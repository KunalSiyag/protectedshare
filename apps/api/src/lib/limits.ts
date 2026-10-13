import type { AppContext, Bindings } from "./env";
import { nowEpochSeconds } from "./env";
import { timingSafeEqual } from "./tokens";

/**
 * Rate limits, using the Workers Rate Limiting binding ([[ratelimits]] in wrangler.toml).
 *
 * - Every limiter is optional. With its binding missing (self-hosting without it, tests) the
 *   check passes, and a limiter outage fails open rather than taking the API down.
 * - Counts are kept per Cloudflare location and are eventually consistent: they stop floods
 *   and online guessing, not the odd extra request.
 * - Keys name the resource (a share, a room, a request), not the person. Only the create
 *   flood guard uses the client IP, and it is generous on purpose (see createFloodGuard).
 */

export type LimiterName = "RL_AUTH" | "RL_CLAIM" | "RL_RESPOND" | "RL_CHAT_POST" | "RL_REPORT" | "RL_CREATE";

export type RateLimitBindings = { [K in LimiterName]?: RateLimit };

/** Every [[ratelimits]] block uses a 60-second period. */
const LIMIT_PERIOD_SECONDS = 60;

/** Once a target collects too many failed attempts, every attempt is refused for this long. */
export const AUTH_LOCK_SECONDS = 10 * 60;

export const RATE_LIMITED = "RATE_LIMITED";

/** True when `key` is still under the limit (or the limiter isn't configured). Counts one hit. */
export async function withinLimit(env: Bindings, name: LimiterName, key: string): Promise<boolean> {
  const limiter = env[name];
  if (!limiter || typeof limiter.limit !== "function") return true;
  try {
    const { success } = await limiter.limit({ key });
    return success;
  } catch (error) {
    console.error("Rate limiter unavailable:", name, error);
    return true;
  }
}

export function rateLimited(message: string, retryAfterSeconds = LIMIT_PERIOD_SECONDS): Response {
  return Response.json(
    { error: message, code: RATE_LIMITED },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))), "Cache-Control": "no-store" },
    },
  );
}

/** Counts one hit on `key`; returns a 429 once it is over the limit, otherwise null. */
export async function limit(c: AppContext, name: LimiterName, key: string, message: string): Promise<Response | null> {
  return (await withinLimit(c.env, name, key)) ? null : rateLimited(message);
}

/* ---------------------------- Create flood guard ---------------------------- */

function isLoopback(ip: string): boolean {
  return ip === "::1" || ip.startsWith("127.") || ip.startsWith("::ffff:127.");
}

/** IPv4 as is; IPv6 grouped by its /64, so one host can't rotate through its own subnet. */
export function ipBucket(ip: string): string {
  if (!ip.includes(":")) return ip;
  // IPv4-mapped IPv6 (::ffff:203.0.113.7) is really that IPv4 address.
  const mapped = /(?:^|:)(\d{1,3}(?:\.\d{1,3}){3})$/.exec(ip);
  if (mapped) return mapped[1];
  const [head, tail] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups =
    tail === undefined ? left : [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill("0"), ...right];
  return `${groups.slice(0, 4).map((group) => group.replace(/^0+(?=.)/, "") || "0").join(":")}::/64`;
}

/**
 * Generous per-IP guard for endpoints that create rows (shares, requests, reports, inquiries,
 * notepads). It keys on CF-Connecting-IP, which Cloudflare sets and clients can't forge.
 * Behind the hosted site's /api rewrite that is a Vercel egress IP shared by many visitors, so
 * the limit in wrangler.toml is set well above what real people produce, and one client that
 * reaches it still holds up creates for everyone else on that IP for the rest of the minute.
 * Loopback (wrangler dev) is not a client, so local development is never limited.
 */
export async function createFloodGuard(c: AppContext): Promise<Response | null> {
  const ip = c.req.header("cf-connecting-ip")?.trim();
  if (!ip || isLoopback(ip)) return null;
  return limit(c, "RL_CREATE", `create:${ipBucket(ip)}`, "Too many new links from this network in a short time. Wait a minute, then try again.");
}

/* ------------------------------- Auth lockout ------------------------------- */

/** What a failed key/password attempt is counted against. */
export type AuthScope = "note" | "secret" | "drop" | "request" | "room" | "workspace";

export function authKey(scope: AuthScope, id: string): string {
  return `auth:${scope}:${id}`;
}

/**
 * Scalar subquery for a row query: the target's lock expiry as `locked_until` (NULL when not
 * locked). `param` is the placeholder the caller binds `authKey(...)` to, e.g. "?3".
 */
export function lockedUntilColumn(param: string): string {
  return `(SELECT until FROM auth_lockouts WHERE key = ${param}) AS locked_until`;
}

function lockedResponse(lockedUntil: number, now: number): Response {
  return rateLimited("Too many wrong attempts on this link. Wait a few minutes, then try again.", lockedUntil - now);
}

/** Before checking a credential: a 429 while the target is locked, otherwise null. */
export function lockedOut(lockedUntil: number | null | undefined): Response | null {
  const now = nowEpochSeconds();
  return lockedUntil && lockedUntil > now ? lockedResponse(lockedUntil, now) : null;
}

/** Same check for callers whose row query doesn't carry `locked_until`. Skipped without RL_AUTH. */
export async function checkLock(c: AppContext, scope: AuthScope, id: string): Promise<Response | null> {
  if (!c.env.RL_AUTH) return null;
  try {
    const row = await c.env.DB.prepare("SELECT until FROM auth_lockouts WHERE key = ?")
      .bind(authKey(scope, id))
      .first<{ until: number }>();
    return lockedOut(row?.until);
  } catch (error) {
    console.error("Auth lock lookup failed:", error);
    return null;
  }
}

/**
 * After a credential failed: counts the failure against the target. Only real mismatches
 * count, never a missing or malformed credential. Under the RL_AUTH limit, `failure` is
 * returned unchanged. Past it:
 * - `lock: true` (a password could be guessed: password notes and secrets, chat rooms,
 *   notepads): the target is locked for AUTH_LOCK_SECONDS in D1, and every location refuses
 *   every attempt, right or wrong, until then.
 * - `lock: false` (random 256-bit keys that can't be guessed: key-only links, file drops,
 *   requests): only the wrong attempts get a 429, so nobody can lock real recipients out.
 */
export async function authFailed(
  c: AppContext,
  scope: AuthScope,
  id: string,
  failure: Response,
  options: { lock: boolean },
): Promise<Response> {
  const key = authKey(scope, id);
  if (await withinLimit(c.env, "RL_AUTH", key)) return failure;
  if (!options.lock) return rateLimited("Too many wrong attempts on this link. Wait a minute, then try again.");
  const now = nowEpochSeconds();
  const until = now + AUTH_LOCK_SECONDS;
  try {
    await c.env.DB.prepare(
      `INSERT INTO auth_lockouts (key, until) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET until = MAX(until, excluded.until)`
    )
      .bind(key, until)
      .run();
  } catch (error) {
    console.error("Failed to record auth lock:", error);
  }
  return lockedResponse(until, now);
}

/** Constant-time check of a stored v1/notepad proof, with the lock applied around it. */
export async function verifyProofWithLock(
  c: AppContext,
  scope: AuthScope,
  id: string,
  stored: string | null | undefined,
  presented: string,
  failure: () => Response,
): Promise<Response | null> {
  const locked = await checkLock(c, scope, id);
  if (locked) return locked;
  if (stored && timingSafeEqual(stored, presented)) return null;
  return authFailed(c, scope, id, failure(), { lock: true });
}
