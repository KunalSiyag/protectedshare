import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { type HealthCheck } from "@protectedshare/contracts";
import { type AppEnv, type Bindings, createId, getPasswordProofParam as getPasswordProof, jsonError, nowEpochSeconds } from "./lib/env";
import { ensureSchema } from "./lib/schema";
import { runScheduledPurge } from "./lib/cron";
import { escapeHtml, singleLine } from "./lib/inquiries";
import { sharesRoutes } from "./routes/shares";
import { manageRoutes } from "./routes/manage";
import { dropsRoutes } from "./routes/drops";
import { requestsRoutes } from "./routes/requests";
import { chatRoutes } from "./routes/chat";

const app = new Hono<AppEnv>();

app.use(
  "/api/*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-Auth-Token", "X-Manage-Token", "X-Upload-Token", "X-Delete-Token", "X-Download-Token"],
    maxAge: 600,
  })
);

// Self-healing schema (once per isolate) and no caching of API responses.
app.use("/api/*", async (c, next) => {
  await ensureSchema(c.env.DB);
  await next();
  if (!c.res.headers.has("Cache-Control")) {
    c.res.headers.set("Cache-Control", "no-store");
  }
});

app.get("/health", () => {
  const payload: HealthCheck = { status: "ok" };
  return Response.json(payload);
});

app.route("/", sharesRoutes);
app.route("/", manageRoutes);
app.route("/", dropsRoutes);
app.route("/", requestsRoutes);
app.route("/", chatRoutes);

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

app.post("/api/inquiries", async (c) => {
  let body: { name?: unknown; email?: unknown; company?: unknown; message?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return jsonError("Invalid JSON body", "INVALID_JSON", 400);
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 320) : "";
  const company = typeof body.company === "string" ? body.company.trim().slice(0, 200) : "";
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 10_000) : "";
  if (!name || !email || !message) {
    return jsonError("Name, email, and message are required fields.", "MISSING_FIELDS", 400);
  }

  const id = createId(16);
  const createdAt = nowEpochSeconds();

  try {
    await c.env.DB.prepare(
      `INSERT INTO inquiries (id, name, email, company, message, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(id, name, email, company || null, message, createdAt)
      .run();
  } catch (error: unknown) {
    console.error("Failed to save inquiry:", error);
    return jsonError("Failed to save inquiry.", "DATABASE_ERROR", 500);
  }

  if (c.env.RESEND_API_KEY) {
    try {
      const emailBody = {
        from: "ProtectedShare Deals <deals@protectedshare.me>",
        to: "admin@protectedshare.me",
        subject: `New Enterprise Deal Inquiry from ${singleLine(name)}`,
        html: `
          <h2>New Deal Inquiry</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Company:</strong> ${escapeHtml(company || "Not provided")}</p>
          <p><strong>Message:</strong></p>
          <blockquote style="background: #f4f4f5; border-left: 4px solid #3b82f6; padding: 10px; margin: 10px 0;">
            ${escapeHtml(message).replace(/\n/g, "<br>")}
          </blockquote>
          <hr />
          <p style="font-size: 11px; color: #71717a;">Stored in D1 with ID: <strong>${escapeHtml(id)}</strong></p>
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
  await runScheduledPurge(env);
};

export default {
  fetch: app.fetch,
  scheduled
};
