/**
 * Chat v2 shared types and helpers: invite links, the encrypted envelope, local storage.
 * Nothing in this file talks to the server.
 */

export const ROOM_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789_-";
const ROOM_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/** Encrypted attachments must fit in one message (server cap 1.5M chars of ciphertext). */
export const MAX_ATTACHMENT_BYTES = 800 * 1024;
export const MAX_BODY_CHARS = 8000;

export function generateRoomId(length = 12): string {
  const values = globalThis.crypto.getRandomValues(new Uint32Array(length));
  let id = "";
  for (let index = 0; index < values.length; index += 1) {
    id += ROOM_ID_ALPHABET[values[index] % ROOM_ID_ALPHABET.length];
  }
  return id;
}

export function isValidRoomId(value: string): boolean {
  return ROOM_ID_PATTERN.test(value);
}

export function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/* ───────────────────────── Invites ───────────────────────── */

/** What a room needs to open: a key (link rooms) or a password (password rooms). */
export type RoomSecret = { roomId: string; key?: string; password?: string };

export type ParsedInvite =
  | { kind: "key"; roomId: string; key: string }
  | { kind: "password"; roomId: string; password: string }
  | { kind: "room"; roomId: string };

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Accepts a full invite URL, just its fragment, or a bare room id.
 * v2: `#r={roomId}&k={key}` (or `#r={roomId}` for password rooms).
 * Legacy: `#{roomId}:{password}`.
 */
export function parseInvite(input: string): ParsedInvite | null {
  let raw = input.trim();
  if (!raw) return null;
  const hashIndex = raw.indexOf("#");
  if (hashIndex >= 0) raw = raw.slice(hashIndex + 1);
  else if (/^https?:\/\//i.test(raw)) return null;
  if (!raw) return null;

  if (/^r=/.test(raw)) {
    const params: Record<string, string> = {};
    for (const part of raw.split("&")) {
      const [name, ...rest] = part.split("=");
      if (name) params[name] = safeDecode(rest.join("="));
    }
    const roomId = params.r ?? "";
    if (!isValidRoomId(roomId)) return null;
    if (params.k) return { kind: "key", roomId, key: params.k };
    return { kind: "room", roomId };
  }

  const separator = raw.indexOf(":");
  if (separator === -1) {
    const roomId = safeDecode(raw);
    return isValidRoomId(roomId) ? { kind: "room", roomId } : null;
  }
  const roomId = safeDecode(raw.slice(0, separator));
  const password = safeDecode(raw.slice(separator + 1));
  if (!isValidRoomId(roomId)) return null;
  if (!password) return { kind: "room", roomId };
  return { kind: "password", roomId, password };
}

export function inviteUrl(origin: string, secret: RoomSecret): string {
  const base = `${origin}/chat#r=${encodeURIComponent(secret.roomId)}`;
  return secret.key ? `${base}&k=${encodeURIComponent(secret.key)}` : base;
}

/** The fragment kept in the address bar while in a room. Password rooms never put the password there. */
export function roomFragment(secret: RoomSecret): string {
  return secret.key
    ? `r=${encodeURIComponent(secret.roomId)}&k=${encodeURIComponent(secret.key)}`
    : `r=${encodeURIComponent(secret.roomId)}`;
}

/* ───────────────────────── Envelope ───────────────────────── */

export const REACTION_KEYS = ["up", "love", "laugh", "wow", "sad", "ack"] as const;
export type ReactionKey = (typeof REACTION_KEYS)[number];

export type FileAttachment = {
  name: string;
  type: string;
  size: number;
  /** Standard base64 of the file bytes. */
  data: string;
  w?: number;
  h?: number;
};

export type ReplyRef = { mid: string; name: string; excerpt: string };

type Sender = { mid: string; from: string; name: string; color: number };

/** Everything inside a v2 message's ciphertext. The server sees none of it. */
export type Envelope =
  | (Sender & { t: "msg"; body: string; reply?: ReplyRef; file?: FileAttachment })
  | (Sender & { t: "edit"; target: string; body: string })
  | (Sender & { t: "del"; target: string })
  | (Sender & { t: "react"; target: string; key: ReactionKey; on: boolean })
  | (Sender & { t: "ttl"; seconds: number | null });

const isStr = (value: unknown, max = 200): value is string => typeof value === "string" && value.length <= max;

/** Envelopes come from other room members. Check shapes before trusting any field. */
export function validateEnvelope(value: unknown): Envelope | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!isStr(v.mid, 80) || !v.mid || !isStr(v.from, 80) || !v.from) return null;
  const name = isStr(v.name, 120) ? v.name.slice(0, 40) : "";
  const color = typeof v.color === "number" && Number.isFinite(v.color) ? Math.abs(Math.floor(v.color)) % NAME_TONES.length : 0;
  const sender = { mid: v.mid, from: v.from, name, color };

  switch (v.t) {
    case "msg": {
      if (typeof v.body !== "string" || v.body.length > MAX_BODY_CHARS * 2) return null;
      let reply: ReplyRef | undefined;
      if (v.reply && typeof v.reply === "object") {
        const r = v.reply as Record<string, unknown>;
        if (isStr(r.mid, 80) && isStr(r.name, 120) && isStr(r.excerpt, 400)) {
          reply = { mid: r.mid, name: r.name.slice(0, 40), excerpt: r.excerpt.slice(0, 160) };
        }
      }
      let file: FileAttachment | undefined;
      if (v.file && typeof v.file === "object") {
        const f = v.file as Record<string, unknown>;
        if (isStr(f.name, 400) && isStr(f.type, 120) && typeof f.size === "number" && typeof f.data === "string") {
          file = {
            name: f.name.slice(0, 200) || "file",
            type: f.type,
            size: f.size,
            data: f.data,
            w: typeof f.w === "number" ? f.w : undefined,
            h: typeof f.h === "number" ? f.h : undefined,
          };
        }
      }
      if (!v.body && !file) return null;
      return { ...sender, t: "msg", body: v.body, reply, file };
    }
    case "edit":
      if (!isStr(v.target, 80) || typeof v.body !== "string" || !v.body.trim()) return null;
      return { ...sender, t: "edit", target: v.target, body: v.body.slice(0, MAX_BODY_CHARS * 2) };
    case "del":
      if (!isStr(v.target, 80)) return null;
      return { ...sender, t: "del", target: v.target };
    case "react":
      if (!isStr(v.target, 80) || !REACTION_KEYS.includes(v.key as ReactionKey)) return null;
      return { ...sender, t: "react", target: v.target, key: v.key as ReactionKey, on: v.on !== false };
    case "ttl":
      if (v.seconds !== null && (typeof v.seconds !== "number" || v.seconds < 0)) return null;
      return { ...sender, t: "ttl", seconds: (v.seconds as number | null) ?? null };
    default:
      return null;
  }
}

