import type { ManageStatusResponse, ReceiptStatus, ShareKind } from "@protectedshare/contracts";
import { nowEpochSeconds } from "./env";

export type ReceiptRow = {
  kind: ShareKind;
  id: string;
  manage_hash: string;
  status: ReceiptStatus;
  reads: number;
  max_reads: number | null;
  created_at: number;
  expires_at: number;
  first_read_at: number | null;
  last_read_at: number | null;
  updated_at: number;
};

/**
 * Creates a receipt for a share (or, without a manage hash, only clears any stale receipt
 * left under the same kind + id). Never throws: receipts must not break a create.
 */
export async function createReceipt(
  db: D1Database,
  input: { kind: ShareKind; id: string; manageHash: string | undefined; maxReads: number | null; createdAt: number; expiresAt: number },
): Promise<void> {
  try {
    // Defense in depth: generateUniqueId already skips ids with receipts, but a stale
    // receipt must never carry an old manage token over to new content.
    const clear = db.prepare("DELETE FROM share_receipts WHERE kind = ? AND id = ?").bind(input.kind, input.id);
    if (!input.manageHash) {
      await clear.run();
      return;
    }
    await db.batch([
      clear,
      db.prepare(
        `INSERT INTO share_receipts
          (kind, id, manage_hash, status, reads, max_reads, created_at, expires_at, first_read_at, last_read_at, updated_at)
         VALUES (?, ?, ?, 'active', 0, ?, ?, ?, NULL, NULL, ?)`
      ).bind(input.kind, input.id, input.manageHash, input.maxReads, input.createdAt, input.expiresAt, input.createdAt),
    ]);
  } catch (error) {
    console.error("Failed to create receipt:", error);
  }
}

/**
 * Records one successful read / download / response. `consumed` marks the share
 * as gone (burned, reads spent, downloads spent, response collected).
 */
export async function recordReceiptEvent(
  db: D1Database,
  kind: ShareKind,
  id: string,
  options: { countRead?: boolean; consumed?: boolean } = {},
): Promise<void> {
  const now = nowEpochSeconds();
  const increment = options.countRead === false ? 0 : 1;
  try {
    await db.prepare(
      `UPDATE share_receipts SET
         reads = reads + ?,
         first_read_at = CASE WHEN ? = 1 THEN COALESCE(first_read_at, ?) ELSE first_read_at END,
         last_read_at = CASE WHEN ? = 1 THEN ? ELSE last_read_at END,
         status = CASE WHEN ? = 1 THEN 'consumed' ELSE status END,
         updated_at = ?
       WHERE kind = ? AND id = ? AND status = 'active'`
    )
      .bind(increment, increment, now, increment, now, options.consumed ? 1 : 0, now, kind, id)
      .run();
  } catch (error) {
    console.error("Failed to record receipt event:", error);
  }
}

export function toManageStatus(row: ReceiptRow, now = nowEpochSeconds()): ManageStatusResponse {
  const status: ReceiptStatus = row.status === "active" && now >= row.expires_at ? "expired" : row.status;
  const readsRemaining =
    row.max_reads === null
      ? null
      : status === "active"
        ? Math.max(0, row.max_reads - row.reads)
        : 0;
  return {
    kind: row.kind,
    id: row.id,
    status,
    reads: row.reads,
    maxReads: row.max_reads,
    readsRemaining,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    firstReadAt: row.first_read_at,
    lastReadAt: row.last_read_at,
  };
}
