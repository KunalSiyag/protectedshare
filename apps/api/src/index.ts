import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import {
  type ApiError,
  type CreateNoteRequest,
  type CreateNoteResponse,
  type CreateSecretRequest,
  type CreateSecretResponse,
  CreateNoteRequestSchema,
  CreateSecretRequestSchema,
  type GetNoteResponse,
  type GetSecretResponse,
  type HealthCheck,
  type CreateChatMessageRequest,
  CreateChatMessageRequestSchema,
  type GetChatMessagesResponse,
  type ChatMessageResponse,
  type UpdateChatPresenceRequest,
  UpdateChatPresenceRequestSchema,
  type GetChatPresenceResponse
} from "@protectedshare/contracts";

type Bindings = {
  DB: D1Database;
  RESEND_API_KEY?: string;
};

type NoteRow = {
  id: string;
  encrypted_blob: string;
  iv: string;
  salt: string;
  password_proof: string;
  is_burn_after_read: number;
  expires_at: number;
  created_at: number;
};

type SecretRow = {
  id: string;
  encrypted_blob: string;
  iv: string;
  salt: string;
  password_proof: string;
  is_burn_after_read?: number;
  reads_remaining: number | null;
  expires_at: number;
  created_at: number;
};

type ChatMessageRow = {
  id: string;
  room_id: string;
  encrypted_blob: string;
  iv: string;
  salt: string;
  created_at: number;
};

const app = new Hono<{ Bindings: Bindings }>();
const NANOID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const MILLISECONDS_THRESHOLD = 100_000_000_000;
const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const CHAT_PRESENCE_TTL_MS = 15_000;

function jsonError(error: string, code: string, status: number): Response {
  const payload: ApiError = { error, code };
  return Response.json(payload, { status });
}

function nowEpochSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

async function fetchChatMessages(
  db: D1Database,
  roomId: string,
  since: number,
): Promise<ChatMessageResponse[]> {
  const { results } = await db.prepare(
    `SELECT * FROM chat_messages
     WHERE room_id = ? AND created_at > ?
     ORDER BY created_at ASC
     LIMIT 100`
  )
    .bind(roomId, since)
    .all<ChatMessageRow>();

  return results.map((row) => ({
    id: row.id,
    payload: {
      encryptedBlob: row.encrypted_blob,
      iv: row.iv,
      salt: row.salt,
    },
    createdAt: row.created_at,
  }));
}

async function pruneStaleChatPresence(db: D1Database, roomId: string, now: number): Promise<void> {
  const cutoff = now - CHAT_PRESENCE_TTL_MS;
  await db.prepare(
    "DELETE FROM chat_room_presence WHERE room_id = ? AND last_seen < ?"
  )
    .bind(roomId, cutoff)
    .run();
}

async function fetchChatPresence(
  db: D1Database,
  roomId: string,
  now: number,
): Promise<GetChatPresenceResponse> {
  await pruneStaleChatPresence(db, roomId, now);

  const onlineRow = await db.prepare(
    "SELECT COUNT(*) AS count FROM chat_room_presence WHERE room_id = ?"
  )
    .bind(roomId)
    .first<{ count: number }>();

  const typingRow = await db.prepare(
    "SELECT COUNT(*) AS count FROM chat_room_presence WHERE room_id = ? AND is_typing = 1"
  )
    .bind(roomId)
    .first<{ count: number }>();

  return {
    onlineCount: onlineRow?.count ?? 0,
    typingCount: typingRow?.count ?? 0,
    generatedAt: now,
  };
}

async function updateChatPresence(
  db: D1Database,
  roomId: string,
  request: UpdateChatPresenceRequest,
  now: number,
): Promise<GetChatPresenceResponse> {
  if (request.state === "leave") {
    await db.prepare(
      "DELETE FROM chat_room_presence WHERE room_id = ? AND client_id = ?"
    )
      .bind(roomId, request.clientId)
      .run();
  } else {
    await db.prepare(
      `INSERT INTO chat_room_presence (
        room_id,
        client_id,
        last_seen,
        is_typing,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(room_id, client_id) DO UPDATE SET
        last_seen = excluded.last_seen,
        is_typing = excluded.is_typing,
        updated_at = excluded.updated_at`
    )
      .bind(
        roomId,
        request.clientId,
        now,
        request.isTyping ? 1 : 0,
        now,
        now
      )
      .run();
  }

  return fetchChatPresence(db, roomId, now);
}

