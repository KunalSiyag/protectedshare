/**
 * Have I Been Pwned "Pwned Passwords" range API, k-anonymity model.
 *
 * The password is hashed with SHA-1 here. Only the first 5 hex characters of the hash are sent;
 * the service answers with every hash suffix that starts with them (padded to 800–1,000 lines
 * when asked with `Add-Padding: true`, padding lines have a count of 0), and the match is made here.
 * https://haveibeenpwned.com/API/v3#PwnedPasswords
 */

export const PWNED_ORIGIN = "https://api.pwnedpasswords.com";
export const PREFIX_LENGTH = 5;

export type PasswordHash = {
  /** 40 uppercase hex characters. */
  full: string;
  /** The 5 characters that are sent. */
  prefix: string;
  /** The 35 characters that stay in the browser. */
  suffix: string;
};

export type RangeResult = {
  /** Times this password appears in the breach corpus. 0 when it isn't there. */
  count: number;
  /** Lines in the response, padding included. */
  returned: number;
  /** Lines that were padding (count 0). */
  padding: number;
};

/** SHA-1 of the UTF-8 bytes, exactly as typed (no trimming or normalization). */
export async function hashPassword(password: string): Promise<PasswordHash> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
  const full = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return { full, prefix: full.slice(0, PREFIX_LENGTH), suffix: full.slice(PREFIX_LENGTH) };
}

export function rangeUrl(prefix: string): string {
  return `${PWNED_ORIGIN}/range/${prefix}`;
}

/** The one request this tool makes. Headers beyond Add-Padding are the browser's own. */
export const RANGE_REQUEST_HEADERS = { "Add-Padding": "true" } as const;

export function parseRange(body: string, suffix: string): RangeResult {
  const wanted = suffix.toUpperCase();
  let count = 0;
  let returned = 0;
  let padding = 0;
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    returned += 1;
    const occurrences = Number.parseInt(line.slice(colon + 1), 10) || 0;
    if (occurrences === 0) {
      padding += 1;
      continue;
    }
    if (line.slice(0, colon).toUpperCase() === wanted) count = occurrences;
  }
  return { count, returned, padding };
}

export class PwnedRequestError extends Error {
  readonly reason: "network" | "http" | "timeout";

  constructor(message: string, reason: "network" | "http" | "timeout") {
    super(message);
    this.name = "PwnedRequestError";
    this.reason = reason;
  }
}

/** GET /range/{prefix} with padding, no cookies and no referrer. */
export async function queryRange(hash: PasswordHash, timeoutMs = 15000): Promise<RangeResult> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response: Response;
    try {
      response = await fetch(rangeUrl(hash.prefix), {
        method: "GET",
        headers: RANGE_REQUEST_HEADERS,
        credentials: "omit",
        referrerPolicy: "no-referrer",
        cache: "no-store",
        mode: "cors",
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) throw new PwnedRequestError("The service didn't answer in time.", "timeout");
      throw new PwnedRequestError(error instanceof Error ? error.message : "Network error", "network");
    }
    if (!response.ok) throw new PwnedRequestError(`The service answered with HTTP ${response.status}.`, "http");
    return parseRange(await response.text(), hash.suffix);
  } finally {
    window.clearTimeout(timer);
  }
}
