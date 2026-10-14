import type { Context } from "hono";
import { MAX_SHARE_TTL_SECONDS, type ApiError } from "@protectedshare/contracts";
import type { RateLimitBindings } from "./limits";

export type Bindings = {
  DB: D1Database;
  RESEND_API_KEY?: string;
  /** R2 bucket for file-drop chunks. Optional: without it chunks stay in D1. */
  DROPS_BUCKET?: R2Bucket;
  /** Worker secret for DELETE /api/admin/:kind/:id. Unset (or under 32 chars) = route disabled. */
  ADMIN_TOKEN?: string;
  /** Where contact-form and abuse-report emails go. Default: admin@protectedshare.me. */
  NOTIFY_EMAIL_TO?: string;
  /** Sender domain for those emails; must be verified in Resend. Default: protectedshare.me. */
  NOTIFY_EMAIL_DOMAIN?: string;
  /** Spending guard (lib/drop-budget.ts): file-drop storage cap in GB. Default 9. */
  DROP_STORAGE_LIMIT_GB?: string | number;
  /** R2 writes (Class A) allowed per UTC day. Default 30,000. */
  R2_CLASS_A_DAILY_LIMIT?: string | number;
  /** R2 reads (Class B) allowed per UTC day. Default 300,000. */
  R2_CLASS_B_DAILY_LIMIT?: string | number;
} & RateLimitBindings;

/** Recipient and sender addresses for operator emails (contact form, abuse reports). */
export function notifyEmail(env: Bindings, sender: string, senderName: string): { from: string; to: string } {
  const domain = env.NOTIFY_EMAIL_DOMAIN?.trim() || "protectedshare.me";
  return { from: `${senderName} <${sender}@${domain}>`, to: env.NOTIFY_EMAIL_TO?.trim() || "admin@protectedshare.me" };
}

export type AppEnv = { Bindings: Bindings };
export type AppContext = Context<AppEnv>;

export const NANOID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const MILLISECONDS_THRESHOLD = 100_000_000_000;
const MAX_ID_RETRIES = 10;

export function jsonError(error: string, code: string, status: number): Response {
  const payload: ApiError = { error, code };
  return Response.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}

export function nowEpochSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** Accepts seconds or milliseconds and returns epoch seconds. */
export function normalizeExpiresAt(expiresAt: number): number {
  if (expiresAt > MILLISECONDS_THRESHOLD) {
    return Math.floor(expiresAt / 1000);
  }
  return expiresAt;
}

export function rejectShareExpiry(expiresAt: number, createdAt: number): Response | null {
  if (expiresAt <= createdAt) {
    return jsonError("expiresAt must be in the future.", "INVALID_EXPIRES_AT", 400);
  }
  if (expiresAt - createdAt > MAX_SHARE_TTL_SECONDS) {
    return jsonError("Expiration can be at most 30 days from now.", "EXPIRES_AT_TOO_FAR", 400);
  }
  return null;
}

/** Unbiased random id from NANOID_ALPHABET (rejection sampling). */
export function createId(size = 5): string {
  let result = "";
  // 248 = 62 * 4: bytes >= 248 are rejected so every symbol is equally likely.
  while (result.length < size) {
    const random = crypto.getRandomValues(new Uint8Array(size * 2));
    for (const byte of random) {
      if (byte < 248) {
        result += NANOID_ALPHABET[byte % NANOID_ALPHABET.length];
        if (result.length === size) break;
      }
    }
  }
  return result;
}

export type IdTable = "notes" | "secrets" | "drops" | "requests";

/** Receipt kind for each content table (share_receipts is keyed by kind + id). */
const RECEIPT_KIND: Record<IdTable, string> = { notes: "note", secrets: "secret", drops: "drop", requests: "request" };

/**
 * Generates an id that collides neither with a live row in `table` nor with a receipt
 * (kept 30 days after expiry) of the same kind, so an old manage token can never point
 * at new content.
 */
export async function generateUniqueId(db: D1Database, table: IdTable, size = 5): Promise<string> {
  for (let attempt = 0; attempt < MAX_ID_RETRIES; attempt++) {
    const candidate = createId(size);
    const existing = await db.prepare(
      `SELECT 1 AS taken FROM ${table} WHERE id = ?1
       UNION ALL
       SELECT 1 AS taken FROM share_receipts WHERE kind = ?2 AND id = ?1
       LIMIT 1`
    )
      .bind(candidate, RECEIPT_KIND[table])
      .first<{ taken: number }>();
    if (!existing) {
      return candidate;
    }
  }
  throw new Error(`Unable to generate a unique ID after ${MAX_ID_RETRIES} attempts.`);
}

/** Reads and JSON-parses a body, refusing anything larger than `maxBytes`. */
export async function readJsonBody(c: AppContext, maxBytes: number): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  const declared = Number(c.req.header("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, response: jsonError("Request body is too large.", "PAYLOAD_TOO_LARGE", 413) };
  }
  let text: string;
  try {
    text = await c.req.text();
  } catch {
    return { ok: false, response: jsonError("Invalid request body.", "INVALID_JSON", 400) };
  }
  if (text.length > maxBytes) {
    return { ok: false, response: jsonError("Request body is too large.", "PAYLOAD_TOO_LARGE", 413) };
  }
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, response: jsonError("Invalid JSON body.", "INVALID_JSON", 400) };
  }
}

export function isValidId(id: string | undefined, maxLength = 64): id is string {
  return !!id && id.length <= maxLength && BASE64_URL_PATTERN.test(id);
}

/** v1 password proofs travel as `?proof=` and must be base64url. */
export function getPasswordProofParam(raw: string | undefined | null): string | null {
  if (!raw || !BASE64_URL_PATTERN.test(raw)) return null;
  return raw;
}
