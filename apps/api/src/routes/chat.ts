import { Hono } from "hono";
import {
  ChatClaimRequestSchema,
  CreateChatMessageV2RequestSchema,
  MAX_CHAT_BLOB_CHARS,
  UpdateChatPresenceRequestSchema,
  UpdateChatSettingsRequestSchema,
  type BurnChatRoomResponse,
  type ChatClaimResponse,
  type ChatMessageV2Response,
  type ChatRoomSettings,
  type DeleteChatMessageResponse,
  type GetChatMessagesV2Response,
  type GetChatPresenceResponse,
  type UpdateChatPresenceRequest,
} from "@protectedshare/contracts";
import { type AppContext, type AppEnv, BASE64_URL_PATTERN, jsonError, readJsonBody } from "../lib/env";
import { timingSafeEqual, verifyToken } from "../lib/tokens";

const CHAT_PRESENCE_TTL_MS = 15_000;
/** Deletion/burn events are kept this long so reconnecting streams can replay them. */
const CHAT_DELETION_RETENTION_MS = 10 * 60 * 1000;
/** Sentinel message id in chat_deletions marking a burned room. */
const ROOM_BURN_MARKER = "__room__";
const STREAM_POLL_MS = 500;
/** How often a stream re-checks the room's claim (every N polls, ~2 s). */
const STREAM_ROOM_CHECK_EVERY = 4;

type ChatMessageRow = {
  id: string;
  room_id: string;
  encrypted_blob: string;
  iv: string;
  salt: string;
  created_at: number;
  expires_at: number | null;
  delete_hash: string | null;
  version: number | null;
};

type ChatRoomRow = {
  room_id: string;
  auth_hash: string;
  ttl_seconds: number | null;
  created_at: number;
  last_active_at: number;
};

export const chatRoutes = new Hono<AppEnv>();

function isValidRoomId(roomId: string | undefined): roomId is string {
  return !!roomId && roomId.length <= 128 && BASE64_URL_PATTERN.test(roomId);
}

function toMessage(row: ChatMessageRow): ChatMessageV2Response {
  const payload: ChatMessageV2Response["payload"] = {
    encryptedBlob: row.encrypted_blob,
    iv: row.iv,
    v: row.version === 2 ? 2 : 1,
  };
  if (row.salt) payload.salt = row.salt;
  return {
    id: row.id,
    payload,
    createdAt: row.created_at,
    expiresAt: row.expires_at ?? null,
    deletable: !!row.delete_hash,
  };
}

async function getRoom(db: D1Database, roomId: string): Promise<ChatRoomRow | null> {
  return db.prepare("SELECT * FROM chat_rooms WHERE room_id = ?").bind(roomId).first<ChatRoomRow>();
}

function toSettings(roomId: string, room: ChatRoomRow | null): ChatRoomSettings {
  return { roomId, claimed: !!room, ttlSeconds: room?.ttl_seconds ?? null };
}

/**
 * Room gate. Legacy rooms (no chat_rooms row) are open, as before.
 * Claimed rooms need X-Auth-Token (or ?token= where `allowQuery`).
 */
async function authorizeRoom(
  c: AppContext,
  options: { allowQuery?: boolean } = {},
): Promise<{ ok: true; roomId: string; room: ChatRoomRow | null } | { ok: false; response: Response }> {
  const roomId = c.req.param("roomId");
  if (!isValidRoomId(roomId)) {
    return { ok: false, response: jsonError("Invalid room ID", "INVALID_ROOM_ID", 400) };
  }
  const room = await getRoom(c.env.DB, roomId);
  if (!room) return { ok: true, roomId, room: null };

  const token = c.req.header("x-auth-token")?.trim() || (options.allowQuery ? c.req.query("token")?.trim() : undefined);
  if (!token) {
    return { ok: false, response: jsonError("This room needs its key.", "ROOM_AUTH_REQUIRED", 401) };
  }
  if (!(await verifyToken(token, room.auth_hash))) {
    return { ok: false, response: jsonError("Wrong room key.", "INVALID_ROOM_AUTH", 401) };
  }
  return { ok: true, roomId, room };
}

async function touchRoom(db: D1Database, roomId: string, now: number): Promise<void> {
  await db.prepare("UPDATE chat_rooms SET last_active_at = ? WHERE room_id = ?").bind(now, roomId).run();
}