/* ───────────────────────── Names & colors ───────────────────────── */

/**
 * Muted ink tones for other people's names. Not a rainbow, and never the seal color.
 * Literal strings so Tailwind keeps them.
 */
export const NAME_TONES = [
  { text: "text-[#4A5A78] dark:text-[#A7B4CE]", avatar: "bg-[#4A5A78]/[0.12] text-[#4A5A78] dark:bg-[#A7B4CE]/[0.14] dark:text-[#A7B4CE]" },
  { text: "text-[#46664F] dark:text-[#9EC4A8]", avatar: "bg-[#46664F]/[0.12] text-[#46664F] dark:bg-[#9EC4A8]/[0.14] dark:text-[#9EC4A8]" },
  { text: "text-[#69507A] dark:text-[#C2AACE]", avatar: "bg-[#69507A]/[0.12] text-[#69507A] dark:bg-[#C2AACE]/[0.14] dark:text-[#C2AACE]" },
  { text: "text-[#735E38] dark:text-[#CFB98E]", avatar: "bg-[#735E38]/[0.12] text-[#735E38] dark:bg-[#CFB98E]/[0.14] dark:text-[#CFB98E]" },
  { text: "text-[#39676A] dark:text-[#93C3C5]", avatar: "bg-[#39676A]/[0.12] text-[#39676A] dark:bg-[#93C3C5]/[0.14] dark:text-[#93C3C5]" },
  { text: "text-[#655650] dark:text-[#C3B2AA]", avatar: "bg-[#655650]/[0.12] text-[#655650] dark:bg-[#C3B2AA]/[0.14] dark:text-[#C3B2AA]" },
] as const;

export function colorFor(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  return hash % NAME_TONES.length;
}

/** "Guest 4F2K"-style label for people who did not set a name. */
export function fallbackName(id: string): string {
  let hash = 7;
  for (let index = 0; index < id.length; index += 1) hash = (hash * 33 + id.charCodeAt(index)) >>> 0;
  let tag = "";
  for (let index = 0; index < 4; index += 1) {
    tag += "ABCDEFGHJKMNPQRSTVWXYZ23456789"[hash % 30];
    hash = Math.floor(hash / 30) + index * 7919;
  }
  return `Guest ${tag}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts[0].startsWith("Guest") && parts[1]) return parts[1].slice(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/* ───────────────────────── Disappearing timers ───────────────────────── */

export type TtlOption = { value: string; seconds: number | null; label: string; short: string };

export const LOBBY_TTL_OPTIONS: TtlOption[] = [
  { value: "off", seconds: null, label: "Off", short: "Off" },
  { value: "300", seconds: 300, label: "5 min", short: "5m" },
  { value: "3600", seconds: 3600, label: "1 hour", short: "1h" },
  { value: "86400", seconds: 86400, label: "1 day", short: "1d" },
];

export const ROOM_TTL_OPTIONS: TtlOption[] = [
  { value: "off", seconds: null, label: "Off", short: "Off" },
  { value: "30", seconds: 30, label: "30 seconds", short: "30s" },
  { value: "300", seconds: 300, label: "5 minutes", short: "5m" },
  { value: "3600", seconds: 3600, label: "1 hour", short: "1h" },
  { value: "86400", seconds: 86400, label: "1 day", short: "1d" },
  { value: "604800", seconds: 604800, label: "1 week", short: "1w" },
];

export function describeTtl(seconds: number | null): string {
  if (!seconds) return "Off";
  const preset = ROOM_TTL_OPTIONS.find((option) => option.seconds === seconds);
  if (preset) return preset.label;
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  return `${Math.round(seconds / 86400)} days`;
}

export function formatRemaining(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.ceil(hours / 24)}d`;
}

