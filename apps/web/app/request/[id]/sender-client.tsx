"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CircleCheck, Clock, FileText, Inbox, KeyRound, LockKeyhole, RotateCw, ShieldAlert, ShieldCheck, Type } from "lucide-react";
import { sealToPublicKey, type SealedToPublicKey } from "@protectedshare/crypto";
import { type PublicRequestResponse, type RespondToRequestRequest, type RespondToRequestResponse } from "@protectedshare/contracts";
import { AUTH_TOKEN_HEADER } from "@protectedshare/contracts/constants";
import { Button, Field, Panel, PanelBody, PanelFooter, Spinner, StatusChip, Textarea, buttonVariants, cn } from "@protectedshare/ui";
import AppLink from "../../../components/app-link";
import EmptyState from "../../../components/empty-state";
import ReportAbuse from "../../../components/report-abuse";
import ServerView from "../../../components/server-view";
import ToolLayout, { ToolNotes } from "../../../components/tool-layout";
import { apiUrl } from "../../../lib/api";
import { describeRequestFailure, readApiError } from "../../../lib/feedback";
import { readFragmentParams } from "../../../lib/share-window";
import RequestFlow from "../request-flow";
import {
  ANSWER_MAX_BYTES,
  byteLength,
  checkRequestForSender,
  fetchPublicRequest,
  formatBytes,
  formatRelativeExpiry,
  formatTime,
  type RequestAnswer,
  type RequestLabel,
} from "../request-shared";

type Phase =
  | { name: "loading" }
  | { name: "gone" }
  | { name: "answered" }
  | { name: "error"; message: string }
  /** The link can't answer: no key, a key that doesn't fit, or a request that fails its check. */
  | { name: "blocked"; reason: "missing-key" | "unreadable" | "tampered" }
  | { name: "ready"; request: PublicRequestResponse; label: RequestLabel; respondToken: string }
  | { name: "sent"; request: PublicRequestResponse; respondedAt: number };

const FILE_ACCEPT = ".txt,.env,.pem,.key,.crt,.pub,.json,.yaml,.yml,.toml,.ini,.conf,.cfg,.csv,.md,text/*";