function normalizeExpiresAt(expiresAt: number): number {
  if (expiresAt > MILLISECONDS_THRESHOLD) {
    return Math.floor(expiresAt / 1000);
  }
  return expiresAt;
}

const MAX_ID_RETRIES = 10;

function createId(size = 5): string {
  const random = crypto.getRandomValues(new Uint8Array(size));
  let result = "";

  for (const item of random) {
    result += NANOID_ALPHABET[item % NANOID_ALPHABET.length];
  }

  return result;
}

/**
 * Generates a unique ID for the given table by checking the DB for collisions
 * before inserting. Retries up to MAX_ID_RETRIES times.
 */
async function generateUniqueId(db: D1Database, table: "notes" | "secrets"): Promise<string> {
  for (let attempt = 0; attempt < MAX_ID_RETRIES; attempt++) {
    const candidate = createId();
    const existing = await db.prepare(
      `SELECT id FROM ${table} WHERE id = ?`
    ).bind(candidate).first<{ id: string }>();

    if (!existing) {
      return candidate;
    }
  }

  throw new Error(`Unable to generate a unique ID after ${MAX_ID_RETRIES} attempts.`);
}

function getPasswordProof(raw: string | undefined | null): string | null {
  if (!raw) {
    return null;
  }

  if (!BASE64_URL_PATTERN.test(raw)) {
    return null;
  }

  return raw;
}

function toNoteResponse(row: NoteRow): GetNoteResponse {
  return {
    id: row.id,
    payload: {
      encryptedBlob: row.encrypted_blob,
      iv: row.iv,
      salt: row.salt
    },
    expiresAt: row.expires_at,
    isBurnAfterRead: row.is_burn_after_read === 1,
    createdAt: row.created_at
  };
}

function toSecretResponse(row: SecretRow): GetSecretResponse {
  return {
    id: row.id,
    payload: {
      encryptedBlob: row.encrypted_blob,
      iv: row.iv,
      salt: row.salt
    },
    expiresAt: row.expires_at,
    createdAt: row.created_at
  };
}

function isMissingBurnAfterReadColumnError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("no such column: is_burn_after_read");
}

app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"]
  })
);

app.get("/health", () => {
  const payload: HealthCheck = { status: "ok" };
  return Response.json(payload);
});

app.post("/api/notes", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateNoteRequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid note request payload.", "INVALID_NOTE_REQUEST", 400);
  }

  const request: CreateNoteRequest = parsed.data;
  const createdAt = nowEpochSeconds();
  const expiresAt = normalizeExpiresAt(request.expiresAt);

  if (expiresAt <= createdAt) {
    return jsonError("expiresAt must be in the future.", "INVALID_EXPIRES_AT", 400);
  }

  let noteId: string;
  try {
    noteId = await generateUniqueId(c.env.DB, "notes");
  } catch {
    return jsonError("Unable to generate a unique link. Please try again.", "ID_GENERATION_FAILED", 503);
  }

  try {
    await c.env.DB.prepare(
      `INSERT INTO notes (
        id,
        encrypted_blob,
        iv,
        salt,
        password_proof,
        is_burn_after_read,
        expires_at,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        noteId,
        request.payload.encryptedBlob,
        request.payload.iv,
        request.payload.salt,
        request.passwordProof,
        request.isBurnAfterRead ? 1 : 0,
        expiresAt,
        createdAt
      )
      .run();
  } catch (error: unknown) {
    if (!isMissingBurnAfterReadColumnError(error)) {
      throw error;
    }

    await c.env.DB.prepare(
      `INSERT INTO notes (
        id,
        encrypted_blob,
        iv,
        salt,
        password_proof,
        expires_at,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        noteId,
        request.payload.encryptedBlob,
        request.payload.iv,
        request.payload.salt,
        request.passwordProof,
        expiresAt,
        createdAt
      )
      .run();
  }

  const response: CreateNoteResponse = { id: noteId };
  return c.json(response, 201);
});

