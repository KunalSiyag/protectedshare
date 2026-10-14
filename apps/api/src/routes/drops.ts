import { Hono } from "hono";
import {
  CreateDropRequestSchema,
  MAX_DROP_CHUNK_BYTES,
  type CompleteDropResponse,
  type ConsumeDropResponse,
  type CreateDropResponse,
  type DropManifestResponse,
  type DropMetaResponse,
  type StartDropDownloadResponse,
  type UploadDropChunkResponse,
} from "@protectedshare/contracts";
import {
  type AppContext,
  type AppEnv,
  generateUniqueId,
  isValidId,
  jsonError,
  normalizeExpiresAt,
  nowEpochSeconds,
  readJsonBody,
  rejectShareExpiry,
} from "../lib/env";
import { deleteDropObjects, dropBucket, dropChunkKey, dropChunkPrefix } from "../lib/drop-storage";
import {
  CHUNK_SIZE_SQL,
  dailyLimitReached,
  dropBudget,
  hasR2Headroom,
  reserveR2Ops,
  storageFull,
  wouldOverfillStorage,
} from "../lib/drop-budget";
import { authFailed, createFloodGuard } from "../lib/limits";
import { createReceipt, recordReceiptEvent } from "../lib/receipts";
import { hashToken, randomToken, verifyToken } from "../lib/tokens";
import { recordUsage } from "../lib/usage";

type DropRow = {
  id: string;
  manifest_blob: string;
  manifest_iv: string;
  salt: string;
  auth_hash: string;
  upload_hash: string;
  total_bytes: number;
  chunk_count: number;
  downloads_remaining: number;
  is_complete: number;
  expires_at: number;
  created_at: number;
};

const NOT_FOUND = () => jsonError("File drop not found or expired.", "DROP_NOT_FOUND", 404);

/** A started download may fetch chunks for this long (capped at the drop's own expiry). */
export const DROP_SESSION_TTL_SECONDS = 60 * 60;

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,256}$/;

export const dropsRoutes = new Hono<AppEnv>();

/** D1 may hand BLOBs back as ArrayBuffer, a typed array, or a plain number array. */
function toBytes(value: unknown): Uint8Array<ArrayBuffer> {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer as ArrayBuffer, value.byteOffset, value.byteLength);
  }
  if (Array.isArray(value)) return Uint8Array.from(value as number[]);
  throw new Error("Unexpected BLOB representation from D1.");
}

async function loadDrop(db: D1Database, id: string): Promise<DropRow | null> {
  if (!isValidId(id)) return null;
  return db.prepare("SELECT * FROM drops WHERE id = ?").bind(id).first<DropRow>();
}

/** A drop a recipient may read: complete, not expired, downloads left. */
function isReadable(row: DropRow | null, now: number): row is DropRow {
  return !!row && row.is_complete === 1 && row.expires_at > now && row.downloads_remaining > 0;
}

async function checkDropAuth(c: AppContext, row: DropRow): Promise<Response | null> {
  const token = c.req.header("x-auth-token")?.trim();
  if (!token) return jsonError("This link needs an auth token.", "AUTH_REQUIRED", 401);
  if (!(await verifyToken(token, row.auth_hash))) {
    // Drop keys are random 256-bit values: wrong attempts are slowed, the drop is never locked.
    return authFailed(c, "drop", row.id, jsonError("Wrong key.", "INVALID_AUTH", 401), { lock: false });
  }
  return null;
}

async function loadReadableDropWithAuth(c: AppContext): Promise<{ ok: true; row: DropRow } | { ok: false; response: Response }> {
  const row = await loadDrop(c.env.DB, c.req.param("id") ?? "");
  if (!isReadable(row, nowEpochSeconds())) return { ok: false, response: NOT_FOUND() };
  const authError = await checkDropAuth(c, row);
  if (authError) return { ok: false, response: authError };
  return { ok: true, row };
}

/** The download token from POST /start, as presented. Null if missing or malformed. */
function downloadTokenFrom(c: AppContext): string | null {
  const token = c.req.header("x-download-token")?.trim();
  return token && TOKEN_PATTERN.test(token) ? token : null;
}

const DOWNLOAD_TOKEN_REQUIRED = () =>
  jsonError("Start the download first (POST /start) and send its X-Download-Token.", "DOWNLOAD_TOKEN_REQUIRED", 401);
