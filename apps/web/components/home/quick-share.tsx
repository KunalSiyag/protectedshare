"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, ChevronDown, Eye, EyeOff, Flame, Lock } from "lucide-react";
import { Button, Kbd, Segmented, Switch, Textarea, cn } from "@protectedshare/ui";
import { generateKey, generateToken, hashToken } from "@protectedshare/crypto";
import type { CreateNoteV2Request } from "@protectedshare/contracts";
import AppLink from "../app-link";
import ServerView from "../server-view";
import ShareResult from "../share-result";
import { apiUrl } from "../../lib/api";
import { sealTextTask, type SealedTextResult } from "../../lib/crypto-task";
import { describeRequestFailure, readApiError } from "../../lib/feedback";
import { addLink } from "../../lib/my-links";
import { withFragmentParams } from "../../lib/share-window";

type Expiry = "3600" | "86400" | "604800";

const EXPIRY_OPTIONS: { value: Expiry; label: string }[] = [
  { value: "3600", label: "1 hour" },
  { value: "86400", label: "1 day" },
  { value: "604800", label: "7 days" },
];

/** Shown sealed in the panel until the visitor types. Clearly labelled as a sample. */
const SAMPLE_TEXT = "Wi-Fi for the office: lighthouse-quartz-71";
const PREVIEW_DELAY_MS = 140;

type Session = { key: string; manageToken: string; manageTokenHash: string };

type Preview = { text: string; sealed: SealedTextResult };

type Done = {
  id: string;
  url: string;
  expiresAtMs: number;
  burn: boolean;
  body: CreateNoteV2Request;
  key: string;
  manageToken: string;
  saved: boolean;
};

async function newSession(): Promise<Session> {
  const manageToken = generateToken();
  return { key: generateKey(), manageToken, manageTokenHash: await hashToken(manageToken) };
}

