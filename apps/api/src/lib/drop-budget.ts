import type { Bindings } from "./env";
import { utcDay } from "./usage";

/**
 * Spending guard for file drops. Cloudflare has no hard spending cap, and R2 bills any usage past
 * its monthly free allowance (10 GB-month of storage, 1 million Class A and 10 million Class B
 * operations) rounded up to a whole unit. So the API caps that usage itself and refuses new work
 * once a cap is reached, instead of billing:
 *
 * - Storage: `drop_storage.bytes` is the size of every stored chunk, kept exact by triggers on
 *   drop_chunks (schema.ts). A chunk is only accepted while the total stays under the cap. It counts
 *   chunks kept in D1 too (self-hosting without R2, rows from before R2).
 * - Operations: `r2_ops_daily` counts R2 writes (Class A: put, list) and reads (Class B: get) per
 *   UTC day, reserved before each call. Daily caps hold in any billing period of up to 31 days.
 *   Deletes are free, so they aren't counted.
 *
 * The defaults stay inside the free allowance with headroom: 9 GB, 30,000 writes and 300,000 reads
 * a day (930,000 and 9.3 million over 31 days). Change them with the DROP_STORAGE_LIMIT_GB,
 * R2_CLASS_A_DAILY_LIMIT and R2_CLASS_B_DAILY_LIMIT vars in wrangler.toml.
 */

const GB = 1_000_000_000;
export const DEFAULT_DROP_STORAGE_LIMIT_GB = 9;
export const DEFAULT_R2_CLASS_A_DAILY_LIMIT = 30_000;
export const DEFAULT_R2_CLASS_B_DAILY_LIMIT = 300_000;
/** Daily operation counts are kept this long (only today's are enforced). */
export const R2_OPS_RETENTION_DAYS = 90;

export const DROP_CAPACITY = "DROP_CAPACITY";

/** What a stored chunk row accounts for: `size`, or the inline BLOB on rows written before R2. */
export const CHUNK_SIZE_SQL = "COALESCE(size, LENGTH(data))";

export type R2OpClass = "class_a" | "class_b";

export type DropBudget = { storageBytes: number; classADaily: number; classBDaily: number };

function positive(name: string, value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  console.warn(`${name} must be a number above 0; using the default (${fallback}).`);
  return fallback;
}

export function dropBudget(env: Bindings): DropBudget {
  return {
    storageBytes: Math.floor(positive("DROP_STORAGE_LIMIT_GB", env.DROP_STORAGE_LIMIT_GB, DEFAULT_DROP_STORAGE_LIMIT_GB) * GB),
    classADaily: Math.floor(positive("R2_CLASS_A_DAILY_LIMIT", env.R2_CLASS_A_DAILY_LIMIT, DEFAULT_R2_CLASS_A_DAILY_LIMIT)),
    classBDaily: Math.floor(positive("R2_CLASS_B_DAILY_LIMIT", env.R2_CLASS_B_DAILY_LIMIT, DEFAULT_R2_CLASS_B_DAILY_LIMIT)),
  };
}

function dailyLimit(budget: DropBudget, kind: R2OpClass): number {
  return kind === "class_a" ? budget.classADaily : budget.classBDaily;
}

/**
 * Reserves `count` R2 operations of one class for today, before they're made. False (and nothing
 * counted) once today's cap would be passed. One statement, so parallel requests can't overshoot.
 */
export async function reserveR2Ops(env: Bindings, kind: R2OpClass, count = 1): Promise<boolean> {
  const limit = dailyLimit(dropBudget(env), kind);
  const row = await env.DB.prepare(
    `INSERT INTO r2_ops_daily (day, ${kind}) SELECT ?1, ?2 WHERE ?2 <= ?3
     ON CONFLICT(day) DO UPDATE SET ${kind} = ${kind} + ?2 WHERE ${kind} + ?2 <= ?3
     RETURNING ${kind} AS used`
  )
    .bind(utcDay(), count, limit)
    .first<{ used: number }>();
  if (!row) console.warn(`R2 ${kind === "class_a" ? "write" : "read"} cap reached for today (${limit}); refusing.`);
  return !!row;
}

/** Whether today still has room for `count` operations of one class. Checks without reserving. */
export async function hasR2Headroom(env: Bindings, kind: R2OpClass, count: number): Promise<boolean> {
  const row = await env.DB.prepare(`SELECT ${kind} AS used FROM r2_ops_daily WHERE day = ?`).bind(utcDay()).first<{ used: number }>();
  return (row?.used ?? 0) + count <= dailyLimit(dropBudget(env), kind);
}

/**
 * Whether storing `bytes` more (replacing `replacing` bytes already counted) would pass the
 * storage cap. A missing counter row counts as full: the guard fails closed.
 */
export async function wouldOverfillStorage(env: Bindings, bytes: number, replacing = 0): Promise<boolean> {
  const row = await env.DB.prepare("SELECT bytes FROM drop_storage WHERE id = 1").first<{ bytes: number }>();
  if (!row) {
    console.error("drop_storage has no counter row; refusing new file-drop bytes.");
    return true;
  }
  const over = row.bytes - replacing + bytes > dropBudget(env).storageBytes;
  if (over) console.warn("File-drop storage cap reached; refusing new bytes.");
  return over;
}

function secondsUntilUtcMidnight(now = Date.now()): number {
  const next = new Date(now);
  next.setUTCHours(24, 0, 0, 0);
  return Math.ceil((next.getTime() - now) / 1000);
}

function capacityResponse(error: string, retryAfterSeconds: number): Response {
  return Response.json(
    { error, code: DROP_CAPACITY },
    { status: 503, headers: { "Retry-After": String(Math.max(1, retryAfterSeconds)), "Cache-Control": "no-store" } },
  );
}

/** The storage cap is reached. Space comes back as drops are downloaded, revoked or expire. */
export function storageFull(): Response {
  return capacityResponse(
    "File drop is full right now. Space frees up as other drops are downloaded or expire, so try again later or send something smaller.",
    30 * 60,
  );
}

/** Today's R2 operations cap is reached; it resets at 00:00 UTC. */
export function dailyLimitReached(direction: "upload" | "download", extra = ""): Response {
  return capacityResponse(
    `File drop has reached today's ${direction} limit. It resets at 00:00 UTC.${extra ? ` ${extra}` : ""}`,
    secondsUntilUtcMidnight(),
  );
}