export default function SenderClient({ id }: { id: string }) {
  const [phase, setPhase] = useState<Phase>({ name: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setPhase({ name: "loading" });
    (async () => {
      const result = await fetchPublicRequest(id, controller.signal);
      if (result.status === "gone") return setPhase({ name: "gone" });
      if (result.status === "error") return setPhase({ name: "error", message: result.message });
      if (result.request.hasResponse) return setPhase({ name: "answered" });
      // Check the link before showing the form: its key must open the title, and the public
      // key fingerprint inside must match the key the server sent. Otherwise nothing is sent.
      const checked = await checkRequestForSender(result.request, readFragmentParams().k);
      if (checked.status !== "ok") return setPhase({ name: "blocked", reason: checked.status });
      setPhase({ name: "ready", request: result.request, label: checked.label, respondToken: checked.respondToken });
    })().catch(() => {
      // Aborted on unmount.
    });
    return () => controller.abort();
  }, [id, attempt]);

  // Pasting a different link into this tab only changes the fragment. Reload the request.
  useEffect(() => {
    const onHashChange = () => setAttempt((value) => value + 1);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const intro = "What you paste is encrypted in this browser to the requester's key. Only their private inbox link can open it. Not us, and not anyone else who has this link.";

  if (phase.name === "loading") {
    return (
      <ToolLayout eyebrow="Secret request" title="Someone asked you for a secret" description={intro}>
        <Panel aria-busy="true">
          <PanelBody className="flex items-center gap-3 py-10 text-small text-ink-3">
            <Spinner /> <span role="status">Loading the request…</span>
          </PanelBody>
        </Panel>
      </ToolLayout>
    );
  }

  if (phase.name === "gone") {
    return (
      <ToolLayout eyebrow="Secret request" title="This request is closed">
        <EmptyState
          icon={Inbox}
          title="Nothing to answer here"
          description="The request expired, or it was answered and the answer has already been opened. If they still need something, ask them for a new link."
          action={
            <AppLink href="/request" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Make your own request
            </AppLink>
          }
        />
      </ToolLayout>
    );
  }

  if (phase.name === "answered") {
    return (
      <ToolLayout eyebrow="Secret request" title="This request already has an answer">
        <EmptyState
          icon={LockKeyhole}
          title="Each request takes one answer"
          description="Someone has already sent a secret for this request. If that wasn't you, tell the person who asked. They should make a new request and not trust what arrived."
        />
      </ToolLayout>
    );
  }

  if (phase.name === "blocked") {
    const copy = BLOCKED_COPY[phase.reason];
    if (phase.reason === "tampered") {
      return (
        <ToolLayout eyebrow="Secret request" title={copy.heading}>
          <Panel className="border-danger/30">
            <PanelBody className="flex items-start gap-3.5 py-6 sm:px-6" role="alert">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                <ShieldAlert aria-hidden="true" className="size-[18px]" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{copy.title}</h2>
                <p className="mt-1.5 max-w-[58ch] text-ui text-ink-2">{copy.description}</p>
                <p className="mt-3 max-w-[58ch] text-small text-ink-3">
                  Your browser checked the request against a fingerprint only the requester&apos;s link key could have written,
                  and it didn&apos;t match. Nothing was sent.
                </p>
              </div>
            </PanelBody>
          </Panel>
        </ToolLayout>
      );
    }
    return (
      <ToolLayout eyebrow="Secret request" title={copy.heading}>
        <EmptyState
          icon={KeyRound}
          title={copy.title}
          description={copy.description}
          action={
            <AppLink href="/request" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Make your own request
            </AppLink>
          }
        />
      </ToolLayout>
    );
  }

  if (phase.name === "error") {
    return (
      <ToolLayout eyebrow="Secret request" title="Someone asked you for a secret">
        <EmptyState
          icon={ShieldAlert}
          title="Couldn't load the request"
          description={phase.message}
          action={
            <Button size="sm" variant="secondary" onClick={() => setAttempt((value) => value + 1)}>
              <RotateCw aria-hidden="true" /> Try again
            </Button>
          }
        />
      </ToolLayout>
    );
  }

  if (phase.name === "sent") {
    return (
      <ToolLayout eyebrow="Secret request" title="Done. You can close this tab.">
        <SentPanel request={phase.request} respondedAt={phase.respondedAt} />
      </ToolLayout>
    );
  }

  return (
    <Composer
      id={id}
      intro={intro}
      request={phase.request}
      label={phase.label}
      respondToken={phase.respondToken}
      onBlocked={() => setPhase({ name: "blocked", reason: "unreadable" })}
      onSent={(respondedAt) => setPhase({ name: "sent", request: phase.request, respondedAt })}
      onAnswered={() => setPhase({ name: "answered" })}
      onGone={() => setPhase({ name: "gone" })}
    />
  );
}

const BLOCKED_COPY: Record<"missing-key" | "unreadable" | "tampered", { heading: string; title: string; description: string }> = {
  "missing-key": {
    heading: "This link is missing its key",
    title: "You can't answer from this link",
    description:
      "The part after # didn't arrive, and only the full link can answer a request. Ask the person who sent it to copy the whole link again. Some chat apps cut it off.",
  },
  unreadable: {
    heading: "This link's key doesn't fit",
    title: "You can't answer from this link",
    description:
      "The key in this link doesn't open the request. It was probably cut off or changed on the way. Ask the person who sent it for the full link again.",
  },
  tampered: {
    heading: "This request was tampered with",
    title: "Don't send anything",
    description:
      "The key this request would encrypt to isn't the one the person who asked made, so someone may be trying to read your answer. Tell them, and ask for a new request.",
  },
};

function RequestCard({ request, label }: { request: PublicRequestResponse; label: RequestLabel }) {
  return (
    <div className="border-b border-line px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow !text-[11px]">They&apos;re asking for</p>
        <StatusChip tone="neutral" icon={<Clock aria-hidden="true" />}>
          Closes {formatRelativeExpiry(request.expiresAt)}
        </StatusChip>
      </div>

      <div className="mt-2.5">
        <h2 className="text-[20px] font-semibold leading-7 tracking-[-0.02em] text-ink [overflow-wrap:anywhere]">
          {label.title || "A secret"}
        </h2>
        {label.note ? (
          <p className="mt-2 whitespace-pre-wrap text-ui text-ink-2 [overflow-wrap:anywhere]">{label.note}</p>
        ) : !label.title ? (
          <p className="mt-2 text-ui text-ink-2">They didn&apos;t add a title. Check with the person who sent you this link before you answer.</p>
        ) : null}
        <p className="mt-3 flex items-center gap-1.5 text-meta text-ink-3">
          <ShieldCheck aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} />
          Checked in your browser: this link&apos;s key opens the request, and its public key is the requester&apos;s.
        </p>
      </div>
    </div>
  );
}

function Composer({
  id,
  intro,
  request,
  label,
  respondToken,
  onBlocked,
  onSent,
  onAnswered,
  onGone,
}: {
  id: string;
  intro: string;
  request: PublicRequestResponse;
  label: RequestLabel;
  /** Derived from the link key; the server only accepts an answer that carries it. */
  respondToken: string;
  onBlocked: () => void;
  onSent: (respondedAt: number) => void;
  onAnswered: () => void;
  onGone: () => void;
}) {
  const [text, setText] = useState("");
  const [mono, setMono] = useState(true);
  const [preview, setPreview] = useState<SealedToPublicKey | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const size = byteLength(text);
  const tooBig = size > ANSWER_MAX_BYTES;
  const empty = text.trim().length === 0;

  const seal = useCallback(
    (value: string) => {
      const answer: RequestAnswer = { text: value, sentAt: Date.now() };
      return sealToPublicKey(JSON.stringify(answer), request.publicKey);
    },
    [request.publicKey]
  );

  // Live server view: the real sealed body, re-sealed as you type.
  useEffect(() => {
    if (empty || tooBig) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      seal(text).then(
        (sealed) => !cancelled && setPreview(sealed),
        () => !cancelled && setPreview(null)
      );
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [text, empty, tooBig, seal]);

  const loadFile = async (file: File | undefined) => {
    setFileNote(null);
    setError(null);
    if (!file) return;
    if (file.size > ANSWER_MAX_BYTES) {
      setError(`${file.name} is ${formatBytes(file.size)}. The limit is 100 KB of text.`);
      return;
    }
    const content = await file.text();
    if (content.includes("\u0000")) {
      setError(`${file.name} doesn't look like a text file. Only text can be sent here.`);
      return;
    }
    setText(content);
    setMono(true);
    setFileNote(`Loaded ${file.name}. Only its text is sent, not the file name.`);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sending || empty || tooBig) return;
    setSending(true);
    setError(null);
    try {
      const body: RespondToRequestRequest = await seal(text);
      const response = await fetch(apiUrl(`/api/requests/${encodeURIComponent(id)}/respond`), {
        method: "POST",
        headers: { "Content-Type": "application/json", [AUTH_TOKEN_HEADER]: respondToken },
        body: JSON.stringify(body),
      });
      if (response.status === 409) return onAnswered();
      if (response.status === 404) return onGone();
      if (response.status === 401) return onBlocked();
      if (!response.ok) {
        throw new Error(await readApiError(response, "Could not send it. Try again in a moment."));
      }
      const data = (await response.json()) as RespondToRequestResponse;
      setText("");
      onSent(data.respondedAt * 1000);
    } catch (caught) {
      setError(describeRequestFailure(caught, "Could not send it. Try again in a moment."));
      setSending(false);
    }
  };

  return (
    <ToolLayout
      eyebrow="Secret request"
      title="Someone asked you for a secret"
      description={intro}
      meta={
        <>
          <StatusChip tone="seal">Sealed to their key</StatusChip>
          <StatusChip>No account</StatusChip>
        </>
      }
      aside={
        <>
          <ServerView
            outgoing={preview ? { headers: { [AUTH_TOKEN_HEADER]: respondToken }, body: preview } : null}
            endpoint={`POST /api/requests/${id}/respond`}
            localOnly={[{ label: "Your secret", value: text }]}
            note="Sealed with a one-time key against the requester's public key, after checking that key against the fingerprint in the encrypted title. The token comes from this link's key and proves you hold the full link. Once it's sent, this page can't open it again."
          />
          <ToolNotes
            items={[
              "Anyone can make a request link. Only answer people you know, and check with them if anything feels off.",
              "Only the full link can answer. Its key is never sent; your browser uses it to check the request and to prove you hold the link.",
              "One answer only. After you send, this link stops accepting more.",
              "The answer is deleted when they open it, or when the request expires.",
            ]}
          />
          <ReportAbuse kind="request" id={id} className="ml-1" />
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <Panel>
          <RequestCard request={request} label={label} />
          <PanelBody className="flex flex-col gap-4 sm:px-6">
            <Field
              label="Paste the secret"
              htmlFor="answer-text"
              error={tooBig ? `That's ${formatBytes(size)}. The limit is 100 KB.` : undefined}
              labelAction={
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-pressed={mono}
                    onClick={() => setMono((value) => !value)}
                    className={cn(
                      "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-control px-2 text-meta font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-seal/45 [&_svg]:size-3.5",
                      mono ? "bg-ink/[0.06] text-ink" : "text-ink-3 hover:bg-ink/[0.05] hover:text-ink"
                    )}
                  >
                    <Type aria-hidden="true" />
                    <span className="sm:hidden">Mono</span>
                    <span className="hidden sm:inline">Monospace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-control px-2 text-meta font-medium text-ink-3 outline-none transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45 [&_svg]:size-3.5"
                  >
                    <FileText aria-hidden="true" />
                    <span className="sm:hidden">Load file</span>
                    <span className="hidden sm:inline">Load text file</span>
                  </button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept={FILE_ACCEPT}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={(event) => {
                      void loadFile(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </div>
              }
              hint={
                <span className="flex justify-between gap-3">
                  <span>{fileNote ?? "A password, an API key, a .env file. Text up to 100 KB."}</span>
                  <span className="tabular shrink-0">{formatBytes(size)}</span>
                </span>
              }
            >
              <Textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                mono={mono}
                rows={8}
                placeholder="Paste it here"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="min-h-[188px]"
              />
            </Field>
          </PanelBody>
          <PanelFooter className="sm:px-6">
            <p className="text-small text-ink-3">Encrypted in this browser before it&apos;s sent.</p>
            <Button type="submit" loading={sending} disabled={empty || tooBig} className="w-full sm:w-auto">
              <LockKeyhole aria-hidden="true" />
              Encrypt and send
            </Button>
          </PanelFooter>
        </Panel>
        {error ? (
          <p role="alert" className="mt-3 text-small text-danger">
            {error}
          </p>
        ) : null}
        <p role="status" className="sr-only">
          {sending ? "Encrypting and sending." : ""}
        </p>
      </form>
    </ToolLayout>
  );
}

function SentPanel({ request, respondedAt }: { request: PublicRequestResponse; respondedAt: number }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      aria-labelledby="sent-title"
      className="animate-rise overflow-hidden rounded-panel border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.03)]"
    >
      <div className="flex items-start gap-4 px-5 pb-5 pt-6 sm:px-6">
        <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
          <CircleCheck aria-hidden="true" className="size-[22px] animate-stamp" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h2 id="sent-title" ref={headingRef} tabIndex={-1} className="text-h3 text-ink outline-none">
            Sent. Only the person who asked can open it, not us.
          </h2>
          <p className="mt-1.5 max-w-[60ch] text-ui text-ink-3">
            It waits on the server as ciphertext until they open it from their inbox, and then it&apos;s deleted. If
            they don&apos;t open it by {formatTime(request.expiresAt * 1000)}, it&apos;s deleted anyway.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <StatusChip tone="ok">Sealed and sent</StatusChip>
            <StatusChip tone="neutral" icon={<Clock aria-hidden="true" />}>
              {formatTime(respondedAt)}
            </StatusChip>
          </div>
        </div>
      </div>
      <div className="border-t border-line px-5 py-5 sm:px-6">
        <RequestFlow current={3} compact />
      </div>
      <div className="flex flex-col gap-3 border-t border-line bg-surface-2/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-small text-ink-3">Need something from someone yourself?</p>
        <AppLink href="/request" className={buttonVariants({ variant: "secondary", size: "sm", className: "self-start sm:self-auto" })}>
          Make a request
        </AppLink>
      </div>
    </section>
  );
}
