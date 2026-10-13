import { Hono } from "hono";
import {
  CreateNoteRequestSchema,
  CreateNoteV2RequestSchema,
  CreateSecretRequestSchema,
  CreateSecretV2RequestSchema,
  type CreateNoteResponse,
  type CreateSecretResponse,
  type GetNoteResponse,
  type GetNoteV2Response,
  type GetSecretResponse,
  type GetSecretV2Response,
  type KdfMode,
  type ShareMetaResponse,
} from "@protectedshare/contracts";
import {
  type AppContext,
  type AppEnv,
  generateUniqueId,
  getPasswordProofParam as getPasswordProof,
  isValidId,
  jsonError,
  normalizeExpiresAt,
  nowEpochSeconds,
  readJsonBody,
  rejectShareExpiry,
} from "../lib/env";
import { authFailed, authKey, createFloodGuard, lockedOut, lockedUntilColumn } from "../lib/limits";
import { createReceipt, recordReceiptEvent } from "../lib/receipts";
import { timingSafeEqual, verifyToken } from "../lib/tokens";
import { recordUsage } from "../lib/usage";

/** v2 note/secret ids are 10 characters; v1 creates keep 5. Readers accept any valid id. */
const V2_ID_LENGTH = 10;
const V1_ID_LENGTH = 5;

/** Largest create body accepted (D1 rows are capped at 2 MB). */
const MAX_SHARE_BODY_BYTES = 1_900_000;

type ShareRow = {
  id: string;
  encrypted_blob: string;
  iv: string;
  salt: string;
  password_proof: string;
  is_burn_after_read: number | null;
  reads_remaining?: number | null;
  expires_at: number;
  created_at: number;
  version: number | null;
  kdf: KdfMode | null;
  /** Only on reads that open the share: set while it is locked after too many wrong passwords. */
  locked_until?: number | null;
};

const NOTE_COLUMNS = "id, encrypted_blob, iv, salt, password_proof, is_burn_after_read, expires_at, created_at, version, kdf";
const SECRET_COLUMNS = "id, encrypted_blob, iv, salt, password_proof, is_burn_after_read, reads_remaining, expires_at, created_at, version, kdf";

/**
 * A password stands between the link and the content (v1 rows, v2 "password" and
 * "key+password"), so wrong guesses lock the share. Key-only links can't be guessed.
 */
function isGuessable(row: ShareRow): boolean {
  return row.version !== 2 || (row.kdf ?? "key") !== "key";
}

/** Row query for an open: the share plus its lock expiry. Binds (id, now, lock key). */
function openQuery(table: "notes" | "secrets"): string {
  const columns = table === "notes" ? NOTE_COLUMNS : SECRET_COLUMNS;
  return `SELECT ${columns}, ${lockedUntilColumn("?3")} FROM ${table} WHERE id = ?1 AND expires_at > ?2`;
}

function isV2Body(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const record = body as Record<string, unknown>;
  const payload = record.payload as Record<string, unknown> | undefined;
  return (payload && typeof payload === "object" && payload.v === 2) || "authHash" in record;
}

function authTokenFrom(c: AppContext): string | undefined {
  return c.req.header("x-auth-token")?.trim() || undefined;
}

/** Shared v2 auth gate. Returns an error response or null when the token matches. */
async function checkV2Auth(c: AppContext, kind: "note" | "secret", row: ShareRow): Promise<Response | null> {
  const token = authTokenFrom(c);
  if (!token) {
    return jsonError("This link needs an auth token.", "AUTH_REQUIRED", 401);
  }
  const lock = isGuessable(row);
  if (lock) {
    const locked = lockedOut(row.locked_until);
    if (locked) return locked;
  }
  if (!(await verifyToken(token, row.password_proof))) {
    return authFailed(c, kind, row.id, jsonError("Wrong key or password.", "INVALID_AUTH", 401), { lock });
  }
  return null;
}

/** v1 gate: `?proof=` against the stored password proof, with the lock around it. */
async function checkV1Proof(c: AppContext, kind: "note" | "secret", row: ShareRow, proof: string): Promise<Response | null> {
  const locked = lockedOut(row.locked_until);
  if (locked) return locked;
  if (!timingSafeEqual(row.password_proof ?? "", proof)) {
    return authFailed(c, kind, row.id, jsonError("Invalid password.", "INVALID_PASSWORD", 401), { lock: true });
  }
  return null;
}

