import { decrypt, derivePasswordProof, encrypt, type EncryptedPayload } from "@protectedshare/crypto";

type WorkerResult = {
  id: number;
  ok: boolean;
  error?: string;
  payload?: EncryptedPayload;
  passwordProof?: string;
  plaintext?: string;
};

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
