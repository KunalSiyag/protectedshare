import { Hono } from "hono";
import { env as workerEnv, waitUntil } from "cloudflare:workers";
import {
  MAX_SHARE_WATCHERS,
  ShareKindSchema,
  UnwatchShareRequestSchema,
  WatchShareRequestSchema,
  type PushEventName,
  type PushEventPayload,
  type ShareKind,
  type WatchShareResponse,
} from "@protectedshare/contracts";
import { type AppContext, type AppEnv, type Bindings, isValidId, jsonError, nowEpochSeconds, readJsonBody } from "../lib/env";
import { verifyToken } from "../lib/tokens";
import { isValidSubscriptionKeys, sendWebPush, type PushTarget, type VapidConfig } from "../lib/webpush";

/**
 * "Tell me when it's opened": Web Push read notifications, no account and no email.
 *
 * The owner of a share (whoever holds its manage token) registers a browser push subscription.
 * On the first open, and on the read that uses the share up, the Worker sends an encrypted
 * Web Push (RFC 8291 + VAPID) with { kind, id, event, at }. A subscription is kept only while
 * its share is active: it goes when the share is used up (after that last notification),
 * revoked (trigger in the schema), or expires (cron).
 */

type NotifyBindings = Bindings & {
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
  /** Local tests only: also accept endpoints under this http://localhost or http://127.0.0.1 prefix. */
  PUSH_TEST_ENDPOINT_PREFIX?: string;
};

/** Push services of the browsers that ship Web Push. The Worker POSTs only to these. */
const PUSH_HOSTS = new Set(["fcm.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"]);
const PUSH_HOST_SUFFIXES = [".push.apple.com", ".notify.windows.com"];
const MAX_ENDPOINT_LENGTH = 2048;
/** The push service may hold a message for an offline device this long. */
const PUSH_TTL_SECONDS = 86_400;
/** Every payload is padded to this size, so its length doesn't hint at the kind or event. */
const PUSH_PAD_TO = 128;
const MAX_WATCH_BODY_BYTES = 4_096;

export const notifyRoutes = new Hono<AppEnv>();

function testEndpointPrefix(raw: string | undefined): URL | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    return url.protocol === "http:" && local && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

/**
 * SSRF guard: the Worker will POST to this URL, so only https on a known browser push service,
 * default port, no credentials. A local test prefix can be allowed, but only on localhost.
 */
export function isAllowedPushEndpoint(raw: string, testPrefix?: string): boolean {
  if (typeof raw !== "string" || raw.length > MAX_ENDPOINT_LENGTH) return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.username || url.password) return false;
  const local = testEndpointPrefix(testPrefix);
  if (local && url.origin === local.origin && url.pathname.startsWith(local.pathname)) return true;
  if (url.protocol !== "https:" || url.port !== "") return false;
  const host = url.hostname.toLowerCase();
  return PUSH_HOSTS.has(host) || PUSH_HOST_SUFFIXES.some((suffix) => host.length > suffix.length && host.endsWith(suffix));
}

function vapidFrom(env: NotifyBindings): VapidConfig | null {
  const publicKey = env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = env.VAPID_PRIVATE_KEY?.trim();
  const subject = env.VAPID_SUBJECT?.trim();
  return publicKey && privateKey && subject ? { publicKey, privateKey, subject } : null;
}

type WatchedReceipt = { kind: ShareKind; id: string; manage_hash: string; status: string; expires_at: number };

/** Same rules and error codes as /api/manage/:kind/:id: the manage token must match the receipt. */
async function authorizeOwner(c: AppContext): Promise<{ ok: true; receipt: WatchedReceipt } | { ok: false; response: Response }> {
  const kind = ShareKindSchema.safeParse(c.req.param("kind"));
  const id = c.req.param("id");
  if (!kind.success || !isValidId(id)) {
    return { ok: false, response: jsonError("Unknown share.", "RECEIPT_NOT_FOUND", 404) };
  }
  const token = c.req.header("x-manage-token")?.trim();
  if (!token) {
    return { ok: false, response: jsonError("A manage token is required.", "MANAGE_TOKEN_REQUIRED", 401) };
  }
  const receipt = await c.env.DB.prepare("SELECT kind, id, manage_hash, status, expires_at FROM share_receipts WHERE kind = ? AND id = ?")
    .bind(kind.data, id)
    .first<WatchedReceipt>();
  if (!receipt) {
    return { ok: false, response: jsonError("Unknown share.", "RECEIPT_NOT_FOUND", 404) };
  }
  if (!(await verifyToken(token, receipt.manage_hash))) {
    return { ok: false, response: jsonError("Invalid manage token.", "INVALID_MANAGE_TOKEN", 401) };
  }
  return { ok: true, receipt };
}

