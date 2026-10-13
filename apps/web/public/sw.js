/*
 * ProtectedShare service worker. Version 1 (bump SW_VERSION on every change so browsers update).
 *
 * lib/push.ts registers it with scope "/share-target/", so it controls no app page and never sees
 * an app request. It never caches anything: a stale copy of the crypto code would be a security
 * problem. It does three things:
 *   1. push: shows "your link was opened". The message ({ kind, id, event, at }) is end-to-end
 *      encrypted by Web Push; the label comes from this device's IndexedDB mirror of My links.
 *   2. notificationclick: opens My links.
 *   3. fetch: only the share-target POST (/share-target/receive). What was shared is kept in this
 *      browser's IndexedDB and the page is sent to /share-target. It never reaches a server.
 */
const SW_VERSION = "1";

const NOTIFY_DB = "ps-notify"; // shared with lib/push.ts
const NOTIFY_STORE = "watched";
const INBOX_DB = "ps-share-inbox"; // shared with app/share-target/inbox.ts
const INBOX_STORE = "items";
const INBOX_KEY = "latest";
const MAX_SHARED_TEXT = 200_000;
const ICON = "/pwa/icon-192.png";
const BADGE = "/pwa/badge-96.png";

const COPY = {
  note: {
    opened: { title: "Your secure note was opened", body: "It can be opened again until it expires." },
    used_up: { title: "Your secure note was opened", body: "It burned after reading. The link no longer opens." },
  },
  secret: {
    opened: { title: "Your EnvShare secret was opened", body: "It has reads left until it expires." },
    used_up: { title: "Your EnvShare secret was opened", body: "That was the last read. It's deleted now." },
  },
  drop: {
    opened: { title: "Your file drop was opened", body: "A download started." },
    used_up: { title: "Your file drop was opened", body: "That was the last download. The files are deleted after it finishes." },
  },
  request: {
    opened: { title: "Your secret request was answered", body: "Open your inbox from My links to read it." },
    used_up: { title: "Your secret request was answered", body: "Open your inbox from My links to read it." },
  },
};

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/* ───────────── IndexedDB ───────────── */

function openDb(name, store, keyPath) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(store)) {
        request.result.createObjectStore(store, keyPath ? { keyPath } : undefined);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idb(name, store, keyPath, mode, run) {
  const db = await openDb(name, store, keyPath);
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const request = run(tx.objectStore(store));
      tx.oncomplete = () => resolve(request ? request.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/* ───────────── push ───────────── */

function readPayload(data) {
  try {
    const payload = data ? data.json() : null;
    if (
      payload &&
      Object.prototype.hasOwnProperty.call(COPY, payload.kind) &&
      typeof payload.id === "string" &&
      /^[A-Za-z0-9_-]{1,64}$/.test(payload.id) &&
      (payload.event === "opened" || payload.event === "used_up")
    ) {
      return payload;
    }
  } catch {
    // fall through
  }
  return null;
}

async function onPush(data) {
  const payload = readPayload(data);
  // Every push must show something (userVisibleOnly), even one we can't read.
  if (!payload) {
    await self.registration.showNotification("One of your links changed", {
      body: "Open My links to see it.",
      tag: "ps-links",
      icon: ICON,
      badge: BADGE,
      data: { url: "/links" },
    });
    return;
  }
  const key = `${payload.kind}:${payload.id}`;
  const entry = await idb(NOTIFY_DB, NOTIFY_STORE, "key", "readonly", (store) => store.get(key)).catch(() => null);
  const label = entry && typeof entry.label === "string" ? entry.label.trim() : "";
  const copy = COPY[payload.kind][payload.event];
  await self.registration.showNotification(copy.title, {
    body: label ? `${label}\n${copy.body}` : copy.body,
    tag: key,
    renotify: true,
    timestamp: Number.isFinite(payload.at) ? payload.at * 1000 : Date.now(),
    icon: ICON,
    badge: BADGE,
    data: { url: "/links" },
  });
  if (payload.event === "used_up") {
    // The share is gone, and so is its watch on the server.
    await idb(NOTIFY_DB, NOTIFY_STORE, "key", "readwrite", (store) => store.delete(key)).catch(() => undefined);
  }
}

self.addEventListener("push", (event) => {
  event.waitUntil(onPush(event.data));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL("/links", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((client) => client.url === target);
      if (open) return open.focus();
      return self.clients.openWindow(target);
    })()
  );
});

// Re-subscribing needs the manage tokens, which stay in the page's localStorage. If the browser
// rotates the subscription, notifications for existing links stop; turning one on again resubscribes.

/* ───────────── share target ───────────── */

async function receiveShare(request) {
  let destination = "/share-target";
  try {
    const form = await request.formData();
    const text = (name) => {
      const value = form.get(name);
      return typeof value === "string" ? value.slice(0, MAX_SHARED_TEXT) : "";
    };
    const files = form.getAll("files").filter((file) => typeof file === "object" && file !== null && file.size > 0);
    await idb(INBOX_DB, INBOX_STORE, null, "readwrite", (store) =>
      store.put({ title: text("title"), text: text("text"), url: text("url"), files, at: Date.now() }, INBOX_KEY)
    );
  } catch {
    destination = "/share-target?error=read";
  }
  return Response.redirect(new URL(destination, self.location.origin).href, 303);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "POST") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname !== "/share-target/receive") return;
  event.respondWith(receiveShare(request));
});
