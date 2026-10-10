/**
 * Recognises common credential formats in pasted text, purely in the browser.
 * Used only to show "Looks like: …" hints. Nothing here is sent anywhere.
 */
const PATTERNS: { label: string; test: RegExp }[] = [
  { label: "AWS access key", test: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { label: "AWS secret key", test: /aws_secret_access_key\s*[=:]\s*["']?[A-Za-z0-9/+=]{40}/i },
  { label: "Private key", test: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/ },
  { label: "JWT", test: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/ },
  {
    label: "Database URL",
    test: /(?:^|\s|=|["'])(?:postgres(?:ql)?|mysql|mariadb|mongodb(?:\+srv)?|rediss?|amqps?|mssql):\/\/[^\s:/@]+:[^\s@]+@/im,
  },
  { label: "Database URL", test: /^\s*(?:export\s+)?DATABASE_URL\s*=\s*\S+/m },
  { label: "Stripe secret key", test: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/ },
  { label: "GitHub token", test: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})/ },
  { label: "Slack token", test: /\bxox[abprs]-[A-Za-z0-9-]{10,}/ },
  { label: "Google API key", test: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { label: "OpenAI-style API key", test: /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}/ },
];

export function detectSecretTypes(text: string): string[] {
  if (!text) return [];
  const sample = text.length > 300_000 ? text.slice(0, 300_000) : text;
  const found: string[] = [];
  for (const pattern of PATTERNS) {
    if (!found.includes(pattern.label) && pattern.test.test(sample)) found.push(pattern.label);
  }
  return found;
}

const ENV_LINE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=(.*)$/;

export type EnvLine = { kind: "pair"; key: string; value: string; raw: string } | { kind: "text"; raw: string };

/** Splits .env-style text into KEY=VALUE rows (quotes removed from values) and other lines. */
export function parseEnv(text: string): EnvLine[] {
  return text.split(/\r?\n/).map((raw) => {
    const match = ENV_LINE.exec(raw);
    if (!match || raw.trim().startsWith("#")) return { kind: "text", raw };
    let value = match[2].trim();
    const quoted = /^(["'`])([\s\S]*)\1$/.exec(value);
    if (quoted) value = quoted[2];
    else value = value.replace(/\s+#.*$/, "");
    return { kind: "pair", key: match[1], value, raw };
  });
}

export function countEnvVars(text: string): number {
  return parseEnv(text).filter((line) => line.kind === "pair").length;
}
