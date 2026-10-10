import { Hono } from "hono";
import {
  ManageBatchRequestSchema,
  ShareKindSchema,
  type ManageBatchItem,
  type ManageBatchResponse,
  type ShareKind,
} from "@protectedshare/contracts";
import { type AppEnv, isValidId, jsonError, nowEpochSeconds, readJsonBody } from "../lib/env";
import { type ReceiptRow, toManageStatus } from "../lib/receipts";
import { verifyToken } from "../lib/tokens";

export const manageRoutes = new Hono<AppEnv>();

/**
 * Deletes the content behind a receipt (ciphertext rows, file chunks, download sessions).
 * Only the row created together with the receipt is touched (`created_at` must match), so a
 * receipt can never delete a newer share that happens to reuse the id.
 */
export async function deleteShareContent(db: D1Database, kind: ShareKind, id: string, createdAt: number): Promise<void> {
  switch (kind) {
    case "note":
      await db.prepare("DELETE FROM notes WHERE id = ? AND created_at = ?").bind(id, createdAt).run();
      return;
    case "secret":
      await db.prepare("DELETE FROM secrets WHERE id = ? AND created_at = ?").bind(id, createdAt).run();
      return;
    case "drop":
      await db.batch([
        db.prepare("DELETE FROM drops WHERE id = ? AND created_at = ?").bind(id, createdAt),
        db.prepare("DELETE FROM drop_chunks WHERE drop_id = ? AND NOT EXISTS (SELECT 1 FROM drops WHERE id = ?)").bind(id, id),
        db.prepare("DELETE FROM drop_sessions WHERE drop_id = ? AND NOT EXISTS (SELECT 1 FROM drops WHERE id = ?)").bind(id, id),
      ]);
      return;
    case "request":
      await db.prepare("DELETE FROM requests WHERE id = ? AND created_at = ?").bind(id, createdAt).run();
      return;
  }
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
    await deleteShareContent(db, row.kind, row.id, row.created_at);
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
