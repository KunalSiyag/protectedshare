import type { Bindings } from "./env";
import { nowEpochSeconds } from "./env";
import { deleteDropObjects, sweepOrphanDropObjects } from "./drop-storage";
import { ensureSchema } from "./schema";
import { USAGE_RETENTION_DAYS, utcDay } from "./usage";

const CHAT_PRESENCE_TTL_MS = 15_000;
const CHAT_DELETION_RETENTION_MS = 10 * 60 * 1000;
const CHAT_ROOM_IDLE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
/** Receipts outlive their share by 30 days so "My links" can still show the outcome. */
const RECEIPT_RETENTION_SECONDS = 30 * 24 * 60 * 60;
/** Drops that were never completed are removed after 6 hours. */
const INCOMPLETE_DROP_TTL_SECONDS = 6 * 60 * 60;
/** Abuse reports are kept for 180 days. */
const REPORT_RETENTION_SECONDS = 180 * 24 * 60 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Scheduled purge. Each statement runs on its own so a missing table (a database
 * that has not seen the v2 schema yet) cannot stop the others.
 */
export async function runScheduledPurge(env: Bindings): Promise<void> {
  await ensureSchema(env.DB);
  const now = nowEpochSeconds();
  const nowMs = Date.now();
  /** Drops deleted below, so their R2 objects go too. */
  const purgedDrops: Array<{ id: string; chunkCount: number }> = [];
  const statements: Array<[string, unknown[], "drops"?]> = [
    ["DELETE FROM notes WHERE expires_at <= ?", [now]],
    // Notepad check-ins (random per-tab id + last seen) older than a minute.
    ["DELETE FROM workspace_sessions WHERE last_seen < ?", [now - 60]],
    ["DELETE FROM secrets WHERE expires_at <= ?", [now]],
    ["DELETE FROM requests WHERE expires_at <= ?", [now]],
    [
      "DELETE FROM drops WHERE expires_at <= ? OR (is_complete = 0 AND created_at <= ?) RETURNING id, chunk_count",
      [now, now - INCOMPLETE_DROP_TTL_SECONDS],
      "drops",
    ],
    // Drops whose downloads are all spent, once every started download session has ended.
    [
      `DELETE FROM drops WHERE downloads_remaining <= 0 AND is_complete = 1
         AND id NOT IN (SELECT drop_id FROM drop_sessions WHERE expires_at > ?)
       RETURNING id, chunk_count`,
      [now],
      "drops",
    ],
    ["DELETE FROM drop_chunks WHERE drop_id NOT IN (SELECT id FROM drops)", []],
    ["DELETE FROM drop_sessions WHERE expires_at <= ? OR drop_id NOT IN (SELECT id FROM drops)", [now]],
    ["DELETE FROM share_receipts WHERE expires_at <= ?", [now - RECEIPT_RETENTION_SECONDS]],
    ["DELETE FROM chat_room_presence WHERE last_seen < ?", [nowMs - CHAT_PRESENCE_TTL_MS]],
    // Zero-retention: messages of rooms nobody is present in.
    ["DELETE FROM chat_messages WHERE room_id NOT IN (SELECT DISTINCT room_id FROM chat_room_presence)", []],
    ["DELETE FROM chat_messages WHERE expires_at IS NOT NULL AND expires_at <= ?", [nowMs]],
    ["DELETE FROM chat_deletions WHERE deleted_at < ?", [nowMs - CHAT_DELETION_RETENTION_MS]],
    [
      "DELETE FROM chat_rooms WHERE last_active_at < ? AND room_id NOT IN (SELECT DISTINCT room_id FROM chat_room_presence)",
      [nowMs - CHAT_ROOM_IDLE_RETENTION_MS],
    ],
    ["DELETE FROM auth_lockouts WHERE until <= ?", [now]],
    ["DELETE FROM abuse_reports WHERE created_at <= ?", [now - REPORT_RETENTION_SECONDS]],
    ["DELETE FROM usage_daily WHERE day < ?", [utcDay(nowMs - USAGE_RETENTION_DAYS * DAY_MS)]],
  ];

  for (const [sql, params, collect] of statements) {
    try {
      const statement = env.DB.prepare(sql).bind(...params);
      if (collect === "drops") {
        const { results } = await statement.all<{ id: string; chunk_count: number }>();
        for (const row of results) purgedDrops.push({ id: row.id, chunkCount: row.chunk_count });
      } else {
        await statement.run();
      }
    } catch (error) {
      console.error("Scheduled purge statement failed:", sql, error);
    }
  }

  // R2 (when configured): objects of the drops purged above, then anything else left orphaned.
  try {
    await deleteDropObjects(env, purgedDrops);
    await sweepOrphanDropObjects(env);
  } catch (error) {
    console.error("Scheduled R2 cleanup failed:", error);
  }
}