/* ───────────────────────── Time ───────────────────────── */

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatFullTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function dayLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(date.getTime()) === dayKey(today.getTime())) return "Today";
  if (dayKey(date.getTime()) === dayKey(yesterday.getTime())) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ───────────────────────── Local storage ───────────────────────── */

function readStore(storage: "local" | "session", key: string): string | null {
  try {
    return (storage === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

function writeStore(storage: "local" | "session", key: string, value: string | null): void {
  try {
    const store = storage === "local" ? window.localStorage : window.sessionStorage;
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    // storage blocked: fine, the feature just won't persist
  }
}

const NAME_KEY = "ps.chat.name";
const PREFS_KEY = "ps.chat.prefs";
const SESSION_KEY = "ps.chat.session";
const SENDER_KEY = "ps.chat.sender";
const PRESENCE_KEY = "ps.chat.presence";
const TOKENS_PREFIX = "ps.chat.tokens.";
const SESSION_TTL_MS = 30 * 60 * 1000;

export function loadName(): string {
  return (readStore("local", NAME_KEY) ?? "").slice(0, 40);
}

export function saveName(name: string): void {
  writeStore("local", NAME_KEY, name.trim() ? name.trim().slice(0, 40) : null);
}

export type ChatPrefs = { notify: boolean; sound: boolean; rail: boolean };

export function loadPrefs(): ChatPrefs {
  try {
    const parsed = JSON.parse(readStore("local", PREFS_KEY) ?? "{}") as Partial<ChatPrefs>;
    return { notify: !!parsed.notify, sound: !!parsed.sound, rail: parsed.rail !== false };
  } catch {
    return { notify: false, sound: false, rail: true };
  }
}

export function savePrefs(prefs: ChatPrefs): void {
  writeStore("local", PREFS_KEY, JSON.stringify(prefs));
}

/** Per-tab ids. The sender id lives only inside ciphertext; the presence id is what the server sees. */
export function tabId(kind: "sender" | "presence"): string {
  const key = kind === "sender" ? SENDER_KEY : PRESENCE_KEY;
  const existing = readStore("session", key);
  if (existing) return existing;
  const next = randomId();
  writeStore("session", key, next);
  return next;
}

type StoredSession = RoomSecret & { savedAt: number };

/** Restores a room after a reload in the same tab, for 30 minutes. Session storage only. */
export function saveSession(secret: RoomSecret): void {
  writeStore("session", SESSION_KEY, JSON.stringify({ ...secret, savedAt: Date.now() } satisfies StoredSession));
}

export function loadSession(): RoomSecret | null {
  try {
    const raw = readStore("session", SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StoredSession;
    if (!session.roomId || Date.now() - session.savedAt > SESSION_TTL_MS) {
      writeStore("session", SESSION_KEY, null);
      return null;
    }
    return { roomId: session.roomId, key: session.key, password: session.password };
  } catch {
    return null;
  }
}

export function clearSession(): void {
  writeStore("session", SESSION_KEY, null);
}

/** Delete tokens for messages this tab sent: mid → server id + token (+ the message it edits/reacts to). */
export type TokenRecord = { serverId: string; token: string; target?: string };

export function loadTokens(roomId: string): Record<string, TokenRecord> {
  try {
    return JSON.parse(readStore("session", TOKENS_PREFIX + roomId) ?? "{}") as Record<string, TokenRecord>;
  } catch {
    return {};
  }
}

export function saveTokens(roomId: string, tokens: Record<string, TokenRecord>): void {
  writeStore("session", TOKENS_PREFIX + roomId, JSON.stringify(tokens));
}

export function clearTokens(roomId: string): void {
  writeStore("session", TOKENS_PREFIX + roomId, null);
}

export function excerptOf(body: string, file?: FileAttachment): string {
  const text = body.replace(/```[\s\S]*?```/g, "[code]").replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();
  if (text) return text.length > 120 ? `${text.slice(0, 117)}…` : text;
  if (file) return file.type.startsWith("image/") ? "Photo" : file.name;
  return "";
}
