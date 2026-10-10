"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KdfMode, ShareMetaResponse } from "@protectedshare/contracts";
import { authTokenTask, decryptForShare, openTextTask, proofForShare } from "../../../lib/crypto-task";
import { passwordFromLocationHash, readFragmentParams } from "../../../lib/share-window";
import { ShareError, describeError, fetchShareMeta, fetchShareV1, fetchShareV2, type ShareKind } from "./share-client";

export type ReaderPhase =
  /** Fetching /meta (does not consume anything). */
  | "loading"
  /** 404 on meta or on open: opened and deleted, expired, revoked, or a wrong link. */
  | "gone"
  /** Couldn't reach the server, or an unexpected error. */
  | "error"
  /** v2 link that needs `#k=` but doesn't have it. */
  | "missing-key"
  /** Ready to open with one click (the click is what consumes a read). */
  | "gate"
  /** Needs the recipient to type a password. */
  | "password"
  /** The key in the link doesn't match (key-only link, or a v1 link with a wrong hash). */
  | "bad-key"
  | "open";

export type OpenedShare = {
  text: string;
  /** The server deleted it as part of this read. */
  deleted: boolean;
  /** Secrets: reads left after this one. */
  remainingReads?: number;
  /** ms */
  expiresAt: number;
};

export type ReaderRequest = { path: string; header?: { name: string; value: string }; query?: string } | null;

type Secret = { key?: string; v1Password?: string };

function needsPassword(meta: ShareMetaResponse): boolean {
  return meta.v === 2 && (meta.kdf === "password" || meta.kdf === "key+password");
}

/**
 * The reader's state machine. It reads /meta first (which never consumes), decides whether the
 * link can open by itself, and only fetches the ciphertext on an explicit open — so link
 * previewers and prefetchers can't burn a note.
 */
export function useShareReader(kind: ShareKind, id: string) {
  const [phase, setPhase] = useState<ReaderPhase>("loading");
  const [meta, setMeta] = useState<ShareMetaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<OpenedShare | null>(null);
  const [keyStripped, setKeyStripped] = useState(false);
  const [lastRequest, setLastRequest] = useState<ReaderRequest>(null);
  const secret = useRef<Secret>({});
  const autoOpened = useRef(false);
  const apiRoot = kind === "note" ? "/api/notes" : "/api/secrets";

  const stripFragment = useCallback(() => {
    if (typeof window === "undefined" || !window.location.hash) return;
    try {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
      setKeyStripped(true);
    } catch {
      // Some embedded browsers block history edits. Not fatal.
    }
  }, []);

  const open = useCallback(
    async (password?: string) => {
      if (!meta || busy) return;
      setBusy(true);
      setError(null);
      setPasswordError(null);
      try {
        let result: OpenedShare;
        if (meta.v === 2) {
          const kdf = (meta.kdf ?? "key") as KdfMode;
          const input = { key: secret.current.key, password: password || undefined };
          const authToken = await authTokenTask(input, meta.salt, kdf);
          setLastRequest({ path: `GET ${apiRoot}/${id}`, header: { name: "X-Auth-Token", value: authToken } });
          const data = await fetchShareV2(kind, id, authToken);
          const text = await openTextTask(data.payload, input);
          const remainingReads = "remainingReads" in data ? data.remainingReads : undefined;
          result = {
            text,
            deleted: kind === "note" ? Boolean("isBurnAfterRead" in data && data.isBurnAfterRead) : remainingReads === 0,
            remainingReads,
            expiresAt: data.expiresAt * 1000,
          };
        } else {
          const v1Password = password ?? secret.current.v1Password ?? "";
          const proof = await proofForShare(v1Password);
          setLastRequest({ path: `GET ${apiRoot}/${id}`, query: `proof=${proof}` });
          const data = await fetchShareV1(kind, id, proof);
          const text = await decryptForShare(v1Password, data.payload.encryptedBlob, data.payload.iv, data.payload.salt);
          const remainingReads = "remainingReads" in data ? data.remainingReads : undefined;
          result = {
            text,
            deleted: kind === "note" ? Boolean("isBurnAfterRead" in data && data.isBurnAfterRead) : remainingReads === 0,
            remainingReads,
            expiresAt: (data.expiresAt > 1e12 ? data.expiresAt : data.expiresAt * 1000),
          };
        }
        setOpened(result);
        setPhase("open");
        stripFragment();
      } catch (caught) {
        if (caught instanceof ShareError && caught.code === "not_found") {
          setPhase("gone");
        } else if (caught instanceof ShareError && caught.code === "auth") {
          if (needsPassword(meta) || (meta.v === 1 && password !== undefined)) {
            setPhase("password");
            setPasswordError(
              meta.kdf === "key+password"
                ? "That password doesn't match. Check it with the sender. Nothing was used up."
                : "That password doesn't match. Nothing was used up — try again."
            );
          } else {
            setPhase("bad-key");
          }
        } else {
          const message = describeError(caught, "Couldn't open this. Try again in a moment.");
          if (phase === "password" || needsPassword(meta)) setPasswordError(message);
          else setError(message);
        }
      } finally {
        setBusy(false);
      }
    },
    [meta, busy, kind, id, apiRoot, stripFragment, phase]
  );

  const load = useCallback(async () => {
    setPhase("loading");
    setError(null);
    try {
      const data = await fetchShareMeta(kind, id);
      setMeta(data);
      if (data.v === 2) {
        const key = readFragmentParams().k;
        secret.current = { key: key || undefined };
        if ((data.kdf === "key" || data.kdf === "key+password") && !key) {
          setPhase("missing-key");
          return;
        }
        setPhase(needsPassword(data) ? "password" : "gate");
        return;
      }
      const v1Password = passwordFromLocationHash();
      secret.current = { v1Password: v1Password || undefined };
      setPhase(v1Password ? "gate" : "password");
    } catch (caught) {
      if (caught instanceof ShareError && caught.code === "not_found") {
        setPhase("gone");
      } else {
        setError(describeError(caught, "Couldn't load this link. Try again in a moment."));
        setPhase("error");
      }
    }
  }, [kind, id]);

  useEffect(() => {
    void load();
  }, [load]);

  // Notes that don't burn open straight from the link: there's nothing for a previewer to destroy.
  const autoOpen = kind === "note" && phase === "gate" && meta !== null && !meta.isBurnAfterRead;
  useEffect(() => {
    if (!autoOpen || autoOpened.current) return;
    autoOpened.current = true;
    void open();
  }, [autoOpen, open]);

  return {
    phase,
    meta,
    error,
    passwordError,
    busy,
    opened,
    keyStripped,
    lastRequest,
    hasKey: Boolean(secret.current.key),
    key: secret.current.key ?? "",
    autoOpening: autoOpen,
    open,
    retry: load,
    /** v1 links whose hash didn't work: let the recipient type the password instead. */
    askPassword: () => {
      setPasswordError(null);
      setPhase("password");
    },
  };
}