app.get("/api/notes/:id", async (c) => {
  const { id } = c.req.param();
  const proof = getPasswordProof(c.req.query("proof"));
  const now = nowEpochSeconds();

  if (!proof) {
    return jsonError("A valid password proof is required.", "INVALID_PASSWORD_PROOF", 400);
  }

  let existing: NoteRow | null = null;
  try {
    existing = await c.env.DB.prepare(
      `SELECT id, encrypted_blob, iv, salt, password_proof, is_burn_after_read, expires_at, created_at
       FROM notes
       WHERE id = ? AND password_proof = ? AND expires_at > ?`
    )
      .bind(id, proof, now)
      .first<NoteRow>();
  } catch (error: unknown) {
    if (!isMissingBurnAfterReadColumnError(error)) {
      throw error;
    }

    existing = await c.env.DB.prepare(
      `SELECT id, encrypted_blob, iv, salt, password_proof, 0 AS is_burn_after_read, expires_at, created_at
       FROM notes
       WHERE id = ? AND password_proof = ? AND expires_at > ?`
    )
      .bind(id, proof, now)
      .first<NoteRow>();
  }

  if (!existing) {
    const availableWithoutPassword = await c.env.DB.prepare(
      "SELECT id FROM notes WHERE id = ? AND expires_at > ?"
    )
      .bind(id, now)
      .first<{ id: string }>();

    if (availableWithoutPassword) {
      return jsonError("Invalid password.", "INVALID_PASSWORD", 401);
    }

    return jsonError("Note not found or expired.", "NOTE_NOT_FOUND", 404);
  }

  if (existing.is_burn_after_read === 1) {
    const deleted = await c.env.DB.prepare(
      `DELETE FROM notes
       WHERE id = ? AND password_proof = ? AND expires_at > ?
       RETURNING id, encrypted_blob, iv, salt, password_proof, is_burn_after_read, expires_at, created_at`
    )
      .bind(id, proof, now)
      .first<NoteRow>();

    if (!deleted) {
      return jsonError("Invalid password.", "INVALID_PASSWORD", 401);
    }

    return c.json(toNoteResponse(deleted));
  }

  return c.json(toNoteResponse(existing));
});

app.post("/api/secrets", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateSecretRequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError("Invalid secret request payload.", "INVALID_SECRET_REQUEST", 400);
  }

  const request: CreateSecretRequest = parsed.data;
  const createdAt = nowEpochSeconds();
  const expiresAt = normalizeExpiresAt(request.expiresAt);
  const maxReads = request.maxReads ?? 1;

  if (expiresAt <= createdAt) {
    return jsonError("expiresAt must be in the future.", "INVALID_EXPIRES_AT", 400);
  }

  let secretId: string;
  try {
    secretId = await generateUniqueId(c.env.DB, "secrets");
  } catch {
    return jsonError("Unable to generate a unique link. Please try again.", "ID_GENERATION_FAILED", 503);
  }

  try {
    await c.env.DB.prepare(
      `INSERT INTO secrets (
        id,
        encrypted_blob,
        iv,
        salt,
        password_proof,
        is_burn_after_read,
        reads_remaining,
        expires_at,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(secretId, request.payload.encryptedBlob, request.payload.iv, request.payload.salt, request.passwordProof, 1, maxReads, expiresAt, createdAt)
      .run();
  } catch (error: unknown) {
    if (!isMissingBurnAfterReadColumnError(error)) {
      throw error;
    }

    await c.env.DB.prepare(
      `INSERT INTO secrets (
        id,
        encrypted_blob,
        iv,
        salt,
        password_proof,
        expires_at,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(secretId, request.payload.encryptedBlob, request.payload.iv, request.payload.salt, request.passwordProof, expiresAt, createdAt)
      .run();
  }

  const response: CreateSecretResponse = { id: secretId };
  return c.json(response, 201);
});

