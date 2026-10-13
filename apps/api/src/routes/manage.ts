import { Hono } from "hono";
import {
  ManageBatchRequestSchema,
  ShareKindSchema,
  type ManageBatchItem,
  type ManageBatchResponse,
  type ShareKind,
} from "@protectedshare/contracts";
import { type AppEnv, type Bindings, isValidId, jsonError, nowEpochSeconds, readJsonBody } from "../lib/env";
import { deleteDropObjects } from "../lib/drop-storage";
import { type ReceiptRow, toManageStatus } from "../lib/receipts";
import { verifyToken } from "../lib/tokens";

export const manageRoutes = new Hono<AppEnv>();

const CONTENT_TABLE: Record<Exclude<ShareKind, "drop">, string> = { note: "notes", secret: "secrets", request: "requests" };

/**
 * Deletes the content behind a share (ciphertext rows; for drops also chunk rows, download
 * sessions and R2 objects). Returns true if a content row was deleted.
 *
 * With `createdAt` only the row created together with the receipt is touched, so a receipt can
 * never delete a newer share that happens to reuse the id. `null` (admin takedown) deletes
 * whatever lives under the id.
 */
export async function deleteShareContent(env: Bindings, kind: ShareKind, id: string, createdAt: number | null): Promise<boolean> {
  const db = env.DB;
  const match = createdAt === null ? "" : " AND created_at = ?2";
  const binds = createdAt === null ? [id] : [id, createdAt];
  if (kind !== "drop") {
    const result = await db.prepare(`DELETE FROM ${CONTENT_TABLE[kind]} WHERE id = ?1${match}`).bind(...binds).run();
    return (result.meta?.changes ?? 0) > 0;
  }
  const [removed] = await db.batch<{ chunk_count: number }>([
    db.prepare(`DELETE FROM drops WHERE id = ?1${match} RETURNING chunk_count`).bind(...binds),
    db.prepare("DELETE FROM drop_chunks WHERE drop_id = ?1 AND NOT EXISTS (SELECT 1 FROM drops WHERE id = ?1)").bind(id),
    db.prepare("DELETE FROM drop_sessions WHERE drop_id = ?1 AND NOT EXISTS (SELECT 1 FROM drops WHERE id = ?1)").bind(id),
  ]);
  const gone = removed?.results?.[0];
  if (gone) await deleteDropObjects(env, [{ id, chunkCount: gone.chunk_count }]);
  return !!gone;
}

async function loadAuthorizedReceipt(
  db: D1Database,
  kind: string,
  id: string,
  token: string | undefined,
): Promise<{ ok: true; row: ReceiptRow } | { ok: false; response: Response }> {
  const parsedKind = ShareKindSchema.safeParse(kind);
  if (!parsedKind.success || !isValidId(id)) {
    return { ok: false, response: jsonError("Unknown share.", "RECEIPT_NOT_FOUND", 404) };
  }
  if (!token) {
    return { ok: false, response: jsonError("A manage token is required.", "MANAGE_TOKEN_REQUIRED", 401) };
  }
  const row = await db.prepare("SELECT * FROM share_receipts WHERE kind = ? AND id = ?")
    .bind(parsedKind.data, id)
    .first<ReceiptRow>();
  if (!row) {
    return { ok: false, response: jsonError("Unknown share.", "RECEIPT_NOT_FOUND", 404) };
  }
  if (!(await verifyToken(token, row.manage_hash))) {
    return { ok: false, response: jsonError("Invalid manage token.", "INVALID_MANAGE_TOKEN", 401) };
  }
  return { ok: true, row };
}

manageRoutes.get("/api/manage/:kind/:id", async (c) => {
  const result = await loadAuthorizedReceipt(c.env.DB, c.req.param("kind"), c.req.param("id"), c.req.header("x-manage-token")?.trim());
  if (!result.ok) return result.response;
  return c.json(toManageStatus(result.row));
});

manageRoutes.delete("/api/manage/:kind/:id", async (c) => {
  const db = c.env.DB;
  const result = await loadAuthorizedReceipt(db, c.req.param("kind"), c.req.param("id"), c.req.header("x-manage-token")?.trim());
  if (!result.ok) return result.response;
  const { row } = result;
  const now = nowEpochSeconds();

  // Consumed/revoked receipts have no content left to delete; never touch a newer share.
  if (row.status === "active") {
    await deleteShareContent(c.env, row.kind, row.id, row.created_at);
  }
  const nextStatus = row.status === "consumed" ? "consumed" : "revoked";
  await db.prepare("UPDATE share_receipts SET status = ?, updated_at = ? WHERE kind = ? AND id = ?")
    .bind(nextStatus, now, row.kind, row.id)
    .run();
  return c.json(toManageStatus({ ...row, status: nextStatus, updated_at: now }, now));
});

manageRoutes.post("/api/manage/batch", async (c) => {
  const db = c.env.DB;
  const read = await readJsonBody(c, 64_000);
  if (!read.ok) return read.response;
  const parsed = ManageBatchRequestSchema.safeParse(read.body);
  if (!parsed.success) {
    return jsonError("Send at most 50 items of { kind, id, token }.", "INVALID_BATCH_REQUEST", 400);
  }
  const { items } = parsed.data;
  if (items.length === 0) {
    const empty: ManageBatchResponse = { items: [] };
    return c.json(empty);
  }

  const results = await db.batch(
    items.map((item) => db.prepare("SELECT * FROM share_receipts WHERE kind = ? AND id = ?").bind(item.kind, item.id))
  );
  const now = nowEpochSeconds();
  const out: ManageBatchItem[] = await Promise.all(
    items.map(async (item, index) => {
      const row = (results[index]?.results?.[0] ?? null) as ReceiptRow | null;
      if (!row || !(await verifyToken(item.token, row.manage_hash))) {
        return { kind: item.kind, id: item.id, status: "not_found" as const };
      }
      return toManageStatus(row, now);
    })
  );
  const response: ManageBatchResponse = { items: out };
  return c.json(response);
});
