"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SecretInput } from "@protectedshare/crypto";
import type { SealedTextResult } from "../../../lib/crypto-task";
import { createManageToken } from "./share-client";

export type PreviewState = "empty" | "sealing" | "sealed" | "estimate";

/**
 * The crypto code loads on demand instead of with the page, so the composer paints and hydrates
 * without it. The first request goes out right after hydration (the draft key), long before
 * anyone can type a note and seal it.
 */
export function loadCrypto() {
  return import("@protectedshare/crypto");
}

/** `sealTextTask` (worker first, main-thread fallback), imported on first use. */
export async function sealTextLazy(plaintext: string, secret: SecretInput): Promise<SealedTextResult> {
  const { sealTextTask } = await import("../../../lib/crypto-task");
  return sealTextTask(plaintext, secret);
}

/**
 * Draft secrets for a composer: the link key and the manage token are created up front, so the
 * server view can show the real key that will go in the link and the real manage-token hash.
 * `reset()` makes fresh ones for the next share. Both arrive a moment after mount; until then
 * `key` is "" and `manage` is null, and callers create their own when they need one sooner.
 */
export function useDraftSecrets() {
  const [key, setKey] = useState("");
  const [manage, setManage] = useState<{ token: string; hash: string } | null>(null);
  const generation = useRef(0);

  const reset = useCallback(() => {
    const current = ++generation.current;
    setKey("");
    setManage(null);
    loadCrypto()
      .then(({ generateKey }) => {
        if (generation.current === current) setKey(generateKey());
      })
      .catch(() => {});
    createManageToken()
      .then((next) => {
        if (generation.current === current) setManage(next);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  return { key, manage, reset };
}

/**
 * Live preview for the server view.
 *
 * Key-only: seals for real (cheap HKDF) about 300 ms after typing stops.
 * Any password involved: shows an estimate, and seals only when `sealNow()` is called, so we
 * don't run 600,000 PBKDF2 rounds on every keystroke.
 */
export function useLiveSeal(text: string, secret: { key?: string; password?: string }) {
  const usesPassword = Boolean(secret.password);
  const signature = `${text}\u0000${secret.key ?? ""}\u0000${secret.password ?? ""}`;
  const [result, setResult] = useState<{ signature: string; sealed: SealedTextResult } | null>(null);
  const [busy, setBusy] = useState(false);
  const latest = useRef(signature);
  latest.current = signature;

  const run = useCallback(async () => {
    const started = latest.current;
    setBusy(true);
    try {
      const sealed = await sealTextLazy(text, { key: secret.key || undefined, password: secret.password || undefined });
      if (latest.current === started) setResult({ signature: started, sealed });
    } catch {
      // Preview only. The real seal reports its own errors.
    } finally {
      if (latest.current === started) setBusy(false);
    }
  }, [text, secret.key, secret.password]);

  useEffect(() => {
    if (!text || usesPassword || !secret.key) {
      setBusy(false);
      return;
    }
    const timer = window.setTimeout(() => void run(), 300);
    return () => window.clearTimeout(timer);
  }, [text, usesPassword, secret.key, run]);

  const sealed = result && result.signature === signature ? result.sealed : null;
  const state: PreviewState = !text ? "empty" : busy ? "sealing" : sealed ? "sealed" : usesPassword ? "estimate" : "sealing";

  return { sealed, state, sealNow: run, usesPassword };
}
