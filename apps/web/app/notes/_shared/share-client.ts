/**
 * Small API layer shared by Secure Note and EnvShare (composer + reader).
 * Everything that touches a key or password happens in the caller; this file only moves
 * ciphertext, hashes and tokens.
 */
import type {
  AUTH_TOKEN_HEADER as ContractAuthTokenHeader,
  CreateNoteResponse,
  GetNoteResponse,
  GetNoteV2Response,
  GetSecretResponse,
  GetSecretV2Response,
  KdfMode,
  ShareMetaResponse,
} from "@protectedshare/contracts";
import { apiUrl } from "../../../lib/api";

/**
 * The contract's header name, without a runtime import: importing a value from
 * @protectedshare/contracts loads its zod schemas into every page that uses this file.
 * The type annotation fails the build if the contract's value ever changes.
 */
const AUTH_TOKEN_HEADER: typeof ContractAuthTokenHeader = "X-Auth-Token";

export type ShareKind = "note" | "secret";

export type ShareErrorCode = "not_found" | "auth" | "network" | "rate" | "too_large" | "server";

export class ShareError extends Error {
  code: ShareErrorCode;
  constructor(code: ShareErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const ROOT: Record<ShareKind, string> = { note: "/api/notes", secret: "/api/secrets" };

async function serverMessage(response: Response): Promise<string | null> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string") {
      return (data as { error: string }).error;
    }
  } catch {
    // not JSON
  }
  return null;
}

/** Seconds to wait from a Retry-After header (delta-seconds or an HTTP date), or null. */
function retryAfterSeconds(response: Response): number | null {
  const value = response.headers.get("Retry-After")?.trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value);
  const at = Date.parse(value);
  return Number.isNaN(at) ? null : Math.max(0, (at - Date.now()) / 1000);
}

/** Rounded up to whole minutes, so the wait is never shorter than we say. */
function describeWait(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "a minute" : `${minutes} minutes`;
}

/**
 * 429: the server's reason (its first sentence) and how long to wait from Retry-After, e.g.
 * "Too many wrong attempts on this link. Try again in 10 minutes." after a password lockout.
 */
async function rateLimitError(response: Response): Promise<ShareError> {
  const message = (await serverMessage(response))?.trim();
  const reason = message ? (message.match(/^[^.!?]*[.!?]/)?.[0] ?? `${message}.`) : "Too many tries.";
  const wait = retryAfterSeconds(response);
  return new ShareError("rate", `${reason} ${wait === null ? "Wait a minute, then try again." : `Try again in ${describeWait(wait)}.`}`);
}

async function toError(response: Response, fallback: string): Promise<ShareError> {
  if (response.status === 404) return new ShareError("not_found", "Not found.");
  if (response.status === 401) return new ShareError("auth", "Wrong key or password.");
  if (response.status === 429) return rateLimitError(response);
  if (response.status === 413) return new ShareError("too_large", "That's too large to store. Shorten it and try again.");
  return new ShareError("server", (await serverMessage(response)) ?? fallback);
}

async function request(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(apiUrl(input), { cache: "no-store", ...init });
  } catch {
    throw new ShareError("network", "Couldn't reach the server. Check your connection and try again.");
  }
}

export function describeError(error: unknown, fallback: string): string {
  if (error instanceof ShareError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/* ───────────── Create ───────────── */

/** Loads the crypto package on demand, so composers don't ship it with the page. */
export async function createManageToken(): Promise<{ token: string; hash: string }> {
  const { generateToken, hashToken } = await import("@protectedshare/crypto");
  const token = generateToken();
  return { token, hash: await hashToken(token) };
}

export async function createShare(kind: ShareKind, body: object): Promise<string> {
  const response = await request(ROOT[kind], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await toError(response, "Couldn't save this. Nothing was stored. Try again.");
  const data = (await response.json()) as CreateNoteResponse;
  return data.id;
}

/* ───────────── Read ───────────── */

export async function fetchShareMeta(kind: ShareKind, id: string): Promise<ShareMetaResponse> {
  const response = await request(`${ROOT[kind]}/${encodeURIComponent(id)}/meta`);
  if (!response.ok) throw await toError(response, "Couldn't load this link. Try again in a moment.");
  return (await response.json()) as ShareMetaResponse;
}

export type OpenedV2 = GetNoteV2Response | GetSecretV2Response;
export type OpenedV1 = GetNoteResponse | GetSecretResponse;

/** v2: consumes a read (or burns the note) on success. */
export async function fetchShareV2(kind: ShareKind, id: string, authToken: string): Promise<OpenedV2> {
  const response = await request(`${ROOT[kind]}/${encodeURIComponent(id)}`, {
    headers: { [AUTH_TOKEN_HEADER]: authToken },
  });
  if (!response.ok) throw await toError(response, "Couldn't open this link. Try again in a moment.");
  return (await response.json()) as OpenedV2;
}

/** Legacy v1 links: password proof in the query string. */
export async function fetchShareV1(kind: ShareKind, id: string, proof: string): Promise<OpenedV1> {
  const response = await request(`${ROOT[kind]}/${encodeURIComponent(id)}?proof=${encodeURIComponent(proof)}`);
  if (!response.ok) throw await toError(response, "Couldn't open this link. Try again in a moment.");
  return (await response.json()) as OpenedV1;
}

/* ───────────── Server-view estimates ───────────── */

const utf8 = new TextEncoder();

/** Length of the base64url ciphertext for this plaintext (AES-GCM adds a 16-byte tag). */
export function estimateCipherChars(text: string): number {
  return Math.ceil(((utf8.encode(text).length + 16) * 4) / 3);
}

/**
 * A stand-in payload with the right shape and honest lengths, for when sealing would mean
 * running 600,000 PBKDF2 rounds on every keystroke.
 */
export function estimatedPayload(text: string, kdf: KdfMode) {
  return {
    v: 2 as const,
    kdf,
    encryptedBlob: `‹${estimateCipherChars(text).toLocaleString()} chars when sealed›`,
    iv: "‹16 chars, random›",
    salt: "‹22 chars, random›",
  };
}

export const ESTIMATED_AUTH_HASH = "‹43 chars, from your secret›";

export function toEpochSeconds(ms: number): number {
  return Math.floor(ms / 1000);
}
