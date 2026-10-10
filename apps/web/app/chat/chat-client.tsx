"use client";

import { useCallback, useEffect, useState } from "react";
import { generateKey } from "@protectedshare/crypto";
import { Spinner } from "@protectedshare/ui";
import { generateRoomId, loadName, loadSession, parseInvite, saveName, type RoomSecret } from "./chat-lib";
import Lobby from "./lobby";
import RoomView from "./room-view";

type Active = { secret: RoomSecret; initialTtl?: number | null; nonce: number };

/** Reads the invite in the address bar: v2 `#r=…&k=…`, legacy `#room:password`, or a bare room id. */
function fromLocation(): { join?: RoomSecret; prefill?: string } {
  const parsed = parseInvite(window.location.hash);
  if (!parsed) return {};
  if (parsed.kind === "key") return { join: { roomId: parsed.roomId, key: parsed.key } };
  if (parsed.kind === "password") return { join: { roomId: parsed.roomId, password: parsed.password } };
  const session = loadSession();
  if (session && session.roomId === parsed.roomId && (session.key || session.password)) return { join: session };
  return { prefill: parsed.roomId };
}

export default function ChatClient() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<Active | null>(null);
  const [prefill, setPrefill] = useState<string | undefined>(undefined);
  const [name, setName] = useState("");

  const open = useCallback((secret: RoomSecret, initialTtl?: number | null) => {
    setActive({ secret, initialTtl, nonce: Date.now() });
  }, []);

  useEffect(() => {
    setName(loadName());
    const fromHash = fromLocation();
    if (fromHash.join) open(fromHash.join);
    else if (fromHash.prefill) setPrefill(fromHash.prefill);
    else {
      const session = loadSession();
      if (session && (session.key || session.password)) open(session);
    }
    setMounted(true);

    // Pasting a new invite into the address bar while on /chat.
    const onHash = () => {
      const next = fromLocation();
      if (next.join) {
        setActive((current) =>
          current && current.secret.roomId === next.join!.roomId && current.secret.key === next.join!.key && !next.join!.password
            ? current
            : { secret: next.join!, nonce: Date.now() }
        );
      } else if (next.prefill) {
        setPrefill(next.prefill);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [open]);

  // The room is a full-height app: drop the page frame's width and padding while it is open.
  useEffect(() => {
    if (!active) return;
    // The join form sits low on the page; the room should start at the top.
    window.scrollTo({ top: 0 });
    document.documentElement.classList.add("notepad-full-width");
    return () => document.documentElement.classList.remove("notepad-full-width");
  }, [active]);

  const changeName = useCallback((value: string) => {
    const next = value.slice(0, 40);
    setName(next);
    saveName(next);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-ink-3" role="status">
        <Spinner size={18} label="Loading chat" />
      </div>
    );
  }

  if (active) {
    return (
      <RoomView
        key={`${active.secret.roomId}-${active.nonce}`}
        secret={active.secret}
        initialTtl={active.initialTtl}
        name={name}
        onNameChange={changeName}
        onExit={(options) => {
          setActive(null);
          setPrefill(options?.prefillRoomId);
          if (options?.startNew) open({ roomId: generateRoomId(), key: generateKey() });
        }}
      />
    );
  }

  return (
    <Lobby
      name={name}
      onNameChange={changeName}
      prefillRoomId={prefill}
      onStart={(secret, ttl) => open(secret, ttl)}
      onJoin={(secret) => open(secret)}
    />
  );
}
