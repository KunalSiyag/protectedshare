"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock, ExternalLink, Link2, Plus, QrCode as QrIcon, ShieldAlert } from "lucide-react";
import {
  createRequestKeys,
  deriveRespondToken,
  generateKey,
  generateToken,
  hashToken,
  type EncryptedJson,
} from "@protectedshare/crypto";
import type { CreateRequestRequest, CreateRequestResponse } from "@protectedshare/contracts";
import { Button, Field, Input, Panel, PanelBody, PanelFooter, StatusChip, Textarea, cn } from "@protectedshare/ui";
import AppLink from "../../components/app-link";
import CopyField from "../../components/copy-field";
import ExpiryPicker, { useExpiry } from "../../components/expiry-picker";
import QrCode from "../../components/qr-code";
import SealMark from "../../components/seal-mark";
import ServerView from "../../components/server-view";
import ToolLayout, { ToolNotes } from "../../components/tool-layout";
import { apiUrl } from "../../lib/api";
import { describeRequestFailure, readApiError } from "../../lib/feedback";
import { addLink, makeLinkLabel } from "../../lib/my-links";
import { formatShareDeadline, resolveExpiresAt, withFragmentParams } from "../../lib/share-window";
import RequestFlow from "./request-flow";
import { LABEL_BLOB_MAX, NOTE_MAX, TITLE_MAX, inboxPath, sealLabel, senderPath, type RequestLabel } from "./request-shared";

type Keys = {
  publicKey: string;
  privateKey: string;
  inboxHash: string;
  /** Rides in both links as #k=. Encrypts the label and derives the respond token. */
  labelKey: string;
  respondHash: string;
  manageToken: string;
  manageTokenHash: string;
};

type Ready = {
  id: string;
  senderUrl: string;
  inboxUrl: string;
  expiresAtMs: number;
  saved: boolean;
  privateKey: string;
  labelKey: string;
};

async function makeKeys(): Promise<Keys> {
  const pair = await createRequestKeys();
  const manageToken = generateToken();
  const labelKey = generateKey();
  const { respondHash } = await deriveRespondToken(labelKey);
  return {
    publicKey: pair.publicKey,
    privateKey: pair.privateKey,
    inboxHash: pair.inboxHash,
    labelKey,
    respondHash,
    manageToken,
    manageTokenHash: await hashToken(manageToken),
  };
}

function cleanLabel(title: string, note: string): RequestLabel | null {
  const label = { title: title.trim(), note: note.trim() };
  return label.title || label.note ? label : null;
}