async function recordDeletions(db: D1Database, roomId: string, ids: string[], now: number): Promise<void> {
  if (ids.length === 0) return;
  await db.batch(
    ids.map((id) =>
      db.prepare(
        `INSERT INTO chat_deletions (room_id, message_id, deleted_at) VALUES (?, ?, ?)
         ON CONFLICT(room_id, message_id) DO UPDATE SET deleted_at = excluded.deleted_at`
      ).bind(roomId, id, now)
    )
  );
}

/** Deletes expired disappearing messages in a room and records them as deletions. */
async function purgeExpiredMessages(db: D1Database, roomId: string, now: number): Promise<void> {
  const { results } = await db.prepare(
    "DELETE FROM chat_messages WHERE room_id = ? AND expires_at IS NOT NULL AND expires_at <= ? RETURNING id"
  )
    .bind(roomId, now)
    .all<{ id: string }>();
  await recordDeletions(db, roomId, results.map((row) => row.id), now);
}

async function fetchChatMessages(
  db: D1Database,
  roomId: string,
  since: number,
  now: number,
  inclusive = false,
): Promise<ChatMessageV2Response[]> {
  const { results } = await db.prepare(
    `SELECT id, room_id, encrypted_blob, iv, salt, created_at, expires_at, delete_hash, version
     FROM chat_messages
     WHERE room_id = ? AND created_at ${inclusive ? ">=" : ">"} ? AND (expires_at IS NULL OR expires_at > ?)
     ORDER BY created_at ASC
     LIMIT 100`
  )
    .bind(roomId, since, now)
    .all<ChatMessageRow>();
  return results.map(toMessage);
}

async function fetchChatPresence(db: D1Database, roomId: string, now: number): Promise<GetChatPresenceResponse> {
  await db.prepare("DELETE FROM chat_room_presence WHERE room_id = ? AND last_seen < ?")
    .bind(roomId, now - CHAT_PRESENCE_TTL_MS)
    .run();

  const onlineRow = await db.prepare("SELECT COUNT(*) AS count FROM chat_room_presence WHERE room_id = ?")
    .bind(roomId)
    .first<{ count: number }>();
  const onlineCount = onlineRow?.count ?? 0;

  // Zero-retention: purge all messages the moment a room goes empty.
  if (onlineCount === 0) {
    await db.prepare("DELETE FROM chat_messages WHERE room_id = ?").bind(roomId).run();
  }

  const typingRow = onlineCount > 0
    ? await db.prepare("SELECT COUNT(*) AS count FROM chat_room_presence WHERE room_id = ? AND is_typing = 1")
        .bind(roomId)
        .first<{ count: number }>()
    : null;

  return { onlineCount, typingCount: typingRow?.count ?? 0, generatedAt: now };
}

async function updateChatPresence(
  db: D1Database,
  roomId: string,
  request: UpdateChatPresenceRequest,
  now: number,
): Promise<GetChatPresenceResponse> {
  if (request.state === "leave") {
    await db.prepare("DELETE FROM chat_room_presence WHERE room_id = ? AND client_id = ?")
      .bind(roomId, request.clientId)
      .run();
  } else {
    await db.prepare(
      `INSERT INTO chat_room_presence (room_id, client_id, last_seen, is_typing, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(room_id, client_id) DO UPDATE SET
         last_seen = excluded.last_seen,
         is_typing = excluded.is_typing,
         updated_at = excluded.updated_at`
    )
      .bind(roomId, request.clientId, now, request.isTyping ? 1 : 0, now, now)
      .run();
  }
  return fetchChatPresence(db, roomId, now);
}

/* ----------------------------- Room claim ----------------------------- */

chatRoutes.post("/api/chat/:roomId/claim", async (c) => {
  const db = c.env.DB;
  const roomId = c.req.param("roomId");
  if (!isValidRoomId(roomId)) return jsonError("Invalid room ID", "INVALID_ROOM_ID", 400);
  const read = await readJsonBody(c, 4_000);
  if (!read.ok) return read.response;
  const parsed = ChatClaimRequestSchema.safeParse(read.body);
  if (!parsed.success) return jsonError("Invalid claim payload.", "VALIDATION_ERROR", 400);

  const now = Date.now();
  const ttl = parsed.data.ttlSeconds ?? null;
  const inserted = await db.prepare(
    `INSERT INTO chat_rooms (room_id, auth_hash, ttl_seconds, created_at, last_active_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(room_id) DO NOTHING
     RETURNING room_id`
  )
    .bind(roomId, parsed.data.authHash, ttl, now, now)
    .first<{ room_id: string }>();

  if (inserted) {
    const response: ChatClaimResponse = { roomId, claimed: true, ttlSeconds: ttl, created: true };
    return c.json(response, 201);
  }

  const room = await getRoom(db, roomId);
  if (!room || !timingSafeEqual(room.auth_hash, parsed.data.authHash)) {
    return jsonError("This room is already claimed with a different key.", "ROOM_CLAIMED", 409);
  }
  await touchRoom(db, roomId, now);
  const response: ChatClaimResponse = { ...toSettings(roomId, room), created: false };
  return c.json(response, 200);
});

