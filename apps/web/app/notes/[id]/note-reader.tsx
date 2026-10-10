"use client";

import { useState } from "react";
import { Check, Copy, EyeOff, Flame } from "lucide-react";
import { Button, Panel, PanelHeader, Segmented, StatusChip } from "@protectedshare/ui";
import AppLink from "../../../components/app-link";
import ToolLayout, { ToolNotes } from "../../../components/tool-layout";
import { copyText } from "../../../lib/clipboard";
import { formatShareDeadline } from "../../../lib/share-window";
import {
  BadKeyMessage,
  BurnChip,
  ErrorMessage,
  ExpiryChip,
  GoneMessage,
  MissingKeyMessage,
  OpenGate,
  PasswordGate,
  ReaderLoading,
  ReaderServerView,
} from "../_shared/reader-ui";
import SafeMarkdown from "../_shared/safe-markdown";
import { useShareReader } from "../_shared/use-share-reader";

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          const ok = await copyText(text);
          setState(ok ? "copied" : "failed");
          window.setTimeout(() => setState("idle"), 1800);
        }}
      >
        {state === "copied" ? <Check aria-hidden="true" className="text-ok" /> : <Copy aria-hidden="true" />}
        {state === "copied" ? "Copied" : state === "failed" ? "Select and copy" : label}
      </Button>
      <span className="sr-only" aria-live="polite">
        {state === "copied" ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}

export default function NoteReader({ id }: { id: string }) {
  const reader = useShareReader("note", id);
  const { phase, meta, opened } = reader;
  const [view, setView] = useState<"formatted" | "plain">("formatted");

  const expiresAt = meta ? meta.expiresAt * 1000 : null;
  const chips =
    meta && expiresAt ? (
      <>
        {meta.isBurnAfterRead ? <BurnChip>Burns after this read</BurnChip> : null}
        <ExpiryChip expiresAt={expiresAt} />
      </>
    ) : null;


  let body: React.ReactNode;
  if (phase === "loading" || (reader.autoOpening && phase === "gate")) {
    body = <ReaderLoading label="Opening the note…" />;
  } else if (phase === "gone") {
    body = <GoneMessage noun="note" toolHref="/notes" toolLabel="Write a note of your own" />;
  } else if (phase === "error") {
    body = <ErrorMessage message={reader.error ?? "Try again in a moment."} onRetry={() => void reader.retry()} />;
  } else if (phase === "missing-key") {
    body = <MissingKeyMessage noun="note" />;
  } else if (phase === "bad-key") {
    body = <BadKeyMessage noun="note" onPassword={meta?.v === 1 ? reader.askPassword : undefined} />;
  } else if (phase === "gate") {
    body = (
      <OpenGate
        title="This note will be deleted after you open it"
        description={
          <p>
            You get one look. Open it when you&apos;re ready to read it, and copy anything you need to keep before you close the tab.
          </p>
        }
        openLabel="Open the note"
        busy={reader.busy}
        error={reader.error}
        onOpen={() => void reader.open()}
        chips={chips}
      />
    );
  } else if (phase === "password") {
    body = (
      <PasswordGate
        id={`note-${id}-password`}
        title={meta?.isBurnAfterRead ? "Enter the password. The note is deleted once it opens." : "This note needs a password"}
        description={
          <p>
            {meta?.kdf === "key+password"
              ? "The link holds half of the key. The sender should have sent you a password another way, like a message or a call."
              : "The sender should have sent you the password separately from the link."}{" "}
            A wrong password doesn&apos;t use anything up.
          </p>
        }
        openLabel="Open the note"
        busy={reader.busy}
        error={reader.passwordError}
        onOpen={(password) => void reader.open(password)}
        chips={chips}
      />
    );
  } else if (phase === "open" && opened) {
    body = (
      <div className="flex animate-rise flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {opened.deleted ? (
              <StatusChip tone="seal" icon={<Flame aria-hidden="true" />}>
                Deleted from the server
              </StatusChip>
            ) : (
              <StatusChip tone="ok">Decrypted in this browser</StatusChip>
            )}
          </div>
        </div>
        <p className="text-small text-ink-2" role="status">
          {opened.deleted
            ? "This note has been deleted from the server. This tab holds the only copy, so save what you need before you close it."
            : `Anyone with the link can open it again until ${formatShareDeadline(opened.expiresAt)}.`}
        </p>

        <Panel>
          <PanelHeader
            title="Note"
            className="items-center py-3"
            actions={
              <>
                <Segmented
                  size="sm"
                  value={view}
                  onChange={setView}
                  aria-label="Display"
                  options={[
                    { value: "formatted", label: "Formatted" },
                    { value: "plain", label: "Plain text" },
                  ]}
                />
                <CopyButton text={opened.text} />
              </>
            }
          />
          <div className="px-5 py-5 sm:px-6 sm:py-6">
            {view === "formatted" ? (
              <SafeMarkdown>{opened.text}</SafeMarkdown>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-small leading-[1.65] text-ink [overflow-wrap:anywhere]">{opened.text}</pre>
            )}
          </div>
        </Panel>

        {reader.keyStripped ? (
          <p className="flex items-start gap-2 text-meta text-ink-3">
            <EyeOff aria-hidden="true" className="mt-px size-3.5 shrink-0" strokeWidth={1.75} />
            We removed the key from the address bar so it doesn&apos;t sit in your browser history.
          </p>
        ) : null}
      </div>
    );
  }

  const opening = phase === "open";
  const localOnly = [
    ...(reader.hasKey ? [{ label: "Key (from the link)", value: reader.key }] : []),
    ...(opened ? [{ label: "Decrypted note", value: opened.text }] : []),
  ];

  return (
    <ToolLayout
      eyebrow="Secure note"
      title={opening ? "Your note" : "Someone sent you a sealed note"}
      description={
        opening
          ? "Decrypted here, in your browser. The server only ever held ciphertext."
          : "It was encrypted in the sender's browser and decrypts in yours. The server can't read it."
      }
      aside={
        <>
          <ReaderServerView request={reader.lastRequest} metaPath={`/api/notes/${id}/meta`} localOnly={localOnly} />
          <ToolNotes
            items={[
              "Checking this link doesn't open it. Only the Open button fetches the note.",
              "Images in the note are never loaded, so nobody learns when you read it.",
              <>
                Want to send one back?{" "}
                <AppLink href="/notes" className="font-medium text-ink underline decoration-line-strong underline-offset-4">
                  Write a secure note
                </AppLink>
              </>,
            ]}
          />
        </>
      }
    >
      {body}
    </ToolLayout>
  );
}
