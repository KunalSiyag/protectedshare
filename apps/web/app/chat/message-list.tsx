"use client";

import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  Check,
  CheckCheck,
  Clock,
  Copy,
  CornerUpLeft,
  Download,
  FileText,
  MoreHorizontal,
  Pencil,
  RotateCw,
  SmilePlus,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { Button, cn } from "@protectedshare/ui";
import ModalDialog from "../../components/modal-dialog";
import {
  NAME_TONES,
  dayKey,
  dayLabel,
  describeTtl,
  formatBytes,
  formatFullTime,
  formatRemaining,
  formatTime,
  initials,
  type FileAttachment,
  type ReactionKey,
} from "./chat-lib";
import { base64ToBlob, downloadAttachment, isInlineImage } from "./chat-media";
import { REACTIONS, reactionMeta } from "./reactions";
import { RichText } from "./rich-text";
import type { ChatMessage, ReactionSummary } from "./use-room";

const GROUP_GAP_MS = 5 * 60 * 1000;

export type MessageActions = {
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onReact: (message: ChatMessage, key: ReactionKey) => void;
  onCopy: (message: ChatMessage) => void;
  onRetry: (message: ChatMessage) => void;
  onDiscard: (message: ChatMessage) => void;
};

type MessageListProps = MessageActions & {
  messages: ChatMessage[];
  reactions: Record<string, ReactionSummary[]>;
  now: number;
  othersTyping: number;
  empty: ReactNode;
  /** Bumped by the composer so the list jumps to the bottom after you send. */
  scrollSignal: number;
};

/* ───────────────────────── Attachments ───────────────────────── */

/** Object URL for an inline image. Created in an effect so StrictMode's re-run gets a fresh one. */
export function useObjectUrl(file: FileAttachment | undefined | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file || !isInlineImage(file)) {
      setUrl(null);
      return;
    }
    let next: string | null = null;
    try {
      next = URL.createObjectURL(base64ToBlob(file.data, file.type));
    } catch {
      next = null;
    }
    setUrl(next);
    return () => {
      if (next) URL.revokeObjectURL(next);
    };
  }, [file]);
  return url;
}

function ImageAttachment({ file, url, onOpen }: { file: FileAttachment; url: string | null; onOpen: () => void }) {
  const maxWidth = 300;
  const ratio = file.w && file.h ? file.h / file.w : 0.75;
  const width = Math.min(maxWidth, file.w ?? maxWidth);
  const height = Math.min(Math.round(width * ratio), 380);
  const finalWidth = ratio > 0 && height === 380 ? Math.round(380 / ratio) : width;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group/image block overflow-hidden rounded-[13px] outline-none focus-visible:ring-2 focus-visible:ring-seal/45"
      aria-label={`Open image ${file.name}`}
    >
      {url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={file.name}
        width={finalWidth}
        height={Math.round(finalWidth * ratio)}
        style={{ width: finalWidth, maxWidth: "100%", height: "auto", aspectRatio: file.w && file.h ? `${file.w} / ${file.h}` : undefined }}
        className="block bg-surface-2 object-cover transition-opacity duration-150 group-hover/image:opacity-95"
        draggable={false}
      />
      ) : (
        <span className="block max-w-full bg-surface-2" style={{ width: finalWidth, aspectRatio: `${file.w ?? 4} / ${file.h ?? 3}` }} />
      )}
    </button>
  );
}

