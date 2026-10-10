import type { Bindings } from "./env";
import { nowEpochSeconds } from "./env";
import { ensureSchema } from "./schema";

const CHAT_PRESENCE_TTL_MS = 15_000;
const CHAT_DELETION_RETENTION_MS = 10 * 60 * 1000;
const CHAT_ROOM_IDLE_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
/** Receipts outlive their share by 30 days so "My links" can still show the outcome. */
const RECEIPT_RETENTION_SECONDS = 30 * 24 * 60 * 60;
/** Drops that were never completed are removed after 6 hours. */
const INCOMPLETE_DROP_TTL_SECONDS = 6 * 60 * 60;

/**
 * Scheduled purge. Each statement runs on its own so a missing table (a database
 * that has not seen the v2 schema yet) cannot stop the others.
 */
export async function runScheduledPurge(env: Bindings): Promise<void> {
  await ensureSchema(env.DB);
  const now = nowEpochSeconds();
  const nowMs = Date.now();
  const statements: Array<[string, unknown[]]> = [
    ["DELETE FROM notes WHERE expires_at <= ?", [now]],
    ["DELETE FROM secrets WHERE expires_at <= ?", [now]],
    ["DELETE FROM requests WHERE expires_at <= ?", [now]],
    ["DELETE FROM drops WHERE expires_at <= ? OR (is_complete = 0 AND created_at <= ?)", [now, now - INCOMPLETE_DROP_TTL_SECONDS]],
    // Drops whose downloads are all spent, once every started download session has ended.
    [
      "DELETE FROM drops WHERE downloads_remaining <= 0 AND is_complete = 1 AND id NOT IN (SELECT drop_id FROM drop_sessions WHERE expires_at > ?)",
      [now],
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
  ];

  for (const [sql, params] of statements) {
    try {
      await env.DB.prepare(sql).bind(...params).run();
    } catch (error) {
      console.error("Scheduled purge statement failed:", sql, error);
    }
  }
}
