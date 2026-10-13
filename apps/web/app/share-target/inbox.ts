/**
 * What the installed app received through "Share to ProtectedShare". public/sw.js writes it to this
 * browser's IndexedDB (it never reaches a server); /share-target and /files read it once and clear it.
 * Shared with public/sw.js: DB "ps-share-inbox", store "items" (out-of-line keys), key "latest".
 *
 * Any website can POST a form to /share-target/receive, so what arrives is untrusted: /share-target
 * shows it for review and nothing moves on without a click. Files reach /files only once that click
 * has marked the item approved; /files takes nothing else.
 */
const DB_NAME = "ps-share-inbox";
const STORE = "items";
const KEY = "latest";
/** Anything older was abandoned; it's deleted unread. */
const MAX_AGE_MS = 15 * 60 * 1000;

/** `approved` is set by approveSharedItem only (public/sw.js never writes it). */
export type SharedItem = { title: string; text: string; url: string; files: File[]; at: number; approved?: boolean };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, op: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = op(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

function isSharedItem(value: unknown): value is SharedItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.at === "number" && Array.isArray(item.files) && ["title", "text", "url"].every((key) => typeof item[key] === "string");
}

/** Deletes whatever is waiting. */
export async function clearSharedItem(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  await run("readwrite", (store) => store.delete(KEY)).catch(() => undefined);
}

/** Reads what was shared, without clearing it. Old or malformed entries are deleted and ignored. */
export async function peekSharedItem(): Promise<SharedItem | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const value = await run("readonly", (store) => store.get(KEY));
    if (!isSharedItem(value)) {
      if (value !== undefined) await clearSharedItem();
      return null;
    }
    if (Date.now() - value.at > MAX_AGE_MS) {
      await clearSharedItem();
      return null;
    }
    return { ...value, files: value.files.filter((file): file is File => file instanceof Blob) };
  } catch {
    return null;
  }
}

/**
 * After the visitor reviewed a share on /share-target and chose File drop: marks that item (the one
 * that arrived at `at`) approved for /files. False if it's gone or something newer replaced it.
 */
export async function approveSharedItem(at: number): Promise<boolean> {
  if (typeof indexedDB === "undefined") return false;
  try {
    const db = await openDb();
    try {
      return await new Promise<boolean>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        let approved = false;
        const request = store.get(KEY);
        request.onsuccess = () => {
          const value: unknown = request.result;
          if (isSharedItem(value) && value.at === at) {
            store.put({ ...value, approved: true }, KEY);
            approved = true;
          }
        };
        tx.oncomplete = () => resolve(approved);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally {
      db.close();
    }
  } catch {
    return false;
  }
}

/**
 * Takes shared files for /files: only an item approved on /share-target, which it then clears.
 * Anything unapproved stays for /share-target to show (or to expire).
 */
export async function takeSharedFiles(): Promise<File[]> {
  const item = await peekSharedItem();
  if (item?.approved !== true) return [];
  await clearSharedItem();
  return item.files;
}

/** Shared title, text and link as one note body, dropping any part another one already contains. */
export function sharedText(item: SharedItem): string {
  const parts = [...new Set([item.title, item.text, item.url].map((value) => value.trim()).filter(Boolean))];
  return parts.filter((part) => !parts.some((other) => other !== part && other.includes(part))).join("\n");
}
