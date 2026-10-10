"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { CircleAlert, Flame, ImageUp, Link2, LockKeyhole, PanelRightClose, PanelRightOpen, ShieldCheck, Users } from "lucide-react";
import { Badge, Button, Spinner, cn } from "@protectedshare/ui";
import ConfirmDialog from "../../components/confirm-dialog";
import CopyField from "../../components/copy-field";
import ModalDialog from "../../components/modal-dialog";
import { useToast } from "../../components/toast";
import { copyText } from "../../lib/clipboard";
import { notificationsSupported, playBlip, requestNotifications, showNotification } from "./chat-alerts";
import {
  MAX_ATTACHMENT_BYTES,
  clearSession,
  clearTokens,
  excerptOf,
  formatBytes,
  inviteUrl,
  loadPrefs,
  roomFragment,
  savePrefs,
  saveSession,
  type ChatPrefs,
  type FileAttachment,
  type ReplyRef,
  type RoomSecret,
} from "./chat-lib";
import { prepareAttachment } from "./chat-media";
import Composer, { type ComposerHandle } from "./composer";
import MessageList from "./message-list";
import RoomInfo, { VerifySheet } from "./room-info";
import { useRoom, type ChatMessage, type Connection, type IncomingNotice } from "./use-room";

export type RoomViewProps = {
  secret: RoomSecret;
  initialTtl?: number | null;
  name: string;
  onNameChange: (name: string) => void;
  /** Back to the lobby. `prefillRoomId` keeps the room id in the join form (wrong password). */
  onExit: (options?: { prefillRoomId?: string; startNew?: boolean }) => void;
};

function ConnectionDot({ connection }: { connection: Connection }) {
  const map: Record<Connection, { label: string; dot: string; text: string }> = {
    connecting: { label: "Connecting", dot: "bg-ink-3", text: "text-ink-3" },
    live: { label: "Live", dot: "bg-ok", text: "text-ink-3" },
    polling: { label: "Reconnecting", dot: "bg-warn animate-pulse", text: "text-warn" },
    offline: { label: "Offline", dot: "bg-danger", text: "text-danger" },
  };
  const state = map[connection];
  return (
    <span className={cn("inline-flex items-center gap-1.5", state.text)} title={connection === "polling" ? "Live stream dropped. Checking for messages every 1.5 s." : undefined}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", state.dot)} />
      {state.label}
    </span>
  );
}

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px] animate-rise text-center">{children}</div>
    </div>
  );
}

