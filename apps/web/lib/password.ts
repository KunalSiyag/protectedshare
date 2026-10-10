/**
 * Rough, local password strength estimate. Nothing here leaves the browser.
 *
 * It estimates entropy from the character classes in use, then takes points off for the
 * patterns attackers try first (repeats, keyboard runs, sequences, common words). It is an
 * estimate to steer people away from weak choices, not a guarantee.
 */

export type StrengthTone = "danger" | "warn" | "ok";

export type StrengthResult = {
  /** 0 (very weak) to 4 (very strong). */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  tone: StrengthTone;
  /** Background utility for meter segments, from the design tokens. */
  color: string;
  /** Estimated entropy in bits, after penalties. */
  entropyBits: number;
  /** At most two short, actionable tips. */
  suggestions: string[];
};

const COMMON = [
  "password",
  "passw0rd",
  "letmein",
  "welcome",
  "qwerty",
  "admin",
  "login",
  "dragon",
  "monkey",
  "football",
  "iloveyou",
  "secret",
  "master",
  "abc123",
  "123456",
  "111111",
  "sunshine",
  "princess",
  "shadow",
  "trustno1",
];

const RUNS = ["abcdefghijklmnopqrstuvwxyz", "qwertyuiop", "asdfghjkl", "zxcvbnm", "0123456789"];

function charsetSize(password: string): number {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^A-Za-z0-9\s]/.test(password)) size += 33;
  if (/\s/.test(password)) size += 1;
  if (/[^\x00-\x7F]/.test(password)) size += 64;
  return Math.max(size, 1);
}

/** Number of characters that continue a run (abc, 321, qwe) or repeat the previous one. */
function patternChars(password: string): number {
  const lower = password.toLowerCase();
  let count = 0;
  for (let index = 1; index < lower.length; index += 1) {
    const prev = lower[index - 1];
    const char = lower[index];
    if (char === prev) {
      count += 1;
      continue;
    }
    const pair = prev + char;
    const reversed = char + prev;
    if (RUNS.some((run) => run.includes(pair) || run.includes(reversed))) count += 1;
  }
  return count;
}

export function estimateEntropy(password: string): number {
  if (!password) return 0;
  const lower = password.toLowerCase();
  let effectiveLength = password.length - patternChars(password) * 0.75;
  for (const word of COMMON) {
    if (lower.includes(word)) effectiveLength -= word.length - 1;
  }
  const bits = Math.max(0, effectiveLength) * Math.log2(charsetSize(password));
  return Math.round(bits);
}

const LEVELS: { min: number; label: string; tone: StrengthTone }[] = [
  { min: 0, label: "Very weak", tone: "danger" },
  { min: 36, label: "Weak", tone: "danger" },
  { min: 50, label: "Fair", tone: "warn" },
  { min: 64, label: "Strong", tone: "ok" },
  { min: 80, label: "Very strong", tone: "ok" },
];

const TONE_BG: Record<StrengthTone, string> = {
  danger: "bg-danger",
  warn: "bg-warn",
  ok: "bg-ok",
};

export function checkPasswordStrength(password: string): StrengthResult {
  const entropyBits = estimateEntropy(password);
  let level = 0;
  LEVELS.forEach((candidate, index) => {
    if (entropyBits >= candidate.min) level = index;
  });
  if (password.length < 8) level = 0;

  const suggestions: string[] = [];
  const lower = password.toLowerCase();
  if (password.length < 12) suggestions.push("Use at least 12 characters, or four random words.");
  if (COMMON.some((word) => lower.includes(word))) suggestions.push("Avoid common words like “password”.");
  if (patternChars(password) >= 3) suggestions.push("Avoid repeats and runs like “aaa” or “1234”.");
  if (suggestions.length === 0 && level < 3 && charsetSize(password) <= 36) {
    suggestions.push("Mix in capitals, digits or symbols, or make it longer.");
  }

  const chosen = LEVELS[level];
  return {
    score: level as StrengthResult["score"],
    label: chosen.label,
    tone: chosen.tone,
    color: TONE_BG[chosen.tone],
    entropyBits,
    suggestions: suggestions.slice(0, 2),
  };
}
