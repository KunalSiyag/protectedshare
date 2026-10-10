/**
 * Password strength, estimated locally.
 *
 * Generated values: entropy is exact for the settings used, so we report it as is.
 * Typed values: we can't know how they were made, so we start from the character pool and
 * subtract what common attacks exploit (leaked-password lists, dictionary words, keyboard
 * walks, sequences, repeats, years). The result is a rough ceiling, not a promise.
 */

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export type StrengthInfo = {
  bits: number;
  level: StrengthLevel;
  label: string;
  tone: "danger" | "warn" | "ok";
};

export const OFFLINE_RATE = 1e10; // fast hash on a GPU rig
export const ONLINE_RATE = 1e4; // a service that doesn't throttle well

const LEVELS: { min: number; label: string; tone: StrengthInfo["tone"] }[] = [
  { min: 0, label: "Very weak", tone: "danger" },
  { min: 28, label: "Weak", tone: "danger" },
  { min: 45, label: "Fair", tone: "warn" },
  { min: 64, label: "Strong", tone: "ok" },
  { min: 90, label: "Very strong", tone: "ok" },
];

export function strengthFromBits(bits: number): StrengthInfo {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i += 1) if (bits >= LEVELS[i].min) index = i;
  const level = LEVELS[index];
  return { bits, level: index as StrengthLevel, label: level.label, tone: level.tone };
}

/** Average time to guess: half the keyspace at `rate` guesses per second. Returns seconds. */
export function crackSeconds(bits: number, rate: number): number {
  return Math.pow(2, Math.max(0, bits - 1)) / rate;
}

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const YEAR = 365.25 * DAY;

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds >= 1.38e10 * YEAR) return "longer than the age of the universe";
  if (seconds < 1) return "less than a second";
  const plain: [number, string][] = [
    [YEAR, "year"],
    [DAY * 30.44, "month"],
    [DAY, "day"],
    [HOUR, "hour"],
    [MINUTE, "minute"],
    [1, "second"],
  ];
  const big: [number, string][] = [
    [1e9 * YEAR, "billion years"],
    [1e6 * YEAR, "million years"],
    [1e3 * YEAR, "thousand years"],
  ];
  for (const [size, name] of big) {
    if (seconds >= size) return `about ${Math.round(seconds / size).toLocaleString("en-US")} ${name}`;
  }
  for (const [size, name] of plain) {
    if (seconds >= size) {
      const value = Math.round(seconds / size);
      return `about ${value.toLocaleString("en-US")} ${name}${value === 1 ? "" : "s"}`;
    }
  }
  return "less than a second";
}

/* ───────────────────────── Typed-password estimator ───────────────────────── */

// A short slice of the most common leaked passwords and words people build passwords from.
// Small on purpose: it runs in the page. Real attackers use lists millions of entries long.
const COMMON = [
  "password", "123456", "12345678", "qwerty", "123456789", "12345", "1234", "111111", "1234567", "dragon",
  "123123", "baseball", "abc123", "football", "monkey", "letmein", "696969", "shadow", "master", "666666",
  "qwertyuiop", "123321", "mustang", "1234567890", "michael", "654321", "superman", "1qaz2wsx", "7777777",
  "121212", "000000", "qazwsx", "123qwe", "killer", "trustno1", "jordan", "jennifer", "zxcvbnm", "asdfgh",
  "hunter", "buster", "soccer", "harley", "batman", "andrew", "tigger", "sunshine", "iloveyou", "2000",
  "charlie", "robert", "thomas", "hockey", "ranger", "daniel", "starwars", "klaster", "112233", "george",
  "computer", "michelle", "jessica", "pepper", "1111", "zxcvbn", "555555", "11111111", "131313", "freedom",
  "777777", "pass", "maggie", "159753", "aaaaaa", "ginger", "princess", "joshua", "cheese", "amanda",
  "summer", "love", "ashley", "nicole", "chelsea", "biteme", "matthew", "access", "yankees", "987654321",
  "dallas", "austin", "thunder", "taylor", "matrix", "admin", "welcome", "login", "secret", "changeme",
  "passw0rd", "p@ssword", "default", "guest", "root", "test", "hello", "monday", "winter", "spring",
  "autumn", "flower", "orange", "purple", "silver", "golden", "diamond", "cookie", "chocolate", "coffee",
  "banana", "apple", "money", "angel", "lovely", "family", "friend", "secure", "office", "company",
  "google", "facebook", "linkedin", "dropbox", "github", "server", "database", "office365", "microsoft",
  "london", "paris", "berlin", "india", "china", "america", "canada", "brazil", "mumbai", "delhi",
];
const COMMON_SET = new Set(COMMON);

const KEYBOARD_ROWS = ["`1234567890-=", "qwertyuiop[]\\", "asdfghjkl;'", "zxcvbnm,./", "1qaz2wsx3edc4rfv5tgb6yhn7ujm8ik,9ol.0p;/-['=]"];