function FileChip({ file, self }: { file: FileAttachment; self: boolean }) {
  return (
    <div className={cn("flex min-w-[220px] max-w-full items-center gap-3 rounded-[12px] p-2 pr-2", self ? "bg-on-ink/[0.1]" : "border border-line bg-surface-2/60")}>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-[9px]", self ? "bg-on-ink/[0.12]" : "bg-surface border border-line")}>
        <FileText aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-medium">{file.name}</p>
        <p className={cn("text-meta", self ? "text-on-ink/70" : "text-ink-3")}>{formatBytes(file.size)} · encrypted</p>
      </div>
      <button
        type="button"
        onClick={() => downloadAttachment(file)}
        aria-label={`Download ${file.name}`}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-[8px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-seal/45",
          self ? "hover:bg-on-ink/[0.14]" : "hover:bg-ink/[0.06]"
        )}
      >
        <Download aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

function Lightbox({ file, url, onClose }: { file: FileAttachment; url: string; onClose: () => void }) {
  const id = useId();
  return (
    <ModalDialog
      titleId={`${id}-title`}
      onClose={onClose}
      panelClassName="relative flex max-h-[calc(100dvh-32px)] w-auto max-w-[min(1200px,calc(100vw-32px))] animate-rise flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-float"
    >
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <h2 id={`${id}-title`} className="min-w-0 flex-1 truncate text-small font-medium text-ink">
          {file.name}
          <span className="ml-2 font-normal text-ink-3">{formatBytes(file.size)}</span>
        </h2>
        <Button variant="ghost" size="sm" onClick={() => downloadAttachment(file)}>
          <Download aria-hidden="true" />
          Save
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close image">
          <X aria-hidden="true" />
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center bg-surface-2/60 p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={file.name} className="max-h-[calc(100dvh-110px)] max-w-full rounded-[8px] object-contain" />
      </div>
    </ModalDialog>
  );
}

/* ───────────────────────── Menus ───────────────────────── */

function ReactionPicker({ onPick, mine, className }: { onPick: (key: ReactionKey) => void; mine: Set<ReactionKey>; className?: string }) {
  return (
    <div role="group" aria-label="Reactions" className={cn("flex items-center gap-0.5", className)}>
      {REACTIONS.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onPick(key)}
          aria-label={label}
          aria-pressed={mine.has(key)}
          title={label}
          className={cn(
            "flex size-8 items-center justify-center rounded-[8px] text-ink-2 outline-none transition-[background-color,color,transform] duration-150 ease-seal hover:scale-110 hover:bg-ink/[0.06] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45 active:scale-95",
            mine.has(key) && "bg-ink/[0.07] text-ink"
          )}
        >
          <Icon aria-hidden="true" className="size-[17px]" strokeWidth={1.9} />
        </button>
      ))}
    </div>
  );
}

type MenuItem = { label: string; icon: ReactNode; onSelect: () => void; danger?: boolean };

function menuItems(message: ChatMessage, actions: MessageActions): MenuItem[] {
  const items: MenuItem[] = [];
  const failed = message.status === "failed";
  if (!failed) items.push({ label: "Reply", icon: <CornerUpLeft aria-hidden="true" />, onSelect: () => actions.onReply(message) });
  if (message.body) items.push({ label: "Copy text", icon: <Copy aria-hidden="true" />, onSelect: () => actions.onCopy(message) });
  if (message.self && message.body && !failed && message.serverId)
    items.push({ label: "Edit", icon: <Pencil aria-hidden="true" />, onSelect: () => actions.onEdit(message) });
  if (failed) {
    items.push({ label: "Retry", icon: <RotateCw aria-hidden="true" />, onSelect: () => actions.onRetry(message) });
    items.push({ label: "Discard", icon: <Trash2 aria-hidden="true" />, onSelect: () => actions.onDiscard(message), danger: true });
  } else if (message.self && message.serverId) {
    items.push({ label: "Delete for everyone", icon: <Trash2 aria-hidden="true" />, onSelect: () => actions.onDelete(message), danger: true });
  }
  return items;
}