const shareClosed = () => jsonError("This link is already used up, revoked or expired.", "SHARE_CLOSED", 410);

notifyRoutes.post("/api/manage/:kind/:id/watch", async (c) => {
  const env = c.env as NotifyBindings;
  if (!vapidFrom(env)) {
    return jsonError("Notifications aren't set up on this server.", "PUSH_NOT_CONFIGURED", 503);
  }
  const auth = await authorizeOwner(c);
  if (!auth.ok) return auth.response;
  const read = await readJsonBody(c, MAX_WATCH_BODY_BYTES);
  if (!read.ok) return read.response;
  const parsed = WatchShareRequestSchema.safeParse(read.body);
  if (!parsed.success) {
    return jsonError("Send { subscription: { endpoint, keys: { p256dh, auth } } }.", "INVALID_SUBSCRIPTION", 400);
  }
  const { endpoint, keys } = parsed.data.subscription;
  if (!isAllowedPushEndpoint(endpoint, env.PUSH_TEST_ENDPOINT_PREFIX)) {
    return jsonError("That push address isn't from a browser push service we know.", "PUSH_ENDPOINT_NOT_ALLOWED", 400);
  }
  if (!(await isValidSubscriptionKeys(keys))) {
    return jsonError("The subscription keys aren't valid.", "INVALID_SUBSCRIPTION", 400);
  }

  const { receipt } = auth;
  const now = nowEpochSeconds();
  if (receipt.status !== "active" || receipt.expires_at <= now) return shareClosed();

  // One statement: insert (or refresh the keys of) this browser's subscription, only while the
  // share is still active and fewer than MAX_SHARE_WATCHERS other browsers watch it.
  const result = await c.env.DB.prepare(
    `INSERT INTO share_watchers (kind, id, endpoint, p256dh, auth, created_at)
     SELECT ?1, ?2, ?3, ?4, ?5, ?6
     WHERE EXISTS (SELECT 1 FROM share_receipts WHERE kind = ?1 AND id = ?2 AND status = 'active' AND expires_at > ?6)
       AND (SELECT COUNT(*) FROM share_watchers WHERE kind = ?1 AND id = ?2 AND endpoint <> ?3) < ?7
     ON CONFLICT (kind, id, endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`
  )
    .bind(receipt.kind, receipt.id, endpoint, keys.p256dh, keys.auth, now, MAX_SHARE_WATCHERS)
    .run();
  if (!result.meta.changes) {
    const still = await c.env.DB.prepare("SELECT 1 AS open FROM share_receipts WHERE kind = ? AND id = ? AND status = 'active' AND expires_at > ?")
      .bind(receipt.kind, receipt.id, now)
      .first();
    if (!still) return shareClosed();
    return jsonError(`A link can notify at most ${MAX_SHARE_WATCHERS} browsers.`, "TOO_MANY_WATCHERS", 409);
  }
  const response: WatchShareResponse = { kind: receipt.kind, id: receipt.id, watching: true };
  return c.json(response, 201);
});

notifyRoutes.delete("/api/manage/:kind/:id/watch", async (c) => {
  const auth = await authorizeOwner(c);
  if (!auth.ok) return auth.response;
  const { receipt } = auth;

  // Optional body { endpoint }: stop one browser. No body: stop every browser watching this share.
  let endpoint: string | undefined;
  if (Number(c.req.header("content-length") ?? "0") > MAX_WATCH_BODY_BYTES) {
    return jsonError("Request body is too large.", "PAYLOAD_TOO_LARGE", 413);
  }
  const text = (await c.req.text().catch(() => "")).slice(0, MAX_WATCH_BODY_BYTES + 1);
  if (text.trim()) {
    let body: unknown = null;
    try {
      body = JSON.parse(text);
    } catch {
      // handled below
    }
    const parsed = UnwatchShareRequestSchema.safeParse(body);
    if (text.length > MAX_WATCH_BODY_BYTES || !parsed.success) {
      return jsonError("Send { endpoint } or no body.", "INVALID_UNWATCH_REQUEST", 400);
    }
    endpoint = parsed.data.endpoint;
  }
  const statement = endpoint
    ? c.env.DB.prepare("DELETE FROM share_watchers WHERE kind = ? AND id = ? AND endpoint = ?").bind(receipt.kind, receipt.id, endpoint)
    : c.env.DB.prepare("DELETE FROM share_watchers WHERE kind = ? AND id = ?").bind(receipt.kind, receipt.id);
  await statement.run();
  const response: WatchShareResponse = { kind: receipt.kind, id: receipt.id, watching: false };
  return c.json(response);
});