app.get("/api/secrets/:id", async (c) => {
  const { id } = c.req.param();
  const proof = getPasswordProof(c.req.query("proof"));
  const now = nowEpochSeconds();

  if (!proof) {
    return jsonError("A valid password proof is required.", "INVALID_PASSWORD_PROOF", 400);
  }

  // First, try to fetch the secret without deleting
  let row: SecretRow | null = null;
  try {
    row = await c.env.DB.prepare(
      `SELECT id, encrypted_blob, iv, salt, password_proof, is_burn_after_read, reads_remaining, expires_at, created_at
       FROM secrets
       WHERE id = ? AND password_proof = ? AND expires_at > ?`
    )
      .bind(id, proof, now)
      .first<SecretRow>();
  } catch (error: unknown) {
    if (!isMissingBurnAfterReadColumnError(error)) {
      throw error;
    }
    // Fallback for DBs without reads_remaining column
    row = await c.env.DB.prepare(
      `DELETE FROM secrets
       WHERE id = ? AND password_proof = ? AND expires_at > ?
       RETURNING id, encrypted_blob, iv, salt, password_proof, expires_at, created_at`
    )
      .bind(id, proof, now)
      .first<SecretRow>();

    if (!row) {
      return jsonError("Secret not found or expired.", "SECRET_NOT_FOUND", 404);
    }
    return c.json(toSecretResponse(row));
  }

  if (!row) {
    const availableWithoutPassword = await c.env.DB.prepare(
      "SELECT id FROM secrets WHERE id = ? AND expires_at > ?"
    )
      .bind(id, now)
      .first<{ id: string }>();

    if (availableWithoutPassword) {
      return jsonError("Invalid password.", "INVALID_PASSWORD", 401);
    }

    return jsonError("Secret not found or expired.", "SECRET_NOT_FOUND", 404);
  }

  const remaining = row.reads_remaining ?? 1;

  if (remaining <= 1) {
    // Last read — delete the secret entirely
    await c.env.DB.prepare("DELETE FROM secrets WHERE id = ?")
      .bind(id)
      .run();
    const resp = toSecretResponse(row);
    return c.json({ ...resp, remainingReads: 0 });
  } else {
    // Decrement the counter
    await c.env.DB.prepare(
      "UPDATE secrets SET reads_remaining = reads_remaining - 1 WHERE id = ?"
    )
      .bind(id)
      .run();
    const resp = toSecretResponse(row);
    return c.json({ ...resp, remainingReads: remaining - 1 });
  }
});

type WorkspacePayload = {
  encryptedBlob: string;
  iv: string;
  salt: string;
};

type CreateWorkspaceRequest = {
  username: string;
  passwordProof: string;
  verifier: WorkspacePayload;
  vault: WorkspacePayload;
};

type UpdateWorkspaceRequest = {
  passwordProof: string;
  vault: WorkspacePayload;
  lastKnownUpdatedAt?: number;
};

type WorkspaceRow = {
  username: string;
  password_proof: string;
  verifier_blob: string;
  verifier_iv: string;
  verifier_salt: string;
  vault_blob: string;
  vault_iv: string;
  vault_salt: string;
  updated_at: number;
  created_at: number;
};

// Helper to ensure the workspaces D1 table exists dynamically (self-healing database schema)
async function ensureWorkspacesTable(db: any): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS workspaces (
      username TEXT PRIMARY KEY,
      password_proof TEXT NOT NULL,
      verifier_blob TEXT NOT NULL,
      verifier_iv TEXT NOT NULL,
      verifier_salt TEXT NOT NULL,
      vault_blob TEXT NOT NULL,
      vault_iv TEXT NOT NULL,
      vault_salt TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )
  `).run();
}

async function ensureWorkspaceSessionsTable(db: any): Promise<void> {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS workspace_sessions (
      username TEXT NOT NULL,
      client_id TEXT NOT NULL,
      last_seen INTEGER NOT NULL,
      PRIMARY KEY (username, client_id)
    )
  `).run();
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_workspace_sessions_last_seen ON workspace_sessions (last_seen)
  `).run();
}

// Workspace API handler functions for both /api/workspaces and /api/workspace
const handleCreateWorkspace = async (c: Context<{ Bindings: Bindings }>) => {
  await ensureWorkspacesTable(c.env.DB);
  const body = await c.req.json().catch(() => null) as CreateWorkspaceRequest | null;
  if (
    !body ||
    typeof body.username !== "string" ||
    !body.username.trim() ||
    typeof body.passwordProof !== "string" ||
    !body.passwordProof.trim() ||
    !body.verifier ||
    !body.vault ||
    typeof body.verifier.encryptedBlob !== "string" ||
    typeof body.verifier.iv !== "string" ||
    typeof body.verifier.salt !== "string" ||
    typeof body.vault.encryptedBlob !== "string" ||
    typeof body.vault.iv !== "string" ||
    typeof body.vault.salt !== "string"
  ) {
    return jsonError("Invalid workspace registration payload.", "INVALID_PAYLOAD", 400);
  }

  const username = body.username.trim().toLowerCase();
  const createdAt = nowEpochSeconds();

  // Check if exists
  const existing = await c.env.DB.prepare(
    "SELECT username FROM workspaces WHERE username = ?"
  )
    .bind(username)
    .first<{ username: string }>();

  if (existing) {
    return jsonError("A notepad with this username already exists.", "WORKSPACE_ALREADY_EXISTS", 409);
  }

  try {
    await c.env.DB.prepare(
      `INSERT INTO workspaces (
        username,
        password_proof,
        verifier_blob,
        verifier_iv,
        verifier_salt,
        vault_blob,
        vault_iv,
        vault_salt,
        updated_at,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        username,
        body.passwordProof,
        body.verifier.encryptedBlob,
        body.verifier.iv,
        body.verifier.salt,
        body.vault.encryptedBlob,
        body.vault.iv,
        body.vault.salt,
        createdAt,
        createdAt
      )
      .run();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return jsonError(`Failed to create notepad: ${msg}`, "DATABASE_ERROR", 500);
  }

  return c.json({ success: true, username }, 201);
};