export default function RequestClient() {
  const expiry = useExpiry("86400");
  const [keys, setKeys] = useState<Keys | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [sealedLabel, setSealedLabel] = useState<EncryptedJson | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState<Ready | null>(null);
  const [sentBody, setSentBody] = useState<CreateRequestRequest | null>(null);
  const keysPromise = useRef<Promise<Keys> | null>(null);

  const freshKeys = useCallback(() => {
    const promise = makeKeys();
    keysPromise.current = promise;
    promise.then(
      (next) => {
        if (keysPromise.current === promise) setKeys(next);
      },
      () => setError("This browser can't create the keys a request needs. Try a current version of Chrome, Firefox or Safari.")
    );
    return promise;
  }, []);

  useEffect(() => {
    void freshKeys();
  }, [freshKeys]);

  // Live preview: encrypt the label as you type so the server view shows the real ciphertext.
  // The label is always sent: even without a title it carries the public key fingerprint.
  const label = useMemo(() => cleanLabel(title, note), [title, note]);
  useEffect(() => {
    if (!keys) {
      setSealedLabel(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const sealed = await sealLabel(keys.labelKey, label, keys.publicKey);
        if (!cancelled) setSealedLabel(sealed);
      } catch {
        if (!cancelled) setSealedLabel(null);
      }
    }, 90);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [keys, label]);

  const previewExpiresAt = useMemo(() => {
    const result = resolveExpiresAt(expiry.choice, expiry.custom);
    return "expiresAt" in result ? Math.floor(result.expiresAt / 1000) : undefined;
  }, [expiry.choice, expiry.custom]);

  const preview: CreateRequestRequest | null = keys
    ? {
        publicKey: keys.publicKey,
        ...(sealedLabel ? { label: sealedLabel } : {}),
        inboxHash: keys.inboxHash,
        respondHash: keys.respondHash,
        manageTokenHash: keys.manageTokenHash,
        expiresAt: previewExpiresAt ?? 0,
      }
    : null;

  const labelTooLong = sealedLabel !== null && sealedLabel.encryptedBlob.length > LABEL_BLOB_MAX;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError(null);
    const resolved = expiry.resolve();
    if ("error" in resolved) return;

    setLoading(true);
    try {
      const current = keys ?? (await (keysPromise.current ?? freshKeys()));
      const labelValue = cleanLabel(title, note);
      const sealed = await sealLabel(current.labelKey, labelValue, current.publicKey);
      if (sealed.encryptedBlob.length > LABEL_BLOB_MAX) {
        throw new Error("The title and note are too long together. Shorten the note.");
      }

      const body: CreateRequestRequest = {
        publicKey: current.publicKey,
        label: sealed,
        inboxHash: current.inboxHash,
        respondHash: current.respondHash,
        manageTokenHash: current.manageTokenHash,
        expiresAt: Math.floor(resolved.expiresAt / 1000),
      };

      const response = await fetch(apiUrl("/api/requests"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Could not create the request. Try again in a moment."));
      }
      const { id } = (await response.json()) as CreateRequestResponse;

      const origin = window.location.origin;
      // Both links carry the link key: theirs needs it to answer, yours to show the title.
      const senderUrl = withFragmentParams(`${origin}${senderPath(id)}`, { k: current.labelKey });
      const inboxUrl = withFragmentParams(`${origin}${inboxPath(id)}`, { p: current.privateKey, k: current.labelKey });

      const saved = addLink({
        kind: "request",
        id,
        url: senderUrl,
        inboxUrl,
        manageToken: current.manageToken,
        label: makeLinkLabel(labelValue?.title || "Secret request"),
        createdAt: Date.now(),
        expiresAt: resolved.expiresAt,
        maxReads: 1,
      });

      setSentBody(body);
      setReady({
        id,
        senderUrl,
        inboxUrl,
        expiresAtMs: resolved.expiresAt,
        saved,
        privateKey: current.privateKey,
        labelKey: current.labelKey,
      });
      // These keys are spent. Make new ones for the next request.
      setKeys(null);
      keysPromise.current = null;
    } catch (caught) {
      setError(describeRequestFailure(caught, "Could not create the request. Try again in a moment."));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setReady(null);
    setSentBody(null);
    setTitle("");
    setNote("");
    setError(null);
    void freshKeys();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const localOnly = ready
    ? [
        { label: "Private key", value: ready.privateKey },
        { label: "Link key", value: ready.labelKey },
      ]
    : [
        { label: "Private key", value: keys?.privateKey ?? "" },
        { label: "Link key", value: keys?.labelKey ?? "" },
        { label: "Title and note", value: label ? [label.title, label.note].filter(Boolean).join(" — ") : "" },
      ];

  return (
    <ToolLayout
      eyebrow="Share"
      title="Ask for a secret"
      description="Send someone a link. What they paste is encrypted in their browser to a key only you hold, and you open it from your private inbox link. Neither of you needs an account."
      meta={
        <>
          <StatusChip tone="seal">Encrypted to your key</StatusChip>
          <StatusChip>One answer, opened once</StatusChip>
          <StatusChip>No account</StatusChip>
        </>
      }
      aside={
        <>
          <ServerView
            outgoing={ready ? sentBody : preview}
            endpoint={ready ? "POST /api/requests · sent" : "POST /api/requests"}
            localOnly={localOnly}
            note="The server gets your public key, which can only lock, plus hashes that let it check the inbox and answer tokens. The private key that opens the answer lives after the # in your inbox link, and browsers don't send that part."
          />
          <ToolNotes
            items={[
              "One answer per request. After they send, their link stops accepting more.",
              "Opening the answer deletes it from the server. Copy it somewhere safe first.",
              "Lose the inbox link and nobody can read the answer. We can't recover it.",
              "Only someone with the full link can answer. Its key encrypts your title and your public key's fingerprint, so their browser can tell if anyone swapped the key.",
            ]}
          />
        </>
      }
    >
      {ready ? (
        <RequestReady ready={ready} onReset={reset} />
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Panel>
            <div className="border-b border-line px-5 py-5 sm:px-6">
              <RequestFlow current={1} />
            </div>
            <PanelBody className="flex flex-col gap-5 sm:px-6">
              <Field
                label="What do you need?"
                htmlFor="request-title"
                optional
                hint="They'll see this at the top of their link."
              >
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value.slice(0, TITLE_MAX))}
                  placeholder="Staging database password"
                  maxLength={TITLE_MAX}
                  autoComplete="off"
                  spellCheck
                />
              </Field>
              <Field
                label="Note for them"
                htmlFor="request-note"
                optional
                error={labelTooLong ? "This note is too long. Shorten it a little." : undefined}
                hint={
                  <span className="flex justify-between gap-3">
                    <span>Which account, which environment. Don&apos;t put secrets here.</span>
                    <span className="tabular shrink-0" aria-hidden="true">
                      {note.length}/{NOTE_MAX}
                    </span>
                  </span>
                }
              >
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX))}
                  placeholder="The read-only user is fine. Paste it as user:password."
                  maxLength={NOTE_MAX}
                  rows={3}
                  className="min-h-[92px]"
                />
              </Field>
              <ExpiryPicker
                {...expiry.pickerProps}
                id="request-expiry"
                label="Request expires after"
                hint="After this, the request and any unopened answer are deleted."
                disabled={loading}
              />
            </PanelBody>
            <PanelFooter className="sm:px-6">
              <p className="text-small text-ink-3">Keys are made in this browser.</p>
              <Button type="submit" loading={loading} disabled={labelTooLong} className="w-full sm:w-auto">
                Create request
              </Button>
            </PanelFooter>
          </Panel>
          {error ? (
            <p role="alert" className="mt-3 text-small text-danger">
              {error}
            </p>
          ) : null}
          <p role="status" className="sr-only">
            {loading ? "Creating your request." : ""}
          </p>
        </form>
      )}
    </ToolLayout>
  );
}