/* ------------------------------ Dispatch ------------------------------ */

/**
 * Which notification a receipt change sends: the first open, and the read that used the share
 * up. Changes that don't count a read (a requester collecting their own answer) send nothing.
 */
export function readEventFor(counted: boolean, after: { reads: number; status: string }): PushEventName | null {
  if (!counted) return null;
  if (after.status === "consumed") return "used_up";
  return after.reads === 1 ? "opened" : null;
}

/**
 * Called by recordReceiptEvent after a receipt changed. Sends the pushes after the response
 * (waitUntil) so a read is never slowed down by a push service, then forgets the share's
 * subscriptions if it's closed. Never throws.
 */
export function notifyReceiptChange(db: D1Database, kind: ShareKind, id: string, counted: boolean, after: { reads: number; status: string }): void {
  const event = readEventFor(counted, after);
  const closed = after.status !== "active";
  if (!event && !closed) return;
  const task = dispatch(db, workerEnv as unknown as NotifyBindings, kind, id, event, closed).catch((error) => {
    console.error("Read notification failed:", error instanceof Error ? error.message : error);
  });
  try {
    waitUntil(task);
  } catch {
    // Outside a request context the promise still runs on its own.
  }
}

async function dispatch(db: D1Database, env: NotifyBindings, kind: ShareKind, id: string, event: PushEventName | null, closed: boolean): Promise<void> {
  const vapid = vapidFrom(env);
  if (event && vapid) {
    const { results } = await db.prepare("SELECT endpoint, p256dh, auth FROM share_watchers WHERE kind = ? AND id = ?")
      .bind(kind, id)
      .all<PushTarget>();
    const payload: PushEventPayload = { kind, id, event, at: nowEpochSeconds() };
    const body = JSON.stringify(payload);
    const gone = await Promise.all(
      results.map(async (target) => {
        // Checked again at send time: rows are only trusted as far as the allow-list goes.
        if (!isAllowedPushEndpoint(target.endpoint, env.PUSH_TEST_ENDPOINT_PREFIX)) return target.endpoint;
        const host = new URL(target.endpoint).host; // logs name the push service, never the endpoint
        try {
          const result = await sendWebPush(target, body, vapid, { ttl: PUSH_TTL_SECONDS, urgency: "normal", padTo: PUSH_PAD_TO });
          if (result.gone) return target.endpoint;
          if (!result.ok) console.warn("Push service refused a read notification:", host, result.status);
        } catch (error) {
          console.warn("Push service unreachable:", host, error instanceof Error ? error.name : "error");
        }
        return null;
      })
    );
    const forget = gone.filter((endpoint): endpoint is string => endpoint !== null);
    if (forget.length > 0 && !closed) {
      await db.batch(
        forget.map((endpoint) => db.prepare("DELETE FROM share_watchers WHERE kind = ? AND id = ? AND endpoint = ?").bind(kind, id, endpoint))
      );
    }
  }
  if (closed) {
    await db.prepare("DELETE FROM share_watchers WHERE kind = ? AND id = ?").bind(kind, id).run();
  }
}

/** Cron: forget subscriptions whose share expired, closed, or lost its receipt. */
export async function purgeClosedWatchers(db: D1Database, now = nowEpochSeconds()): Promise<void> {
  try {
    await db.prepare(
      `DELETE FROM share_watchers WHERE NOT EXISTS (
         SELECT 1 FROM share_receipts r
         WHERE r.kind = share_watchers.kind AND r.id = share_watchers.id AND r.status = 'active' AND r.expires_at > ?
       )`
    )
      .bind(now)
      .run();
  } catch (error) {
    console.error("Watcher purge failed:", error);
  }
}