const handleGetWorkspace = async (c: Context<{ Bindings: Bindings }>) => {
  await ensureWorkspacesTable(c.env.DB);
  const username = (c.req.param("username") || "").trim().toLowerCase();
  if (!username) {
    return jsonError("Username is required.", "MISSING_USERNAME", 400);
  }
  const proof = getPasswordProof(c.req.query("proof"));

  if (!proof) {
    return jsonError("A valid password proof is required.", "INVALID_PASSWORD_PROOF", 400);
  }

  const row = await c.env.DB.prepare(
    `SELECT username, password_proof, verifier_blob, verifier_iv, verifier_salt, vault_blob, vault_iv, vault_salt, updated_at
     FROM workspaces
     WHERE username = ?`
  )
    .bind(username)
    .first<WorkspaceRow>();

  if (!row) {
    return jsonError("Notepad not found. Create one first.", "WORKSPACE_NOT_FOUND", 404);
  }

  if (row.password_proof !== proof) {
    return jsonError("Invalid username or password.", "INVALID_CREDENTIALS", 401);
  }

  return c.json({
    username: row.username,
    verifier: {
      encryptedBlob: row.verifier_blob,
      iv: row.verifier_iv,
      salt: row.verifier_salt
    },
    vault: {
      encryptedBlob: row.vault_blob,
      iv: row.vault_iv,
      salt: row.vault_salt
    },
    updatedAt: row.updated_at
  });
};

const handleUpdateWorkspace = async (c: Context<{ Bindings: Bindings }>) => {
  await ensureWorkspacesTable(c.env.DB);
  const username = (c.req.param("username") || "").trim().toLowerCase();
  if (!username) {
    return jsonError("Username is required.", "MISSING_USERNAME", 400);
  }
  const body = await c.req.json().catch(() => null) as UpdateWorkspaceRequest | null;

  if (
    !body ||
    typeof body.passwordProof !== "string" ||
    !body.passwordProof.trim() ||
    !body.vault ||
    typeof body.vault.encryptedBlob !== "string" ||
    typeof body.vault.iv !== "string" ||
    typeof body.vault.salt !== "string"
  ) {
    return jsonError("Invalid save payload.", "INVALID_PAYLOAD", 400);
  }

  // Verify proof and fetch current updated_at
  const row = await c.env.DB.prepare(
    "SELECT password_proof, verifier_blob, verifier_iv, verifier_salt, vault_blob, vault_iv, vault_salt, updated_at FROM workspaces WHERE username = ?"
  )
    .bind(username)
    .first<WorkspaceRow>();

  if (!row) {
    return jsonError("Notepad not found.", "WORKSPACE_NOT_FOUND", 404);
  }

  if (row.password_proof !== body.passwordProof) {
    return jsonError("Invalid credentials.", "INVALID_CREDENTIALS", 401);
  }

  // Conflict check (OCC)
  if (typeof body.lastKnownUpdatedAt === "number" && row.updated_at > body.lastKnownUpdatedAt) {
    return c.json({
      error: "Conflict detected. This notepad has been updated on another device.",
      code: "SYNC_CONFLICT",
      updatedAt: row.updated_at,
      vault: {
        encryptedBlob: row.vault_blob,
        iv: row.vault_iv,
        salt: row.vault_salt
      }
    }, 409);
  }

  const updatedAt = nowEpochSeconds();

  try {
    await c.env.DB.prepare(
      `UPDATE workspaces
       SET vault_blob = ?, vault_iv = ?, vault_salt = ?, updated_at = ?
       WHERE username = ?`
    )
      .bind(
        body.vault.encryptedBlob,
        body.vault.iv,
        body.vault.salt,
        updatedAt,
        username
      )
      .run();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return jsonError(`Failed to save notes: ${msg}`, "DATABASE_ERROR", 500);
  }

  return c.json({ success: true, updatedAt });
};