const LEET: Record<string, string> = { "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "!": "i", "+": "t" };

function poolSize(value: string): number {
  let pool = 0;
  if (/[a-z]/.test(value)) pool += 26;
  if (/[A-Z]/.test(value)) pool += 26;
  if (/[0-9]/.test(value)) pool += 10;
  if (/[!-/:-@[-`{-~ ]/.test(value)) pool += 33;
  if (/[^\x00-\x7f]/.test(value)) pool += 100;
  return Math.max(pool, 10);
}

function unleet(value: string): string {
  return [...value.toLowerCase()].map((char) => LEET[char] ?? char).join("");
}

function isKeyboardStep(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return KEYBOARD_ROWS.some((row) => {
    const i = row.indexOf(x);
    return i !== -1 && (row[i + 1] === y || row[i - 1] === y);
  });
}

type Span = { start: number; end: number; bits: number };

/** Find cheap substrings: common words (with leet and capitals), years. */
function findSpans(value: string): Span[] {
  const spans: Span[] = [];
  const lower = unleet(value);
  for (let start = 0; start < value.length; start += 1) {
    for (let end = Math.min(value.length, start + 16); end >= start + 3; end -= 1) {
      const slice = lower.slice(start, end);
      if (COMMON_SET.has(slice)) {
        const original = value.slice(start, end);
        const caps = /[A-Z]/.test(original) ? 1 : 0;
        const leet = original.toLowerCase() !== slice ? 1 : 0;
        spans.push({ start, end, bits: Math.log2(COMMON.length) + caps + leet + 1 });
        break;
      }
    }
  }
  const yearPattern = /(19[0-9]{2}|20[0-4][0-9])/g;
  let match: RegExpExecArray | null;
  while ((match = yearPattern.exec(value))) {
    spans.push({ start: match.index, end: match.index + 4, bits: Math.log2(150) });
  }
  return spans;
}

/**
 * Rough entropy for a typed password. Picks the cheapest cover of the string by cheap spans
 * (common words, years) and per-character costs that drop for repeats, sequences and walks.
 */
export function estimateTypedBits(value: string): number {
  if (!value) return 0;
  const chars = [...value];
  const n = chars.length;
  const charBits = Math.log2(poolSize(value));

  // Per-character cost.
  const cost: number[] = chars.map((char, i) => {
    if (i === 0) return charBits;
    const prev = chars[i - 1];
    if (char === prev) return 1;
    const delta = char.codePointAt(0)! - prev.codePointAt(0)!;
    if (Math.abs(delta) === 1 && /[a-z0-9]/i.test(char) && /[a-z0-9]/i.test(prev)) return 1.5;
    if (isKeyboardStep(prev, char)) return 2;
    return charBits;
  });

  // Dynamic programming over spans: best[i] = cheapest bits for value[0..i).
  const spans = findSpans(value);
  const best = new Array<number>(n + 1).fill(Infinity);
  best[0] = 0;
  for (let i = 0; i < n; i += 1) {
    if (!Number.isFinite(best[i])) continue;
    best[i + 1] = Math.min(best[i + 1], best[i] + cost[i]);
    for (const span of spans) {
      if (span.start === i) best[span.end] = Math.min(best[span.end], best[i] + span.bits);
    }
  }

  let bits = best[n];
  // Whole value is a known password: an attacker tries it in the first few thousand guesses.
  if (COMMON_SET.has(unleet(value))) bits = Math.min(bits, Math.log2(COMMON.length) + 2);
  // A short pattern repeated (abcabcabc) is about as strong as the pattern.
  const repeat = /^(.{1,8}?)\1+$/.exec(value);
  if (repeat) bits = Math.min(bits, estimateTypedBits(repeat[1]) + Math.log2(n / repeat[1].length + 1));
  return Math.max(0, Math.min(bits, n * charBits));
}

export type TypedFinding = { tone: "danger" | "warn" | "ok"; text: string };

/** Plain reasons behind the estimate, most important first. */
export function typedFindings(value: string): TypedFinding[] {
  const findings: TypedFinding[] = [];
  if (!value) return findings;
  const lower = unleet(value);
  if (COMMON_SET.has(lower)) findings.push({ tone: "danger", text: "This is on lists of the most common passwords." });
  else if (findSpans(value).some((span) => span.end - span.start >= 4 && !/^\d+$/.test(value.slice(span.start, span.end)))) {
    findings.push({ tone: "warn", text: "Contains a common word. Swapping letters for symbols (a to @) barely helps." });
  }
  if (/(19[0-9]{2}|20[0-4][0-9])/.test(value)) findings.push({ tone: "warn", text: "Contains a year. Attackers try those early." });
  if (/(.)\1\1/.test(value)) findings.push({ tone: "warn", text: "Has a character repeated three or more times." });
  if (/(abc|bcd|cde|123|234|345|456|567|678|789|qwe|wer|ert|asd|sdf|zxc)/i.test(value)) {
    findings.push({ tone: "warn", text: "Has a sequence or keyboard walk." });
  }
  if (value.length < 12) findings.push({ tone: "warn", text: "Shorter than 12 characters. Length matters most." });
  if (findings.length === 0) findings.push({ tone: "ok", text: "No common patterns found. Use it in one place only." });
  return findings;
}