/* ------------------------------ Settings ------------------------------ */

chatRoutes.get("/api/chat/:roomId/settings", async (c) => {
  const auth = await authorizeRoom(c);
  if (!auth.ok) return auth.response;
  return c.json(toSettings(auth.roomId, auth.room));
});

chatRoutes.patch("/api/chat/:roomId/settings", async (c) => {
  const auth = await authorizeRoom(c);
  if (!auth.ok) return auth.response;
  if (!auth.room) return jsonError("Only claimed rooms have settings.", "ROOM_NOT_CLAIMED", 404);
  const read = await readJsonBody(c, 1_000);
  if (!read.ok) return read.response;
  const parsed = UpdateChatSettingsRequestSchema.safeParse(read.body);
  if (!parsed.success) return jsonError("Invalid settings payload.", "VALIDATION_ERROR", 400);

  const now = Date.now();
  await c.env.DB.prepare("UPDATE chat_rooms SET ttl_seconds = ?, last_active_at = ? WHERE room_id = ?")
    .bind(parsed.data.ttlSeconds, now, auth.roomId)
    .run();
  return c.json(toSettings(auth.roomId, { ...auth.room, ttl_seconds: parsed.data.ttlSeconds }));
});

/* ------------------------------ Messages ------------------------------ */

chatRoutes.post("/api/chat/:roomId", async (c) => {
  const db = c.env.DB;
  const auth = await authorizeRoom(c);
  if (!auth.ok) return auth.response;

  const read = await readJsonBody(c, MAX_CHAT_BLOB_CHARS + 4_000);
  if (!read.ok) return read.response;
  const parsed = CreateChatMessageV2RequestSchema.safeParse(read.body);
  if (!parsed.success) return jsonError("Invalid request payload", "VALIDATION_ERROR", 400);

  const { payload, ttlSeconds, deleteHash } = parsed.data;
  const id = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = ttlSeconds ? now + ttlSeconds * 1000 : null;
  const version = payload.v === 2 ? 2 : 1;

  try {
    await db.prepare(
      `INSERT INTO chat_messages (id, room_id, encrypted_blob, iv, salt, created_at, expires_at, delete_hash, version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, auth.roomId, payload.encryptedBlob, payload.iv, payload.salt ?? "", now, expiresAt, deleteHash ?? null, version)
      .run();
    if (auth.room) await touchRoom(db, auth.roomId, now);
  } catch (error) {
    console.error("Database error in chat POST:", error);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }

  const response: ChatMessageV2Response = {
    id,
    payload: { encryptedBlob: payload.encryptedBlob, iv: payload.iv, v: version, ...(payload.salt ? { salt: payload.salt } : {}) },
    createdAt: now,
    expiresAt,
    deletable: !!deleteHash,
  };
  return c.json(response, 201);
});

chatRoutes.get("/api/chat/:roomId", async (c) => {
  const auth = await authorizeRoom(c);
  if (!auth.ok) return auth.response;
  const sinceParam = c.req.query("since");
  const since = sinceParam ? parseInt(sinceParam, 10) : 0;
  if (Number.isNaN(since)) return jsonError("Invalid since parameter", "INVALID_PARAMETER", 400);

  try {
    const now = Date.now();
    await purgeExpiredMessages(c.env.DB, auth.roomId, now);
    const messages = await fetchChatMessages(c.env.DB, auth.roomId, since, now);
    const response: GetChatMessagesV2Response = { messages };
    return c.json(response, 200);
  } catch (error) {
    console.error("Database error in chat GET:", error);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
});

chatRoutes.delete("/api/chat/:roomId/messages/:messageId", async (c) => {
  const db = c.env.DB;
  const auth = await authorizeRoom(c);
  if (!auth.ok) return auth.response;
  const messageId = c.req.param("messageId");
  if (!messageId || messageId.length > 64) return jsonError("Message not found.", "MESSAGE_NOT_FOUND", 404);

  const row = await db.prepare("SELECT delete_hash FROM chat_messages WHERE id = ? AND room_id = ?")
    .bind(messageId, auth.roomId)
    .first<{ delete_hash: string | null }>();
  if (!row) return jsonError("Message not found.", "MESSAGE_NOT_FOUND", 404);
  if (!row.delete_hash) return jsonError("This message cannot be deleted.", "MESSAGE_NOT_DELETABLE", 403);
  const token = c.req.header("x-delete-token")?.trim();
  if (!(await verifyToken(token, row.delete_hash))) {
    return jsonError("Invalid delete token.", "INVALID_DELETE_TOKEN", 403);
  }

  const now = Date.now();
  await db.prepare("DELETE FROM chat_messages WHERE id = ? AND room_id = ?").bind(messageId, auth.roomId).run();
  await recordDeletions(db, auth.roomId, [messageId], now);
  const response: DeleteChatMessageResponse = { id: messageId, deleted: true };
  return c.json(response);
});

/** Burn: deletes every message, presence row and the room claim. Streams get a `burned` event. */
chatRoutes.delete("/api/chat/:roomId", async (c) => {
  const db = c.env.DB;
  const auth = await authorizeRoom(c);
  if (!auth.ok) return auth.response;
  const now = Date.now();
  await db.batch([
    db.prepare("DELETE FROM chat_messages WHERE room_id = ?").bind(auth.roomId),
    db.prepare("DELETE FROM chat_room_presence WHERE room_id = ?").bind(auth.roomId),
    db.prepare("DELETE FROM chat_rooms WHERE room_id = ?").bind(auth.roomId),
    db.prepare("DELETE FROM chat_deletions WHERE room_id = ?").bind(auth.roomId),
    db.prepare("INSERT INTO chat_deletions (room_id, message_id, deleted_at) VALUES (?, ?, ?)")
      .bind(auth.roomId, ROOM_BURN_MARKER, now),
  ]);
  const response: BurnChatRoomResponse = { roomId: auth.roomId, burnedAt: now };
  return c.json(response);
});

/* ------------------------------ Presence ------------------------------ */

chatRoutes.post("/api/chat/:roomId/presence", async (c) => {
  const auth = await authorizeRoom(c, { allowQuery: true });
  if (!auth.ok) return auth.response;
  const read = await readJsonBody(c, 4_000);
  if (!read.ok) return read.response;
  const result = UpdateChatPresenceRequestSchema.safeParse(read.body);
  if (!result.success) return jsonError("Invalid request payload", "VALIDATION_ERROR", 400);

  try {
    const response = await updateChatPresence(c.env.DB, auth.roomId, result.data, Date.now());
    return c.json(response, 200);
  } catch (error) {
    console.error("Database error in chat presence POST:", error);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
});

chatRoutes.delete("/api/chat/:roomId/presence", async (c) => {
  const auth = await authorizeRoom(c, { allowQuery: true });
  if (!auth.ok) return auth.response;
  const clientId = c.req.query("clientId");
  if (!clientId || !clientId.trim()) return jsonError("clientId is required", "MISSING_CLIENT_ID", 400);

  try {
    await c.env.DB.prepare("DELETE FROM chat_room_presence WHERE room_id = ? AND client_id = ?")
      .bind(auth.roomId, clientId.trim())
      .run();
    const response = await fetchChatPresence(c.env.DB, auth.roomId, Date.now());
    return c.json(response, 200);
  } catch (error) {
    console.error("Database error in chat presence DELETE:", error);
    return jsonError("Internal server error", "INTERNAL_ERROR", 500);
  }
});

/* ------------------------------- Stream ------------------------------- */

chatRoutes.get("/api/chat/:roomId/stream", async (c) => {
  const auth = await authorizeRoom(c, { allowQuery: true });
  if (!auth.ok) return auth.response;
  const { roomId } = auth;
  const db = c.env.DB;
  // What this stream was authorized with. Re-checked while it runs, so a stream opened on an
  // open (legacy) room, or before a burn + re-claim, can't keep reading a room it has no key for.
  const authorizedHash = auth.room?.auth_hash ?? null;
  const presentedToken = c.req.header("x-auth-token")?.trim() || c.req.query("token")?.trim() || undefined;
  let tokenMatchesHash: string | null = authorizedHash;

  const sinceParam = c.req.query("since");
  const initialSince = sinceParam ? parseInt(sinceParam, 10) : 0;
  if (Number.isNaN(initialSince)) return jsonError("Invalid since parameter", "INVALID_PARAMETER", 400);

  const encoder = new TextEncoder();
  const streamStart = Date.now();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const push = (data: unknown, eventName: string) => {
        controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Message cursor: first query is `> since` (legacy semantics); later ones are
      // `>= since` minus ids already sent at that millisecond, so same-ms messages are not lost.
      let since = initialSince;
      let sentAtSince = new Set<string>();
      let inclusive = false;
      // Deletion cursor: replay deletions newer than the client's cursor (bounded by retention).
      let deletionCursor = initialSince > 0 ? Math.max(initialSince, streamStart - CHAT_DELETION_RETENTION_MS) : streamStart;
      let deletionsSeen = new Set<string>();
      let iteration = 0;

      try {
        push({ connected: true, roomId }, "ready");

        while (!closed) {
          const now = Date.now();
          if (iteration > 0 && iteration % STREAM_ROOM_CHECK_EVERY === 0) {
            const current = await getRoom(db, roomId);
            let revoked = false;
            if (!current) {
              // The claim is gone: burned or forgotten after idling.
              revoked = authorizedHash !== null;
            } else if (current.auth_hash !== tokenMatchesHash) {
              // Claimed (or burned and re-claimed) since this stream was authorized: it needs the new key.
              if (await verifyToken(presentedToken, current.auth_hash)) tokenMatchesHash = current.auth_hash;
              else revoked = true;
            }
            if (revoked) {
              const burn = await db.prepare("SELECT deleted_at FROM chat_deletions WHERE room_id = ? AND message_id = ? AND deleted_at >= ?")
                .bind(roomId, ROOM_BURN_MARKER, streamStart)
                .first<{ deleted_at: number }>();
              if (burn) push({ roomId, burnedAt: burn.deleted_at }, "burned");
              else push({ error: "ROOM_AUTH_CHANGED" }, "error");
              break;
            }
          }
          if (iteration % 10 === 0) {
            await purgeExpiredMessages(db, roomId, now);
          }
          iteration++;
          let sent = false;

          const fetched = await fetchChatMessages(db, roomId, since, now, inclusive);
          const messages = fetched.filter((message) => !sentAtSince.has(message.id));
          if (messages.length > 0) {
            push({ messages }, "messages");
            sent = true;
            const newest = Math.max(...messages.map((message) => message.createdAt));
            if (newest !== since) sentAtSince = new Set();
            since = newest;
            for (const message of messages) {
              if (message.createdAt === since) sentAtSince.add(message.id);
            }
          }
          inclusive = true;

          const { results: deletions } = await db.prepare(
            `SELECT message_id, deleted_at FROM chat_deletions
             WHERE room_id = ? AND deleted_at >= ?
             ORDER BY deleted_at ASC LIMIT 200`
          )
            .bind(roomId, deletionCursor)
            .all<{ message_id: string; deleted_at: number }>();
          const fresh = deletions.filter((row) => !deletionsSeen.has(`${row.message_id}:${row.deleted_at}`));
          if (fresh.length > 0) {
            const burn = fresh.find((row) => row.message_id === ROOM_BURN_MARKER);
            if (burn) {
              push({ roomId, burnedAt: burn.deleted_at }, "burned");
              break;
            }
            push({ ids: fresh.map((row) => row.message_id) }, "deleted");
            sent = true;
            const newest = fresh[fresh.length - 1].deleted_at;
            if (newest !== deletionCursor) deletionsSeen = new Set();
            deletionCursor = newest;
            for (const row of fresh) {
              if (row.deleted_at === deletionCursor) deletionsSeen.add(`${row.message_id}:${row.deleted_at}`);
            }
          }

          if (!sent) controller.enqueue(encoder.encode(`: keep-alive\n\n`));
          await new Promise((resolve) => setTimeout(resolve, STREAM_POLL_MS));
        }
      } catch (error) {
        if (!closed) {
          console.error("Chat stream error:", error);
          try {
            push({ error: "STREAM_ERROR" }, "error");
          } catch {
            // stream already gone
          }
        }
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
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