function LinkStep({
  number,
  title,
  description,
  children,
  className,
}: {
  number: number;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-5 py-5 sm:px-6", className)}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="tabular mt-px flex size-6 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-meta font-semibold text-ink"
        >
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-6 tracking-[-0.01em] text-ink">{title}</h3>
          <p className="mt-0.5 text-small text-ink-3">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:pl-9">{children}</div>
    </div>
  );
}

function RequestReady({ ready, onReset }: { ready: Ready; onReset: () => void }) {
  const [showQr, setShowQr] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: false });
  }, []);

  return (
    <section
      aria-labelledby="request-ready-title"
      className="animate-rise overflow-hidden rounded-panel border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.03)]"
    >
      <div className="flex items-start gap-4 px-5 pb-5 pt-6 sm:px-6">
        <span className="relative mt-0.5 flex size-11 shrink-0 items-center justify-center">
          <span aria-hidden="true" className="absolute inset-0 animate-ring rounded-full border border-seal/50" />
          <SealMark size={44} className="animate-stamp" />
        </span>
        <div className="min-w-0">
          <h2 id="request-ready-title" ref={headingRef} tabIndex={-1} className="text-h3 text-ink outline-none">
            Request ready. Two links, two jobs.
          </h2>
          <p className="mt-1 text-ui text-ink-3">Send the first one. Keep the second one to yourself.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <StatusChip tone="neutral" icon={<Clock aria-hidden="true" />}>
              Expires {formatShareDeadline(ready.expiresAtMs)}
            </StatusChip>
            <StatusChip tone="neutral">One answer</StatusChip>
          </div>
        </div>
      </div>

      <div className="border-t border-line px-5 py-4 sm:px-6">
        <RequestFlow current={2} compact />
      </div>

      <LinkStep
        number={1}
        title="Send this to them"
        description="It shows your title and a box for the secret. It can't open the answer."
        className="border-t border-line"
      >
        <CopyField value={ready.senderUrl} label="Request link" size="lg" />
        <div>
          <Button
            variant="secondary"
            size="sm"
            aria-expanded={showQr}
            aria-controls="request-qr"
            onClick={() => setShowQr((value) => !value)}
          >
            <QrIcon aria-hidden="true" />
            {showQr ? "Hide QR code" : "Show QR code"}
          </Button>
          {showQr ? (
            <div id="request-qr" className="mt-4 flex animate-fade-in flex-col items-start gap-2 sm:flex-row sm:items-end sm:gap-4">
              <QrCode value={ready.senderUrl} size={168} label="QR code for the request link" />
              <p className="max-w-[240px] text-small text-ink-3">
                Scan to answer on a phone. The code holds the request link, not your inbox link.
              </p>
            </div>
          ) : null}
        </div>
      </LinkStep>

      <LinkStep
        number={2}
        title="Keep this one: your private inbox"
        description="Open it any time to check for the answer."
        className="border-t border-line"
      >
        <div className="flex items-start gap-2.5 rounded-field border border-warn/25 bg-warn-soft px-3.5 py-3">
          <ShieldAlert aria-hidden="true" className="mt-px size-4 shrink-0 text-warn" strokeWidth={2} />
          <p className="text-small text-ink-2">
            <span className="font-medium text-ink">It&apos;s the only way to read the answer.</span> It holds your private
            key, so don&apos;t send it to anyone. If you lose it, we can&apos;t recover it.
          </p>
        </div>
        <CopyField value={ready.inboxUrl} label="Inbox link" />
        <div>
          <a
            href={ready.inboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-control border border-line-strong bg-surface px-3 text-small font-medium text-ink shadow-[0_1px_0_rgb(0_0_0/0.03)] outline-none transition-colors hover:border-ink-3/60 hover:bg-surface-2/60 focus-visible:ring-2 focus-visible:ring-seal/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bg [&_svg]:size-[15px]"
          >
            <ExternalLink aria-hidden="true" />
            Open inbox in a new tab
          </a>
        </div>
      </LinkStep>

      <div className="flex flex-col-reverse gap-3 border-t border-line bg-surface-2/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2 text-small text-ink-3">
          <Link2 aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
          {ready.saved ? (
            <span>
              Both links are saved in{" "}
              <AppLink href="/links" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                My links
              </AppLink>{" "}
              on this device only.
            </span>
          ) : (
            <span>This browser couldn&apos;t save them. Copy the inbox link before you leave.</span>
          )}
        </p>
        <Button variant="secondary" size="sm" onClick={onReset} className="self-start sm:self-auto">
          <Plus aria-hidden="true" />
          New request
        </Button>
      </div>
    </section>
  );
}