const handleDeleteWorkspace = async (c: Context<{ Bindings: Bindings }>) => {
  await ensureWorkspacesTable(c.env.DB);
  const username = (c.req.param("username") || "").trim().toLowerCase();
  if (!username) {
    return jsonError("Username is required.", "MISSING_USERNAME", 400);
  }
  const proof = getPasswordProof(c.req.query("proof"));

  if (!proof) {
    return jsonError("A valid password proof is required.", "INVALID_PASSWORD_PROOF", 400);
  }

  const row = await c.env.DB.prepare(
    "SELECT password_proof FROM workspaces WHERE username = ?"
  )
    .bind(username)
    .first<{ password_proof: string }>();

  if (!row) {
    return jsonError("Notepad not found.", "WORKSPACE_NOT_FOUND", 404);
  }

  if (row.password_proof !== proof) {
    return jsonError("Invalid credentials.", "INVALID_CREDENTIALS", 401);
  }

  try {
    await c.env.DB.prepare("DELETE FROM workspaces WHERE username = ?")
      .bind(username)
      .run();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return jsonError(`Failed to delete notepad: ${msg}`, "DATABASE_ERROR", 500);
  }

  return c.json({ success: true });
};

const handleWorkspaceHeartbeat = async (c: Context<{ Bindings: Bindings }>) => {
  await ensureWorkspaceSessionsTable(c.env.DB);
  await ensureWorkspacesTable(c.env.DB);

  const username = (c.req.param("username") || "").trim().toLowerCase();
  if (!username) {
    return jsonError("Username is required.", "MISSING_USERNAME", 400);
  }

  const body = await c.req.json().catch(() => null) as { passwordProof?: string; clientId?: string } | null;
  if (!body || typeof body.passwordProof !== "string" || !body.passwordProof.trim() || typeof body.clientId !== "string" || !body.clientId.trim()) {
    return jsonError("Invalid heartbeat payload.", "INVALID_PAYLOAD", 400);
  }

  // Verify ownership
  const row = await c.env.DB.prepare(
    "SELECT password_proof FROM workspaces WHERE username = ?"
  )
    .bind(username)
    .first<{ password_proof: string }>();

  if (!row) {
    return jsonError("Notepad not found.", "WORKSPACE_NOT_FOUND", 404);
  }

  if (row.password_proof !== body.passwordProof) {
    return jsonError("Invalid credentials.", "INVALID_CREDENTIALS", 401);
  }

  const now = nowEpochSeconds();

  try {
    // Cleanup sessions older than 30 seconds
    await c.env.DB.prepare("DELETE FROM workspace_sessions WHERE last_seen < ?")
      .bind(now - 30)
      .run();

    // Register/update current session
    await c.env.DB.prepare(
      "INSERT OR REPLACE INTO workspace_sessions (username, client_id, last_seen) VALUES (?, ?, ?)"
    )
      .bind(username, body.clientId, now)
      .run();

    // Get other active users count
    const { count } = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM workspace_sessions WHERE username = ? AND client_id != ?"
    )
      .bind(username, body.clientId)
      .first<{ count: number }>() || { count: 0 };

    return c.json({ success: true, activeOtherUsers: count });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return jsonError(`Heartbeat failed: ${msg}`, "DATABASE_ERROR", 500);
  }
};

