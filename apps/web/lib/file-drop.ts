/**
 * Encrypted file drop engine.
 *
 * All files are treated as one logical byte stream, split into 1 MiB plaintext chunks.
 * Each chunk is sealed with AES-256-GCM (iv ‖ ciphertext ‖ tag, +28 bytes) with its
 * position bound as AAD, and uploaded on its own. File names, types, sizes and offsets
 * live in an encrypted manifest. The key stays in the link fragment (`#k=`).
 *
 * Files are read with Blob.slice, so at most a few chunks are in memory at once while
 * uploading. Downloads keep decrypted chunks as Blobs and stitch files together lazily.
 *
 * Downloads are counted by the server: POST /start spends one download and returns a
 * download token (valid for an hour). Chunk GETs need it, retries and resumes reuse it, and
 * /consume ends the session (the server deletes the drop after the last one).
 */
import {
  decryptChunk,
  decryptJson,
  deriveFileKeys,
  encryptChunk,
  encryptJson,
  generateKey,
  generateSalt,
  generateToken,
  hashToken,
} from "@protectedshare/crypto";
import {
  AUTH_TOKEN_HEADER,
  DOWNLOAD_TOKEN_HEADER,
  MANAGE_TOKEN_HEADER,
  MAX_DROP_CHUNKS,
  MAX_DROP_PLAINTEXT_BYTES,
  UPLOAD_TOKEN_HEADER,
  type CompleteDropResponse,
  type ConsumeDropResponse,
  type CreateDropRequest,
  type CreateDropResponse,
  type DropManifestResponse,
  type DropMetaResponse,
  type StartDropDownloadResponse,
} from "@protectedshare/contracts";
import { apiUrl } from "./api";

export const DROP_CHUNK_SIZE = 1_048_576;
/** 12-byte IV + 16-byte GCM tag added to every chunk. */
export const DROP_CHUNK_OVERHEAD = 28;
export const MAX_DROP_FILES = 100;
export const MAX_DROP_MESSAGE = 2_000;
export const DROP_CONCURRENCY = 3;
const MAX_RETRIES = 3;

export { MAX_DROP_PLAINTEXT_BYTES };

export type DropFileEntry = { name: string; type: string; size: number; offset: number };
export type DropManifest = { v: 1; files: DropFileEntry[]; message?: string; createdAt: number };

/* ───────────────────────── Errors ───────────────────────── */

export type DropErrorCode =
  | "not_found"
  | "wrong_key"
  | "missing_key"
  | "too_large"
  | "aborted"
  | "network"
  | "server"
  | "damaged"
  | "session_expired";

export class DropError extends Error {
  code: DropErrorCode;
  status?: number;
  constructor(code: DropErrorCode, message: string, status?: number) {
    super(message);
    this.name = "DropError";
    this.code = code;
    this.status = status;
  }
}

export function isAbort(error: unknown): boolean {
  return (
    (error instanceof DropError && error.code === "aborted") ||
    (error instanceof DOMException && error.name === "AbortError")
  );
}

function aborted(): DropError {
  return new DropError("aborted", "Stopped.");
}

async function readError(response: Response): Promise<{ message?: string; code?: string }> {
  try {
    const body = (await response.json()) as { error?: string; code?: string };
    return { message: body.error, code: body.code };
  } catch {
    return {};
  }
}

/**
 * The API always answers errors as JSON with a `code`. A response without one came from
 * something in between (a proxy, a restarting dev server, a gateway), so treat it as
 * transient and let the caller retry instead of declaring the drop gone or the key wrong.
 */