function requestBody(sealed: SealedTextResult, session: Session, expiry: Expiry, burn: boolean): CreateNoteV2Request {
  return {
    payload: sealed.payload,
    authHash: sealed.authHash,
    manageTokenHash: session.manageTokenHash,
    expiresAt: Math.floor(Date.now() / 1000) + Number(expiry),
    isBurnAfterRead: burn,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

type LocalItem = { label: string; value: string; where: string };

/** Left of the boundary: what this page holds that the request never carries. */
function StaysHere({ items }: { items: LocalItem[] }) {
  const [shown, setShown] = useState(false);
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="mt-10 hidden border-t border-line pt-4 lg:block">
      <div className="flex items-center justify-between gap-3">
        <h2 id={headingId} className="eyebrow">
          Stays in this browser
        </h2>
        <button
          type="button"
          aria-pressed={shown}
          onClick={() => setShown((value) => !value)}
          className="flex items-center gap-1.5 rounded-[6px] px-1.5 py-0.5 text-meta font-medium text-ink-3 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
        >
          {shown ? <EyeOff aria-hidden="true" className="size-3.5" /> : <Eye aria-hidden="true" className="size-3.5" />}
          {shown ? "Hide values" : "Show values"}
        </button>
      </div>
      <dl className="mt-2 divide-y divide-line/70">
        {items.map((item) => (
          <div key={item.label} className="grid grid-cols-[120px_minmax(0,1fr)_auto] items-center gap-4 py-2">
            <dt className="text-small text-ink-2">{item.label}</dt>
            <dd className={cn("min-w-0 truncate font-mono text-[12px]", shown ? "text-ink" : "tracking-[0.04em] text-ink-3")}>
              {item.value ? (shown ? item.value : "•".repeat(Math.min(item.value.length, 18))) : "—"}
            </dd>
            <dd className="text-small text-ink-3">{item.where}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export type QuickShareProps = {
  /** Headline and subhead, rendered on the server and placed above the composer. */
  intro: ReactNode;
  /** Starts the composer with this text (e.g. text shared to the installed app). */
  initialText?: string;
};

/**
 * The homepage hero: a working note composer on the left, and on the right the exact
 * request body our server would receive, re-sealed as you type with this session's key.
 */
export default function QuickShare({ intro, initialText }: QuickShareProps) {
  const fieldId = useId();
  const statusId = useId();
  const stripId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [text, setText] = useState(initialText ?? "");
  const [expiry, setExpiry] = useState<Expiry>("86400");
  const [burn, setBurn] = useState(true);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [stripOpen, setStripOpen] = useState(false);
  const [pulse, setPulse] = useState(0);
  const seq = useRef(0);

  useEffect(() => {
    let live = true;
    void newSession().then((value) => {
      if (live) setSession(value);
    });
    return () => {
      live = false;
    };
  }, []);

  // Re-seal on every pause in typing. A fresh IV and salt each time, so the whole blob changes.
  useEffect(() => {
    if (!session || done) return;
    const source = text.length > 0 ? text : SAMPLE_TEXT;
    const ticket = ++seq.current;
    const timer = window.setTimeout(
      () => {
        void sealTextTask(source, { key: session.key })
          .then((sealed) => {
            if (ticket !== seq.current) return;
            setPreview({ text: source, sealed });
            setPulse((value) => value + 1);
          })
          .catch(() => undefined);
      },
      preview ? PREVIEW_DELAY_MS : 0
    );
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, session, done]);

  const isSample = text.length === 0;
  const outgoing = useMemo(() => {
    if (done) return done.body;
    if (!preview || !session) return null;
    return requestBody(preview.sealed, session, expiry, burn);
  }, [done, preview, session, expiry, burn]);

  const bytes = useMemo(() => (outgoing ? new TextEncoder().encode(JSON.stringify(outgoing)).length : 0), [outgoing]);

  const submit = useCallback(async () => {
    if (busy || !session) return;
    if (!text.trim()) {
      setError("Write or paste something first.");
      textareaRef.current?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Reuse the sealed body on screen when it matches, so what you saw is what gets sent.
      const sealed = preview && preview.text === text ? preview.sealed : await sealTextTask(text, { key: session.key });
      const body = requestBody(sealed, session, expiry, burn);
      const response = await fetch(apiUrl("/api/notes"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, "The server didn't accept the note. Try again."));
      }
      const { id } = (await response.json()) as { id: string };
      const url = withFragmentParams(`${window.location.origin}/notes/${id}`, { k: session.key });
      const expiresAtMs = body.expiresAt * 1000;
      const saved = addLink({
        kind: "note",
        id,
        url,
        manageToken: session.manageToken,
        label: "Quick share",
        createdAt: Date.now(),
        expiresAt: expiresAtMs,
      });
      setDone({ id, url, expiresAtMs, burn, body, key: session.key, manageToken: session.manageToken, saved });
      setText("");
      setPreview(null);
    } catch (cause) {
      setError(describeRequestFailure(cause, "Couldn't create the link. Try again."));
    } finally {
      setBusy(false);
    }
  }, [busy, session, text, preview, expiry, burn]);

  const reset = useCallback(() => {
    setDone(null);
    setError(null);
    setSession(null);
    void newSession().then(setSession);
    window.setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const localOnly: LocalItem[] = done
    ? [
        { label: "Key", value: done.key, where: "in your link, after #" },
        { label: "Manage token", value: done.manageToken, where: "in My links; sent only to check or revoke" },
      ]
    : [
        { label: "Key", value: session?.key ?? "", where: "goes in the link, after #" },
        { label: isSample ? "Sample text" : "Your text", value: preview?.text ?? "", where: "never sent" },
        { label: "Manage token", value: session?.manageToken ?? "", where: "in My links; sent only to check or revoke" },
      ];

  const note = done ? (
    <>That&apos;s all we received. The key only exists in your link, after the #.</>
  ) : isSample ? (
    <>Sealed from sample text. Start typing and it re-seals with every pause.</>
  ) : (
    <>A fresh IV and salt on every pass, so the whole blob changes. Nothing is sent until you create the link.</>
  );

  const serverView = (withLocal: boolean) => (
    <ServerView
      key={done ? "sent" : "live"}
      title={done ? "What our server received" : "What our server would receive"}
      endpoint={done ? `POST /api/notes  →  201 {"id":"${done.id}"}` : "POST /api/notes"}
      outgoing={outgoing}
      localOnly={withLocal ? localOnly.map(({ label, value }) => ({ label, value })) : []}
      truncateAt={done ? 48 : 220}
      note={note}
    />
  );

  const blob = outgoing?.payload.encryptedBlob ?? "";

  return (
    <div className="mx-auto grid w-full max-w-content px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,468px)]">
      {/* Left: your browser */}
      <div className="min-w-0 pb-10 pt-10 sm:pt-14 lg:pb-20 lg:pr-12 lg:pt-16">
        {intro}

        <div id="seal" className="mt-8 scroll-mt-24 sm:mt-10">
          {done ? (
            <ShareResult
              url={done.url}
              expiresAt={done.expiresAtMs}
              burnLabel={done.burn ? "Burns after first read" : undefined}
              savedToLinks={done.saved}
              onReset={reset}
              resetLabel="Seal another"
            />
          ) : (
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
              className={cn(
                "overflow-hidden rounded-panel border bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-[border-color,box-shadow] duration-150 ease-seal",
                "focus-within:border-line-strong focus-within:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_0_0_4px_rgb(var(--ink)/0.04)]",
                error ? "border-danger/50" : "border-line"
              )}
            >
              <label htmlFor={fieldId} className="sr-only">
                Secret to share
              </label>
              <Textarea
                ref={textareaRef}
                id={fieldId}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    void submit();
                  }
                }}
                placeholder="Paste a password, a key, a note…"
                rows={5}
                spellCheck={false}
                autoComplete="off"
                aria-describedby={statusId}
                aria-invalid={error ? true : undefined}
                className="min-h-[148px] resize-none rounded-none border-0 bg-transparent px-5 pb-3 pt-4 text-[16px] leading-[1.55] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-[17px]"
              />

              <div className="flex flex-col gap-3 border-t border-line bg-surface-2/40 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:pl-4 sm:pr-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                  <Segmented
                    aria-label="Expires after"
                    size="sm"
                    value={expiry}
                    onChange={setExpiry}
                    options={EXPIRY_OPTIONS}
                  />
                  <Switch
                    checked={burn}
                    onCheckedChange={setBurn}
                    label={
                      <span className="inline-flex items-center gap-1.5">
                        <Flame aria-hidden="true" className={cn("size-3.5", burn ? "text-seal" : "text-ink-3")} />
                        Burn after reading
                      </span>
                    }
                    className="flex-row-reverse items-center justify-end gap-2.5"
                  />
                </div>
                <Button type="submit" loading={busy} disabled={!session} className="w-full sm:w-auto">
                  <Lock aria-hidden="true" />
                  Seal and create link
                </Button>
              </div>
            </form>
          )}

          <p id={statusId} aria-live="polite" className={cn("mt-3 min-h-[18px] text-small", error ? "text-danger" : "text-ink-3")}>
            {error ? (
              error
            ) : done ? null : (
              <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <span className="hidden items-center gap-1 sm:inline-flex">
                  <Kbd>⌘</Kbd>
                  <Kbd>Enter</Kbd>
                  <span className="ml-0.5">to seal.</span>
                </span>
                No account. Need a password, a title or a read limit?{" "}
                <AppLink href="/notes" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  Open the full note tool
                </AppLink>
              </span>
            )}
          </p>
        </div>

        <StaysHere items={localOnly} />

        {/* Mobile: the server view collapses into a strip under the composer. */}
        <div className="mt-6 lg:hidden">
          <div className="overflow-hidden rounded-panel border border-line bg-surface-2/50">
            <button
              type="button"
              aria-expanded={stripOpen}
              aria-controls={stripId}
              onClick={() => setStripOpen((value) => !value)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-seal/45"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3 text-small font-semibold text-ink">
                  {done ? "What our server received" : "What our server would receive"}
                  <span className="tabular shrink-0 font-mono text-[11px] font-normal text-ink-3">{formatBytes(bytes)}</span>
                </span>
                <span
                  key={pulse}
                  aria-hidden="true"
                  className="mt-1 block truncate font-mono text-[12px] leading-[18px] text-ink-3 animate-fade-in"
                >
                  {blob ? `"encryptedBlob": "${blob}"` : "…"}
                </span>
              </span>
              <ChevronDown
                aria-hidden="true"
                className={cn("size-4 shrink-0 text-ink-3 transition-transform duration-150 ease-seal", stripOpen && "rotate-180")}
              />
            </button>
            <div id={stripId} hidden={!stripOpen} className="border-t border-line p-2">
              {stripOpen ? serverView(true) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Right: our server. The band runs to the viewport edge; its left border is the boundary. */}
      <div className="relative hidden min-w-0 lg:block lg:pb-20 lg:pl-12 lg:pt-16">
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[100vw] border-l border-line bg-surface-2/50" />
        <div className="relative lg:sticky lg:top-[84px]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="eyebrow">Server side</p>
            <p className="flex items-center gap-1.5 text-meta text-ink-3">
              <span
                key={pulse}
                aria-hidden="true"
                className="size-1.5 rounded-full bg-ok animate-fade-in"
              />
              {done ? "Sent once, over HTTPS" : "Live as you type"}
            </p>
          </div>
          {serverView(false)}
          {!done ? (
            <p className="mt-4 flex items-center gap-2 text-small text-ink-3">
              <ArrowRight aria-hidden="true" className="size-3.5 shrink-0" />
              No key, no text. The key goes in the link you send.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
