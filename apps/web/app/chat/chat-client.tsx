"use client";

import { useCallback, useEffect, useState } from "react";
import { generateKey } from "@protectedshare/crypto";
import { Spinner } from "@protectedshare/ui";
import { generateRoomId, loadName, loadSession, parseInvite, saveName, type RoomSecret } from "./chat-lib";
import Lobby from "./lobby";
import RoomView from "./room-view";

type Active = { secret: RoomSecret; initialTtl?: number | null; nonce: number };

/**
 * The lobby and the guide are server-rendered so the page has content before JavaScript runs.
 * When the address bar has an invite, or this tab has a saved room session (key "ps.chat.session",
 * see chat-lib), the room opens right after hydration; this runs during HTML parsing and swaps
 * the lobby for a spinner so the join form doesn't flash first. It only reads; nothing is sent.
 */
const JOINING_CLASS = "chat-joining";
const JOINING_SCRIPT = `try{if(location.hash.length>1||sessionStorage.getItem("ps.chat.session"))document.documentElement.classList.add("${JOINING_CLASS}")}catch(e){}`;

/** In-page anchors such as the skip link's `#main-content` name an element; invites never do. */
function isPageAnchor(hash: string): boolean {
  const id = hash.replace(/^#/, "");
  if (!id || id.includes("=") || id.includes(":")) return false;
  try {
    return document.getElementById(decodeURIComponent(id)) !== null;
  } catch {
    return false;
  }
}

/** Reads the invite in the address bar: v2 `#r=…&k=…`, legacy `#room:password`, or a bare room id. */
function fromLocation(): { join?: RoomSecret; prefill?: string } {
  if (isPageAnchor(window.location.hash)) return {};
  const parsed = parseInvite(window.location.hash);
  if (!parsed) return {};
  if (parsed.kind === "key") return { join: { roomId: parsed.roomId, key: parsed.key } };
  if (parsed.kind === "password") return { join: { roomId: parsed.roomId, password: parsed.password } };
  const session = loadSession();
  if (session && session.roomId === parsed.roomId && (session.key || session.password)) return { join: session };
  return { prefill: parsed.roomId };
}

export default function ChatClient({ guide }: { guide?: React.ReactNode }) {
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
    document.documentElement.classList.remove(JOINING_CLASS);

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

  // Same element positions before and after mount, so the lobby isn't remounted on hydration.
  return (
    <>
      {mounted ? null : (
        <>
          <script dangerouslySetInnerHTML={{ __html: JOINING_SCRIPT }} />
          <div className="hidden flex-1 items-center justify-center py-24 text-ink-3 [.chat-joining_&]:flex" role="status">
            <Spinner size={18} label="Loading chat" />
          </div>
        </>
      )}
      <div className={mounted ? "contents" : "contents [.chat-joining_&]:hidden"}>
        <Lobby
          name={name}
          onNameChange={changeName}
          prefillRoomId={prefill}
          onStart={(secret, ttl) => open(secret, ttl)}
          onJoin={(secret) => open(secret)}
        />
        {guide}
      </div>
    </>
  );
}
