import { Hono } from "hono";
import {
  CreateRequestRequestSchema,
  MAX_REQUEST_RESPONSE_BYTES,
  RespondToRequestRequestSchema,
  type CreateRequestResponse,
  type PublicRequestResponse,
  type RequestResponseSealed,
  type RespondToRequestResponse,
} from "@protectedshare/contracts";
import {
  type AppEnv,
  generateUniqueId,
  isValidId,
  jsonError,
  normalizeExpiresAt,
  nowEpochSeconds,
  readJsonBody,
  rejectShareExpiry,
} from "../lib/env";
import { createReceipt, recordReceiptEvent } from "../lib/receipts";
import { verifyToken } from "../lib/tokens";

type RequestRow = {
  id: string;
  public_key: string;
  label_blob: string | null;
  label_iv: string | null;
  inbox_hash: string;
  response_blob: string | null;
  response_iv: string | null;
  response_salt: string | null;
  response_epk: string | null;
  responded_at: number | null;
  expires_at: number;
  created_at: number;
  /** SHA-256 of the respond token (derived from the link key). NULL on legacy rows. */
  respond_hash: string | null;
};

const NOT_FOUND = () => jsonError("Request not found or expired.", "REQUEST_NOT_FOUND", 404);

async function loadLiveRequest(db: D1Database, id: string | undefined, now: number): Promise<RequestRow | null> {
  if (!isValidId(id)) return null;
  return db.prepare("SELECT * FROM requests WHERE id = ? AND expires_at > ?").bind(id, now).first<RequestRow>();
}

export const requestsRoutes = new Hono<AppEnv>();

requestsRoutes.post("/api/requests", async (c) => {
  const db = c.env.DB;
  const read = await readJsonBody(c, 32_000);
  if (!read.ok) return read.response;
  const parsed = CreateRequestRequestSchema.safeParse(read.body);
  if (!parsed.success) {
    return jsonError("Invalid secret request payload.", "INVALID_REQUEST_PAYLOAD", 400);
  }
  const request = parsed.data;
  const createdAt = nowEpochSeconds();
  const expiresAt = normalizeExpiresAt(request.expiresAt);
  const expiryError = rejectShareExpiry(expiresAt, createdAt);
  if (expiryError) return expiryError;

  let id: string;
  try {
    id = await generateUniqueId(db, "requests", 10);
  } catch {
    return jsonError("Unable to generate a unique link. Please try again.", "ID_GENERATION_FAILED", 503);
  }
  await db.prepare(
    `INSERT INTO requests (id, public_key, label_blob, label_iv, inbox_hash, respond_hash, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, request.publicKey, request.label?.encryptedBlob ?? null, request.label?.iv ?? null,
      request.inboxHash, request.respondHash ?? null, expiresAt, createdAt)
    .run();
  await createReceipt(db, { kind: "request", id, manageHash: request.manageTokenHash, maxReads: 1, createdAt, expiresAt });

  const response: CreateRequestResponse = { id };
  return c.json(response, 201);
});

requestsRoutes.get("/api/requests/:id", async (c) => {
  const row = await loadLiveRequest(c.env.DB, c.req.param("id"), nowEpochSeconds());
  if (!row) return NOT_FOUND();
  const response: PublicRequestResponse = {
    id: row.id,
    publicKey: row.public_key,
    label: row.label_blob && row.label_iv ? { encryptedBlob: row.label_blob, iv: row.label_iv } : null,
    hasResponse: row.response_blob !== null,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
  return c.json(response);
});

requestsRoutes.post("/api/requests/:id/respond", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const read = await readJsonBody(c, MAX_REQUEST_RESPONSE_BYTES + 2_000);
  if (!read.ok) return read.response;
  const parsed = RespondToRequestRequestSchema.safeParse(read.body);
  if (!parsed.success) {
    return jsonError("Invalid response payload.", "INVALID_RESPONSE_PAYLOAD", 400);
  }
  const body = parsed.data;
  const now = nowEpochSeconds();
  const row = await loadLiveRequest(db, id, now);
  if (!row) return NOT_FOUND();

  // Only a holder of the full request link (with #k=) can answer. Rows created before
  // respond tokens existed have no hash and stay open.
  if (row.respond_hash) {
    const token = c.req.header("x-auth-token")?.trim();
    if (!token) return jsonError("This link can't answer the request. It needs the full link.", "AUTH_REQUIRED", 401);
    if (!(await verifyToken(token, row.respond_hash))) {
      return jsonError("This link can't answer the request.", "INVALID_AUTH", 401);
    }
  }

  const updated = await db.prepare(
    `UPDATE requests SET response_blob = ?, response_iv = ?, response_salt = ?, response_epk = ?, responded_at = ?
     WHERE id = ? AND expires_at > ? AND response_blob IS NULL
     RETURNING id`
  )
    .bind(body.encryptedBlob, body.iv, body.salt, body.ephemeralPublicKey, now, row.id, now)
    .first<{ id: string }>();

  if (!updated) {
    const existing = await loadLiveRequest(db, row.id, now);
    if (existing) {
      return jsonError("This request has already been answered.", "ALREADY_RESPONDED", 409);
    }
    return NOT_FOUND();
  }

  await recordReceiptEvent(db, "request", row.id, { consumed: false });
  const response: RespondToRequestResponse = { id: row.id, respondedAt: now };
  return c.json(response, 201);
});

requestsRoutes.get("/api/requests/:id/response", async (c) => {
  const db = c.env.DB;
  const now = nowEpochSeconds();
  const row = await loadLiveRequest(db, c.req.param("id"), now);
  if (!row) return NOT_FOUND();

  const token = c.req.header("x-auth-token")?.trim();
  if (!token) return jsonError("The inbox token is required.", "AUTH_REQUIRED", 401);
  if (!(await verifyToken(token, row.inbox_hash))) {
    return jsonError("Wrong inbox key.", "INVALID_AUTH", 401);
  }
  if (row.response_blob === null) {
    return jsonError("No response yet.", "NO_RESPONSE_YET", 404);
  }

  // Burn: the response can be collected exactly once.
  const deleted = await db.prepare(
    `DELETE FROM requests WHERE id = ? AND response_blob IS NOT NULL
     RETURNING id, response_blob, response_iv, response_salt, response_epk, responded_at`
  )
    .bind(row.id)
    .first<RequestRow>();
  if (!deleted || !deleted.response_blob) return NOT_FOUND();

  await recordReceiptEvent(db, "request", row.id, { countRead: false, consumed: true });
  const response: RequestResponseSealed = {
    id: deleted.id,
    ephemeralPublicKey: deleted.response_epk ?? "",
    salt: deleted.response_salt ?? "",
    iv: deleted.response_iv ?? "",
    encryptedBlob: deleted.response_blob,
    respondedAt: deleted.responded_at ?? now,
  };
  return c.json(response);
});
