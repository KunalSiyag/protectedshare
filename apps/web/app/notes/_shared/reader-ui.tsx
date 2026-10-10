"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Clock, Eye, EyeOff, Flame, KeyRound, Link2Off, LockKeyhole, RotateCw, SearchX, WifiOff } from "lucide-react";
import { Button, Input, Panel, StatusChip, cn } from "@protectedshare/ui";
import AppLink from "../../../components/app-link";
import ServerView from "../../../components/server-view";
import SealMark from "../../../components/seal-mark";
import { formatShareDeadline } from "../../../lib/share-window";
import type { ReaderRequest } from "./use-share-reader";

/** Centered message inside a panel: gone, missing key, errors. */
export function ReaderMessage({
  icon: Icon,
  title,
  children,
  actions,
  tone = "neutral",
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
  tone?: "neutral" | "danger";
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  return (
    <Panel className="animate-fade-in">
      <div className="flex flex-col items-start gap-4 px-6 py-8 sm:px-8 sm:py-10">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-[10px] border",
            tone === "danger" ? "border-danger/25 bg-danger-soft text-danger" : "border-line bg-surface-2/60 text-ink-2"
          )}
        >
          <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
        </span>
        <div className="max-w-[52ch]">
          <h2 ref={headingRef} tabIndex={-1} className="text-h3 text-ink outline-none">
            {title}
          </h2>
          {children ? <div className="mt-2 text-ui text-ink-2">{children}</div> : null}
        </div>
        {actions ? <div className="mt-1 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </Panel>
  );
}

export function ReaderLoading({ label }: { label: string }) {
  return (
    <Panel aria-busy="true">
      <div className="flex flex-col gap-4 px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex items-center gap-3">
          <span className="size-10 animate-pulse rounded-[10px] bg-surface-2" />
          <span className="h-4 w-48 animate-pulse rounded bg-surface-2" />
        </div>
        <span className="h-3 w-full max-w-[420px] animate-pulse rounded bg-surface-2" />
        <span className="h-3 w-2/3 max-w-[300px] animate-pulse rounded bg-surface-2" />
        <p className="sr-only" role="status">
          {label}
        </p>
      </div>
    </Panel>
  );
}

export function GoneMessage({ noun, toolHref, toolLabel }: { noun: string; toolHref: string; toolLabel: string }) {
  return (
    <ReaderMessage
      icon={SearchX}
      title={`This ${noun} isn't here anymore`}
      actions={
        <AppLink href={toolHref} className="inline-flex h-9 items-center rounded-control border border-line-strong bg-surface px-3 text-small font-medium text-ink hover:bg-surface-2/60">
          {toolLabel}
        </AppLink>
      }
    >
      <p>It was already opened and deleted, it expired, the sender revoked it, or the link is incomplete.</p>
      <p className="mt-2 text-small text-ink-3">If you were expecting it, ask the sender for a new link. Nobody can recover a deleted {noun} — not even us.</p>
    </ReaderMessage>
  );
}

export function MissingKeyMessage({ noun }: { noun: string }) {
  return (
    <ReaderMessage icon={Link2Off} title="This link is missing its key">
      <p>
        The part after <span className="font-mono text-small text-ink">#k=</span> opens the {noun}, and it isn&apos;t in this address.
        Some apps cut links short. Copy the whole link from the message and paste it here.
      </p>
      <p className="mt-2 text-small text-ink-3">Nothing was opened or used up.</p>
    </ReaderMessage>
  );
}

export function BadKeyMessage({ noun, onPassword }: { noun: string; onPassword?: () => void }) {
  return (
    <ReaderMessage
      icon={KeyRound}
      title="The key in this link doesn't match"
      tone="danger"
      actions={
        onPassword ? (
          <Button variant="secondary" size="sm" onClick={onPassword}>
            Type the password instead
          </Button>
        ) : null
      }
    >
      <p>The {noun} is still there, but this link can&apos;t open it. It may have been changed or cut off when it was copied.</p>
      <p className="mt-2 text-small text-ink-3">Nothing was opened or used up. Ask the sender to send the link again.</p>
    </ReaderMessage>
  );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <ReaderMessage
      icon={WifiOff}
      title="Couldn't load this link"
      actions={
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RotateCw aria-hidden="true" />
          Try again
        </Button>
      }
    >
      <p>{message}</p>
    </ReaderMessage>
  );
}

/**
 * Shown before a read that deletes something. The ciphertext is fetched only on click, so a chat
 * app's link preview can't use up the read.
 */