export default function RoomView({ secret, initialTtl, name, onNameChange, onExit }: RoomViewProps) {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<ChatPrefs>(() => loadPrefs());
  const [notifyBlocked, setNotifyBlocked] = useState(false);
  const [unread, setUnread] = useState(0);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const onIncoming = useCallback(
    (notice: IncomingNotice) => {
      const hidden = document.visibilityState === "hidden";
      const unfocused = hidden || !document.hasFocus();
      if (hidden) setUnread((count) => count + 1);
      if (prefsRef.current.sound && unfocused) playBlip();
      if (prefsRef.current.notify && hidden) showNotification(secret.roomId, notice.name);
    },
    [secret.roomId]
  );

  const room = useRoom({ ...secret, initialTtl, name, onIncoming });
  const composerRef = useRef<ComposerHandle>(null);
  const [replyTo, setReplyTo] = useState<ReplyRef | null>(null);
  const [editing, setEditing] = useState<{ mid: string; body: string } | null>(null);
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const [scrollSignal, setScrollSignal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<ChatMessage | null>(null);
  const [confirmBurn, setConfirmBurn] = useState(false);
  const [burning, setBurning] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const sheetId = useId();

  const invite = useMemo(
    () => (typeof window === "undefined" ? "" : inviteUrl(window.location.origin, { roomId: secret.roomId, key: secret.key })),
    [secret.roomId, secret.key]
  );

  // Keep the room in the address bar and in this tab's session (30 min restore window).
  useEffect(() => {
    if (room.phase !== "ready") return;
    saveSession(secret);
    const fragment = `#${roomFragment(secret)}`;
    if (window.location.hash !== fragment) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${fragment}`);
    }
  }, [room.phase, secret]);

  useEffect(() => {
    if (room.phase !== "burned") return;
    clearSession();
    clearTokens(secret.roomId);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setVerifyOpen(false);
    setInfoOpen(false);
    setConfirmDelete(null);
  }, [room.phase, secret.roomId]);

  // Unread count in the tab title while hidden.
  const baseTitle = useRef<string | null>(null);
  useEffect(() => {
    baseTitle.current ??= document.title.replace(/^\(\d+\)\s*/, "");
    const onVisible = () => {
      if (document.visibilityState === "visible") setUnread(0);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (baseTitle.current) document.title = baseTitle.current;
    };
  }, []);
  useEffect(() => {
    if (!baseTitle.current) return;
    document.title = unread > 0 ? `(${unread}) ${baseTitle.current}` : baseTitle.current;
  }, [unread]);

  useEffect(() => {
    if (notificationsSupported() && Notification.permission === "denied") setNotifyBlocked(true);
  }, []);

  const updatePrefs = useCallback(
    async (next: ChatPrefs) => {
      if (next.notify && !prefs.notify) {
        const granted = await requestNotifications();
        if (!granted) {
          setNotifyBlocked(notificationsSupported() && Notification.permission === "denied");
          toast({ title: "Notifications are off", description: "Your browser didn't allow them for this site.", tone: "danger" });
          next = { ...next, notify: false };
        }
      }
      if (next.sound && !prefs.sound) playBlip();
      setPrefs(next);
      savePrefs(next);
    },
    [prefs.notify, prefs.sound, toast]
  );

  /* ───────────── attachments ───────────── */

  const handleFiles = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file || editing) return;
      if (files.length > 1) toast({ title: "One file at a time", description: `Attached ${file.name}.` });
      setPreparing(true);
      try {
        setAttachment(await prepareAttachment(file));
        composerRef.current?.focus();
      } catch (caught) {
        toast({
          title: "Couldn't attach that file",
          description: caught instanceof Error ? caught.message : `Files can be up to ${formatBytes(MAX_ATTACHMENT_BYTES)}.`,
          tone: "danger",
        });
      } finally {
        setPreparing(false);
      }
    },
    [editing, toast]
  );

  /* ───────────── message actions ───────────── */

  const onReply = useCallback((message: ChatMessage) => {
    setEditing(null);
    setReplyTo({ mid: message.mid, name: message.self ? "yourself" : message.name, excerpt: excerptOf(message.body, message.file) });
    composerRef.current?.focus();
  }, []);

  const onEdit = useCallback((message: ChatMessage) => {
    setReplyTo(null);
    setAttachment(null);
    setEditing({ mid: message.mid, body: message.body });
  }, []);

  const { messages, react, retry, discard } = room;

  const onEditLast = useCallback(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.self && message.kind === "msg" && message.body && message.serverId) {
        onEdit(message);
        return;
      }
    }
  }, [messages, onEdit]);

  const onReact = useCallback(
    (message: ChatMessage, key: Parameters<typeof react>[1]) => {
      react(message.mid, key).catch(() => toast({ title: "Reaction didn't send", tone: "danger" }));
    },
    [react, toast]
  );

  const onCopy = useCallback(
    async (message: ChatMessage) => {
      const ok = await copyText(message.body);
      toast(ok ? { title: "Copied", tone: "ok", duration: 1800 } : { title: "Couldn't copy", tone: "danger" });
    },
    [toast]
  );

  const onRetry = useCallback((message: ChatMessage) => retry(message.mid), [retry]);
  const onDiscard = useCallback((message: ChatMessage) => discard(message.mid), [discard]);
  const onDelete = useCallback((message: ChatMessage) => setConfirmDelete(message), []);

  const onSubmit = useCallback(
    async (body: string) => {
      if (editing) {
        const original = messages.find((message) => message.mid === editing.mid);
        if (!body.trim() || body === original?.body) {
          setEditing(null);
          return true;
        }
        const target = editing.mid;
        setEditing(null);
        try {
          await room.edit(target, body);
        } catch {
          toast({ title: "Edit didn't save", description: "Check your connection and try again.", tone: "danger" });
        }
        return true;
      }
      room.send({ body: body.trim() ? body : "", reply: replyTo ?? undefined, file: attachment ?? undefined });
      setReplyTo(null);
      setAttachment(null);
      setScrollSignal((value) => value + 1);
      return true;
    },
    [attachment, editing, messages, replyTo, room, toast]
  );

  const copyInvite = async () => {
    const ok = await copyText(invite);
    toast(
      ok
        ? {
            title: "Invite link copied",
            description: secret.password ? "Send the password separately." : "Anyone with it can join this room.",
            tone: "ok",
          }
        : { title: "Couldn't copy", description: "Open room info to copy the link by hand.", tone: "danger" }
    );
  };

  const leave = async () => {
    await room.leave();
    clearSession();
    clearTokens(secret.roomId);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    onExit();
  };

  const toggleRail = () => {
    const next = { ...prefs, rail: !prefs.rail };
    setPrefs(next);
    savePrefs(next);
  };

  const infoProps = {
    roomId: secret.roomId,
    invite,
    password: secret.password,
    safetyWords: room.safetyWords,
    onlineCount: room.presence?.onlineCount ?? 1,
    people: room.people,
    displayName: room.displayName,
    name,
    onNameChange,
    ttlSeconds: room.ttlSeconds,
    onTtlChange: (seconds: number | null) => {
      room.setRoomTtl(seconds).catch((caught: unknown) =>
        toast({ title: "Timer didn't change", description: caught instanceof Error ? caught.message : undefined, tone: "danger" })
      );
    },
    prefs,
    onPrefsChange: (next: ChatPrefs) => void updatePrefs(next),
    notifyBlocked,
    onVerify: () => {
      setInfoOpen(false);
      setVerifyOpen(true);
    },
    onLeave: () => void leave(),
    onBurn: () => {
      setInfoOpen(false);
      setConfirmBurn(true);
    },
  };

  /* ───────────── states before/after the room ───────────── */

  let body: React.ReactNode;
  if (room.phase === "deriving" || room.phase === "claiming") {
    body = (
      <CenterCard>
        <span className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink-2">
          <Spinner size={18} />
        </span>
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink" role="status">
          {room.phase === "deriving" ? "Deriving the room key" : "Opening the room"}
        </h2>
        <p className="mt-1.5 text-small text-ink-3">
          {room.phase === "deriving" && secret.password
            ? "Stretching the password in this browser. This takes a moment on purpose."
            : "Keys are made in this browser. Only a hash of the room key goes to the server."}
        </p>
      </CenterCard>
    );
  } else if (room.phase === "error") {
    body = (
      <CenterCard>
        <span className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-danger-soft text-danger">
          <CircleAlert aria-hidden="true" className="size-5" />
        </span>
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">Couldn&apos;t open this room</h2>
        <p role="alert" className="mt-1.5 text-small text-ink-2">
          {room.error}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onExit({ prefillRoomId: secret.password ? secret.roomId : undefined })}>
            Back
          </Button>
          <Button size="sm" onClick={room.retryJoin}>
            Try again
          </Button>
        </div>
      </CenterCard>
    );
  } else if (room.phase === "burned") {
    body = (
      <CenterCard>
        <span className="mx-auto mb-4 flex size-12 animate-stamp items-center justify-center rounded-full bg-seal-soft text-seal">
          <Flame aria-hidden="true" className="size-[22px]" strokeWidth={1.9} />
        </span>
        <h2 className="text-h3 text-ink" role="status">
          This room was burned
        </h2>
        <p className="mt-2 text-ui text-ink-2">
          Every message was deleted from the server and cleared from this tab. Opening the old invite link now starts an empty room.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" onClick={() => onExit()}>
            Back to chat
          </Button>
          <Button onClick={() => onExit({ startNew: true })}>Start a new room</Button>
        </div>
      </CenterCard>
    );
  }

  const ready = room.phase === "ready";
  const online = room.presence?.onlineCount ?? 1;
  const railOpen = prefs.rail;

  const emptyRoom = (
    <div className="w-full max-w-[420px] animate-rise text-center">
      <span className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full border border-line bg-surface text-ink-2 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
        <LockKeyhole aria-hidden="true" className="size-5" strokeWidth={1.75} />
      </span>
      <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{online > 1 ? "Say hello" : "The room is open"}</h2>
      <p className="mx-auto mt-1.5 max-w-[36ch] text-small text-ink-3">
        {online > 1
          ? `${online - 1} other ${online === 2 ? "person is" : "people are"} here. Messages are encrypted in this browser before they're sent.`
          : "Send the invite to someone you trust. Messages are encrypted in this browser before they're sent."}
      </p>
      {online <= 1 ? (
        <div className="mt-5 text-left">
          <CopyField value={invite} hint={secret.password ? "They'll also need the password." : undefined} />
        </div>
      ) : null}
      <Button variant="ghost" size="sm" className="mt-3" onClick={() => setVerifyOpen(true)}>
        <ShieldCheck aria-hidden="true" />
        Verify safety words
      </Button>
    </div>
  );

  return (
    <div className="mx-auto flex h-[calc(100dvh-92px)] min-h-[460px] w-full max-w-content flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.03)] md:h-[calc(100dvh-108px)]">
      {/* Header */}
      <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-4">
        <span className="hidden size-9 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface-2/60 text-ink-2 sm:flex">
          <LockKeyhole aria-hidden="true" className="size-[17px]" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="flex min-w-0 items-center gap-2 text-[15px] font-semibold leading-5 tracking-[-0.01em] text-ink">
            <span className="truncate">Encrypted room</span>
            <span className="hidden truncate rounded-[6px] bg-ink/[0.05] px-1.5 py-px font-mono text-meta font-normal text-ink-2 sm:inline">{secret.roomId}</span>
          </h1>
          <p className="mt-0.5 flex items-center gap-2.5 text-meta text-ink-3">
            {ready ? (
              <>
                <span className="inline-flex items-center gap-1">
                  <Users aria-hidden="true" className="size-3" />
                  <span className="tabular">{online}</span> online
                </span>
                <span aria-hidden="true">·</span>
                {room.othersTyping > 0 ? <span className="text-ink-2">typing…</span> : <ConnectionDot connection={room.connection} />}
                {room.ttlSeconds ? (
                  <Badge className="hidden sm:inline-flex" tone="neutral">
                    Disappearing
                  </Badge>
                ) : null}
              </>
            ) : room.phase === "burned" ? (
              "Burned"
            ) : (
              "Connecting"
            )}
          </p>
        </div>
        {ready ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="secondary" size="sm" onClick={copyInvite} className="max-sm:size-9 max-sm:px-0" aria-label="Copy invite link">
              <Link2 aria-hidden="true" />
              <span className="max-sm:sr-only">Invite</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setVerifyOpen(true)} className="max-sm:size-9 max-sm:px-0" aria-label="Verify safety words">
              <ShieldCheck aria-hidden="true" />
              <span className="max-sm:sr-only">Verify</span>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleRail}
              aria-label={railOpen ? "Hide room info" : "Show room info"}
              aria-pressed={railOpen}
              className="hidden lg:inline-flex"
            >
              {railOpen ? <PanelRightClose aria-hidden="true" /> : <PanelRightOpen aria-hidden="true" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setInfoOpen(true)}
              aria-label="Room info"
              aria-haspopup="dialog"
              className="size-9 lg:hidden"
            >
              <PanelRightOpen aria-hidden="true" />
            </Button>
          </div>
        ) : null}
      </header>

      {ready ? (
        <div className="flex min-h-0 flex-1">
          <div
            className="relative flex min-w-0 flex-1 flex-col bg-bg"
            onDragEnter={(event) => {
              if (!event.dataTransfer.types.includes("Files")) return;
              event.preventDefault();
              dragDepth.current += 1;
              setDragging(true);
            }}
            onDragOver={(event) => {
              if (event.dataTransfer.types.includes("Files")) event.preventDefault();
            }}
            onDragLeave={() => {
              dragDepth.current = Math.max(0, dragDepth.current - 1);
              if (dragDepth.current === 0) setDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              dragDepth.current = 0;
              setDragging(false);
              const files = Array.from(event.dataTransfer.files ?? []);
              if (files.length) void handleFiles(files);
            }}
          >
            <MessageList
              messages={room.messages}
              reactions={room.reactions}
              now={room.now}
              othersTyping={room.othersTyping}
              empty={emptyRoom}
              scrollSignal={scrollSignal}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onReact={onReact}
              onCopy={onCopy}
              onRetry={onRetry}
              onDiscard={onDiscard}
            />
            <Composer
              ref={composerRef}
              replyTo={replyTo}
              editing={editing}
              attachment={attachment}
              preparing={preparing}
              ttlSeconds={room.ttlSeconds}
              onCancelReply={() => setReplyTo(null)}
              onCancelEdit={() => setEditing(null)}
              onRemoveAttachment={() => setAttachment(null)}
              onFiles={(files) => void handleFiles(files)}
              onSubmit={onSubmit}
              onTyping={room.setTyping}
              onEditLast={onEditLast}
            />
            {dragging ? (
              <div className="pointer-events-none absolute inset-2 z-20 flex animate-fade-in flex-col items-center justify-center gap-2 rounded-[12px] border-2 border-dashed border-ink-3/60 bg-surface/90 text-center backdrop-blur-[2px]">
                <ImageUp aria-hidden="true" className="size-7 text-ink-2" strokeWidth={1.6} />
                <p className="text-ui font-medium text-ink">Drop to attach</p>
                <p className="text-small text-ink-3">Encrypted before it leaves this browser · up to {formatBytes(MAX_ATTACHMENT_BYTES)}</p>
              </div>
            ) : null}
          </div>
          {railOpen ? (
            <aside aria-label="Room info" className="hidden w-[336px] shrink-0 overflow-y-auto border-l border-line bg-surface lg:block">
              <RoomInfo {...infoProps} />
            </aside>
          ) : null}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col bg-bg">{body}</div>
      )}

      {infoOpen && ready ? (
        <ModalDialog
          titleId={`${sheetId}-title`}
          onClose={() => setInfoOpen(false)}
          panelClassName="fixed inset-x-0 bottom-0 flex max-h-[88dvh] w-full animate-rise flex-col rounded-t-[18px] border border-line bg-surface shadow-float sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:max-h-[calc(100dvh-32px)] sm:w-[380px] sm:rounded-panel"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-line px-5 py-3">
            <h2 id={`${sheetId}-title`} className="text-[15px] font-semibold text-ink">
              Room info
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setInfoOpen(false)}>
              Done
            </Button>
          </div>
          <div className="min-h-0 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
            <RoomInfo {...infoProps} />
          </div>
        </ModalDialog>
      ) : null}

      {verifyOpen && room.safetyWords.length ? <VerifySheet words={room.safetyWords} onClose={() => setVerifyOpen(false)} /> : null}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete for everyone?"
        description="The message is removed from the server and from everyone's screen. Anyone who already read it may remember it."
        confirmLabel="Delete"
        tone="danger"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          const target = confirmDelete;
          setConfirmDelete(null);
          if (target) {
            if (editing?.mid === target.mid) setEditing(null);
            room.remove(target.mid).catch(() => toast({ title: "Couldn't delete it", tone: "danger" }));
          }
        }}
      />
      <ConfirmDialog
        open={confirmBurn}
        title="Burn this room?"
        description="Every message and the room itself are deleted from the server for everyone. People still here see that the room was burned. This can't be undone."
        confirmLabel="Burn room"
        tone="danger"
        loading={burning}
        onCancel={() => setConfirmBurn(false)}
        onConfirm={async () => {
          setBurning(true);
          try {
            await room.burn();
            setConfirmBurn(false);
          } catch (caught) {
            toast({ title: "Couldn't burn the room", description: caught instanceof Error ? caught.message : undefined, tone: "danger" });
          } finally {
            setBurning(false);
          }
        }}
      />
    </div>
  );
}
