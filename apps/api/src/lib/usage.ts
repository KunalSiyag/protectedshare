import type { UsageKind, UsageStatsResponse } from "@protectedshare/contracts";
import type { AppContext } from "./env";
import { nowEpochSeconds } from "./env";

/**
 * Daily create counters for GET /api/stats: one row per UTC day and kind, no ids, no content,
 * nothing about who created what. Incremented after a create succeeded (a drop when its upload
 * completes, a chat room when it is first claimed).
 */

export const STATS_WINDOW_DAYS = 30;
/** How long one isolate reuses a computed answer (matches the response's max-age). */
const STATS_MEMO_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Counters older than this are purged by the cron. */
export const USAGE_RETENTION_DAYS = 400;

const KINDS: UsageKind[] = ["note", "secret", "drop", "request", "chat"];

export function utcDay(ms = Date.now()): string {
  return new Date(ms).toISOString().slice(0, 10);
}

let memo: { at: number; window: string; value: UsageStatsResponse } | null = null;

/** Runs `task` after the response when the runtime allows it, so counters never slow a create. */
export function inBackground(c: AppContext, task: Promise<unknown>): void {
  try {
    c.executionCtx.waitUntil(task);
  } catch {
    // No execution context (tests): the promise is already running.
  }
}

/** Counts one successful create. Never throws and never delays the response. */
export function recordUsage(c: AppContext, kind: UsageKind): void {
  const day = utcDay();
  const task = c.env.DB.prepare(
    `INSERT INTO usage_daily (day, kind, created) VALUES (?, ?, 1)
     ON CONFLICT(day, kind) DO UPDATE SET created = created + 1`
  )
    .bind(day, kind)
    .run()
    .then(() => {
      // Keep this isolate's cached answer in step with its own creates.
      if (memo) {
        memo.value.last30Days.byKind[kind] += 1;
        memo.value.last30Days.total += 1;
      }
    })
    .catch((error: unknown) => console.error("Failed to record usage:", error));
  inBackground(c, task);
}

/** Creates in the last 30 UTC days (today included), summed per kind. */
export async function readUsageStats(db: D1Database): Promise<UsageStatsResponse> {
  const now = Date.now();
  const window = utcDay(now - (STATS_WINDOW_DAYS - 1) * DAY_MS);
  if (memo && memo.window === window && now - memo.at < STATS_MEMO_MS) {
    return structuredClone(memo.value);
  }
  const { results } = await db.prepare("SELECT kind, SUM(created) AS created FROM usage_daily WHERE day >= ? GROUP BY kind")
    .bind(window)
    .all<{ kind: string; created: number }>();
  const byKind: UsageStatsResponse["last30Days"]["byKind"] = { note: 0, secret: 0, drop: 0, request: 0, chat: 0 };
  for (const row of results) {
    if ((KINDS as string[]).includes(row.kind)) byKind[row.kind as UsageKind] = Math.max(0, Number(row.created) || 0);
  }
  const total = KINDS.reduce((sum, kind) => sum + byKind[kind], 0);
  const value: UsageStatsResponse = { last30Days: { total, byKind }, generatedAt: nowEpochSeconds() };
  memo = { at: now, window, value };
  return structuredClone(value);
}
