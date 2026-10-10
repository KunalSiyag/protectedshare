import {
  decryptJson,
  deriveRespondToken,
  encryptJson,
  fromBase64Url,
  importRawKey,
  publicKeyFingerprint,
  toBase64Url,
  type EncryptedJson,
} from "@protectedshare/crypto";
import type { PublicRequestResponse } from "@protectedshare/contracts";
import { apiUrl } from "../../lib/api";
import { readApiError } from "../../lib/feedback";

/** What the requester writes. Encrypted with the label key that rides in the sender link (#k=). */
export type RequestLabel = { title: string; note: string };

/**
 * The encrypted label as stored. Always sent by current requesters, even with no title:
 * `pk` is the SHA-256 fingerprint of the request's public key, so the sender can check the
 * server didn't swap in a different key. Only a holder of `#k=` could have written it.
 */
type LabelPayload = { title?: string; note?: string; pk: string };

/** Encrypt title, note and the public key fingerprint with the link key. */
export async function sealLabel(labelKey: string, label: RequestLabel | null, publicKey: string): Promise<EncryptedJson> {
  const payload: LabelPayload = {
    ...(label?.title ? { title: label.title } : {}),
    ...(label?.note ? { note: label.note } : {}),
    pk: await publicKeyFingerprint(publicKey),
  };
  return encryptJson(await importRawKey(labelKey), payload);
}

/** What the sender's browser seals to the requester's public key. */
export type RequestAnswer = { text: string; sentAt: number };

export const TITLE_MAX = 120;
export const NOTE_MAX = 600;
/** Plaintext cap for an answer. The sealed body stays under the API's 200 KB limit. */
export const ANSWER_MAX_BYTES = 100 * 1024;
/** The API caps the encrypted label at 4,000 base64url characters. */
export const LABEL_BLOB_MAX = 4_000;

export const POLL_MS = 8_000;

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
}

export function senderPath(id: string): string {
  return `/request/${encodeURIComponent(id)}`;
}

export function inboxPath(id: string): string {
  return `/request/${encodeURIComponent(id)}/inbox`;
}

export type PublicRequestResult =
  | { status: "ok"; request: PublicRequestResponse }
  | { status: "gone" }
  | { status: "error"; message: string };

/** GET /api/requests/:id. Public: carries the requester's public key and the encrypted label. */
export async function fetchPublicRequest(id: string, signal?: AbortSignal): Promise<PublicRequestResult> {
  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/requests/${encodeURIComponent(id)}`), { cache: "no-store", signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return { status: "error", message: "Could not reach the server. Check your connection and try again." };
  }
  if (response.status === 404) return { status: "gone" };
  if (!response.ok) {
    return { status: "error", message: await readApiError(response, "Could not load this request. Try again in a moment.") };
  }
  return { status: "ok", request: (await response.json()) as PublicRequestResponse };
}

export type LabelState =
  | { status: "none" }
  | { status: "missing-key" }
  | { status: "unreadable" }
  | { status: "ok"; label: RequestLabel; pk: string | null };

/** Decrypt the request label with the key from the link. Never throws. */
export async function openLabel(label: EncryptedJson | null, key: string | undefined): Promise<LabelState> {
  if (!label) return { status: "none" };
  if (!key) return { status: "missing-key" };
  try {
    const value = await decryptJson<Partial<LabelPayload>>(await importRawKey(key), label);
    const title = typeof value?.title === "string" ? value.title.slice(0, TITLE_MAX) : "";
    const note = typeof value?.note === "string" ? value.note.slice(0, NOTE_MAX * 2) : "";
    const pk = typeof value?.pk === "string" ? value.pk : null;
    return { status: "ok", label: { title, note }, pk };
  } catch {
    return { status: "unreadable" };
  }
}

/** True when the label carries a title or a note worth showing. */
export function hasLabelText(label: LabelState): label is { status: "ok"; label: RequestLabel; pk: string | null } {
  return label.status === "ok" && Boolean(label.label.title || label.label.note);
}

export type SenderCheck =
  | { status: "ok"; label: RequestLabel; respondToken: string }
  /** No `#k=` in the link: can't answer. */
  | { status: "missing-key" }
  /** `#k=` doesn't open the label: cut off or changed. Can't answer. */
  | { status: "unreadable" }
  /** No label, no fingerprint, or a fingerprint that doesn't match the public key the server sent. */
  | { status: "tampered" };

/**
 * Everything the sender's browser checks before it lets anyone answer: the link key opens
 * the label, and the public key fingerprint inside it matches the public key the server
 * handed over. Only then does it derive the respond token the server asks for.
 */
export async function checkRequestForSender(request: PublicRequestResponse, key: string | undefined): Promise<SenderCheck> {
  if (!key) return { status: "missing-key" };
  if (!request.label) return { status: "tampered" };
  const opened = await openLabel(request.label, key);
  if (opened.status === "missing-key") return { status: "missing-key" };
  if (opened.status !== "ok") return { status: "unreadable" };
  let expected: string;
  try {
    expected = await publicKeyFingerprint(request.publicKey);
  } catch {
    return { status: "tampered" };
  }
  if (!opened.pk || opened.pk !== expected) return { status: "tampered" };
  try {
    const { respondToken } = await deriveRespondToken(key);
    return { status: "ok", label: opened.label, respondToken };
  } catch {
    return { status: "unreadable" };
  }
}

/**
 * Recompute the raw public key from a PKCS#8 private key. Lets the inbox check that its key
 * belongs to this request without a server round trip (and without burning anything).
 */
export async function publicKeyFromPrivate(privateKey: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    new Uint8Array(fromBase64Url(privateKey)).buffer,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  const jwk = await crypto.subtle.exportKey("jwk", key);
  if (!jwk.x || !jwk.y) throw new Error("Not a P-256 key.");
  const x = fromBase64Url(jwk.x);
  const y = fromBase64Url(jwk.y);
  const raw = new Uint8Array(1 + x.length + y.length);
  raw[0] = 0x04;
  raw.set(x, 1);
  raw.set(y, 1 + x.length);
  return toBase64Url(raw);
}

/** Parse what the sender sealed. Older or hand-made payloads may be plain text. */
export function parseAnswer(plaintext: string): RequestAnswer {
  try {
    const value: unknown = JSON.parse(plaintext);
    if (value && typeof value === "object" && typeof (value as RequestAnswer).text === "string") {
      const sentAt = (value as RequestAnswer).sentAt;
      return { text: (value as RequestAnswer).text, sentAt: typeof sentAt === "number" ? sentAt : 0 };
    }
  } catch {
    // Not JSON: treat as text.
  }
  return { text: plaintext, sentAt: 0 };
}

/** "in 3 hours", "in 2 days" from an epoch-seconds expiry. */
export function formatRelativeExpiry(expiresAtSeconds: number, now = Date.now()): string {
  const diff = expiresAtSeconds * 1000 - now;
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const minutes = Math.round(diff / 60_000);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(diff / 3_600_000);
  if (Math.abs(hours) < 48) return formatter.format(hours, "hour");
  return formatter.format(Math.round(diff / 86_400_000), "day");
}

export function formatTime(epochMs: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(epochMs);
}