const INVALID_DOWNLOAD_TOKEN = () =>
  jsonError("This download session has ended or the token is wrong. Start the download again.", "INVALID_DOWNLOAD_TOKEN", 403);

async function loadUploadableDrop(c: AppContext): Promise<{ ok: true; row: DropRow } | { ok: false; response: Response }> {
  const row = await loadDrop(c.env.DB, c.req.param("id") ?? "");
  if (!row || row.expires_at <= nowEpochSeconds()) return { ok: false, response: NOT_FOUND() };
  const token = c.req.header("x-upload-token")?.trim();
  if (!token || !(await verifyToken(token, row.upload_hash))) {
    return { ok: false, response: jsonError("Invalid upload token.", "INVALID_UPLOAD_TOKEN", 401) };
  }
  if (row.is_complete === 1) {
    return { ok: false, response: jsonError("This drop is already sealed.", "DROP_ALREADY_COMPLETE", 409) };
  }
  return { ok: true, row };
}

function parseChunkIndex(raw: string | undefined, chunkCount: number): number | null {
  const idx = raw && /^\d{1,3}$/.test(raw) ? Number(raw) : -1;
  return idx >= 0 && idx < chunkCount ? idx : null;
}

dropsRoutes.post("/api/drops", async (c) => {
  const db = c.env.DB;
  const flooded = await createFloodGuard(c);
  if (flooded) return flooded;
  const read = await readJsonBody(c, 256_000);
  if (!read.ok) return read.response;
  const parsed = CreateDropRequestSchema.safeParse(read.body);
  if (!parsed.success) {
    return jsonError("Invalid file drop payload.", "INVALID_DROP_REQUEST", 400);
  }
  const request = parsed.data;
  const createdAt = nowEpochSeconds();
  const expiresAt = normalizeExpiresAt(request.expiresAt);
  const expiryError = rejectShareExpiry(expiresAt, createdAt);
  if (expiryError) return expiryError;

  // Spending guard: refuse up front a drop that can't fit, rather than partway through its upload.
  // Only a check; each chunk reserves its own bytes and R2 write (one per chunk, one for /complete).
  if (await wouldOverfillStorage(c.env, request.totalBytes)) return storageFull();
  if (dropBucket(c.env) && !(await hasR2Headroom(c.env, "class_a", request.chunkCount + 1))) {
    return dailyLimitReached("upload");
  }

  let id: string;
  try {
    id = await generateUniqueId(db, "drops", 10);
  } catch {
    return jsonError("Unable to generate a unique link. Please try again.", "ID_GENERATION_FAILED", 503);
  }
  const uploadToken = randomToken(32);
  const uploadHash = await hashToken(uploadToken);

  await db.prepare(
    `INSERT INTO drops (id, manifest_blob, manifest_iv, salt, auth_hash, upload_hash, total_bytes, chunk_count,
                        downloads_remaining, is_complete, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  )
    .bind(id, request.manifest.encryptedBlob, request.manifest.iv, request.salt, request.authHash, uploadHash,
      request.totalBytes, request.chunkCount, request.maxDownloads, expiresAt, createdAt)
    .run();
  await createReceipt(db, {
    kind: "drop", id, manageHash: request.manageTokenHash, maxReads: request.maxDownloads, createdAt, expiresAt,
  });

  const response: CreateDropResponse = { id, uploadToken };
  return c.json(response, 201);
});

dropsRoutes.put("/api/drops/:id/chunks/:idx", async (c) => {
  const db = c.env.DB;
  const declared = Number(c.req.header("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > MAX_DROP_CHUNK_BYTES) {
    return jsonError(`A chunk can be at most ${MAX_DROP_CHUNK_BYTES} bytes.`, "CHUNK_TOO_LARGE", 413);
  }
  const auth = await loadUploadableDrop(c);
  if (!auth.ok) return auth.response;
  const drop = auth.row;

  const idx = parseChunkIndex(c.req.param("idx"), drop.chunk_count);
  if (idx === null) {
    return jsonError("Chunk index out of range.", "INVALID_CHUNK_INDEX", 400);
  }

  const body = new Uint8Array(await c.req.arrayBuffer());
  if (body.byteLength === 0) {
    return jsonError("Chunk body is empty.", "EMPTY_CHUNK", 400);
  }
  if (body.byteLength > MAX_DROP_CHUNK_BYTES) {
    return jsonError(`A chunk can be at most ${MAX_DROP_CHUNK_BYTES} bytes.`, "CHUNK_TOO_LARGE", 413);
  }

  // Spending guard: every R2 put is reserved against today's write cap before it's made.
  const bucket = dropBucket(c.env);
  if (bucket && !(await reserveR2Ops(c.env, "class_a"))) return dailyLimitReached("upload");

  // Reserve the bytes in D1 first. One statement: the size checks and the write happen
  // atomically, so parallel PUTs can't push the stored total past the declared totalBytes or
  // the storage cap (drop_storage, kept by triggers), and nothing lands after /complete. With R2
  // the row holds only the size; the bytes follow.
  const written = await db.prepare(
    `INSERT INTO drop_chunks (drop_id, idx, data, size)
     SELECT ?1, ?2, ${bucket ? "X''" : "?5"}, ?3
     WHERE (SELECT COALESCE(SUM(${CHUNK_SIZE_SQL}), 0) FROM drop_chunks WHERE drop_id = ?1 AND idx != ?2) + ?3
           <= (SELECT total_bytes FROM drops WHERE id = ?1 AND is_complete = 0)
       AND (SELECT bytes FROM drop_storage WHERE id = 1)
           - COALESCE((SELECT ${CHUNK_SIZE_SQL} FROM drop_chunks WHERE drop_id = ?1 AND idx = ?2), 0) + ?3 <= ?4
     ON CONFLICT(drop_id, idx) DO UPDATE SET data = excluded.data, size = excluded.size
     RETURNING idx`
  )
    .bind(drop.id, idx, body.byteLength, dropBudget(c.env).storageBytes, ...(bucket ? [] : [body]))
    .first<{ idx: number }>();
  if (!written) {
    const current = await loadDrop(db, drop.id);
    if (current?.is_complete === 1) {
      return jsonError("This drop is already sealed.", "DROP_ALREADY_COMPLETE", 409);
    }
    if (!current) return NOT_FOUND();
    const existing = await db.prepare(`SELECT ${CHUNK_SIZE_SQL} AS size FROM drop_chunks WHERE drop_id = ? AND idx = ?`)
      .bind(drop.id, idx)
      .first<{ size: number }>();
    if (await wouldOverfillStorage(c.env, body.byteLength, existing?.size ?? 0)) return storageFull();
    return jsonError("Upload exceeds the declared totalBytes.", "DROP_TOO_LARGE", 413);
  }

  if (bucket) {
    try {
      await bucket.put(dropChunkKey(drop.id, idx), body);
    } catch (error) {
      console.error("R2 put failed for a drop chunk:", error);
      // Release the reservation so the budget and /complete don't count bytes that aren't stored.
      await db.prepare("DELETE FROM drop_chunks WHERE drop_id = ? AND idx = ? AND LENGTH(data) = 0")
        .bind(drop.id, idx)
        .run()
        .catch((releaseError: unknown) => console.error("Failed to release a chunk reservation:", releaseError));
      return jsonError("Couldn't store this chunk. Try again.", "CHUNK_STORE_FAILED", 503);
    }
  }

  const response: UploadDropChunkResponse = { idx, size: body.byteLength };
  return c.json(response);
});

dropsRoutes.post("/api/drops/:id/complete", async (c) => {
  const db = c.env.DB;
  const auth = await loadUploadableDrop(c);
  if (!auth.ok) return auth.response;
  const drop = auth.row;

  const stats = await db.prepare(
    `SELECT COUNT(*) AS count, COALESCE(SUM(${CHUNK_SIZE_SQL}), 0) AS bytes FROM drop_chunks WHERE drop_id = ? AND idx < ?`
  )
    .bind(drop.id, drop.chunk_count)
    .first<{ count: number; bytes: number }>();
  let count = stats?.count ?? 0;

  // R2-backed chunks: check every object landed with the size D1 reserved for it. A chunk
  // whose write never finished is dropped from D1 so the uploader sends it again.
  const bucket = dropBucket(c.env);
  if (bucket && count === drop.chunk_count) {
    const { results: reserved } = await db.prepare(
      "SELECT idx, size FROM drop_chunks WHERE drop_id = ? AND idx < ? AND LENGTH(data) = 0"
    )
      .bind(drop.id, drop.chunk_count)
      .all<{ idx: number; size: number }>();
    if (reserved.length > 0) {
      if (!(await reserveR2Ops(c.env, "class_a"))) return dailyLimitReached("upload");
      const listing = await bucket.list({ prefix: dropChunkPrefix(drop.id), limit: 1000 });
      const stored = new Map(listing.objects.map((object) => [object.key, object.size]));
      const missing = reserved.filter((row) => stored.get(dropChunkKey(drop.id, row.idx)) !== row.size);
      if (missing.length > 0) {
        await db.batch(
          missing.map((row) =>
            db.prepare("DELETE FROM drop_chunks WHERE drop_id = ? AND idx = ? AND LENGTH(data) = 0").bind(drop.id, row.idx)
          )
        );
        count -= missing.length;
      }
    }
  }

  if (count !== drop.chunk_count) {
    return c.json(
      { error: `Missing chunks: ${count} of ${drop.chunk_count} uploaded.`, code: "DROP_INCOMPLETE", uploaded: count },
      409,
    );
  }
  const totalBytes = stats?.bytes ?? 0;
  const sealed = await db.prepare("UPDATE drops SET is_complete = 1, total_bytes = ? WHERE id = ? AND is_complete = 0")
    .bind(totalBytes, drop.id)
    .run();
  if ((sealed.meta?.changes ?? 0) > 0) recordUsage(c, "drop");

  const response: CompleteDropResponse = { id: drop.id, totalBytes, chunkCount: drop.chunk_count };
  return c.json(response);
});

dropsRoutes.get("/api/drops/:id/meta", async (c) => {
  const row = await loadDrop(c.env.DB, c.req.param("id"));
  if (!isReadable(row, nowEpochSeconds())) return NOT_FOUND();
  const response: DropMetaResponse = {
    id: row.id,
    salt: row.salt,
    chunkCount: row.chunk_count,
    totalBytes: row.total_bytes,
    expiresAt: row.expires_at,
    downloadsRemaining: row.downloads_remaining,
  };
  return c.json(response);
});

dropsRoutes.get("/api/drops/:id/manifest", async (c) => {
  const auth = await loadReadableDropWithAuth(c);
  if (!auth.ok) return auth.response;
  const response: DropManifestResponse = {
    manifest: { encryptedBlob: auth.row.manifest_blob, iv: auth.row.manifest_iv },
    chunkCount: auth.row.chunk_count,
  };
  return c.json(response);
});

/**
 * Start a download: spends one download (atomically), records it on the receipt, and opens
 * a download session. Chunk GETs and /consume need the returned X-Download-Token. Cancelling
 * a started download does not give the download back.
 */
dropsRoutes.post("/api/drops/:id/start", async (c) => {
  const db = c.env.DB;
  const auth = await loadReadableDropWithAuth(c);
  if (!auth.ok) return auth.response;
  const drop = auth.row;
  const now = nowEpochSeconds();

  // Spending guard: a download reads every chunk once. Checked before the download is spent.
  if (dropBucket(c.env) && !(await hasR2Headroom(c.env, "class_b", drop.chunk_count))) {
    return dailyLimitReached("download", "This didn't use up a download.");
  }

  const updated = await db.prepare(
    `UPDATE drops SET downloads_remaining = downloads_remaining - 1
     WHERE id = ? AND is_complete = 1 AND downloads_remaining >= 1 AND expires_at > ?
     RETURNING downloads_remaining, expires_at`
  )
    .bind(drop.id, now)
    .first<{ downloads_remaining: number; expires_at: number }>();
  if (!updated) return NOT_FOUND();

  const downloadsRemaining = Math.max(0, updated.downloads_remaining);
  const downloadToken = randomToken(32);
  const expiresAt = Math.min(now + DROP_SESSION_TTL_SECONDS, updated.expires_at);
  await db.prepare("INSERT INTO drop_sessions (drop_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(drop.id, await hashToken(downloadToken), expiresAt, now)
    .run();
  await recordReceiptEvent(db, "drop", drop.id, { consumed: downloadsRemaining === 0 });

  const response: StartDropDownloadResponse = { downloadToken, downloadsRemaining, expiresAt };
  return c.json(response, 201);
});

dropsRoutes.get("/api/drops/:id/chunks/:idx", async (c) => {
  const db = c.env.DB;
  const now = nowEpochSeconds();
  const row = await loadDrop(db, c.req.param("id"));
  // Readable while a started download is running, even after the last one was spent.
  if (!row || row.is_complete !== 1 || row.expires_at <= now) return NOT_FOUND();
  const authError = await checkDropAuth(c, row);
  if (authError) return authError;
  const downloadToken = downloadTokenFrom(c);
  if (!downloadToken) return DOWNLOAD_TOKEN_REQUIRED();
  const session = await db.prepare("SELECT 1 AS live FROM drop_sessions WHERE drop_id = ? AND token_hash = ? AND expires_at > ?")
    .bind(row.id, await hashToken(downloadToken), now)
    .first<{ live: number }>();
  if (!session) return INVALID_DOWNLOAD_TOKEN();

  const idx = parseChunkIndex(c.req.param("idx"), row.chunk_count);
  if (idx === null) {
    return jsonError("Chunk index out of range.", "INVALID_CHUNK_INDEX", 400);
  }
  // `data` comes back only for chunks stored in D1 (including every row written before R2).
  const chunk = await db.prepare(
    "SELECT CASE WHEN LENGTH(data) > 0 THEN data END AS data FROM drop_chunks WHERE drop_id = ? AND idx = ?"
  )
    .bind(row.id, idx)
    .first<{ data: unknown }>();
  if (!chunk) return jsonError("Chunk not found.", "CHUNK_NOT_FOUND", 404);
  const headers = { "Content-Type": "application/octet-stream", "Cache-Control": "no-store" };

  if (chunk.data !== null && chunk.data !== undefined) {
    const bytes = toBytes(chunk.data);
    return new Response(bytes, { status: 200, headers: { ...headers, "Content-Length": String(bytes.byteLength) } });
  }
  const bucket = dropBucket(c.env);
  if (!bucket) {
    return jsonError("This server can't read file-drop storage right now.", "CHUNK_STORAGE_UNAVAILABLE", 503);
  }
  if (!(await reserveR2Ops(c.env, "class_b"))) return dailyLimitReached("download");
  const object = await bucket.get(dropChunkKey(row.id, idx));
  if (!object) return jsonError("Chunk not found.", "CHUNK_NOT_FOUND", 404);
  return new Response(object.body, { status: 200, headers: { ...headers, "Content-Length": String(object.size) } });
});

/**
 * Finish a download (path kept as /consume; /finish is an alias). Ends the caller's download
 * session. When no downloads are left and no other download is running, the drop and its
 * chunks are deleted (D1 rows and R2 objects). The download itself was already counted by /start.
 */
async function finishDownload(c: AppContext): Promise<Response> {
  const db = c.env.DB;
  const id = c.req.param("id") ?? "";
  if (!isValidId(id)) return NOT_FOUND();
  const downloadToken = downloadTokenFrom(c);
  if (!downloadToken) return DOWNLOAD_TOKEN_REQUIRED();
  const now = nowEpochSeconds();

  const ended = await db.prepare("DELETE FROM drop_sessions WHERE drop_id = ? AND token_hash = ? RETURNING drop_id")
    .bind(id, await hashToken(downloadToken))
    .first<{ drop_id: string }>();
  if (!ended) return INVALID_DOWNLOAD_TOKEN();

  const [removed] = await db.batch<{ id: string; chunk_count: number }>([
    db.prepare(
      `DELETE FROM drops WHERE id = ?1 AND downloads_remaining <= 0
         AND NOT EXISTS (SELECT 1 FROM drop_sessions WHERE drop_id = ?1 AND expires_at > ?2)
       RETURNING id, chunk_count`
    ).bind(id, now),
    db.prepare("DELETE FROM drop_chunks WHERE drop_id = ?1 AND NOT EXISTS (SELECT 1 FROM drops WHERE id = ?1)").bind(id),
    db.prepare("DELETE FROM drop_sessions WHERE drop_id = ?1 AND NOT EXISTS (SELECT 1 FROM drops WHERE id = ?1)").bind(id),
  ]);
  const gone = removed?.results?.[0];
  let deleted = !!gone;
  let downloadsRemaining = 0;
  if (gone) {
    await deleteDropObjects(c.env, [{ id, chunkCount: gone.chunk_count }]);
  } else {
    const row = await db.prepare("SELECT downloads_remaining FROM drops WHERE id = ?").bind(id).first<{ downloads_remaining: number }>();
    // Already gone (revoked, or removed when another download finished): report it as deleted.
    if (!row) deleted = true;
    downloadsRemaining = Math.max(0, row?.downloads_remaining ?? 0);
  }

  const response: ConsumeDropResponse = { downloadsRemaining, deleted };
  return c.json(response);
}

dropsRoutes.post("/api/drops/:id/consume", finishDownload);
dropsRoutes.post("/api/drops/:id/finish", finishDownload);