async function errorFromResponse(response: Response, fallback: string): Promise<DropError> {
  const { message, code } = await readError(response);
  if (!code) return new DropError("network", "The server didn't answer properly. Trying again usually fixes this.", response.status);
  if (code === "DOWNLOAD_TOKEN_REQUIRED" || code === "INVALID_DOWNLOAD_TOKEN") {
    return new DropError("session_expired", "This download's hour-long window closed before every piece arrived.", response.status);
  }
  if (response.status === 404) return new DropError("not_found", "This drop is gone. It expired, was revoked, or its downloads were used up.", 404);
  if (response.status === 401) return new DropError("wrong_key", "The key in this link doesn't match. Check that you copied the whole link.", 401);
  if (response.status === 413) return new DropError("too_large", message ?? "That's more than the server accepts.", 413);
  return new DropError("server", message ?? fallback, response.status);
}

/** Retry on network errors, non-API responses, 408, 429 and 5xx (incl. the proxy's 502). Everything else is final. */
function retryable(error: unknown): boolean {
  if (isAbort(error)) return false;
  if (error instanceof DropError) {
    if (error.code === "network") return true;
    if (error.code === "server") return !error.status || error.status === 408 || error.status === 429 || error.status >= 500;
    return false;
  }
  return true;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(aborted());
    const timer = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      window.clearTimeout(timer);
      reject(aborted());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function withRetries<T>(task: (attempt: number) => Promise<T>, signal?: AbortSignal): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await task(attempt);
    } catch (error) {
      if (signal?.aborted) throw aborted();
      if (attempt >= MAX_RETRIES || !retryable(error)) throw error;
      attempt += 1;
      // 400ms, 1.2s, 3.6s with a little jitter.
      await sleep(400 * 3 ** (attempt - 1) + Math.random() * 200, signal);
    }
  }
}

/** Run `worker` over `indices` with a fixed number of lanes. Stops at the first error. */
async function pool(indices: number[], lanes: number, worker: (index: number) => Promise<void>, signal?: AbortSignal) {
  const queue = [...indices];
  let failure: unknown = null;
  const lane = async () => {
    while (queue.length > 0 && failure === null) {
      if (signal?.aborted) throw aborted();
      const index = queue.shift()!;
      try {
        await worker(index);
      } catch (error) {
        failure ??= error;
        throw error;
      }
    }
  };
  const results = await Promise.allSettled(Array.from({ length: Math.min(lanes, indices.length) }, lane));
  if (failure !== null) throw failure;
  const rejected = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
  if (rejected) throw rejected.reason;
}

/* ───────────────────────── Sizes ───────────────────────── */

export function chunkCountFor(plainBytes: number): number {
  return Math.max(1, Math.ceil(plainBytes / DROP_CHUNK_SIZE));
}

/** Exact ciphertext size the server will store for this much plaintext. */
export function encryptedSizeFor(plainBytes: number): number {
  return plainBytes + chunkCountFor(plainBytes) * DROP_CHUNK_OVERHEAD;
}

/** Inverse of `encryptedSizeFor`, for showing the real total before the manifest is open. */
export function plainSizeFor(encryptedBytes: number, chunkCount: number): number {
  return Math.max(0, encryptedBytes - chunkCount * DROP_CHUNK_OVERHEAD);
}