const handleMigratePasswordProof = async (c: Context<{ Bindings: Bindings }>) => {
  await ensureWorkspacesTable(c.env.DB);
  const username = (c.req.param("username") || "").trim().toLowerCase();
  if (!username) {
    return jsonError("Username is required.", "MISSING_USERNAME", 400);
  }

  const body = await c.req.json().catch(() => null) as { legacyProof?: string; newProof?: string } | null;
  if (!body || typeof body.legacyProof !== "string" || !body.legacyProof.trim() || typeof body.newProof !== "string" || !body.newProof.trim()) {
    return jsonError("Invalid migration payload.", "INVALID_PAYLOAD", 400);
  }

  const row = await c.env.DB.prepare(
    "SELECT password_proof FROM workspaces WHERE username = ?"
  )
    .bind(username)
    .first<{ password_proof: string }>();

  if (!row) {
    return jsonError("Notepad not found.", "WORKSPACE_NOT_FOUND", 404);
  }

  if (row.password_proof !== body.legacyProof) {
    return jsonError("Invalid credentials.", "INVALID_CREDENTIALS", 401);
  }

  try {
    await c.env.DB.prepare(
      "UPDATE workspaces SET password_proof = ? WHERE username = ?"
    )
      .bind(body.newProof, username)
      .run();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return jsonError(`Failed to migrate proof: ${msg}`, "DATABASE_ERROR", 500);
  }

  return c.json({ success: true });
};

// Bind handlers to both plural and singular routes for backward/forward compatibility
app.post("/api/workspaces", handleCreateWorkspace);
app.post("/api/workspace", handleCreateWorkspace);

app.get("/api/workspaces/:username", handleGetWorkspace);
app.get("/api/workspace/:username", handleGetWorkspace);

app.put("/api/workspaces/:username", handleUpdateWorkspace);
app.put("/api/workspace/:username", handleUpdateWorkspace);

app.delete("/api/workspaces/:username", handleDeleteWorkspace);
app.delete("/api/workspace/:username", handleDeleteWorkspace);

app.post("/api/workspaces/:username/heartbeat", handleWorkspaceHeartbeat);
app.post("/api/workspace/:username/heartbeat", handleWorkspaceHeartbeat);

app.post("/api/workspaces/:username/migrate-proof", handleMigratePasswordProof);
app.post("/api/workspace/:username/migrate-proof", handleMigratePasswordProof);

