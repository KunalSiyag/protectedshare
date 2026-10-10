"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { generateKey } from "@protectedshare/crypto";
import { sealTextTask, type SealedTextResult } from "../../../lib/crypto-task";
import { createManageToken } from "./share-client";

export type PreviewState = "empty" | "sealing" | "sealed" | "estimate";

/**
 * Draft secrets for a composer: the link key and the manage token are created up front, so the
 * server view can show the real key that will go in the link and the real manage-token hash.
 * `reset()` makes fresh ones for the next share.
 */
export function useDraftSecrets() {
  const [key, setKey] = useState("");
  const [manage, setManage] = useState<{ token: string; hash: string } | null>(null);

  const reset = useCallback(() => {
    setKey(generateKey());
    setManage(null);
    void createManageToken().then(setManage);
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
      const sealed = await sealTextTask(text, { key: secret.key || undefined, password: secret.password || undefined });
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