function v1Payload(row: ShareRow) {
  return { encryptedBlob: row.encrypted_blob, iv: row.iv, salt: row.salt };
}

function v2Payload(row: ShareRow) {
  return { v: 2 as const, kdf: (row.kdf ?? "key") as KdfMode, encryptedBlob: row.encrypted_blob, iv: row.iv, salt: row.salt };
}

export const sharesRoutes = new Hono<AppEnv>();

/* ------------------------------- Notes -------------------------------- */

sharesRoutes.post("/api/notes", async (c) => {
  const flooded = await createFloodGuard(c);
  if (flooded) return flooded;
  const read = await readJsonBody(c, MAX_SHARE_BODY_BYTES);
  if (!read.ok) return read.response;
  const createdAt = nowEpochSeconds();
  const db = c.env.DB;

  if (isV2Body(read.body)) {
    const parsed = CreateNoteV2RequestSchema.safeParse(read.body);
    if (!parsed.success) {
      return jsonError("Invalid note request payload.", "INVALID_NOTE_REQUEST", 400);
    }
    const request = parsed.data;
    const expiresAt = normalizeExpiresAt(request.expiresAt);
    const expiryError = rejectShareExpiry(expiresAt, createdAt);
    if (expiryError) return expiryError;

    let id: string;
    try {
      // v2 ids are 10 characters (62^10); v1 creates keep 5 for old clients.
      id = await generateUniqueId(db, "notes", V2_ID_LENGTH);
    } catch {
      return jsonError("Unable to generate a unique link. Please try again.", "ID_GENERATION_FAILED", 503);
    }
    await db.prepare(
      `INSERT INTO notes (id, encrypted_blob, iv, salt, password_proof, is_burn_after_read, expires_at, created_at, version, kdf)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 2, ?)`
    )
      .bind(id, request.payload.encryptedBlob, request.payload.iv, request.payload.salt, request.authHash,
        request.isBurnAfterRead ? 1 : 0, expiresAt, createdAt, request.payload.kdf)
      .run();
    await createReceipt(db, {
      kind: "note", id, manageHash: request.manageTokenHash,
      maxReads: request.isBurnAfterRead ? 1 : null, createdAt, expiresAt,
    });
    recordUsage(c, "note");
    const response: CreateNoteResponse = { id };
    return c.json(response, 201);
  }

  const parsed = CreateNoteRequestSchema.safeParse(read.body);
  if (!parsed.success) {
    return jsonError("Invalid note request payload.", "INVALID_NOTE_REQUEST", 400);
  }
  const request = parsed.data;
  const expiresAt = normalizeExpiresAt(request.expiresAt);
  const expiryError = rejectShareExpiry(expiresAt, createdAt);
  if (expiryError) return expiryError;

  let id: string;
  try {
    id = await generateUniqueId(db, "notes");
  } catch {
    return jsonError("Unable to generate a unique link. Please try again.", "ID_GENERATION_FAILED", 503);
  }
  await db.prepare(
    `INSERT INTO notes (id, encrypted_blob, iv, salt, password_proof, is_burn_after_read, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, request.payload.encryptedBlob, request.payload.iv, request.payload.salt, request.passwordProof,
      request.isBurnAfterRead ? 1 : 0, expiresAt, createdAt)
    .run();
  // No receipt for v1 shares; this only clears a stale one under the same id.
  await createReceipt(db, { kind: "note", id, manageHash: undefined, maxReads: null, createdAt, expiresAt });
  recordUsage(c, "note");
  const response: CreateNoteResponse = { id };
  return c.json(response, 201);
});

sharesRoutes.get("/api/notes/:id/meta", async (c) => {
  const id = c.req.param("id");
  if (!isValidId(id)) return jsonError("Note not found or expired.", "NOTE_NOT_FOUND", 404);
  const row = await c.env.DB.prepare(`SELECT ${NOTE_COLUMNS} FROM notes WHERE id = ? AND expires_at > ?`)
    .bind(id, nowEpochSeconds())
    .first<ShareRow>();
  if (!row) return jsonError("Note not found or expired.", "NOTE_NOT_FOUND", 404);
  const isV2 = row.version === 2;
  const response: ShareMetaResponse = {
    id: row.id,
    v: isV2 ? 2 : 1,
    kdf: isV2 ? (row.kdf ?? "key") : null,
    salt: row.salt,
    expiresAt: row.expires_at,
    isBurnAfterRead: row.is_burn_after_read === 1,
  };
  return c.json(response);
});

sharesRoutes.get("/api/notes/:id", async (c) => {
  const id = c.req.param("id");
  const now = nowEpochSeconds();
  const db = c.env.DB;
  if (!isValidId(id)) return jsonError("Note not found or expired.", "NOTE_NOT_FOUND", 404);

  const row = await db.prepare(openQuery("notes"))
    .bind(id, now, authKey("note", id))
    .first<ShareRow>();

  if (row && row.version === 2) {
    const authError = await checkV2Auth(c, "note", row);
    if (authError) return authError;
    const burn = row.is_burn_after_read === 1;
    if (burn) {
      const deleted = await db.prepare("DELETE FROM notes WHERE id = ? AND expires_at > ? RETURNING id")
        .bind(id, now)
        .first<{ id: string }>();
      if (!deleted) return jsonError("Note not found or expired.", "NOTE_NOT_FOUND", 404);
    }
    await recordReceiptEvent(db, "note", id, { consumed: burn });
    const response: GetNoteV2Response = {
      id: row.id,
      v: 2,
      kdf: row.kdf ?? "key",
      payload: v2Payload(row),
      expiresAt: row.expires_at,
      isBurnAfterRead: burn,
      createdAt: row.created_at,
    };
    return c.json(response);
  }

  if (!row) {
    return jsonError("Note not found or expired.", "NOTE_NOT_FOUND", 404);
  }
  // v1: password proof in ?proof=
  const proof = getPasswordProof(c.req.query("proof"));
  if (!proof) {
    return jsonError("A valid password proof is required.", "INVALID_PASSWORD_PROOF", 400);
  }
  const proofError = await checkV1Proof(c, "note", row, proof);
  if (proofError) return proofError;
  if (row.is_burn_after_read === 1) {
    const deleted = await db.prepare(
      "DELETE FROM notes WHERE id = ? AND password_proof = ? AND expires_at > ? RETURNING id"
    )
      .bind(id, proof, now)
      .first<{ id: string }>();
    if (!deleted) return jsonError("Note not found or expired.", "NOTE_NOT_FOUND", 404);
  }
  const response: GetNoteResponse = {
    id: row.id,
    payload: v1Payload(row),
    expiresAt: row.expires_at,
    isBurnAfterRead: row.is_burn_after_read === 1,
    createdAt: row.created_at,
    v: 1,
    kdf: null,
  };
  return c.json(response);
});

/* ------------------------------ Secrets ------------------------------- */

sharesRoutes.post("/api/secrets", async (c) => {
  const flooded = await createFloodGuard(c);
  if (flooded) return flooded;
  const read = await readJsonBody(c, MAX_SHARE_BODY_BYTES);
  if (!read.ok) return read.response;
  const createdAt = nowEpochSeconds();
  const db = c.env.DB;
  const v2 = isV2Body(read.body);

  const parsed = v2 ? CreateSecretV2RequestSchema.safeParse(read.body) : CreateSecretRequestSchema.safeParse(read.body);
  if (!parsed.success) {
    return jsonError("Invalid secret request payload.", "INVALID_SECRET_REQUEST", 400);
  }
  const request = parsed.data;
  const expiresAt = normalizeExpiresAt(request.expiresAt);
  const expiryError = rejectShareExpiry(expiresAt, createdAt);
  if (expiryError) return expiryError;
  const maxReads = request.maxReads ?? 1;

  let id: string;
  try {
    id = await generateUniqueId(db, "secrets", v2 ? V2_ID_LENGTH : V1_ID_LENGTH);
  } catch {
    return jsonError("Unable to generate a unique link. Please try again.", "ID_GENERATION_FAILED", 503);
  }

  if ("authHash" in request) {
    await db.prepare(
      `INSERT INTO secrets (id, encrypted_blob, iv, salt, password_proof, is_burn_after_read, reads_remaining, expires_at, created_at, version, kdf)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, 2, ?)`
    )
      .bind(id, request.payload.encryptedBlob, request.payload.iv, request.payload.salt, request.authHash,
        maxReads, expiresAt, createdAt, request.payload.kdf)
      .run();
    await createReceipt(db, { kind: "secret", id, manageHash: request.manageTokenHash, maxReads, createdAt, expiresAt });
  } else {
    await db.prepare(
      `INSERT INTO secrets (id, encrypted_blob, iv, salt, password_proof, is_burn_after_read, reads_remaining, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`
    )
      .bind(id, request.payload.encryptedBlob, request.payload.iv, request.payload.salt, request.passwordProof,
        maxReads, expiresAt, createdAt)
      .run();
    await createReceipt(db, { kind: "secret", id, manageHash: undefined, maxReads, createdAt, expiresAt });
  }
  recordUsage(c, "secret");

  const response: CreateSecretResponse = { id };
  return c.json(response, 201);
});

sharesRoutes.get("/api/secrets/:id/meta", async (c) => {
  const id = c.req.param("id");
  if (!isValidId(id)) return jsonError("Secret not found or expired.", "SECRET_NOT_FOUND", 404);
  const row = await c.env.DB.prepare(`SELECT ${SECRET_COLUMNS} FROM secrets WHERE id = ? AND expires_at > ?`)
    .bind(id, nowEpochSeconds())
    .first<ShareRow>();
  if (!row) return jsonError("Secret not found or expired.", "SECRET_NOT_FOUND", 404);
  const isV2 = row.version === 2;
  const response: ShareMetaResponse = {
    id: row.id,
    v: isV2 ? 2 : 1,
    kdf: isV2 ? (row.kdf ?? "key") : null,
    salt: row.salt,
    expiresAt: row.expires_at,
    isBurnAfterRead: true,
    remainingReads: Math.max(0, row.reads_remaining ?? 1),
  };
  return c.json(response);
});

/** Atomically spends one read. Returns reads left, or null if the secret is gone. */
async function spendSecretRead(db: D1Database, id: string, now: number): Promise<number | null> {
  const updated = await db.prepare(
    `UPDATE secrets SET reads_remaining = COALESCE(reads_remaining, 1) - 1
     WHERE id = ? AND expires_at > ? AND COALESCE(reads_remaining, 1) >= 1
     RETURNING reads_remaining`
  )
    .bind(id, now)
    .first<{ reads_remaining: number }>();
  if (!updated) return null;
  const remaining = Math.max(0, updated.reads_remaining);
  if (remaining <= 0) {
    await db.prepare("DELETE FROM secrets WHERE id = ?").bind(id).run();
  }
  return remaining;
}

sharesRoutes.get("/api/secrets/:id", async (c) => {
  const id = c.req.param("id");
  const now = nowEpochSeconds();
  const db = c.env.DB;
  if (!isValidId(id)) return jsonError("Secret not found or expired.", "SECRET_NOT_FOUND", 404);

  const row = await db.prepare(openQuery("secrets"))
    .bind(id, now, authKey("secret", id))
    .first<ShareRow>();

  if (row && row.version === 2) {
    const authError = await checkV2Auth(c, "secret", row);
    if (authError) return authError;
    const remaining = await spendSecretRead(db, id, now);
    if (remaining === null) return jsonError("Secret not found or expired.", "SECRET_NOT_FOUND", 404);
    await recordReceiptEvent(db, "secret", id, { consumed: remaining === 0 });
    const response: GetSecretV2Response = {
      id: row.id,
      v: 2,
      kdf: row.kdf ?? "key",
      payload: v2Payload(row),
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      remainingReads: remaining,
    };
    return c.json(response);
  }

  if (!row) {
    return jsonError("Secret not found or expired.", "SECRET_NOT_FOUND", 404);
  }
  const proof = getPasswordProof(c.req.query("proof"));
  if (!proof) {
    return jsonError("A valid password proof is required.", "INVALID_PASSWORD_PROOF", 400);
  }
  const proofError = await checkV1Proof(c, "secret", row, proof);
  if (proofError) return proofError;
  const remaining = await spendSecretRead(db, id, now);
  if (remaining === null) return jsonError("Secret not found or expired.", "SECRET_NOT_FOUND", 404);
  const response: GetSecretResponse = {
    id: row.id,
    payload: v1Payload(row),
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    remainingReads: remaining,
    v: 1,
    kdf: null,
  };
  return c.json(response);
});