app.post("/api/chat/:roomId", async (c) => {
  const roomId = c.req.param("roomId");
  if (!roomId || !BASE64_URL_PATTERN.test(roomId)) {
    return jsonError("Invalid room ID", "INVALID_ROOM_ID", 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError("Invalid JSON body", "INVALID_JSON", 400);
  }

  const result = CreateChatMessageRequestSchema.safeParse(body);
  if (!result.success) {
    return jsonError("Invalid request payload", "VALIDATION_ERROR", 400);
  }

  const { payload } = result.data;
  const id = crypto.randomUUID();
  const now = Date.now();

  try {
    await c.env.DB.prepare(
      `INSERT INTO chat_messages (id, room_id, encrypted_blob, iv, salt, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        roomId,
        payload.encryptedBlob,
        payload.iv,
        payload.salt,
        now
      )
      .run();

    const response: ChatMessageResponse = {
      id,
      payload,
      createdAt: now,
    };
    return c.json(response, 201);
  } catch (error) {
    console.error("Database error in chat POST:", error);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
});

app.get("/api/chat/:roomId", async (c) => {
  const roomId = c.req.param("roomId");
  if (!roomId || !BASE64_URL_PATTERN.test(roomId)) {
    return jsonError("Invalid room ID", "INVALID_ROOM_ID", 400);
  }

  const sinceParam = c.req.query("since");
  const since = sinceParam ? parseInt(sinceParam, 10) : 0;
  if (isNaN(since)) {
    return jsonError("Invalid since parameter", "INVALID_PARAMETER", 400);
  }

  try {
    const messages = await fetchChatMessages(c.env.DB, roomId, since);

    const response: GetChatMessagesResponse = { messages };
    return c.json(response, 200);
  } catch (error) {
    console.error("Database error in chat GET:", error);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
});

app.post("/api/chat/:roomId/presence", async (c) => {
  const roomId = c.req.param("roomId");
  if (!roomId || !BASE64_URL_PATTERN.test(roomId)) {
    return jsonError("Invalid room ID", "INVALID_ROOM_ID", 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError("Invalid JSON body", "INVALID_JSON", 400);
  }

  const result = UpdateChatPresenceRequestSchema.safeParse(body);
  if (!result.success) {
    return jsonError("Invalid request payload", "VALIDATION_ERROR", 400);
  }

  const now = Date.now();

  try {
    const response = await updateChatPresence(c.env.DB, roomId, result.data, now);
    return c.json(response, 200);
  } catch (error) {
    console.error("Database error in chat presence POST:", error);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
});

app.delete("/api/chat/:roomId/presence", async (c) => {
  const roomId = c.req.param("roomId");
  if (!roomId || !BASE64_URL_PATTERN.test(roomId)) {
    return jsonError("Invalid room ID", "INVALID_ROOM_ID", 400);
  }

  const clientId = c.req.query("clientId");
  if (!clientId || !clientId.trim()) {
    return jsonError("clientId is required", "MISSING_CLIENT_ID", 400);
  }

  const now = Date.now();

  try {
    await c.env.DB.prepare(
      "DELETE FROM chat_room_presence WHERE room_id = ? AND client_id = ?"
    )
      .bind(roomId, clientId.trim())
      .run();

    const response = await fetchChatPresence(c.env.DB, roomId, now);
    return c.json(response, 200);
  } catch (error) {
    console.error("Database error in chat presence DELETE:", error);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
});

app.get("/api/chat/:roomId/stream", async (c) => {
  const roomId = c.req.param("roomId");
  if (!roomId || !BASE64_URL_PATTERN.test(roomId)) {
    return jsonError("Invalid room ID", "INVALID_ROOM_ID", 400);
  }

  const sinceParam = c.req.query("since");
  const initialSince = sinceParam ? parseInt(sinceParam, 10) : 0;
  if (Number.isNaN(initialSince)) {
    return jsonError("Invalid since parameter", "INVALID_PARAMETER", 400);
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const push = (data: unknown, eventName = "messages") => {
        controller.enqueue(encoder.encode(`event: ${eventName}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const sendKeepAlive = () => {
        controller.enqueue(encoder.encode(`: keep-alive\n\n`));
      };

      let since = initialSince;
      try {
        push({ connected: true, roomId }, "ready");

        while (!closed) {
          const messages = await fetchChatMessages(c.env.DB, roomId, since);

          if (messages.length > 0) {
            push({ messages }, "messages");
            since = Math.max(...messages.map((message) => message.createdAt));
          } else {
            sendKeepAlive();
          }

          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.error("Chat stream error:", error);
        push({ error: "STREAM_ERROR" }, "error");
      } finally {
        controller.close();
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});

app.post("/api/inquiries", async (c) => {
  let body: { name?: string; email?: string; company?: string; message?: string };
  try {
    body = await c.req.json();
  } catch {
    return jsonError("Invalid JSON body", "INVALID_JSON", 400);
  }

  const { name, email, company, message } = body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return jsonError("Name, email, and message are required fields.", "MISSING_FIELDS", 400);
  }

  const id = Math.random().toString(36).substring(2, 10);
  const createdAt = nowEpochSeconds();

  try {
    await c.env.DB.prepare(
      `INSERT INTO inquiries (id, name, email, company, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(id, name.trim(), email.trim(), company?.trim() || null, message.trim(), createdAt)
      .run();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Database write error";
    return jsonError(`Failed to save inquiry: ${msg}`, "DATABASE_ERROR", 500);
  }

  if (c.env.RESEND_API_KEY) {
    try {
      const emailBody = {
        from: "ProtectedShare Deals <deals@protectedshare.me>",
        to: "admin@protectedshare.me",
        subject: `New Enterprise Deal Inquiry from ${name}`,
        html: `
          <h2>New Deal Inquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Company:</strong> ${company || "Not provided"}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="background: #f4f4f5; border-left: 4px solid #3b82f6; padding: 10px; margin: 10px 0;">
            ${message.replace(/\n/g, "<br>")}
          </blockquote>
          <hr />
          <p style="font-size: 11px; color: #71717a;">Stored securely in D1 with ID: <strong>${id}</strong></p>
        `
      };

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${c.env.RESEND_API_KEY}`
        },
        body: JSON.stringify(emailBody)
      });
    } catch {
      // Fail silently to guarantee client success response
    }
  }

  return c.json({ success: true, id }, 201);
});

const scheduled: ExportedHandlerScheduledHandler<Bindings> = async (_event, env) => {
  const now = nowEpochSeconds();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM notes WHERE expires_at <= ?").bind(now),
    env.DB.prepare("DELETE FROM secrets WHERE expires_at <= ?").bind(now)
  ]);
};

export default {
  fetch: app.fetch,
  scheduled
};