export function OpenGate({
  title,
  description,
  openLabel,
  busy,
  error,
  onOpen,
  chips,
}: {
  title: string;
  description: ReactNode;
  openLabel: string;
  busy: boolean;
  error?: string | null;
  onOpen: () => void;
  chips?: ReactNode;
}) {
  return (
    <Panel className="animate-fade-in">
      <div className="flex flex-col items-start gap-5 px-6 py-8 sm:px-8 sm:py-10">
        <SealMark size={40} />
        <div className="max-w-[54ch]">
          <h2 className="text-h3 text-ink">{title}</h2>
          <div className="mt-2 text-ui text-ink-2">{description}</div>
          {chips ? <div className="mt-4 flex flex-wrap gap-1.5">{chips}</div> : null}
        </div>
        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={onOpen} loading={busy} className="min-w-[180px]">
            {openLabel}
          </Button>
          <p className="text-meta text-ink-3" aria-live="polite">
            {busy ? "Checking the key and decrypting in this browser…" : "Decrypts in this browser. The key never reaches the server."}
          </p>
        </div>
        {error ? (
          <p role="alert" className="text-small text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

export function PasswordGate({
  id,
  title,
  description,
  openLabel,
  busy,
  error,
  onOpen,
  chips,
}: {
  id: string;
  title: string;
  description: ReactNode;
  openLabel: string;
  busy: boolean;
  error?: string | null;
  onOpen: (password: string) => void;
  chips?: ReactNode;
}) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [empty, setEmpty] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    if (error) inputRef.current?.select();
  }, [error]);

  const message = empty ? "Type the password first." : error;

  return (
    <Panel className="animate-fade-in">
      <form
        className="flex flex-col items-start gap-5 px-6 py-8 sm:px-8 sm:py-10"
        onSubmit={(event) => {
          event.preventDefault();
          if (!password) {
            setEmpty(true);
            inputRef.current?.focus();
            return;
          }
          onOpen(password);
        }}
      >
        <span className="flex size-10 items-center justify-center rounded-[10px] border border-line bg-surface-2/60 text-ink-2">
          <LockKeyhole aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
        </span>
        <div className="max-w-[54ch]">
          <h2 className="text-h3 text-ink">{title}</h2>
          <div className="mt-2 text-ui text-ink-2">{description}</div>
          {chips ? <div className="mt-4 flex flex-wrap gap-1.5">{chips}</div> : null}
        </div>
        <div className="flex w-full max-w-[420px] flex-col gap-1.5">
          <label htmlFor={id} className="text-small font-medium text-ink">
            Password
          </label>
          <div className="relative">
            <Input
              ref={inputRef}
              id={id}
              type={visible ? "text" : "password"}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setEmpty(false);
              }}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              invalid={Boolean(message)}
              aria-describedby={message ? `${id}-error` : undefined}
              className="h-11 pr-11 font-mono text-[14px] tracking-tight"
            />
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-control text-ink-3 outline-none transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
            >
              {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
            </button>
          </div>
          {message ? (
            <p id={`${id}-error`} role="alert" className="text-small text-danger">
              {message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" loading={busy} className="min-w-[180px]">
            {openLabel}
          </Button>
          <p className="text-meta text-ink-3" aria-live="polite">
            {busy ? "Stretching the password and decrypting in this browser…" : "The password never leaves this browser."}
          </p>
        </div>
      </form>
    </Panel>
  );
}

export function ExpiryChip({ expiresAt }: { expiresAt: number }) {
  return (
    <StatusChip tone="neutral" icon={<Clock aria-hidden="true" />}>
      Expires {formatShareDeadline(expiresAt)}
    </StatusChip>
  );
}

export function BurnChip({ children }: { children: ReactNode }) {
  return (
    <StatusChip tone="seal" icon={<Flame aria-hidden="true" />}>
      {children}
    </StatusChip>
  );
}

/** The reader's server view: what this page sent (or will send) to open the share. */
export function ReaderServerView({
  request,
  metaPath,
  localOnly,
}: {
  request: ReaderRequest;
  metaPath: string;
  localOnly: { label: string; value: string }[];
}) {
  const outgoing = request
    ? {
        request: request.path,
        ...(request.header ? { headers: { [request.header.name]: request.header.value } } : {}),
        ...(request.query ? { query: request.query } : {}),
        body: null,
      }
    : { request: `GET ${metaPath}`, headers: {}, body: null };

  return (
    <ServerView
      title="What this page sends"
      outgoing={outgoing}
      endpoint={request ? "To open it" : "So far: only the public details"}
      localOnly={localOnly}
      note={
        request?.header
          ? "The token proves you hold the key without revealing it. The server keeps only a hash of it and can't decrypt anything with it."
          : request?.query
            ? "Older link: it sends a password proof (a slow hash of the password), not the password."
            : "Checking the link only asks for the expiry and the salt. It doesn't open or use up anything."
      }
    />
  );
}
