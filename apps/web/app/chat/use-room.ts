"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  decrypt as decryptV1,
  decryptJson,
  deriveRoomKeys,
  encryptJson,
  generateToken,
  hashToken,
} from "@protectedshare/crypto";
import { type ChatClaimResponse, type ChatMessageV2Response, type ChatRoomSettings, type CreateChatMessageV2Request, type GetChatMessagesV2Response, type GetChatPresenceResponse } from "@protectedshare/contracts";
import { AUTH_TOKEN_HEADER, DELETE_TOKEN_HEADER } from "@protectedshare/contracts/constants";
import { apiUrl } from "../../lib/api";
import { readApiError } from "../../lib/feedback";
import {
  colorFor,
  excerptOf,
  fallbackName,
  loadTokens,
  randomId,
  saveTokens,
  tabId,
  validateEnvelope,
  type Envelope,
  type FileAttachment,
  type ReactionKey,
  type ReplyRef,
  type RoomSecret,
  type TokenRecord,
} from "./chat-lib";

export type SendStatus = "sending" | "sent" | "delivered" | "failed";

export type ChatMessage = {
  mid: string;
  serverId?: string;
  kind: "msg" | "system";
  from: string;
  name: string;
  color: number;
  self: boolean;
  body: string;
  edited: boolean;
  reply?: ReplyRef;
  file?: FileAttachment;
  createdAt: number;
  expiresAt: number | null;
  status: SendStatus;
  /** Sent by a v1 client (password rooms only). */
  legacy?: boolean;
  /** For system lines: the new disappearing timer. */
  ttlSeconds?: number | null;
};

export type ReactionSummary = { key: ReactionKey; count: number; names: string[]; mine: boolean };

export type RoomPhase = "deriving" | "claiming" | "ready" | "burned" | "error";
export type Connection = "connecting" | "live" | "polling" | "offline";

type Store = {
  msgs: Record<string, ChatMessage>;
  edits: Record<string, { from: string; body: string; at: number }>;
  deletes: Record<string, string>; // target mid → who deleted ("server" or sender id)
  reactions: Record<string, Record<string, { name: string; keys: ReactionKey[] }>>;
};

const EMPTY_STORE: Store = { msgs: {}, edits: {}, deletes: {}, reactions: {} };

type Keys = { encKey: CryptoKey; authToken: string; safetyWords: string[] };

export type IncomingNotice = { name: string; excerpt: string };

export type UseRoomOptions = RoomSecret & {
  /** Disappearing timer to set when this tab creates the room. */
  initialTtl?: number | null;
  name: string;
  onIncoming?: (notice: IncomingNotice) => void;
};

const POLL_MS = 1500;
const HEARTBEAT_MS = 3000;
const SETTINGS_MS = 15000;

function jsonHeaders(token: string | null): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers[AUTH_TOKEN_HEADER] = token;
  return headers;
}

function remainingTtl(expiresAt: number | null, fallback: number | null): number | null {
  if (!expiresAt) return fallback;
  return Math.max(5, Math.ceil((expiresAt - Date.now()) / 1000));
}