function MoreMenu({ items, onClose, align }: { items: MenuItem[]; onClose: () => void; align: "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  // Opens toward the message's outer edge; on narrow screens shift it back inside the viewport.
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    const menu = ref.current;
    if (!menu) return;
    const rect = menu.getBoundingClientRect();
    const margin = 8;
    if (rect.left < margin) setShift(margin - rect.left);
    else if (rect.right > window.innerWidth - margin) setShift(window.innerWidth - margin - rect.right);
  }, []);
  useEffect(() => {
    const first = ref.current?.querySelector<HTMLButtonElement>("button");
    first?.focus();
    const onDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const buttons = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === "ArrowDown" ? (index + 1) % buttons.length : (index - 1 + buttons.length) % buttons.length;
        buttons[next]?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);
  return (
    <div
      ref={ref}
      role="menu"
      style={shift ? { translate: `${shift}px 0` } : undefined}
      className={cn(
        "absolute top-full z-30 mt-1 w-52 animate-drop rounded-[12px] border border-line bg-surface p-1 shadow-float",
        align === "right" ? "right-0" : "left-0"
      )}
    >
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          onClick={() => {
            onClose();
            item.onSelect();
          }}
          className={cn(
            "flex h-9 w-full items-center gap-2.5 rounded-[8px] px-2.5 text-left text-small outline-none transition-colors [&_svg]:size-[15px] [&_svg]:shrink-0",
            item.danger ? "text-danger hover:bg-danger-soft focus-visible:bg-danger-soft" : "text-ink hover:bg-ink/[0.05] focus-visible:bg-ink/[0.05]"
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

function ActionSheet({
  message,
  actions,
  mine,
  onClose,
}: {
  message: ChatMessage;
  actions: MessageActions;
  mine: Set<ReactionKey>;
  onClose: () => void;
}) {
  const id = useId();
  const items = menuItems(message, actions);
  return (
    <ModalDialog
      titleId={`${id}-title`}
      onClose={onClose}
      panelClassName="fixed inset-x-0 bottom-0 w-full animate-rise rounded-t-[18px] border border-line bg-surface p-3 pb-[max(12px,env(safe-area-inset-bottom))] shadow-float sm:static sm:max-w-[360px] sm:rounded-panel"
    >
      <h2 id={`${id}-title`} className="sr-only">
        Message actions
      </h2>
      <div aria-hidden="true" className="mx-auto mb-3 h-1 w-9 rounded-full bg-line-strong sm:hidden" />
      {message.status !== "failed" ? (
        <div className="mb-2 flex justify-center rounded-[14px] border border-line bg-surface-2/50 p-1.5">
          <ReactionPicker
            mine={mine}
            onPick={(key) => {
              onClose();
              actions.onReact(message, key);
            }}
            className="w-full justify-between [&_button]:size-11"
          />
        </div>
      ) : null}
      <div className="flex flex-col">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              onClose();
              item.onSelect();
            }}
            className={cn(
              "flex h-12 items-center gap-3 rounded-[10px] px-3 text-ui outline-none [&_svg]:size-[18px]",
              item.danger ? "text-danger active:bg-danger-soft" : "text-ink active:bg-ink/[0.05]",
              "focus-visible:bg-ink/[0.05]"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </ModalDialog>
  );
}

/* ───────────────────────── Message row ───────────────────────── */

type RowProps = {
  message: ChatMessage;
  reactions?: ReactionSummary[];
  groupStart: boolean;
  groupEnd: boolean;
  showStatus: boolean;
  now: number;
  actions: MessageActions;
  onJumpTo: (mid: string) => void;
  onOpenImage: (file: FileAttachment, url: string) => void;
};

const StatusLine = ({ message }: { message: ChatMessage }) => {
  if (message.status === "sending")
    return (
      <span className="inline-flex items-center gap-1">
        <Clock aria-hidden="true" className="size-3" /> Sending
      </span>
    );
  if (message.status === "sent")
    return (
      <span className="inline-flex items-center gap-1" title="The server accepted it">
        <Check aria-hidden="true" className="size-3.5" /> Sent
      </span>
    );
  if (message.status === "delivered")
    return (
      <span className="inline-flex items-center gap-1" title="It reached the room's live stream. Read receipts are not tracked.">
        <CheckCheck aria-hidden="true" className="size-3.5" /> Delivered
      </span>
    );
  return null;
};

const MessageRow = memo(function MessageRow({
  message,
  reactions,
  groupStart,
  groupEnd,
  showStatus,
  now,
  actions,
  onJumpTo,
  onOpenImage,
}: RowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [swipe, setSwipe] = useState(0);
  const touch = useRef<{ x: number; y: number; timer?: number; moved: boolean; long: boolean } | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  // The picker opens toward the message's outer edge; on narrow screens shift it back inside the viewport.
  const pickerPanelRef = useRef<HTMLDivElement>(null);
  const [pickerShift, setPickerShift] = useState(0);
  useLayoutEffect(() => {
    if (!pickerOpen) {
      setPickerShift(0);
      return;
    }
    const panel = pickerPanelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const margin = 8;
    if (rect.left < margin) setPickerShift(margin - rect.left);
    else if (rect.right > window.innerWidth - margin) setPickerShift(window.innerWidth - margin - rect.right);
  }, [pickerOpen]);
  const url = useObjectUrl(message.file);
  const self = message.self;
  const tone = NAME_TONES[message.color % NAME_TONES.length];
  const mine = useMemo(() => new Set((reactions ?? []).filter((r) => r.mine).map((r) => r.key)), [reactions]);
  const failed = message.status === "failed";
  const hasImage = Boolean(message.file && isInlineImage(message.file));
  const hasFile = Boolean(message.file && !hasImage);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = (event: PointerEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) setPickerOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setPickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [pickerOpen]);

  const onTouchStart = (event: React.TouchEvent) => {
    if (failed && !message.body) return;
    const point = event.touches[0];
    const state = { x: point.clientX, y: point.clientY, moved: false, long: false, timer: undefined as number | undefined };
    state.timer = window.setTimeout(() => {
      state.long = true;
      navigator.vibrate?.(8);
      setSheetOpen(true);
    }, 430);
    touch.current = state;
  };
  const onTouchMove = (event: React.TouchEvent) => {
    const state = touch.current;
    if (!state) return;
    const point = event.touches[0];
    const dx = point.clientX - state.x;
    const dy = point.clientY - state.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      state.moved = true;
      window.clearTimeout(state.timer);
    }
    if (!failed && Math.abs(dx) > Math.abs(dy) * 1.4 && dx > 0) setSwipe(Math.min(dx, 84));
  };
  const onTouchEnd = () => {
    const state = touch.current;
    if (state) window.clearTimeout(state.timer);
    if (swipe > 60) {
      navigator.vibrate?.(6);
      actions.onReply(message);
    }
    setSwipe(0);
    touch.current = null;
  };

  const radius = self
    ? cn("rounded-[18px]", !groupStart && "rounded-tr-[6px]", !groupEnd && "rounded-br-[6px]")
    : cn("rounded-[18px]", !groupStart && "rounded-tl-[6px]", !groupEnd && "rounded-bl-[6px]");

  const remaining = message.expiresAt ? message.expiresAt - now : null;

  return (
    <li
      data-mid={message.mid}
      className={cn("group/row relative flex w-full items-end gap-2 px-3 sm:px-5", groupStart ? "mt-3" : "mt-[3px]", self ? "justify-end" : "justify-start")}
    >
      {!self ? (
        <div className="w-7 shrink-0 self-end" aria-hidden="true">
          {groupEnd ? (
            <span className={cn("flex size-7 items-center justify-center rounded-full text-[11px] font-semibold", tone.avatar)}>
              {initials(message.name)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn("relative flex min-w-0 max-w-[min(560px,82%)] flex-col", self ? "items-end" : "items-start")}
        style={swipe ? { transform: `translateX(${swipe}px)` } : undefined}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        onContextMenu={(event) => {
          if (touch.current?.long) event.preventDefault();
        }}
      >
        {swipe > 0 ? (
          <span
            aria-hidden="true"
            className={cn(
              "absolute -left-9 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-ink/[0.06] text-ink-2 transition-opacity",
              swipe > 60 ? "opacity-100" : "opacity-50"
            )}
          >
            <CornerUpLeft className="size-3.5" />
          </span>
        ) : null}

        {!self && groupStart ? (
          <span className={cn("mb-1 ml-3 flex items-center gap-1.5 text-meta font-semibold", tone.text)}>
            {message.name}
            {message.legacy ? <span className="rounded-[4px] bg-ink/[0.06] px-1 text-[10px] font-medium text-ink-3">older app</span> : null}
          </span>
        ) : null}

        <div className={cn("relative flex items-center gap-1", self ? "flex-row-reverse" : "flex-row")}>
          <div
            data-bubble=""
            title={formatFullTime(message.createdAt)}
            className={cn(
              "relative min-w-0 select-text text-ui [overflow-wrap:anywhere]",
              radius,
              self ? "bg-ink text-on-ink" : "border border-line bg-surface text-ink shadow-[0_1px_0_rgb(0_0_0/0.02)]",
              hasImage && !message.body && !message.reply ? "p-1" : hasImage || hasFile ? "p-1.5" : "px-3.5 py-2",
              failed && "opacity-60",
              message.status === "sending" && "opacity-[0.86]"
            )}
          >
            {message.reply ? (
              <button
                type="button"
                onClick={() => onJumpTo(message.reply!.mid)}
                className={cn(
                  "mb-1.5 flex w-full min-w-0 max-w-[420px] flex-col rounded-[10px] px-2.5 py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-seal/45",
                  self ? "bg-on-ink/[0.1] hover:bg-on-ink/[0.14]" : "bg-surface-2 hover:bg-ink/[0.06]",
                  (hasImage || hasFile) && "mx-0.5 mt-0.5 w-auto"
                )}
              >
                <span className={cn("flex items-center gap-1 text-meta font-semibold", self ? "text-on-ink/80" : "text-ink-2")}>
                  <CornerUpLeft aria-hidden="true" className="size-3" />
                  {message.reply.name}
                </span>
                <span className={cn("line-clamp-2 text-small", self ? "text-on-ink/70" : "text-ink-3")}>{message.reply.excerpt}</span>
              </button>
            ) : null}
            {message.file && hasImage ? (
              <ImageAttachment file={message.file} url={url} onOpen={() => url && onOpenImage(message.file!, url)} />
            ) : null}
            {message.file && hasFile ? <FileChip file={message.file} self={self} /> : null}
            {message.body ? (
              <div className={cn("whitespace-pre-wrap", (hasImage || hasFile) && "px-2 pb-1 pt-1.5")}>
                <RichText text={message.body} self={self} />
                {message.edited ? <span className={cn("ml-1.5 text-meta", self ? "text-on-ink/60" : "text-ink-3")}>edited</span> : null}
              </div>
            ) : null}
          </div>

          {/* Hover toolbar (pointer devices) */}
          {!failed ? (
            <div
              className={cn(
                "hidden [@media(pointer:fine)]:flex shrink-0 items-center gap-0.5 rounded-[10px] border border-line bg-surface p-0.5 opacity-0 shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-opacity duration-150 group-hover/row:opacity-100 group-focus-within/row:opacity-100",
                (menuOpen || pickerOpen) && "opacity-100"
              )}
            >
              <div ref={pickerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setPickerOpen((open) => !open)}
                  aria-label="Add reaction"
                  aria-expanded={pickerOpen}
                  className="flex size-7 items-center justify-center rounded-[7px] text-ink-3 outline-none hover:bg-ink/[0.06] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
                >
                  <SmilePlus aria-hidden="true" className="size-[15px]" />
                </button>
                {pickerOpen ? (
                  <div
                    ref={pickerPanelRef}
                    style={pickerShift ? { translate: `${pickerShift}px 0` } : undefined}
                    className={cn(
                      "absolute bottom-full z-30 mb-1.5 animate-drop rounded-[12px] border border-line bg-surface p-1 shadow-float",
                      self ? "right-0" : "left-0"
                    )}
                  >
                    <ReactionPicker
                      mine={mine}
                      onPick={(key) => {
                        setPickerOpen(false);
                        actions.onReact(message, key);
                      }}
                    />
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => actions.onReply(message)}
                aria-label="Reply"
                className="flex size-7 items-center justify-center rounded-[7px] text-ink-3 outline-none hover:bg-ink/[0.06] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
              >
                <CornerUpLeft aria-hidden="true" className="size-[15px]" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  aria-label="More actions"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex size-7 items-center justify-center rounded-[7px] text-ink-3 outline-none hover:bg-ink/[0.06] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
                >
                  <MoreHorizontal aria-hidden="true" className="size-[15px]" />
                </button>
                {menuOpen ? <MoreMenu items={menuItems(message, actions)} onClose={closeMenu} align={self ? "right" : "left"} /> : null}
              </div>
            </div>
          ) : null}
        </div>

        {reactions && reactions.length ? (
          <div className={cn("relative z-[1] -mt-1.5 flex flex-wrap gap-1", self ? "mr-2 justify-end" : "ml-2")}>
            {reactions.map((reaction) => {
              const { Icon, label } = reactionMeta(reaction.key);
              return (
                <button
                  key={reaction.key}
                  type="button"
                  onClick={() => actions.onReact(message, reaction.key)}
                  title={`${label}: ${reaction.names.join(", ")}`}
                  aria-label={`${label}, ${reaction.count}: ${reaction.names.join(", ")}${reaction.mine ? ". Tap to remove yours." : ""}`}
                  aria-pressed={reaction.mine}
                  className={cn(
                    "inline-flex h-6 animate-fade-in items-center gap-1 rounded-full border px-1.5 text-meta font-medium tabular outline-none transition-colors focus-visible:ring-2 focus-visible:ring-seal/45",
                    reaction.mine
                      ? "border-ink/30 bg-surface text-ink shadow-[0_0_0_1px_rgb(var(--ink)/0.05)]"
                      : "border-line bg-surface text-ink-2 hover:border-line-strong"
                  )}
                >
                  <Icon aria-hidden="true" className="size-3.5" strokeWidth={2} />
                  {reaction.count > 1 ? reaction.count : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {failed ? (
          <div className="mt-1 flex items-center gap-2 text-meta text-danger" role="alert">
            <span>Not sent.</span>
            <button type="button" onClick={() => actions.onRetry(message)} className="font-semibold underline-offset-2 outline-none hover:underline focus-visible:underline">
              Retry
            </button>
            <span aria-hidden="true" className="text-ink-3">·</span>
            <button type="button" onClick={() => actions.onDiscard(message)} className="text-ink-3 underline-offset-2 outline-none hover:underline focus-visible:underline">
              Discard
            </button>
          </div>
        ) : groupEnd || remaining !== null ? (
          <div className={cn("mt-1 flex items-center gap-2 px-1 text-[11.5px] leading-4 text-ink-3 tabular", self ? "flex-row-reverse" : "")}>
            {groupEnd ? <time dateTime={new Date(message.createdAt).toISOString()}>{formatTime(message.createdAt)}</time> : null}
            {remaining !== null ? (
              <span className="inline-flex items-center gap-0.5" title={`Disappears ${formatFullTime(message.expiresAt!)}`}>
                <Timer aria-hidden="true" className="size-3" />
                <span className="sr-only">Disappears in </span>
                {formatRemaining(remaining)}
              </span>
            ) : null}
            {self && showStatus ? <StatusLine message={message} /> : null}
          </div>
        ) : null}
      </div>

      {sheetOpen ? <ActionSheet message={message} actions={actions} mine={mine} onClose={() => setSheetOpen(false)} /> : null}
    </li>
  );
});

function SystemRow({ message }: { message: ChatMessage }) {
  const who = message.self ? "You" : message.name;
  const text = message.ttlSeconds
    ? `${who} set disappearing messages to ${describeTtl(message.ttlSeconds).toLowerCase()}`
    : `${who} turned off disappearing messages`;
  return (
    <li className="my-3 flex justify-center px-4">
      <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-meta text-ink-2">
        <Timer aria-hidden="true" className="size-3.5 shrink-0 text-ink-3" />
        <span className="truncate">{text}</span>
        <span className="text-ink-3">· {formatTime(message.createdAt)}</span>
      </span>
    </li>
  );
}

function Divider({ label, strong }: { label: string; strong?: boolean }) {
  return (
    <li role="separator" aria-label={label} className="my-4 flex items-center gap-3 px-5">
      <span className={cn("h-px flex-1", strong ? "bg-ink-3/40" : "bg-line")} />
      <span className={cn("text-meta font-medium", strong ? "text-ink-2" : "text-ink-3")}>{label}</span>
      <span className={cn("h-px flex-1", strong ? "bg-ink-3/40" : "bg-line")} />
    </li>
  );
}

function TypingRow() {
  return (
    <li className="mt-3 flex items-end gap-2 px-3 sm:px-5" aria-hidden="true">
      <div className="w-7 shrink-0" />
      <div className="flex h-9 items-center gap-1 rounded-[18px] border border-line bg-surface px-3.5">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="size-1.5 animate-pulse rounded-full bg-ink-3"
            style={{ animationDelay: `${index * 180}ms`, animationDuration: "1.1s" }}
          />
        ))}
      </div>
      <span className="pb-2 text-meta text-ink-3">Someone is typing</span>
    </li>
  );
}

/* ───────────────────────── List ───────────────────────── */

export default function MessageList({
  messages,
  reactions,
  now,
  othersTyping,
  empty,
  scrollSignal,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onCopy,
  onRetry,
  onDiscard,
}: MessageListProps) {
  const actions = useMemo<MessageActions>(
    () => ({ onReply, onEdit, onDelete, onReact, onCopy, onRetry, onDiscard }),
    [onReply, onEdit, onDelete, onReact, onCopy, onRetry, onDiscard]
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const atBottomRef = useRef(true);
  const [pending, setPending] = useState(0);
  const [dividerMid, setDividerMid] = useState<string | null>(null);
  const lastMidRef = useRef<string | null>(null);
  const [lightbox, setLightbox] = useState<{ file: FileAttachment; url: string } | null>(null);
  const [liveText, setLiveText] = useState("");

  const scrollToBottom = useCallback((smooth = false) => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // React to appended messages: follow along, or count them as unread.
  useLayoutEffect(() => {
    const last = messages[messages.length - 1];
    const previousLast = lastMidRef.current;
    lastMidRef.current = last?.mid ?? null;
    if (!last || last.mid === previousLast) return;
    const startIndex = previousLast ? messages.findIndex((message) => message.mid === previousLast) + 1 : 0;
    const fresh = startIndex > 0 ? messages.slice(startIndex) : previousLast ? [] : messages;
    if (!previousLast) {
      scrollToBottom();
      return;
    }
    const incoming = fresh.filter((message) => !message.self && message.kind === "msg");
    const selfSent = fresh.some((message) => message.self && message.kind === "msg");
    if (incoming.length) {
      const latest = incoming[incoming.length - 1];
      setLiveText(`${latest.name}: ${latest.body || (latest.file ? "sent an attachment" : "")}`);
    }
    if (selfSent) {
      setDividerMid(null);
      setPending(0);
      scrollToBottom(true);
      return;
    }
    const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";
    if (incoming.length && (!atBottomRef.current || hidden)) {
      setPending((count) => count + incoming.length);
      setDividerMid((current) => current ?? incoming[0].mid);
      if (atBottomRef.current) scrollToBottom(true);
      return;
    }
    if (atBottomRef.current) scrollToBottom(true);
  }, [messages, scrollToBottom]);

  // Announce, then forget: deleted or expired text should not linger in the live region.
  useEffect(() => {
    if (!liveText) return;
    const timer = window.setTimeout(() => setLiveText(""), 4000);
    return () => window.clearTimeout(timer);
  }, [liveText]);

  useEffect(() => {
    if (scrollSignal) {
      setDividerMid(null);
      setPending(0);
      scrollToBottom(true);
    }
  }, [scrollSignal, scrollToBottom]);

  // Keep pinned to the bottom while images load or the typing row appears.
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const content = element.firstElementChild;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      if (atBottomRef.current) element.scrollTop = element.scrollHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && atBottomRef.current) setPending(0);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const onScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    const bottom = element.scrollHeight - element.scrollTop - element.clientHeight < 72;
    atBottomRef.current = bottom;
    setAtBottom(bottom);
    if (bottom) setPending(0);
  };

  const jumpTo = useCallback((mid: string) => {
    const element = scrollRef.current?.querySelector<HTMLElement>(`[data-mid="${CSS.escape(mid)}"]`);
    if (!element) return;
    element.scrollIntoView({ block: "center", behavior: "smooth" });
    const bubble = element.querySelector<HTMLElement>("[data-bubble]");
    if (bubble) {
      bubble.classList.remove("animate-flash");
      void bubble.offsetWidth;
      bubble.classList.add("animate-flash");
    }
  }, []);

  const openImage = useCallback((file: FileAttachment, url: string) => setLightbox({ file, url }), []);

  const lastSelfMid = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].self && messages[index].kind === "msg") return messages[index].mid;
    }
    return null;
  }, [messages]);

  const rows: ReactNode[] = [];
  messages.forEach((message, index) => {
    const previous = messages[index - 1];
    const next = messages[index + 1];
    if (!previous || dayKey(previous.createdAt) !== dayKey(message.createdAt)) {
      rows.push(<Divider key={`day-${message.mid}`} label={dayLabel(message.createdAt)} />);
    }
    if (dividerMid === message.mid) rows.push(<Divider key="unread" label="New messages" strong />);
    if (message.kind === "system") {
      rows.push(<SystemRow key={message.mid} message={message} />);
      return;
    }
    const continuesFrom = (a: ChatMessage | undefined, b: ChatMessage) =>
      !!a &&
      a.kind === "msg" &&
      a.from === b.from &&
      Math.abs(b.createdAt - a.createdAt) < GROUP_GAP_MS &&
      dayKey(a.createdAt) === dayKey(b.createdAt);
    const groupStart = !continuesFrom(previous, message) || dividerMid === message.mid;
    const groupEnd = !next || !continuesFrom(message, next) || dividerMid === next.mid || !!reactions[message.mid]?.length;
    rows.push(
      <MessageRow
        key={message.mid}
        message={message}
        reactions={reactions[message.mid]}
        groupStart={groupStart}
        groupEnd={groupEnd}
        showStatus={message.mid === lastSelfMid || message.status === "sending"}
        now={now}
        actions={actions}
        onJumpTo={jumpTo}
        onOpenImage={openImage}
      />
    );
  });

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="absolute inset-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
      >
        <div className="flex min-h-full flex-col justify-end pb-4 pt-2">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-4 py-8">{empty}</div>
          ) : (
            <ol aria-label="Messages" className="mx-auto w-full max-w-[920px]">
              {rows}
              {othersTyping > 0 ? <TypingRow /> : null}
            </ol>
          )}
          {messages.length === 0 && othersTyping > 0 ? (
            <ol className="mx-auto w-full max-w-[920px]">
              <TypingRow />
            </ol>
          ) : null}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {liveText}
      </p>
      <p aria-live="polite" className="sr-only">
        {othersTyping > 0 ? "Someone is typing" : ""}
      </p>

      {!atBottom || pending > 0 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
          <button
            type="button"
            onClick={() => {
              scrollToBottom(true);
              setPending(0);
            }}
            className="pointer-events-auto inline-flex h-9 animate-rise items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-small font-medium text-ink shadow-float outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-seal/45"
          >
            <ArrowDown aria-hidden="true" className="size-4" />
            {pending > 0 ? `${pending} new ${pending === 1 ? "message" : "messages"}` : "Jump to latest"}
          </button>
        </div>
      ) : null}

      {lightbox ? <Lightbox file={lightbox.file} url={lightbox.url} onClose={() => setLightbox(null)} /> : null}
    </div>
  );
}
