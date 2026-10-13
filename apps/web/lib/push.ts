import { useEffect, useState } from "react";
import { type ShareKind } from "@protectedshare/contracts";
import { MANAGE_TOKEN_HEADER } from "@protectedshare/contracts/constants";
import { apiUrl } from "./api";
import type { MyLink } from "./my-links";

/**
 * "Tell me when it's opened": Web Push read notifications for links in My links.
 *
 * - The service worker (public/sw.js) is registered with scope /share-target/, so it controls no
 *   app page and never sees an app request. It shows the notifications and takes share-target POSTs.
 * - Turning a link on sends its manage token and this browser's push subscription (endpoint and
 *   public keys) to POST /api/manage/:kind/:id/watch. Nothing else leaves the browser.
 * - Labels stay on this device: watched links are mirrored into IndexedDB (ps-notify/watched,
 *   keyed "kind:id") because the service worker can't read localStorage. Only kind, id, label and
 *   expiry are mirrored, never the URL, key or manage token.
 */

/** Same key the API signs with (VAPID_PUBLIC_KEY). Empty: notifications are off for this deployment. */
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export const SW_URL = "/sw.js";
export const SW_SCOPE = "/share-target/";

// Shared with public/sw.js. Change both together.
const DB_NAME = "ps-notify";
const DB_VERSION = 1;
const STORE = "watched";
const CHANGE_EVENT = "ps:watch-changed";

export type WatchedEntry = { key: string; kind: ShareKind; id: string; label: string; expiresAt: number };
type WatchableLink = Pick<MyLink, "kind" | "id" | "manageToken" | "label" | "expiresAt">;

export const watchKey = (kind: string, id: string) => `${kind}:${id}`;

/* ───────────── support ───────────── */

/**
 * available: this browser can subscribe. home-screen: iPhone or iPad in a Safari tab, where Web Push
 * exists only for Home Screen apps. unsupported: no Web Push here. off: no VAPID key configured.
 */
export type PushAvailability = "available" | "home-screen" | "unsupported" | "off";

function isAppleMobile(): boolean {
  const { userAgent, platform, maxTouchPoints } = navigator;
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
}

/** Running as the installed app (or an iOS Home Screen web app), not in a browser tab. */
export function isStandalone(): boolean {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function pushAvailability(): PushAvailability {
  if (typeof window === "undefined") return "unsupported";
  if (!VAPID_PUBLIC_KEY) return "off";
  if ("serviceWorker" in navigator && "PushManager" in window && "Notification" in window) return "available";
  if (isAppleMobile() && !isStandalone()) return "home-screen";
  return "unsupported";
}

/** Client-only value (null during SSR and the first render, so hydration matches). */
export function usePushAvailability(): PushAvailability | null {
  const [value, setValue] = useState<PushAvailability | null>(null);
  useEffect(() => setValue(pushAvailability()), []);
  return value;
}

/* ───────────── share URLs ───────────── */

const PATH_KINDS: Record<string, ShareKind> = { notes: "note", n: "note", secrets: "secret", s: "secret", files: "drop", request: "request" };

/** kind + id from a share link's path (/notes/:id, /secrets/:id, /files/:id, /request/:id). */
export function shareFromUrl(url: string): { kind: ShareKind; id: string } | null {
  try {
    const { pathname } = new URL(url, "https://protectedshare.me");
    const match = /^\/([a-z]+)\/([A-Za-z0-9_-]{1,64})\/?$/.exec(pathname);
    const kind = match ? PATH_KINDS[match[1]] : undefined;
    return kind && match ? { kind, id: match[2] } : null;
  } catch {
    return null;
  }
}

/* ───────────── IndexedDB mirror ───────────── */

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB blocked"));
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T | undefined> {
  const db = await openDb();
  try {
    return await new Promise<T | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request ? request.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function listWatched(): Promise<WatchedEntry[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    return ((await withStore<WatchedEntry[]>("readonly", (store) => store.getAll() as IDBRequest<WatchedEntry[]>)) ?? []).filter(
      (entry) => entry && typeof entry.key === "string"
    );
  } catch {
    return [];
  }
}

async function forgetEntries(keys: string[]): Promise<void> {
  if (keys.length === 0 || typeof indexedDB === "undefined") return;
  try {
    await withStore("readwrite", (store) => {
      for (const key of keys) store.delete(key);
    });
  } catch {
    // Private mode or storage blocked: nothing was mirrored either.
  }
  emitChange();
}

function emitChange(): void {
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore
  }
}

/** Keys ("kind:id") this browser watches, refreshed on changes and when the tab regains focus. null while loading. */
export function useWatchedKeys(): ReadonlySet<string> | null {
  const [keys, setKeys] = useState<ReadonlySet<string> | null>(null);
  useEffect(() => {
    let live = true;
    const load = () => {
      void listWatched().then((entries) => {
        if (live) setKeys(new Set(entries.filter((entry) => entry.expiresAt > Date.now()).map((entry) => entry.key)));
      });
    };
    load();
    window.addEventListener(CHANGE_EVENT, load);
    window.addEventListener("focus", load);
    return () => {
      live = false;
      window.removeEventListener(CHANGE_EVENT, load);
      window.removeEventListener("focus", load);
    };
  }, []);
  return keys;
}

/** Drops mirrored labels for links that expired or are no longer watched anywhere. */
export async function pruneWatched(keep: (entry: WatchedEntry) => boolean = () => true): Promise<void> {
  const now = Date.now();
  const stale = (await listWatched()).filter((entry) => entry.expiresAt <= now || !keep(entry)).map((entry) => entry.key);
  await forgetEntries(stale);
}

/* ───────────── service worker + subscription ───────────── */

function whenActive(registration: ServiceWorkerRegistration): Promise<void> {
  if (registration.active) return Promise.resolve();
  const worker = registration.installing ?? registration.waiting;
  if (!worker) return Promise.reject(new Error("No service worker"));
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Service worker didn't start")), 15_000);
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") {
        window.clearTimeout(timer);
        resolve();
      } else if (worker.state === "redundant") {
        window.clearTimeout(timer);
        reject(new Error("Service worker failed to install"));
      }
    });
  });
}