export function useRoom(options: UseRoomOptions) {
  const { roomId, key, password, initialTtl } = options;
  const [phase, setPhase] = useState<RoomPhase>("deriving");
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<Connection>("connecting");
  const [store, setStore] = useState<Store>(EMPTY_STORE);
  const [presence, setPresence] = useState<GetChatPresenceResponse | null>(null);
  const [ttlSeconds, setTtlSeconds] = useState<number | null>(null);
  const [safetyWords, setSafetyWords] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [attempt, setAttempt] = useState(0);

  const senderId = useMemo(() => tabId("sender"), []);
  const presenceId = useMemo(() => tabId("presence"), []);
  const color = useMemo(() => colorFor(senderId), [senderId]);

  const keysRef = useRef<Keys | null>(null);
  const nameRef = useRef(options.name);
  nameRef.current = options.name;
  const onIncomingRef = useRef(options.onIncoming);
  onIncomingRef.current = options.onIncoming;
  const ttlRef = useRef<number | null>(null);
  ttlRef.current = ttlSeconds;
  const storeRef = useRef(store);
  storeRef.current = store;

  const cursorRef = useRef(0);
  const seenRef = useRef(new Set<string>());
  const serverToMidRef = useRef(new Map<string, string>());
  const tokensRef = useRef<Record<string, TokenRecord>>({});
  const outboxRef = useRef(new Map<string, { envelope: Envelope; ttl: number | null }>());
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const typingRef = useRef(false);
  const joinedAtRef = useRef(Date.now());
  const activeRef = useRef(true);
  const phaseRef = useRef<RoomPhase>(phase);
  phaseRef.current = phase;

  const displayName = options.name.trim() || fallbackName(senderId);

  /* ───────────── applying envelopes ───────────── */

  const applyEnvelope = useCallback(
    (draft: Store, envelope: Envelope, meta: { serverId?: string; createdAt: number; expiresAt: number | null }) => {
      const self = envelope.from === senderId;
      const name = envelope.name || fallbackName(envelope.from);
      switch (envelope.t) {
        case "msg": {
          const existing = draft.msgs[envelope.mid];
          if (existing) {
            draft.msgs[envelope.mid] = {
              ...existing,
              serverId: existing.serverId ?? meta.serverId,
              createdAt: meta.createdAt,
              expiresAt: meta.expiresAt,
              status: self ? "delivered" : existing.status,
            };
          } else {
            draft.msgs[envelope.mid] = {
              mid: envelope.mid,
              serverId: meta.serverId,
              kind: "msg",
              from: envelope.from,
              name,
              color: envelope.color,
              self,
              body: envelope.body,
              edited: false,
              reply: envelope.reply,
              file: envelope.file,
              createdAt: meta.createdAt,
              expiresAt: meta.expiresAt,
              status: "delivered",
              ...(envelope.from.startsWith("v1:") ? { legacy: true } : {}),
            };
          }
          return;
        }
        case "edit": {
          const previous = draft.edits[envelope.target];
          if (!previous || previous.at <= meta.createdAt) {
            draft.edits[envelope.target] = { from: envelope.from, body: envelope.body, at: meta.createdAt };
          }
          return;
        }
        case "del":
          if (!draft.deletes[envelope.target]) draft.deletes[envelope.target] = envelope.from;
          return;
        case "react": {
          const byPerson = { ...(draft.reactions[envelope.target] ?? {}) };
          const current = byPerson[envelope.from] ?? { name, keys: [] };
          const keys = envelope.on
            ? current.keys.includes(envelope.key)
              ? current.keys
              : [...current.keys, envelope.key]
            : current.keys.filter((value) => value !== envelope.key);
          byPerson[envelope.from] = { name, keys };
          draft.reactions[envelope.target] = byPerson;
          return;
        }
        case "ttl":
          draft.msgs[envelope.mid] = {
            mid: envelope.mid,
            serverId: meta.serverId,
            kind: "system",
            from: envelope.from,
            name,
            color: envelope.color,
            self,
            body: "",
            edited: false,
            createdAt: meta.createdAt,
            expiresAt: meta.expiresAt,
            status: "delivered",
            ttlSeconds: envelope.seconds,
          };
          if (!self) setTtlSeconds(envelope.seconds);
          return;
      }
    },
    [senderId]
  );

  const ingest = useCallback(
    (incoming: ChatMessageV2Response[]) => {
      if (incoming.length === 0) return;
      queueRef.current = queueRef.current.then(async () => {
        const keys = keysRef.current;
        if (!keys || !activeRef.current) return;
        const decoded: { envelope: Envelope; meta: { serverId: string; createdAt: number; expiresAt: number | null } }[] = [];
        const acked: string[] = [];
        for (const message of incoming) {
          if (message.createdAt > cursorRef.current) cursorRef.current = message.createdAt;
          if (seenRef.current.has(message.id)) {
            const mid = serverToMidRef.current.get(message.id);
            if (mid) acked.push(mid);
            continue;
          }
          seenRef.current.add(message.id);
          const meta = { serverId: message.id, createdAt: message.createdAt, expiresAt: message.expiresAt };
          try {
            if (message.payload.v === 2) {
              const envelope = validateEnvelope(
                await decryptJson(keys.encKey, { encryptedBlob: message.payload.encryptedBlob, iv: message.payload.iv })
              );
              if (envelope) {
                serverToMidRef.current.set(message.id, envelope.mid);
                decoded.push({ envelope, meta });
              }
            } else if (password && message.payload.salt) {
              const text = await decryptV1(message.payload.encryptedBlob, password, message.payload.iv, message.payload.salt);
              serverToMidRef.current.set(message.id, message.id);
              decoded.push({
                envelope: { t: "msg", mid: message.id, from: `v1:${message.id}`, name: "Earlier client", color: 0, body: text },
                meta,
              });
            }
          } catch {
            // Not decryptable with this room's key: skip it.
          }
        }
        if (decoded.length === 0 && acked.length === 0) return;

        setStore((previous) => {
          const draft: Store = {
            msgs: { ...previous.msgs },
            edits: { ...previous.edits },
            deletes: { ...previous.deletes },
            reactions: { ...previous.reactions },
          };
          for (const mid of acked) {
            const message = draft.msgs[mid];
            if (message && message.status === "sent") draft.msgs[mid] = { ...message, status: "delivered" };
          }
          for (const { envelope, meta } of decoded) applyEnvelope(draft, envelope, meta);
          return draft;
        });

        for (const { envelope, meta } of decoded) {
          if (envelope.t === "msg" && envelope.from !== senderId && meta.createdAt > joinedAtRef.current - 1500) {
            onIncomingRef.current?.({
              name: envelope.name || fallbackName(envelope.from),
              excerpt: excerptOf(envelope.body, envelope.file),
            });
          }
        }
      });
    },
    [applyEnvelope, password, senderId]
  );

  const applyServerDeletes = useCallback((ids: string[]) => {
    setStore((previous) => {
      let changed = false;
      const deletes = { ...previous.deletes };
      for (const id of ids) {
        const mid = serverToMidRef.current.get(id);
        if (mid && !deletes[mid]) {
          deletes[mid] = "server";
          changed = true;
        }
      }
      return changed ? { ...previous, deletes } : previous;
    });
  }, []);

  /* ───────────── lifecycle: derive → claim → connect ───────────── */

  const markBurned = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setPhase("burned");
    setConnection("offline");
    setStore(EMPTY_STORE);
  }, []);

  useEffect(() => {
    let cancelled = false;
    activeRef.current = true;
    tokensRef.current = loadTokens(roomId);
    joinedAtRef.current = Date.now();
    let eventSource: EventSource | null = null;
    let pollTimer: number | undefined;
    let reopenTimer: number | undefined;
    let readyTimer: number | undefined;
    let heartbeatTimer: number | undefined;
    let settingsTimer: number | undefined;
    let backoff = 1000;
    let polling = false;

    const alive = () => !cancelled && activeRef.current;

    const handleAuthFailure = async () => {
      // A burned room loses its claim; anything else is a key mismatch.
      const token = keysRef.current?.authToken ?? null;
      try {
        const response = await fetch(apiUrl(`/api/chat/${roomId}/settings`), { headers: jsonHeaders(token) });
        if (response.ok) {
          const settings = (await response.json()) as ChatRoomSettings;
          if (!settings.claimed) markBurned();
          return;
        }
      } catch {
        // offline: try again later
      }
    };

    const poll = async () => {
      if (!alive() || !polling) return;
      try {
        const response = await fetch(apiUrl(`/api/chat/${roomId}?since=${Math.max(0, cursorRef.current - 1)}`), {
          headers: jsonHeaders(keysRef.current?.authToken ?? null),
          cache: "no-store",
        });
        if (response.status === 401) {
          await handleAuthFailure();
        } else if (response.ok) {
          const data = (await response.json()) as GetChatMessagesV2Response;
          ingest(data.messages ?? []);
          if (alive()) setConnection((current) => (current === "live" ? current : "polling"));
        } else if (alive()) {
          setConnection("offline");
        }
      } catch {
        if (alive()) setConnection("offline");
      } finally {
        if (alive() && polling) pollTimer = window.setTimeout(poll, POLL_MS);
      }
    };

    const startPolling = () => {
      if (polling) return;
      polling = true;
      void poll();
    };

    const stopPolling = () => {
      polling = false;
      window.clearTimeout(pollTimer);
    };

    const openStream = () => {
      if (!alive()) return;
      if (typeof window === "undefined" || !("EventSource" in window)) {
        startPolling();
        return;
      }
      const token = keysRef.current?.authToken ?? "";
      const since = Math.max(0, cursorRef.current - 1);
      eventSource = new EventSource(
        apiUrl(`/api/chat/${roomId}/stream?since=${since}&token=${encodeURIComponent(token)}`)
      );
      // Some proxies hold SSE frames back. If the stream hasn't said hello soon, poll alongside it.
      window.clearTimeout(readyTimer);
      readyTimer = window.setTimeout(() => {
        if (alive()) startPolling();
      }, 6000);
      eventSource.addEventListener("ready", () => {
        window.clearTimeout(readyTimer);
        if (!alive()) return;
        backoff = 1000;
        stopPolling();
        setConnection("live");
      });
      eventSource.addEventListener("messages", (event) => {
        try {
          const data = JSON.parse((event as MessageEvent<string>).data) as GetChatMessagesV2Response;
          ingest(data.messages ?? []);
        } catch {
          // ignore malformed frames
        }
      });
      eventSource.addEventListener("deleted", (event) => {
        try {
          const data = JSON.parse((event as MessageEvent<string>).data) as { ids?: string[] };
          applyServerDeletes(data.ids ?? []);
        } catch {
          // ignore
        }
      });
      eventSource.addEventListener("burned", () => {
        eventSource?.close();
        eventSource = null;
        markBurned();
      });
      eventSource.addEventListener("error", () => {
        eventSource?.close();
        eventSource = null;
        if (!alive()) return;
        setConnection((current) => (current === "live" ? "polling" : current));
        startPolling();
        window.clearTimeout(reopenTimer);
        reopenTimer = window.setTimeout(openStream, backoff);
        backoff = Math.min(backoff * 2, 30000);
      });
    };

    const heartbeat = async () => {
      if (!alive()) return;
      try {
        const response = await fetch(apiUrl(`/api/chat/${roomId}/presence`), {
          method: "POST",
          headers: jsonHeaders(keysRef.current?.authToken ?? null),
          body: JSON.stringify({ clientId: presenceId, isTyping: typingRef.current, state: "active" }),
        });
        if (response.ok && alive()) setPresence((await response.json()) as GetChatPresenceResponse);
        else if (response.status === 401) await handleAuthFailure();
      } catch {
        // offline; next beat retries
      }
    };

    const syncSettings = async () => {
      if (!alive()) return;
      try {
        const response = await fetch(apiUrl(`/api/chat/${roomId}/settings`), {
          headers: jsonHeaders(keysRef.current?.authToken ?? null),
          cache: "no-store",
        });
        if (response.status === 401) {
          await handleAuthFailure();
          return;
        }
        if (!response.ok) return;
        const settings = (await response.json()) as ChatRoomSettings;
        if (!settings.claimed) {
          markBurned();
          return;
        }
        if (alive()) setTtlSeconds(settings.ttlSeconds ?? null);
      } catch {
        // ignore
      }
    };

    const start = async () => {
      setPhase("deriving");
      setError(null);
      try {
        const derived = await deriveRoomKeys({ key, password, roomId });
        if (cancelled) return;
        keysRef.current = { encKey: derived.encKey, authToken: derived.authToken, safetyWords: derived.safetyWords };
        setSafetyWords(derived.safetyWords);
        setPhase("claiming");

        const response = await fetch(apiUrl(`/api/chat/${roomId}/claim`), {
          method: "POST",
          headers: jsonHeaders(null),
          body: JSON.stringify({ authHash: derived.authHash, ...(initialTtl ? { ttlSeconds: initialTtl } : {}) }),
        });
        if (cancelled) return;
        if (response.status === 409) {
          setError(
            password
              ? "That password doesn't match this room. Check it with the person who invited you."
              : "This link's key doesn't match the room. Ask for a fresh invite link."
          );
          setPhase("error");
          return;
        }
        if (!response.ok) {
          setError(await readApiError(response, "Couldn't open the room. Check your connection and try again."));
          setPhase("error");
          return;
        }
        const claim = (await response.json()) as ChatClaimResponse;
        setTtlSeconds(claim.ttlSeconds ?? null);
        setPhase("ready");
        openStream();
        void heartbeat();
        heartbeatTimer = window.setInterval(heartbeat, HEARTBEAT_MS);
        settingsTimer = window.setInterval(syncSettings, SETTINGS_MS);
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Couldn't open the room.");
        setPhase("error");
      }
    };

    void start();

    const leaveBeacon = () => {
      const token = keysRef.current?.authToken;
      if (!token || !activeRef.current) return;
      void fetch(
        apiUrl(`/api/chat/${roomId}/presence?clientId=${encodeURIComponent(presenceId)}&token=${encodeURIComponent(token)}`),
        { method: "DELETE", keepalive: true }
      ).catch(() => {});
    };
    window.addEventListener("pagehide", leaveBeacon);

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", leaveBeacon);
      eventSource?.close();
      stopPolling();
      window.clearTimeout(reopenTimer);
      window.clearTimeout(readyTimer);
      window.clearInterval(heartbeatTimer);
      window.clearInterval(settingsTimer);
      seenRef.current = new Set();
      serverToMidRef.current = new Map();
      cursorRef.current = 0;
      setStore(EMPTY_STORE);
      setPresence(null);
    };
  }, [roomId, key, password, initialTtl, attempt, ingest, applyServerDeletes, markBurned, presenceId]);

  /* ───────────── expiry tick ───────────── */

  const hasExpiring = useMemo(() => Object.values(store.msgs).some((message) => message.expiresAt), [store.msgs]);

  useEffect(() => {
    if (!hasExpiring) return;
    setNow(Date.now());
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      const expired = Object.values(storeRef.current.msgs).filter((message) => message.expiresAt && message.expiresAt <= current);
      if (expired.length) {
        setStore((previous) => {
          const msgs = { ...previous.msgs };
          for (const message of expired) delete msgs[message.mid];
          return { ...previous, msgs };
        });
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hasExpiring]);

  /* ───────────── sending ───────────── */

  const persistToken = useCallback(
    (mid: string, record: TokenRecord) => {
      tokensRef.current = { ...tokensRef.current, [mid]: record };
      saveTokens(roomId, tokensRef.current);
    },
    [roomId]
  );

  const post = useCallback(
    async (envelope: Envelope, ttl: number | null, target?: string): Promise<ChatMessageV2Response> => {
      const keys = keysRef.current;
      if (!keys) throw new Error("The room isn't ready yet.");
      const token = generateToken();
      const [deleteHash, sealed] = await Promise.all([hashToken(token), encryptJson(keys.encKey, envelope)]);
      const body: CreateChatMessageV2Request = {
        payload: { encryptedBlob: sealed.encryptedBlob, iv: sealed.iv, v: 2 },
        deleteHash,
        ...(ttl ? { ttlSeconds: ttl } : {}),
      };
      const response = await fetch(apiUrl(`/api/chat/${roomId}`), {
        method: "POST",
        headers: jsonHeaders(keys.authToken),
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        throw new Error("The room rejected this message. It may have been burned.");
      }
      if (!response.ok) throw new Error(await readApiError(response, "Couldn't send. Check your connection."));
      const data = (await response.json()) as ChatMessageV2Response;
      seenRef.current.add(data.id);
      serverToMidRef.current.set(data.id, envelope.mid);
      if (data.createdAt > cursorRef.current) cursorRef.current = data.createdAt;
      persistToken(envelope.mid, { serverId: data.id, token, ...(target ? { target } : {}) });
      return data;
    },
    [persistToken, roomId]
  );

  const sender = useCallback(
    () => ({ from: senderId, name: nameRef.current.trim().slice(0, 40), color }),
    [color, senderId]
  );

  const deliver = useCallback(
    async (mid: string) => {
      const entry = outboxRef.current.get(mid);
      if (!entry) return;
      setStore((previous) =>
        previous.msgs[mid] ? { ...previous, msgs: { ...previous.msgs, [mid]: { ...previous.msgs[mid], status: "sending" } } } : previous
      );
      try {
        const data = await post(entry.envelope, entry.ttl);
        outboxRef.current.delete(mid);
        setStore((previous) => {
          const message = previous.msgs[mid];
          if (!message) return previous;
          return {
            ...previous,
            msgs: {
              ...previous.msgs,
              [mid]: {
                ...message,
                serverId: data.id,
                createdAt: data.createdAt,
                expiresAt: data.expiresAt,
                status: message.status === "delivered" ? "delivered" : "sent",
              },
            },
          };
        });
      } catch {
        setStore((previous) =>
          previous.msgs[mid] ? { ...previous, msgs: { ...previous.msgs, [mid]: { ...previous.msgs[mid], status: "failed" } } } : previous
        );
      }
    },
    [post]
  );

  const send = useCallback(
    (input: { body: string; reply?: ReplyRef; file?: FileAttachment }) => {
      const mid = randomId();
      const ttl = ttlRef.current;
      const envelope: Envelope = { t: "msg", mid, ...sender(), body: input.body, reply: input.reply, file: input.file };
      outboxRef.current.set(mid, { envelope, ttl });
      const createdAt = Date.now();
      setStore((previous) => ({
        ...previous,
        msgs: {
          ...previous.msgs,
          [mid]: {
            mid,
            kind: "msg",
            from: senderId,
            name: displayName,
            color,
            self: true,
            body: input.body,
            edited: false,
            reply: input.reply,
            file: input.file,
            createdAt,
            expiresAt: ttl ? createdAt + ttl * 1000 : null,
            status: "sending",
          },
        },
      }));
      void deliver(mid);
    },
    [color, deliver, displayName, sender, senderId]
  );

  const retry = useCallback((mid: string) => void deliver(mid), [deliver]);

  const discard = useCallback((mid: string) => {
    outboxRef.current.delete(mid);
    setStore((previous) => {
      const msgs = { ...previous.msgs };
      delete msgs[mid];
      return { ...previous, msgs };
    });
  }, []);

  const edit = useCallback(
    async (target: string, body: string) => {
      const message = storeRef.current.msgs[target];
      if (!message || !message.self) return;
      const mid = randomId();
      const envelope: Envelope = { t: "edit", mid, ...sender(), target, body };
      const at = Date.now();
      setStore((previous) => ({ ...previous, edits: { ...previous.edits, [target]: { from: senderId, body, at } } }));
      try {
        const data = await post(envelope, remainingTtl(message.expiresAt, null), target);
        setStore((previous) => ({ ...previous, edits: { ...previous.edits, [target]: { from: senderId, body, at: data.createdAt } } }));
      } catch (caught) {
        setStore((previous) => {
          const edits = { ...previous.edits };
          delete edits[target];
          return { ...previous, edits };
        });
        throw caught;
      }
    },
    [post, sender, senderId]
  );

  const react = useCallback(
    async (target: string, reaction: ReactionKey) => {
      const message = storeRef.current.msgs[target];
      if (!message) return;
      const mine = storeRef.current.reactions[target]?.[senderId]?.keys.includes(reaction) ?? false;
      const envelope: Envelope = { t: "react", mid: randomId(), ...sender(), target, key: reaction, on: !mine };
      setStore((previous) => {
        const draft = { ...previous, reactions: { ...previous.reactions } };
        applyEnvelope(draft, envelope, { createdAt: Date.now(), expiresAt: null });
        return draft;
      });
      try {
        await post(envelope, remainingTtl(message.expiresAt, null), target);
      } catch (caught) {
        setStore((previous) => {
          const draft = { ...previous, reactions: { ...previous.reactions } };
          applyEnvelope(draft, { ...envelope, on: mine }, { createdAt: Date.now(), expiresAt: null });
          return draft;
        });
        throw caught;
      }
    },
    [applyEnvelope, post, sender, senderId]
  );

  /** Delete for everyone: removes the server rows (message, its edits, my reactions) and tells other tabs. */
  const remove = useCallback(
    async (target: string) => {
      const keys = keysRef.current;
      const message = storeRef.current.msgs[target];
      if (!keys || !message || !message.self) return;
      setStore((previous) => ({ ...previous, deletes: { ...previous.deletes, [target]: senderId } }));
      const related = Object.entries(tokensRef.current).filter(([mid, record]) => mid === target || record.target === target);
      await Promise.all(
        related.map(async ([mid, record]) => {
          try {
            const response = await fetch(apiUrl(`/api/chat/${roomId}/messages/${encodeURIComponent(record.serverId)}`), {
              method: "DELETE",
              headers: { [AUTH_TOKEN_HEADER]: keys.authToken, [DELETE_TOKEN_HEADER]: record.token },
            });
            if (response.ok || response.status === 404) {
              const next = { ...tokensRef.current };
              delete next[mid];
              tokensRef.current = next;
            }
          } catch {
            // the del control message still hides it for everyone
          }
        })
      );
      saveTokens(roomId, tokensRef.current);
      outboxRef.current.delete(target);
      if (message.serverId) {
        const envelope: Envelope = { t: "del", mid: randomId(), from: senderId, name: "", color, target };
        try {
          await post(envelope, Math.min(3600, remainingTtl(message.expiresAt, 3600) ?? 3600));
        } catch {
          // best effort
        }
      }
    },
    [color, post, roomId, senderId]
  );

  const setRoomTtl = useCallback(
    async (seconds: number | null) => {
      const keys = keysRef.current;
      if (!keys) return;
      const previous = ttlRef.current;
      setTtlSeconds(seconds);
      const response = await fetch(apiUrl(`/api/chat/${roomId}/settings`), {
        method: "PATCH",
        headers: jsonHeaders(keys.authToken),
        body: JSON.stringify({ ttlSeconds: seconds }),
      });
      if (!response.ok) {
        setTtlSeconds(previous);
        throw new Error(await readApiError(response, "Couldn't change the timer."));
      }
      const mid = randomId();
      const envelope: Envelope = { t: "ttl", mid, ...sender(), seconds };
      setStore((draft) => {
        const next = { ...draft, msgs: { ...draft.msgs } };
        applyEnvelope(next, envelope, { createdAt: Date.now(), expiresAt: null });
        return next;
      });
      try {
        await post(envelope, null);
      } catch {
        // settings already changed; the line just won't reach polling clients
      }
    },
    [applyEnvelope, post, roomId, sender]
  );

  const setTyping = useCallback(
    (typing: boolean) => {
      if (typingRef.current === typing) return;
      typingRef.current = typing;
      const keys = keysRef.current;
      if (!keys || !activeRef.current) return;
      void fetch(apiUrl(`/api/chat/${roomId}/presence`), {
        method: "POST",
        headers: jsonHeaders(keys.authToken),
        body: JSON.stringify({ clientId: presenceId, isTyping: typing, state: "active" }),
      })
        .then(async (response) => {
          if (response.ok && activeRef.current) setPresence((await response.json()) as GetChatPresenceResponse);
        })
        .catch(() => {});
    },
    [presenceId, roomId]
  );

  const leave = useCallback(async () => {
    const keys = keysRef.current;
    activeRef.current = false;
    if (keys) {
      try {
        await fetch(
          apiUrl(`/api/chat/${roomId}/presence?clientId=${encodeURIComponent(presenceId)}`),
          { method: "DELETE", headers: { [AUTH_TOKEN_HEADER]: keys.authToken }, keepalive: true }
        );
      } catch {
        // presence times out on its own after 15 seconds
      }
    }
  }, [presenceId, roomId]);

  const burn = useCallback(async () => {
    const keys = keysRef.current;
    if (!keys) return;
    const response = await fetch(apiUrl(`/api/chat/${roomId}`), {
      method: "DELETE",
      headers: { [AUTH_TOKEN_HEADER]: keys.authToken },
    });
    if (!response.ok) throw new Error(await readApiError(response, "Couldn't burn the room. Try again."));
    markBurned();
  }, [markBurned, roomId]);

  const retryJoin = useCallback(() => setAttempt((value) => value + 1), []);

  /* ───────────── derived view ───────────── */

  const messages = useMemo(() => {
    const list: ChatMessage[] = [];
    for (const message of Object.values(store.msgs)) {
      const deletedBy = store.deletes[message.mid];
      if (deletedBy && (deletedBy === "server" || deletedBy === message.from)) continue;
      if (message.expiresAt && message.expiresAt <= now) continue;
      const edit = store.edits[message.mid];
      if (edit && edit.from === message.from && message.kind === "msg") {
        list.push({ ...message, body: edit.body, edited: true });
      } else {
        list.push(message);
      }
    }
    list.sort((a, b) => a.createdAt - b.createdAt || a.mid.localeCompare(b.mid));
    return list;
  }, [store, now]);

  const reactions = useMemo(() => {
    const out: Record<string, ReactionSummary[]> = {};
    for (const [target, people] of Object.entries(store.reactions)) {
      const byKey = new Map<ReactionKey, ReactionSummary>();
      for (const [from, entry] of Object.entries(people)) {
        for (const reaction of entry.keys) {
          const summary = byKey.get(reaction) ?? { key: reaction, count: 0, names: [], mine: false };
          summary.count += 1;
          summary.names.push(from === senderId ? "You" : entry.name || fallbackName(from));
          if (from === senderId) summary.mine = true;
          byKey.set(reaction, summary);
        }
      }
      if (byKey.size) out[target] = Array.from(byKey.values());
    }
    return out;
  }, [store.reactions, senderId]);

  /** People seen in this room's messages (names only live inside ciphertext). */
  const people = useMemo(() => {
    const seen = new Map<string, { name: string; color: number }>();
    for (const message of Object.values(store.msgs)) {
      if (message.self || message.legacy) continue;
      seen.set(message.from, { name: message.name, color: message.color });
    }
    return Array.from(seen.entries()).map(([id, value]) => ({ id, ...value }));
  }, [store.msgs]);

  const othersTyping = presence ? Math.max(0, presence.typingCount - (typingRef.current ? 1 : 0)) : 0;

  return {
    phase,
    error,
    connection,
    messages,
    reactions,
    people,
    presence,
    othersTyping,
    ttlSeconds,
    safetyWords,
    now,
    senderId,
    displayName,
    color,
    send,
    retry,
    discard,
    edit,
    react,
    remove,
    setRoomTtl,
    setTyping,
    leave,
    burn,
    retryJoin,
  };
}

export type RoomApi = ReturnType<typeof useRoom>;
