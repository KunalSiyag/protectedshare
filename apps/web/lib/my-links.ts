import { useSyncExternalStore } from "react";

/**
 * "My links": shares created on this device, kept only in this browser's localStorage.
 * Never store secret content here. `label` is a user-visible name (a title or file names,
 * first 40 chars), and `manageToken` lets this browser check status or revoke.
 */
export type MyLinkKind = "note" | "secret" | "drop" | "request";

export type MyLink = {
  kind: MyLinkKind;
  id: string;
  /** Full share URL including the fragment. */
  url: string;
  /** Requester inbox URL (secret requests only). */
  inboxUrl?: string;
  manageToken: string;
  label: string;
  createdAt: number;
  expiresAt: number;
  maxReads?: number;
};

export const MY_LINKS_KEY = "ps.links.v1";
const CHANGE_EVENT = "ps:links-changed";
const MAX_LINKS = 200;
const LABEL_MAX = 40;

const EMPTY: readonly MyLink[] = Object.freeze([]);
let cachedRaw: string | null | undefined;
let cachedList: readonly MyLink[] = EMPTY;

function isLink(value: unknown): value is MyLink {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    (v.kind === "note" || v.kind === "secret" || v.kind === "drop" || v.kind === "request") &&
    typeof v.id === "string" &&
    typeof v.url === "string" &&
    typeof v.manageToken === "string" &&
    typeof v.createdAt === "number" &&
    typeof v.expiresAt === "number"
  );
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(MY_LINKS_KEY);
  } catch {
    return null;
  }
}

function parse(raw: string | null): readonly MyLink[] {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(isLink).map((link) => ({ ...link, label: typeof link.label === "string" ? link.label : "" }));
  } catch {
    return EMPTY;
  }
}

function write(list: readonly MyLink[]): void {
  try {
    window.localStorage.setItem(MY_LINKS_KEY, JSON.stringify(list));
  } catch {
    // Storage full or blocked (private mode). The share still works; it just isn't remembered.
  }
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore
  }
}

/** Newest first. Returns a stable array reference until storage changes. */
export function listLinks(): readonly MyLink[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedList = [...parse(raw)].sort((a, b) => b.createdAt - a.createdAt);
  }
  return cachedList;
}

/** Make a safe, short label from a title or file names. Never pass secret content. */
export function makeLinkLabel(source: string): string {
  const clean = source.replace(/\s+/g, " ").trim();
  return clean.length > LABEL_MAX ? `${clean.slice(0, LABEL_MAX - 1)}…` : clean;
}

/** Adds (or replaces, by kind+id) a link. Returns false if storage is unavailable. */
export function addLink(entry: MyLink): boolean {
  if (typeof window === "undefined") return false;
  const next = [
    { ...entry, label: makeLinkLabel(entry.label ?? "") },
    ...listLinks().filter((link) => !(link.kind === entry.kind && link.id === entry.id)),
  ].slice(0, MAX_LINKS);
  write(next);
  return readRaw() !== null;
}

export function updateLink(kind: MyLinkKind, id: string, patch: Partial<Omit<MyLink, "kind" | "id">>): void {
  if (typeof window === "undefined") return;
  write(listLinks().map((link) => (link.kind === kind && link.id === id ? { ...link, ...patch } : link)));
}

export function removeLink(kind: MyLinkKind, id: string): void {
  if (typeof window === "undefined") return;
  write(listLinks().filter((link) => !(link.kind === kind && link.id === id)));
}

export function clearLinks(): void {
  if (typeof window === "undefined") return;
  write(EMPTY);
}

/** Calls `cb` when links change in this tab or another tab. Returns an unsubscribe function. */
export function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === MY_LINKS_KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, cb);
  };
}

const serverSnapshot = () => EMPTY;

/** Hydration-safe hook: returns [] during SSR and the first client render, then the live list. */
export function useMyLinks(): readonly MyLink[] {
  return useSyncExternalStore(subscribe, listLinks, serverSnapshot);
}

/** Number of saved links that have not passed their expiry. 0 on the server. */
export function useMyLinksCount(): number {
  const links = useMyLinks();
  // Expired entries stay listed (they show as expired) but don't count as live.
  return links.filter((link) => link.expiresAt > Date.now()).length;
}
