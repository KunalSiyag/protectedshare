import { armorText, dearmorText } from "@protectedshare/crypto";

/**
 * Runs the 600,000-iteration PBKDF2 in a worker so the page stays responsive.
 * Falls back to the main thread when workers are unavailable (or the worker script can't load).
 */
type Reply = { id: number; ok: boolean; text?: string; error?: string };

let worker: Worker | null = null;
let broken = false;
let nextId = 1;
const pending = new Map<number, { resolve: (reply: Reply) => void; reject: (error: Error) => void }>();

const MISSING = "WORKER_UNAVAILABLE";

function getWorker(): Worker | null {
  if (broken || typeof window === "undefined" || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./armor.worker.ts", import.meta.url));
    worker.onmessage = (event: MessageEvent<Reply>) => {
      const waiter = pending.get(event.data.id);
      if (!waiter) return;
      pending.delete(event.data.id);
      waiter.resolve(event.data);
    };
    worker.onerror = () => {
      broken = true;
      worker?.terminate();
      worker = null;
      for (const waiter of pending.values()) waiter.reject(new Error(MISSING));
      pending.clear();
    };
    return worker;
  } catch {
    broken = true;
    return null;
  }
}

function ask(body: Record<string, unknown>): Promise<Reply> {
  const thread = getWorker();
  if (!thread) return Promise.reject(new Error(MISSING));
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    thread.postMessage({ ...body, id });
  });
}

/** Load the worker script now, so the tool keeps working if the connection drops later. */
export function warmArmorWorker(): void {
  void ask({ op: "ping" }).catch(() => undefined);
}

function unwrap(reply: Reply): string {
  if (!reply.ok || typeof reply.text !== "string") throw new Error(reply.error || "Failed.");
  return reply.text;
}

export async function armorTask(plaintext: string, password: string): Promise<string> {
  try {
    return unwrap(await ask({ op: "armor", plaintext, password }));
  } catch (error) {
    if (!(error instanceof Error) || error.message !== MISSING) throw error;
    return armorText(plaintext, password);
  }
}

export async function dearmorTask(armored: string, password: string): Promise<string> {
  try {
    return unwrap(await ask({ op: "dearmor", armored, password }));
  } catch (error) {
    if (!(error instanceof Error) || error.message !== MISSING) throw error;
    return dearmorText(armored, password);
  }
}