export function formatSize(bytes: number): string {
  if (bytes < 1000) return `${bytes} B`;
  if (bytes < 1000 * 1000) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(bytes < 100 * 1024 * 1024 ? 1 : 0)} MB`;
}

/* ───────────────────────── Manifest ───────────────────────── */

export function buildManifest(files: readonly File[], message?: string, createdAt = Date.now()): DropManifest {
  let offset = 0;
  const entries = files.map((file) => {
    const entry = { name: file.name || "file", type: file.type || "application/octet-stream", size: file.size, offset };
    offset += file.size;
    return entry;
  });
  const trimmed = message?.trim();
  return { v: 1, files: entries, ...(trimmed ? { message: trimmed } : {}), createdAt };
}

function isManifest(value: unknown): value is DropManifest {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    v.v === 1 &&
    Array.isArray(v.files) &&
    v.files.every(
      (file) =>
        file &&
        typeof file === "object" &&
        typeof (file as DropFileEntry).name === "string" &&
        typeof (file as DropFileEntry).size === "number" &&
        typeof (file as DropFileEntry).offset === "number"
    )
  );
}

/* ───────────────────────── Sender ───────────────────────── */

export type DropSession = {
  key: string;
  salt: string;
  encKey: CryptoKey;
  authHash: string;
  manageToken: string;
  manageTokenHash: string;
};

/** Fresh key, salt and manage token for one drop. Cheap (HKDF only). */
export async function createDropSession(): Promise<DropSession> {
  const key = generateKey();
  const salt = generateSalt();
  const { encKey, authHash } = await deriveFileKeys(key, salt);
  const manageToken = generateToken();
  return { key, salt, encKey, authHash, manageToken, manageTokenHash: await hashToken(manageToken) };
}

export type DropOptions = { message?: string; maxDownloads: number; /** epoch seconds */ expiresAt: number };

/** The exact JSON body for POST /api/drops. */
export async function buildCreateBody(session: DropSession, files: readonly File[], options: DropOptions): Promise<CreateDropRequest> {
  const plainBytes = files.reduce((sum, file) => sum + file.size, 0);
  const manifest = await encryptJson(session.encKey, buildManifest(files, options.message));
  return {
    manifest,
    salt: session.salt,
    authHash: session.authHash,
    manageTokenHash: session.manageTokenHash,
    totalBytes: encryptedSizeFor(plainBytes),
    chunkCount: chunkCountFor(plainBytes),
    maxDownloads: options.maxDownloads,
    expiresAt: options.expiresAt,
  };
}

/** Plaintext bytes of chunk `index` from the logical concatenation of `files`. */
function sliceStream(files: readonly File[], index: number): Blob {
  const start = index * DROP_CHUNK_SIZE;
  const end = start + DROP_CHUNK_SIZE;
  const parts: Blob[] = [];
  let offset = 0;
  for (const file of files) {
    const fileStart = offset;
    const fileEnd = offset + file.size;
    offset = fileEnd;
    if (fileEnd <= start || fileStart >= end) continue;
    parts.push(file.slice(Math.max(start, fileStart) - fileStart, Math.min(end, fileEnd) - fileStart));
  }
  return new Blob(parts);
}

function putChunk(
  url: string,
  uploadToken: string,
  body: Uint8Array,
  onBytes: (sent: number) => void,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(aborted());
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");
    xhr.setRequestHeader(UPLOAD_TOKEN_HEADER, uploadToken);
    xhr.upload.onprogress = (event) => onBytes(event.loaded);
    const cleanup = () => signal?.removeEventListener("abort", onAbort);
    const onAbort = () => xhr.abort();
    signal?.addEventListener("abort", onAbort, { once: true });
    xhr.onload = () => {
      cleanup();
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message: string | undefined;
      let code: string | undefined;
      try {
        ({ error: message, code } = JSON.parse(xhr.responseText) as { error?: string; code?: string });
      } catch {
        // not JSON
      }
      // No API error code: an intermediary failed (proxy 502, dev server 404). Retry.
      if (!code) return reject(new DropError("network", `The upload hit a hiccup (${xhr.status}).`, xhr.status));
      if (xhr.status === 413) return reject(new DropError("too_large", message ?? "A chunk was too large for the server.", 413));
      if (xhr.status === 404) return reject(new DropError("not_found", "The upload expired on the server. Start again.", 404));
      reject(new DropError("server", message ?? `Upload failed (${xhr.status}).`, xhr.status));
    };
    xhr.onerror = () => {
      cleanup();
      reject(new DropError("network", "The connection dropped while uploading."));
    };
    xhr.onabort = () => {
      cleanup();
      reject(aborted());
    };
    xhr.send(new Blob([new Uint8Array(body)]));
  });
}

export type TransferProgress = {
  /** Ciphertext bytes moved so far. */
  done: number;
  total: number;
  chunksDone: number;
  chunkCount: number;
};

/** Upload state that survives a failed attempt, so "Try again" only sends what's missing. */
export type UploadState = {
  id?: string;
  uploadToken?: string;
  body: CreateDropRequest;
  uploaded: Set<number>;
  completed?: boolean;
};

export function newUploadState(body: CreateDropRequest): UploadState {
  return { body, uploaded: new Set() };
}

/**
 * Create the drop (once), upload missing chunks (3 at a time, each retried up to 3 times),
 * then seal it with /complete. Safe to call again with the same state after a failure.
 */
export async function uploadDrop(
  session: DropSession,
  files: readonly File[],
  state: UploadState,
  options: { signal?: AbortSignal; onProgress?: (progress: TransferProgress) => void } = {}
): Promise<{ id: string }> {
  const { signal, onProgress } = options;
  const { body } = state;
  const total = body.totalBytes;
  const chunkCount = body.chunkCount;

  if (!state.id || !state.uploadToken) {
    const created = await withRetries(async () => {
      let response: Response;
      try {
        response = await fetch(apiUrl("/api/drops"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal,
        });
      } catch (error) {
        if (isAbort(error) || signal?.aborted) throw aborted();
        throw new DropError("network", "Couldn't reach the server.");
      }
      if (!response.ok) throw await errorFromResponse(response, "The server didn't accept this drop.");
      return (await response.json()) as CreateDropResponse;
    }, signal);
    state.id = created.id;
    state.uploadToken = created.uploadToken;
  }
  const id = state.id;
  const uploadToken = state.uploadToken!;

  const sizeOf = (index: number) => {
    const plain = Math.min(DROP_CHUNK_SIZE, Math.max(0, total - chunkCount * DROP_CHUNK_OVERHEAD - index * DROP_CHUNK_SIZE));
    return plain + DROP_CHUNK_OVERHEAD;
  };
  const inFlight = new Map<number, number>();
  const report = () => {
    let done = 0;
    for (const index of state.uploaded) done += sizeOf(index);
    for (const sent of inFlight.values()) done += sent;
    onProgress?.({ done: Math.min(done, total), total, chunksDone: state.uploaded.size, chunkCount });
  };
  report();

  const pending = Array.from({ length: chunkCount }, (_, index) => index).filter((index) => !state.uploaded.has(index));
  await pool(
    pending,
    DROP_CONCURRENCY,
    async (index) => {
      const plain = new Uint8Array(await sliceStream(files, index).arrayBuffer());
      const sealed = await encryptChunk(session.encKey, plain, index, chunkCount);
      await withRetries(async () => {
        inFlight.set(index, 0);
        report();
        try {
          await putChunk(
            apiUrl(`/api/drops/${id}/chunks/${index}`),
            uploadToken,
            sealed,
            (sent) => {
              inFlight.set(index, Math.min(sent, sealed.byteLength));
              report();
            },
            signal
          );
        } finally {
          inFlight.delete(index);
        }
      }, signal);
      state.uploaded.add(index);
      report();
    },
    signal
  );

  if (!state.completed) {
    await withRetries(async () => {
      let response: Response;
      try {
        response = await fetch(apiUrl(`/api/drops/${id}/complete`), {
          method: "POST",
          headers: { [UPLOAD_TOKEN_HEADER]: uploadToken },
          signal,
        });
      } catch {
        if (signal?.aborted) throw aborted();
        throw new DropError("network", "Couldn't reach the server to finish the upload.");
      }
      if (response.status === 409) {
        const { code } = await readError(response);
        if (code === "DROP_ALREADY_COMPLETE") return;
        // Missing chunks: forget what we think we sent so a retry re-sends everything.
        state.uploaded.clear();
        throw new DropError("server", "The server is missing part of the upload. Try again.", 409);
      }
      if (!response.ok) throw await errorFromResponse(response, "Couldn't finish the upload.");
      (await response.json()) as CompleteDropResponse;
    }, signal);
    state.completed = true;
  }

  return { id };
}

/** Best-effort delete of a drop this browser created (used when an upload is cancelled). */
export async function revokeDrop(id: string, manageToken: string): Promise<void> {
  try {
    await fetch(apiUrl(`/api/manage/drop/${id}`), { method: "DELETE", headers: { [MANAGE_TOKEN_HEADER]: manageToken } });
  } catch {
    // The incomplete drop is never readable and is purged at expiry anyway.
  }
}

/* ───────────────────────── Recipient ───────────────────────── */

export async function fetchDropMeta(id: string, signal?: AbortSignal): Promise<DropMetaResponse> {
  return withRetries(() => fetchDropMetaOnce(id, signal), signal);
}

async function fetchDropMetaOnce(id: string, signal?: AbortSignal): Promise<DropMetaResponse> {
  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/drops/${encodeURIComponent(id)}/meta`), { cache: "no-store", signal });
  } catch {
    if (signal?.aborted) throw aborted();
    throw new DropError("network", "Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) throw await errorFromResponse(response, "Couldn't load this drop.");
  return (await response.json()) as DropMetaResponse;
}

export type OpenedDrop = {
  meta: DropMetaResponse;
  encKey: CryptoKey;
  authToken: string;
  manifest: DropManifest;
};

/** Derive keys from `#k=`, fetch and decrypt the manifest. Does not use up a download. */
export async function openDrop(id: string, key: string, meta: DropMetaResponse, signal?: AbortSignal): Promise<OpenedDrop> {
  let keys: Awaited<ReturnType<typeof deriveFileKeys>>;
  try {
    keys = await deriveFileKeys(key, meta.salt);
  } catch (error) {
    throw new DropError("missing_key", error instanceof Error ? error.message : "This link's key is incomplete.");
  }
  const body = await withRetries(async () => {
    let response: Response;
    try {
      response = await fetch(apiUrl(`/api/drops/${encodeURIComponent(id)}/manifest`), {
        headers: { [AUTH_TOKEN_HEADER]: keys.authToken },
        cache: "no-store",
        signal,
      });
    } catch {
      if (signal?.aborted) throw aborted();
      throw new DropError("network", "Couldn't reach the server. Check your connection and try again.");
    }
    if (!response.ok) throw await errorFromResponse(response, "Couldn't open this drop.");
    return (await response.json()) as DropManifestResponse;
  }, signal);
  let manifest: unknown;
  try {
    manifest = await decryptJson(keys.encKey, body.manifest);
  } catch {
    throw new DropError("wrong_key", "This key can't open the drop. Check that you copied the whole link.");
  }
  if (!isManifest(manifest)) throw new DropError("damaged", "The file list in this drop is damaged.");
  return { meta, encKey: keys.encKey, authToken: keys.authToken, manifest };
}

/** The server-side download session opened by POST /start. */
export type DownloadSession = {
  token: string;
  /** Downloads left on the link after this one. */
  downloadsRemaining: number;
  /** Epoch seconds. */
  expiresAt: number;
};

/**
 * Decrypted chunks and the download session, kept between attempts so a retry or a resume
 * only fetches what's missing and doesn't start (and pay for) a second download.
 */
export type DownloadState = { chunks: (Blob | undefined)[]; session?: DownloadSession };

export function newDownloadState(chunkCount: number): DownloadState {
  return { chunks: new Array<Blob | undefined>(Math.min(chunkCount, MAX_DROP_CHUNKS)).fill(undefined) };
}

/** A session is reused while it has at least a minute left. */
export function hasLiveSession(state: DownloadState | null | undefined): state is DownloadState & { session: DownloadSession } {
  return Boolean(state?.session && state.session.expiresAt * 1000 > Date.now() + 60_000);
}

/**
 * Spend one download and open a download session. Deliberately not retried automatically:
 * a lost response could otherwise count twice.
 */
export async function startDownload(id: string, authToken: string, signal?: AbortSignal): Promise<DownloadSession> {
  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/drops/${encodeURIComponent(id)}/start`), {
      method: "POST",
      headers: { [AUTH_TOKEN_HEADER]: authToken },
      cache: "no-store",
      signal,
    });
  } catch {
    if (signal?.aborted) throw aborted();
    throw new DropError("network", "Couldn't reach the server to start the download.");
  }
  if (!response.ok) throw await errorFromResponse(response, "Couldn't start the download.");
  const body = (await response.json()) as StartDropDownloadResponse;
  return { token: body.downloadToken, downloadsRemaining: body.downloadsRemaining, expiresAt: body.expiresAt };
}

async function fetchChunk(
  id: string,
  index: number,
  authToken: string,
  downloadToken: string,
  onBytes: (received: number) => void,
  signal?: AbortSignal
): Promise<Uint8Array> {
  let response: Response;
  try {
    response = await fetch(apiUrl(`/api/drops/${encodeURIComponent(id)}/chunks/${index}`), {
      headers: { [AUTH_TOKEN_HEADER]: authToken, [DOWNLOAD_TOKEN_HEADER]: downloadToken },
      cache: "no-store",
      signal,
    });
  } catch {
    if (signal?.aborted) throw aborted();
    throw new DropError("network", "The connection dropped while downloading.");
  }
  if (!response.ok) throw await errorFromResponse(response, "Couldn't download part of this drop.");
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    onBytes(bytes.byteLength);
    return bytes;
  }
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      received += value.byteLength;
      onBytes(received);
    }
  } catch {
    if (signal?.aborted) throw aborted();
    throw new DropError("network", "The connection dropped while downloading.");
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}

/**
 * Fetch and decrypt every missing chunk (3 at a time, each retried up to 3 times). Starts the
 * download on the server first (spending one) unless `state` already holds a live session.
 */
export async function downloadChunks(
  id: string,
  opened: OpenedDrop,
  state: DownloadState,
  options: {
    signal?: AbortSignal;
    onProgress?: (progress: TransferProgress) => void;
    /** Called once the server has counted this download. */
    onSession?: (session: DownloadSession) => void;
  } = {}
): Promise<void> {
  const { signal, onProgress, onSession } = options;
  if (!hasLiveSession(state)) {
    state.session = await startDownload(id, opened.authToken, signal);
    onSession?.(state.session);
  }
  const downloadToken = state.session!.token;
  const { chunkCount, totalBytes } = opened.meta;
  const plainTotal = plainSizeFor(totalBytes, chunkCount);
  const sizeOf = (index: number) =>
    Math.min(DROP_CHUNK_SIZE, Math.max(0, plainTotal - index * DROP_CHUNK_SIZE)) + DROP_CHUNK_OVERHEAD;
  const inFlight = new Map<number, number>();
  const report = () => {
    let done = 0;
    let chunksDone = 0;
    state.chunks.forEach((chunk, index) => {
      if (chunk) {
        done += sizeOf(index);
        chunksDone += 1;
      }
    });
    for (const received of inFlight.values()) done += received;
    onProgress?.({ done: Math.min(done, totalBytes), total: totalBytes, chunksDone, chunkCount });
  };
  report();

  const pending = state.chunks.map((chunk, index) => (chunk ? -1 : index)).filter((index) => index >= 0);
  await pool(
    pending,
    DROP_CONCURRENCY,
    async (index) => {
      const sealed = await withRetries(async () => {
        inFlight.set(index, 0);
        try {
          return await fetchChunk(
            id,
            index,
            opened.authToken,
            downloadToken,
            (received) => {
              inFlight.set(index, received);
              report();
            },
            signal
          );
        } finally {
          inFlight.delete(index);
        }
      }, signal).catch((error: unknown) => {
        // The session ended: forget it, so the next attempt starts (and counts) a new download.
        if (error instanceof DropError && error.code === "session_expired") state.session = undefined;
        throw error;
      });
      let plain: Uint8Array;
      try {
        plain = await decryptChunk(opened.encKey, sealed, index, chunkCount);
      } catch {
        throw new DropError("damaged", "Part of this drop didn't decrypt. It may have been changed on the server.");
      }
      state.chunks[index] = new Blob([new Uint8Array(plain)]);
      report();
    },
    signal
  );
}

/**
 * Finish the download session (POST /consume). The download was already counted by /start;
 * this lets the server delete the drop right away when it was the last one.
 */
export async function finishDownload(id: string, downloadToken: string): Promise<ConsumeDropResponse> {
  return withRetries(async () => {
    let response: Response;
    try {
      response = await fetch(apiUrl(`/api/drops/${encodeURIComponent(id)}/consume`), {
        method: "POST",
        headers: { [DOWNLOAD_TOKEN_HEADER]: downloadToken },
      });
    } catch {
      throw new DropError("network", "Couldn't reach the server.");
    }
    if (!response.ok) throw await errorFromResponse(response, "Couldn't tell the server the download finished.");
    return (await response.json()) as ConsumeDropResponse;
  });
}

export type DecryptedFile = DropFileEntry & {
  /** Always application/octet-stream: the sender's claimed type is never trusted for saving. */
  blob: Blob;
  /** Set only when the bytes really are a PNG, JPEG, GIF or WebP image (sniffed, not claimed). */
  preview?: { type: PreviewImageType; blob: Blob };
};

const OCTET_STREAM = "application/octet-stream";

/** Stitch files back together from decrypted chunks. Lazy Blob slices, no big copies. */
export function assembleFiles(manifest: DropManifest, state: DownloadState): DecryptedFile[] {
  return manifest.files.map((file) => {
    const parts: Blob[] = [];
    const start = file.offset;
    const end = file.offset + file.size;
    for (let index = Math.floor(start / DROP_CHUNK_SIZE); index * DROP_CHUNK_SIZE < end; index += 1) {
      const chunk = state.chunks[index];
      if (!chunk) throw new DropError("damaged", "A part of this drop is missing.");
      const chunkStart = index * DROP_CHUNK_SIZE;
      parts.push(chunk.slice(Math.max(start, chunkStart) - chunkStart, Math.min(end, chunkStart + DROP_CHUNK_SIZE) - chunkStart));
    }
    const blob = new Blob(parts, { type: OCTET_STREAM });
    return { ...file, blob };
  });
}

export type PreviewImageType = "image/png" | "image/jpeg" | "image/gif" | "image/webp";

/** Identify a raster image from its first bytes. Never SVG, HTML or anything that can run script. */
export async function sniffImageType(blob: Blob): Promise<PreviewImageType | null> {
  if (blob.size < 12) return null;
  const head = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const at = (offset: number, bytes: number[]) => bytes.every((byte, index) => head[offset + index] === byte);
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (at(0, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (at(0, [0x47, 0x49, 0x46, 0x38]) && (head[4] === 0x37 || head[4] === 0x39) && head[5] === 0x61) return "image/gif";
  if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) return "image/webp";
  return null;
}

/** Attach a typed preview blob to files whose bytes are a safe raster image. */
export async function withPreviews(files: DecryptedFile[]): Promise<DecryptedFile[]> {
  return Promise.all(
    files.map(async (file) => {
      const type = await sniffImageType(file.blob).catch(() => null);
      return type ? { ...file, preview: { type, blob: file.blob.slice(0, file.blob.size, type) } } : file;
    })
  );
}

/** Trigger a browser download for a blob. Always saved as application/octet-stream. */
export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob.type === OCTET_STREAM ? blob : blob.slice(0, blob.size, OCTET_STREAM));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = safeFileName(name);
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Names come from the sender. Strip path separators and control characters. */
export function safeFileName(name: string): string {
  // eslint-disable-next-line no-control-regex
  const clean = name.replace(/[\u0000-\u001f\u007f/\\]/g, "_").replace(/^\.+/, "").trim();
  return clean.slice(0, 200) || "file";
}

/**
 * Image types the browser may preview as <img>: PNG, JPEG, GIF and WebP only. SVG is excluded
 * (it can carry script when opened directly). For received files, pass the sniffed type.
 */
export function isPreviewableImage(type: string): boolean {
  return /^image\/(png|jpe?g|gif|webp)$/i.test(type);
}
