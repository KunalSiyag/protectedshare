"use client";

import { useEffect, useMemo, useState } from "react";
import { LogIn, MessageSquarePlus } from "lucide-react";
import { deriveRoomKeys, generateKey } from "@protectedshare/crypto";
import { Badge, Button, Field, Input, Panel, PanelBody, PanelFooter, PanelHeader, Segmented, StatusChip } from "@protectedshare/ui";
import ServerView from "../../components/server-view";
import ToolLayout, { ToolNotes } from "../../components/tool-layout";
import { LOBBY_TTL_OPTIONS, generateRoomId, parseInvite, type RoomSecret } from "./chat-lib";

export type LobbyProps = {
  name: string;
  onNameChange: (name: string) => void;
  prefillRoomId?: string;
  onStart: (secret: RoomSecret, ttlSeconds: number | null) => void;
  onJoin: (secret: RoomSecret) => void;
};

export default function Lobby({ name, onNameChange, prefillRoomId, onStart, onJoin }: LobbyProps) {
  const [draft, setDraft] = useState<{ roomId: string; key: string } | null>(null);
  const [authHash, setAuthHash] = useState<string | null>(null);
  const [ttl, setTtl] = useState("off");
  const [invite, setInvite] = useState(prefillRoomId ?? "");
  const [password, setPassword] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  // A fresh room id and key, made in this browser, so the server view shows the real request.
  useEffect(() => {
    const next = { roomId: generateRoomId(), key: generateKey() };
    setDraft(next);
    let cancelled = false;
    deriveRoomKeys({ key: next.key, roomId: next.roomId })
      .then((keys) => {
        if (!cancelled) setAuthHash(keys.authHash);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (prefillRoomId) setInvite(prefillRoomId);
  }, [prefillRoomId]);

  const ttlSeconds = LOBBY_TTL_OPTIONS.find((option) => option.value === ttl)?.seconds ?? null;
  const parsed = useMemo(() => parseInvite(invite), [invite]);
  const needsPassword = parsed?.kind === "room";

  const join = (event: React.FormEvent) => {
    event.preventDefault();
    setJoinError(null);
    if (!invite.trim()) {
      setJoinError("Paste the invite link, or type the room ID.");
      return;
    }
    if (!parsed) {
      setJoinError("That isn't a room link or ID. Room IDs use letters, numbers, - and _.");
      return;
    }
    if (parsed.kind === "key") onJoin({ roomId: parsed.roomId, key: parsed.key });
    else if (parsed.kind === "password") onJoin({ roomId: parsed.roomId, password: parsed.password });
    else if (!password) setJoinError("This room needs its password.");
    else onJoin({ roomId: parsed.roomId, password });
  };

  return (
    <ToolLayout
      eyebrow="Talk"
      title="Encrypted chat"
      description="Open a private room, send the link, and talk. Messages are encrypted in your browser, so the server only relays ciphertext."
      meta={
        <>
          <StatusChip tone="seal">End-to-end encrypted</StatusChip>
          <Badge>No account</Badge>
          <Badge>Photos and files up to 800 KB</Badge>
        </>
      }
      aside={
        <>
          <ServerView
            endpoint={draft ? `POST /api/chat/${draft.roomId}/claim` : "POST /api/chat/…/claim"}
            outgoing={authHash ? { authHash, ...(ttlSeconds ? { ttlSeconds } : {}) } : null}
            localOnly={[
              { label: "Room key (in the link)", value: draft?.key ?? "" },
              { label: "Your name", value: name.trim() || "Not set" },
            ]}
            note="The server gets a hash it can check, never the key. Your name travels only inside encrypted messages."
          />
          <ToolNotes
            items={[
              "The room key lives after the # in the invite link. Browsers don't send that part to servers.",
              "Compare the 5 safety words with the other person to be sure you hold the same key.",
              "Messages are deleted from the server when everyone leaves, or when someone burns the room.",
              "Disappearing messages are deleted by the server when their timer runs out.",
            ]}
          />
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Panel>
          <PanelHeader
            icon={<MessageSquarePlus aria-hidden="true" />}
            title="Start a room"
            description="A new room with a random key. You'll get an invite link to send."
          />
          <PanelBody className="flex flex-col gap-5">
            <Field label="Your name" htmlFor="chat-name" optional hint="Shown to people in the room. Stored in this browser.">
              <Input
                value={name}
                maxLength={40}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="e.g. Sam"
                autoComplete="nickname"
              />
            </Field>
            <div className="flex flex-col gap-1.5">
              <span id="chat-ttl-label" className="text-small font-medium text-ink">
                Disappearing messages
              </span>
              <Segmented
                aria-labelledby="chat-ttl-label"
                value={ttl}
                onChange={setTtl}
                options={LOBBY_TTL_OPTIONS.map(({ value, label }) => ({ value, label }))}
              />
              <p className="text-small text-ink-3">You can change this later in the room.</p>
            </div>
          </PanelBody>
          <PanelFooter>
            <p className="text-small text-ink-3">Opens the room and makes an invite link.</p>
            <Button
              size="md"
              disabled={!draft}
              onClick={() => draft && onStart({ roomId: draft.roomId, key: draft.key }, ttlSeconds)}
            >
              <MessageSquarePlus aria-hidden="true" />
              Start a room
            </Button>
          </PanelFooter>
        </Panel>

        <Panel>
          <PanelHeader
            icon={<LogIn aria-hidden="true" />}
            title="Join a room"
            description="Paste the invite link someone sent you. Older password rooms work too."
          />
          <form onSubmit={join} noValidate>
            <PanelBody className="flex flex-col gap-4">
              <Field label="Invite link or room ID" htmlFor="chat-invite" error={!needsPassword ? joinError : undefined}>
                <Input
                  mono
                  value={invite}
                  onChange={(event) => {
                    setInvite(event.target.value);
                    setJoinError(null);
                  }}
                  placeholder="https://protectedshare.me/chat#r=…&k=…"
                  autoComplete="off"
                  spellCheck={false}
                />
              </Field>
              {needsPassword ? (
                <Field label="Room password" htmlFor="chat-password" error={joinError} hint="Ask the person who made the room.">
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setJoinError(null);
                    }}
                    autoComplete="off"
                    autoFocus={!!prefillRoomId}
                  />
                </Field>
              ) : null}
            </PanelBody>
            <PanelFooter>
              <p className="text-small text-ink-3">
                {parsed?.kind === "key"
                  ? "Link key found. Ready to join."
                  : parsed?.kind === "password"
                    ? "Older link with a password. Ready to join."
                    : "The key stays in this browser."}
              </p>
              <Button type="submit" variant="secondary">
                <LogIn aria-hidden="true" />
                Join
              </Button>
            </PanelFooter>
          </form>
        </Panel>
      </div>
    </ToolLayout>
  );
}
