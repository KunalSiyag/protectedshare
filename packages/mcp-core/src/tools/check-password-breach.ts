/**
 * check_password_breach (local server only): Have I Been Pwned's Pwned Passwords range API,
 * k-anonymity model, exactly like apps/web/app/tools/breached-password-checker/pwned.ts.
 * The password is hashed with SHA-1 here; only the first 5 hex characters of the hash are sent
 * (GET {hibp}/range/{prefix}, with Add-Padding), and the match is made here.
 * https://haveibeenpwned.com/API/v3#PwnedPasswords
 */
import { ToolError, fail, ok, str, type ToolDefinition } from "../shared";

export const DEFAULT_HIBP_URL = "https://api.pwnedpasswords.com";
const PREFIX_LENGTH = 5;
const TIMEOUT_MS = 15_000;

/** SHA-1 of the UTF-8 bytes exactly as given (no trimming or normalization), uppercase hex. */
export async function sha1Hex(password: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/** Count for `suffix` in a range response. Padding lines (count 0) never match. */
export function countInRange(body: string, suffix: string): { count: number; returned: number } {
  const wanted = suffix.toUpperCase();
  let count = 0;
  let returned = 0;
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    returned += 1;
    const occurrences = Number.parseInt(line.slice(colon + 1), 10) || 0;
    if (occurrences > 0 && line.slice(0, colon).toUpperCase() === wanted) count = occurrences;
  }
  return { count, returned };
}

export const checkPasswordBreach: ToolDefinition = {
  name: "check_password_breach",
  title: "Check password breach",
  modes: ["local"],
  description: () =>
    "Check whether a password appears in known data breaches, using Have I Been Pwned's Pwned Passwords range API (k-anonymity). The password is hashed with SHA-1 on this computer and only the first 5 characters of the hash are sent to api.pwnedpasswords.com; the comparison happens locally. Returns how many times it appears in breach data (0 if it doesn't).",
  inputSchema: () => ({
    type: "object",
    additionalProperties: false,
    properties: {
      password: {
        type: "string",
        minLength: 1,
        maxLength: 1024,
        description: "The password to check, exactly as used (it isn't trimmed).",
      },
    },
    required: ["password"],
  }),
  outputSchema: {
    type: "object",
    properties: {
      breached: { type: "boolean" },
      count: { type: "integer", description: "Times this password appears in Have I Been Pwned's breach data." },
      sha1_prefix_sent: { type: "string", description: "The only part of the hash that left this computer." },
      summary: { type: "string" },
    },
    required: ["breached", "count", "sha1_prefix_sent", "summary"],
  },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  async handler(args, ctx) {
    try {
      const password = str(args, "password");
      if (!password) throw new ToolError("`password` is empty.");
      const hash = await sha1Hex(password);
      const prefix = hash.slice(0, PREFIX_LENGTH);
      let body: string;
      try {
        const response = await ctx.fetch(`${ctx.hibpUrl}/range/${prefix}`, {
          method: "GET",
          headers: { "Add-Padding": "true", "User-Agent": ctx.userAgent },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!response.ok) throw new ToolError(`Have I Been Pwned answered with HTTP ${response.status}. Try again later.`);
        body = await response.text();
      } catch (error) {
        if (error instanceof ToolError) throw error;
        throw new ToolError("Couldn't reach api.pwnedpasswords.com. Check the network connection and try again.");
      }
      const { count, returned } = countInRange(body, hash.slice(PREFIX_LENGTH));
      if (returned === 0) throw new ToolError("Have I Been Pwned sent an empty answer. Try again later.");
      return ok({
        breached: count > 0,
        count,
        sha1_prefix_sent: prefix,
        summary:
          count > 0
            ? `This password appears ${count.toLocaleString("en-US")} times in breach data. Don't use it anywhere.`
            : "This password isn't in Have I Been Pwned's breach data. That doesn't make it strong.",
      });
    } catch (error) {
      if (error instanceof ToolError) return fail(error.message);
      throw error;
    }
  },
};