/**
 * Registers public/sw.js for /share-target/ only. Also what makes "Share to ProtectedShare" from
 * the installed app stay on this device. Resolves null where unsupported. Call it only when the
 * visitor turns notifications on (watchLink) or in the installed app (components/standalone-sw.tsx,
 * /share-target): the privacy policy promises no worker otherwise. Elsewhere use
 * existingServiceWorker or refreshServiceWorker, which never register one.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  const registration = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE, updateViaCache: "none" });
  await whenActive(registration);
  return registration;
}

/** The worker this browser already has for /share-target/, or null. Never registers one. */
export async function existingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return (await navigator.serviceWorker.getRegistration(SW_SCOPE)) ?? null;
  } catch {
    return null;
  }
}

/**
 * Checks an existing worker for a newer sw.js (it controls no app page, so the browser seldom
 * checks by itself). Does nothing when this browser has no worker.
 */
export async function refreshServiceWorker(): Promise<void> {
  const registration = await existingServiceWorker();
  await registration?.update().catch(() => undefined);
}

function serverKey(): Uint8Array<ArrayBuffer> {
  const base64 = VAPID_PUBLIC_KEY.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function sameKey(a: ArrayBuffer | null | undefined, b: Uint8Array): boolean {
  if (!a || a.byteLength !== b.length) return false;
  const view = new Uint8Array(a);
  return view.every((byte, index) => byte === b[index]);
}

async function pushSubscription(registration: ServiceWorkerRegistration): Promise<PushSubscription> {
  const key = serverKey();
  const existing = await registration.pushManager.getSubscription();
  // A subscription made for an older server key can't receive our messages; replace it.
  if (existing && sameKey(existing.options.applicationServerKey, key)) return existing;
  if (existing) await existing.unsubscribe().catch(() => false);
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
}

/* ───────────── watch / unwatch ───────────── */

/** on, or why not: permission denied, link already used up or expired, 5 browsers already, or failed. */
export type WatchResult = "on" | "denied" | "closed" | "limit" | "unavailable" | "failed";

/**
 * Turns on read notifications for one link. Call it straight from a click: the permission prompt
 * needs the user's gesture (Safari is strict about it).
 */
export async function watchLink(link: WatchableLink): Promise<WatchResult> {
  if (pushAvailability() !== "available") return "unavailable";
  // Resolves at once when the site is already allowed or blocked; prompts only when undecided.
  // (Not Notification.permission: some browsers report it stale.)
  let permission: NotificationPermission;
  try {
    permission = await Notification.requestPermission();
  } catch {
    return "denied";
  }
  if (permission !== "granted") return "denied";
  try {
    const registration = await registerServiceWorker();
    if (!registration) return "unavailable";
    const { endpoint, keys } = (await pushSubscription(registration)).toJSON();
    if (!endpoint || !keys?.p256dh || !keys.auth) return "failed";
    const response = await fetch(apiUrl(`/api/manage/${link.kind}/${encodeURIComponent(link.id)}/watch`), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", [MANAGE_TOKEN_HEADER]: link.manageToken },
      body: JSON.stringify({ subscription: { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } } }),
    });
    if (response.status === 404 || response.status === 410) return "closed";
    if (response.status === 409) return "limit";
    if (!response.ok) return "failed";
    const entry: WatchedEntry = { key: watchKey(link.kind, link.id), kind: link.kind, id: link.id, label: link.label, expiresAt: link.expiresAt };
    await withStore("readwrite", (store) => store.put(entry)).catch(() => undefined);
    emitChange();
    return "on";
  } catch {
    return "failed";
  }
}

/** Stops read notifications for a link in every browser that watches it. False if the server didn't answer. */
export async function unwatchLink(link: Pick<MyLink, "kind" | "id" | "manageToken">): Promise<boolean> {
  try {
    const response = await fetch(apiUrl(`/api/manage/${link.kind}/${encodeURIComponent(link.id)}/watch`), {
      method: "DELETE",
      cache: "no-store",
      headers: { [MANAGE_TOKEN_HEADER]: link.manageToken },
    });
    // 404: the server already forgot the share, so nothing is left to stop.
    if (!response.ok && response.status !== 404) return false;
  } catch {
    return false;
  }
  await forgetEntries([watchKey(link.kind, link.id)]);
  return true;
}

/** Forgets the local mirror only (the share is already closed, so the server dropped it too). */
export function forgetWatched(kind: string, id: string): Promise<void> {
  return forgetEntries([watchKey(kind, id)]);
}
