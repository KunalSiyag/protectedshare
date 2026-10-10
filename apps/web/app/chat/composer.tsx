"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ArrowUp, CornerUpLeft, FileText, Paperclip, Pencil, Timer, X } from "lucide-react";
import { Kbd, Spinner, cn } from "@protectedshare/ui";
import { MAX_BODY_CHARS, describeTtl, formatBytes, type FileAttachment, type ReplyRef } from "./chat-lib";
import { isInlineImage } from "./chat-media";
import { useObjectUrl } from "./message-list";

export type ComposerHandle = {
  focus: () => void;
  setDraft: (value: string) => void;
};

type ComposerProps = {
  disabled?: boolean;
  replyTo: ReplyRef | null;
  editing: { mid: string; body: string } | null;
  attachment: FileAttachment | null;
  preparing: boolean;
  ttlSeconds: number | null;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onRemoveAttachment: () => void;
  onFiles: (files: File[]) => void;
  onSubmit: (body: string) => boolean | Promise<boolean>;
  onTyping: (typing: boolean) => void;
  onEditLast: () => void;
};

function AttachmentPreview({ file, onRemove }: { file: FileAttachment; onRemove: () => void }) {
  const url = useObjectUrl(file);
  return (
    <div className="flex animate-rise items-center gap-3 rounded-[12px] border border-line bg-surface-2/50 p-1.5 pr-1">
      {url && isInlineImage(file) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-11 rounded-[8px] object-cover" />
      ) : (
        <span className="flex size-11 items-center justify-center rounded-[8px] border border-line bg-surface text-ink-3">
          <FileText aria-hidden="true" className="size-5" strokeWidth={1.75} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-small font-medium text-ink">{file.name}</p>
        <p className="text-meta text-ink-3">
          {formatBytes(file.size)}
          {url && file.w && file.h ? ` · ${file.w}×${file.h}` : ""} · encrypted when you send
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove attachment"
        className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-ink-3 outline-none hover:bg-ink/[0.06] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  {
    disabled,
    replyTo,
    editing,
    attachment,
    preparing,
    ttlSeconds,
    onCancelReply,
    onCancelEdit,
    onRemoveAttachment,
    onFiles,
    onSubmit,
    onTyping,
    onEditLast,
  },
  ref
) {
  const [draft, setDraftState] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<number | undefined>(undefined);
  const savedDraft = useRef("");

  const resize = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 176)}px`;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => textareaRef.current?.focus(),
      setDraft: (value: string) => {
        setDraftState(value);
        requestAnimationFrame(resize);
      },
    }),
    [resize]
  );

  useEffect(resize, [draft, resize]);

  // Entering edit mode swaps the draft for the message text; leaving restores it.
  const editingMid = editing?.mid ?? null;
  useEffect(() => {
    if (editing) {
      savedDraft.current = textareaRef.current?.value ?? "";
      setDraftState(editing.body);
      requestAnimationFrame(() => {
        const element = textareaRef.current;
        if (!element) return;
        element.focus();
        element.setSelectionRange(element.value.length, element.value.length);
      });
    } else {
      setDraftState(savedDraft.current);
      savedDraft.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingMid]);

  useEffect(() => () => window.clearTimeout(typingTimer.current), []);

  const stopTyping = useCallback(() => {
    window.clearTimeout(typingTimer.current);
    onTyping(false);
  }, [onTyping]);

  const handleChange = (value: string) => {
    setDraftState(value);
    if (value.trim() && !editing) {
      onTyping(true);
      window.clearTimeout(typingTimer.current);
      typingTimer.current = window.setTimeout(() => onTyping(false), 4000);
    } else {
      stopTyping();
    }
  };

  const canSend = !disabled && !preparing && (draft.trim().length > 0 || !!attachment) && draft.length <= MAX_BODY_CHARS;

  const submit = async () => {
    if (!canSend) return;
    const body = draft.replace(/\s+$/, "");
    const ok = await onSubmit(body);
    if (ok) {
      // In edit mode the parent clears `editing`, which restores the earlier draft.
      if (!editing) setDraftState("");
      stopTyping();
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
      return;
    }
    if (event.key === "Escape") {
      if (editing) {
        event.preventDefault();
        onCancelEdit();
      } else if (replyTo) {
        event.preventDefault();
        onCancelReply();
      } else if (attachment) {
        event.preventDefault();
        onRemoveAttachment();
      }
      return;
    }
    if (event.key === "ArrowUp" && !draft && !editing && !attachment) {
      event.preventDefault();
      onEditLast();
    }
  };

  const onPaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files ?? []);
    if (files.length) {
      event.preventDefault();
      onFiles(files);
    }
  };

  const over = draft.length > MAX_BODY_CHARS * 0.9;

  return (
    <div className="border-t border-line bg-surface px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 sm:px-5 sm:pb-3">
      <div className="mx-auto w-full max-w-[880px]">
        {editing || replyTo || attachment || preparing ? (
          <div className="mb-2 flex flex-col gap-2">
            {editing ? (
              <div className="flex animate-rise items-center gap-2.5 rounded-[12px] bg-surface-2 py-1.5 pl-3 pr-1">
                <Pencil aria-hidden="true" className="size-4 shrink-0 text-ink-3" />
                <div className="min-w-0 flex-1">
                  <p className="text-meta font-semibold text-ink">Editing message</p>
                  <p className="truncate text-small text-ink-3">Press Enter to save, Esc to cancel</p>
                </div>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  aria-label="Cancel editing"
                  className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-ink-3 outline-none hover:bg-ink/[0.06] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
            ) : replyTo ? (
              <div className="flex animate-rise items-center gap-2.5 rounded-[12px] bg-surface-2 py-1.5 pl-3 pr-1">
                <CornerUpLeft aria-hidden="true" className="size-4 shrink-0 text-ink-3" />
                <div className="min-w-0 flex-1">
                  <p className="text-meta font-semibold text-ink">Replying to {replyTo.name}</p>
                  <p className="truncate text-small text-ink-3">{replyTo.excerpt}</p>
                </div>
                <button
                  type="button"
                  onClick={onCancelReply}
                  aria-label="Cancel reply"
                  className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-ink-3 outline-none hover:bg-ink/[0.06] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
            ) : null}
            {preparing ? (
              <div role="status" className="flex items-center gap-2.5 rounded-[12px] border border-line bg-surface-2/50 px-3 py-3 text-small text-ink-2">
                <Spinner size={16} />
                Preparing attachment…
              </div>
            ) : attachment ? (
              <AttachmentPreview file={attachment} onRemove={onRemoveAttachment} />
            ) : null}
          </div>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          className={cn(
            "flex items-end gap-1.5 rounded-[22px] border border-line-strong bg-surface py-1 pl-1 pr-1 transition-[border-color,box-shadow] duration-150 focus-within:border-ink-3 focus-within:ring-[3px] focus-within:ring-seal/15",
            disabled && "opacity-60"
          )}
        >
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              if (files.length) onFiles(files);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled || !!editing}
            aria-label="Attach a photo or file"
            title="Attach a photo or file (up to 800 KB)"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-3 outline-none transition-colors hover:bg-ink/[0.06] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45 disabled:opacity-40"
          >
            <Paperclip aria-hidden="true" className="size-[18px]" />
          </button>
          <label htmlFor="chat-composer" className="sr-only">
            {editing ? "Edit message" : "Message"}
          </label>
          <textarea
            id="chat-composer"
            ref={textareaRef}
            rows={1}
            value={draft}
            disabled={disabled}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={stopTyping}
            placeholder={editing ? "Edit your message" : attachment ? "Add a caption" : "Write an encrypted message"}
            autoComplete="off"
            spellCheck
            enterKeyHint="send"
            className="max-h-[176px] min-h-[36px] flex-1 resize-none bg-transparent px-1 py-[7px] text-[16px] leading-[22px] text-ink outline-none placeholder:text-ink-3 sm:text-ui"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label={editing ? "Save edit" : "Send message"}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-on-ink outline-none transition-[background-color,transform,opacity] duration-150 ease-seal hover:bg-ink/[0.86] focus-visible:ring-2 focus-visible:ring-seal/45 focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-95 disabled:bg-ink/25 disabled:text-on-ink"
          >
            <ArrowUp aria-hidden="true" className="size-[18px]" strokeWidth={2.25} />
          </button>
        </form>

        <div className="mt-1.5 flex min-h-4 items-center justify-between gap-3 px-2 text-[11.5px] leading-4 text-ink-3">
          <span className="inline-flex items-center gap-1">
            {ttlSeconds ? (
              <>
                <Timer aria-hidden="true" className="size-3" />
                New messages disappear after {describeTtl(ttlSeconds).toLowerCase()}
              </>
            ) : (
              <span className="hidden sm:inline">**bold** _italic_ `code` · paste or drop a photo</span>
            )}
          </span>
          <span className={cn("hidden items-center gap-1.5 sm:inline-flex", over && "!inline-flex")}>
            {over ? (
              <span className={cn("tabular", draft.length > MAX_BODY_CHARS && "text-danger")}>
                {draft.length.toLocaleString()} / {MAX_BODY_CHARS.toLocaleString()}
              </span>
            ) : (
              <>
                <Kbd>Enter</Kbd> send <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd> new line
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
});

export default Composer;
