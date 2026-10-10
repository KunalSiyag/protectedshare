import {
  decrypt,
  deriveAuthToken,
  derivePasswordProof,
  encrypt,
  openText,
  sealText,
  type EncryptedPayload,
  type KdfMode,
  type SealedV2,
  type SecretInput,
} from "@protectedshare/crypto";

type WorkerResult = {
  id: number;
  ok: boolean;
  error?: string;
  payload?: EncryptedPayload;
  passwordProof?: string;
  plaintext?: string;
  sealed?: SealedTextResult;
  authToken?: string;
};

export type SealedTextResult = { payload: SealedV2; authToken: string; authHash: string };

type Pending = {
  resolve: (result: WorkerResult) => void;
  reject: (error: Error) => void;
};

let worker: Worker | null = null;
let workerBroken = false;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker | null {
  if (workerBroken || typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (worker) return worker;

  try {
    worker = new Worker(new URL("./crypto.worker.ts", import.meta.url));
    worker.onmessage = (event: MessageEvent<WorkerResult>) => {
      const waiter = pending.get(event.data.id);
      if (!waiter) return;
      pending.delete(event.data.id);
      waiter.resolve(event.data);
    };
    worker.onerror = () => {
      workerBroken = true;
      worker?.terminate();
      worker = null;
      for (const waiter of pending.values()) {
        waiter.reject(new Error("WORKER_UNAVAILABLE"));
      }
      pending.clear();
    };
    return worker;
  } catch {
    workerBroken = true;
    return null;
  }
}

function ask(body: Record<string, unknown>): Promise<WorkerResult> {
  const thread = getWorker();
  if (!thread) return Promise.reject(new Error("WORKER_UNAVAILABLE"));

  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    thread.postMessage({ ...body, id });
  });
}

function unwrap(result: WorkerResult): WorkerResult {
  if (!result.ok) {
    throw new Error(result.error || "Encryption failed.");
  }
  return result;
}

export async function sealForShare(plaintext: string, password: string): Promise<{ payload: EncryptedPayload; passwordProof: string }> {
  try {
    const result = unwrap(await ask({ op: "seal", plaintext, password }));
    if (!result.payload || !result.passwordProof) {
      throw new Error("Encryption failed.");
    }
    return { payload: result.payload, passwordProof: result.passwordProof };
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "WORKER_UNAVAILABLE") throw error;
    return {
      payload: await encrypt(plaintext, password),
      passwordProof: await derivePasswordProof(password),
    };
  }
}

export async function proofForShare(password: string): Promise<string> {
  try {
    const result = unwrap(await ask({ op: "proof", password }));
    if (!result.passwordProof) throw new Error("Could not prepare the password check.");
    return result.passwordProof;
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "WORKER_UNAVAILABLE") throw error;
    return derivePasswordProof(password);
  }
}

export async function decryptForShare(password: string, encryptedBlob: string, iv: string, salt: string): Promise<string> {
  try {
    const result = unwrap(await ask({ op: "decrypt", password, encryptedBlob, iv, salt }));
    if (typeof result.plaintext !== "string") throw new Error("Could not decrypt this secret.");
    return result.plaintext;
  } catch (error) {
    if (!(error instanceof Error) || error.message !== "WORKER_UNAVAILABLE") throw error;
    return decrypt(encryptedBlob, password, iv, salt);
  }
}

function isWorkerMissing(error: unknown): boolean {
  return error instanceof Error && error.message === "WORKER_UNAVAILABLE";
}

/** v2: seal text with a link key, a password, or both. Runs off the main thread when it can. */
export async function sealTextTask(plaintext: string, secret: SecretInput): Promise<SealedTextResult> {
  try {
    const result = unwrap(await ask({ op: "sealV2", plaintext, secret }));
    if (!result.sealed) throw new Error("Encryption failed.");
    return result.sealed;
  } catch (error) {
    if (!isWorkerMissing(error)) throw error;
    return sealText(plaintext, secret);
  }
}

/** v2: open a sealed payload. */
export async function openTextTask(payload: SealedV2, secret: SecretInput): Promise<string> {
  try {
    const result = unwrap(await ask({ op: "openV2", payload, secret }));
    if (typeof result.plaintext !== "string") throw new Error("Could not decrypt this secret.");
    return result.plaintext;
  } catch (error) {
    if (!isWorkerMissing(error)) throw error;
    return openText(payload, secret);
  }
}

/** v2: recompute the retrieval token from the salt and kdf reported by a `/meta` endpoint. */
export async function authTokenTask(secret: SecretInput, salt: string, kdf: KdfMode): Promise<string> {
  try {
    const result = unwrap(await ask({ op: "authV2", secret, salt, kdf }));
    if (!result.authToken) throw new Error("Could not prepare the key check.");
    return result.authToken;
  } catch (error) {
    if (!isWorkerMissing(error)) throw error;
    return deriveAuthToken(secret, salt, kdf);
  }
}
