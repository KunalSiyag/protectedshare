"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, EyeOff, Flame } from "lucide-react";
import { Button, Panel, Segmented, StatusChip, cn } from "@protectedshare/ui";
import AppLink from "../../../components/app-link";
import ReportAbuse from "../../../components/report-abuse";
import ToolLayout, { ToolNotes } from "../../../components/tool-layout";
import { copyText } from "../../../lib/clipboard";
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
} from "../../notes/_shared/reader-ui";
import { useShareReader } from "../../notes/_shared/use-share-reader";
import { parseEnv } from "../detect";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (id: string, text: string) => {
    const ok = await copyText(text);
    setCopied(ok ? id : `fail:${id}`);
    window.setTimeout(() => setCopied((current) => (current === id || current === `fail:${id}` ? null : current)), 1600);
  };
  return { copied, copy };
}

function readsText(n: number): string {
  return n === 1 ? "1 read" : `${n} reads`;
}

function SecretContent({ text }: { text: string }) {
  const lines = useMemo(() => parseEnv(text), [text]);
  const pairs = lines.filter((line) => line.kind === "pair").length;
  const [view, setView] = useState<"rows" | "raw">(pairs > 0 ? "rows" : "raw");
  const { copied, copy } = useCopy();

  const download = () => {
    const blob = new Blob([text.endsWith("\n") ? text : `${text}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "shared.env";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Panel>
      <div className="flex flex-col gap-3 border-b border-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-[22px] tracking-[-0.01em] text-ink">Secrets</h2>
          {pairs > 0 ? (
            <p className="text-small text-ink-3">
              {pairs} {pairs === 1 ? "variable" : "variables"}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pairs > 0 ? (
            <Segmented
              size="sm"
              value={view}
              onChange={setView}
              aria-label="Display"
              options={[
                { value: "rows", label: "Rows" },
                { value: "raw", label: "Raw" },
              ]}
            />
          ) : null}
          <Button variant="secondary" size="sm" onClick={() => void copy("all", text)}>
            {copied === "all" ? <Check aria-hidden="true" className="text-ok" /> : <Copy aria-hidden="true" />}
            {copied === "all" ? "Copied" : "Copy all"}
          </Button>
          <Button variant="secondary" size="sm" onClick={download}>
            <Download aria-hidden="true" />
            Download .env
          </Button>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {copied && !copied.startsWith("fail:") ? "Copied to clipboard" : ""}
      </span>
      {view === "raw" ? (
        <pre className="max-h-[560px] overflow-auto whitespace-pre px-5 py-4 font-mono text-[13px] leading-[1.7] text-ink sm:px-6">{text}</pre>
      ) : (
        <ul className="divide-y divide-line/70 font-mono text-[13px]">
          {lines.map((line, index) => {
            if (line.kind === "text") {
              if (!line.raw.trim()) return null;
              return (
                <li key={index} className="whitespace-pre-wrap px-5 py-2 text-ink-3 [overflow-wrap:anywhere] sm:px-6">
                  {line.raw}
                </li>
              );
            }
            const id = `row-${index}`;
            const isCopied = copied === id;
            return (
              <li key={index} className="group flex items-start gap-3 px-5 py-2.5 sm:grid sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] sm:items-center sm:px-6">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:contents">
                  <span className="truncate text-ink-2" title={line.key}>
                    {line.key}
                  </span>
                  <span className="min-w-0 break-all text-ink">{line.value || <span className="text-ink-3">(empty)</span>}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void copy(id, line.value)}
                  aria-label={`Copy value of ${line.key}`}
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-control px-2 font-sans text-meta font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-seal/45",
                    isCopied ? "bg-ok-soft text-ok" : "text-ink-3 hover:bg-ink/[0.05] hover:text-ink"
                  )}
                >
                  {isCopied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
                  <span className="hidden sm:inline">{isCopied ? "Copied" : "Copy"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export default function SecretReader({ id }: { id: string }) {
  const reader = useShareReader("secret", id);
  const { phase, meta, opened } = reader;

  const left = meta?.remainingReads ?? 1;
  const lastRead = left <= 1;
  const chips = meta ? (
    <>
      <BurnChip>{lastRead ? "Last read" : `${readsText(left)} left`}</BurnChip>
      <ExpiryChip expiresAt={meta.expiresAt * 1000} />
    </>
  ) : null;
  const gateTitle = lastRead ? "This secret will be deleted after you open it" : `Opening this uses 1 of the ${readsText(left)} left`;

  let body: React.ReactNode;
  if (phase === "loading") {
    body = <ReaderLoading label="Checking the link…" />;
  } else if (phase === "gone") {
    body = <GoneMessage noun="secret" toolHref="/secrets" toolLabel="Share a secret of your own" />;
  } else if (phase === "error") {
    body = <ErrorMessage message={reader.error ?? "Try again in a moment."} onRetry={() => void reader.retry()} />;
  } else if (phase === "missing-key") {
    body = <MissingKeyMessage noun="secret" />;
  } else if (phase === "bad-key") {
    body = <BadKeyMessage noun="secret" onPassword={meta?.v === 1 ? reader.askPassword : undefined} />;
  } else if (phase === "gate") {
    body = (
      <OpenGate
        title={gateTitle}
        description={
          <p>
            {lastRead
              ? "You get one look. Copy or download what you need before you close the tab."
              : "Each open uses a read. When they run out, the server deletes it."}
          </p>
        }
        openLabel="Open the secret"
        busy={reader.busy}
        error={reader.error}
        onOpen={() => void reader.open()}
        chips={chips}
      />
    );
  } else if (phase === "password") {
    body = (
      <PasswordGate
        id={`secret-${id}-password`}
        title={lastRead ? "Enter the password. It's deleted once it opens." : "This secret also needs a password"}
        description={
          <p>
            The link holds the key. The sender should have sent the password another way. A wrong password doesn&apos;t use up a read.
          </p>
        }
        openLabel="Open the secret"
        busy={reader.busy}
        error={reader.passwordError}
        onOpen={(password) => void reader.open(password)}
        chips={chips}
      />
    );
  } else if (phase === "open" && opened) {
    const remaining = opened.remainingReads ?? 0;
    body = (
      <div className="flex animate-rise flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {remaining === 0 ? (
            <StatusChip tone="seal" icon={<Flame aria-hidden="true" />}>
              Deleted from the server
            </StatusChip>
          ) : (
            <>
              <StatusChip tone="ok">Decrypted in this browser</StatusChip>
              <BurnChip>{readsText(remaining)} left</BurnChip>
            </>
          )}
        </div>
        <p className="text-small text-ink-2" role="status">
          {remaining === 0
            ? "That was the last read, so it's been deleted from the server. This tab holds the only copy."
            : `It can be opened ${remaining === 1 ? "once more" : `${remaining} more times`}, then the server deletes it.`}
        </p>
        <SecretContent text={opened.text} />
        {reader.keyStripped ? (
          <p className="flex items-start gap-2 text-meta text-ink-3">
            <EyeOff aria-hidden="true" className="mt-px size-3.5 shrink-0" strokeWidth={1.75} />
            We removed the key from the address bar so it doesn&apos;t sit in your browser history.
          </p>
        ) : null}
      </div>
    );
  }

  const localOnly = [
    ...(reader.hasKey ? [{ label: "Key (from the link)", value: reader.key }] : []),
    ...(opened ? [{ label: "Decrypted secrets", value: opened.text }] : []),
  ];

  return (
    <ToolLayout
      eyebrow="EnvShare"
      title={phase === "open" ? "Your secrets" : "Someone shared secrets with you"}
      description={
        phase === "open"
          ? "Decrypted here, in your browser. The server only ever held ciphertext."
          : "Encrypted in the sender's browser, with a read limit. It decrypts here, in yours."
      }
      aside={
        <>
          <ReaderServerView request={reader.lastRequest} metaPath={`/api/secrets/${id}/meta`} localOnly={localOnly} />
          <ToolNotes
            items={[
              "Checking this link doesn't use a read. Only the Open button does.",
              "Store what you need in your password manager or secrets store, not in chat.",
              <>
                Need to send some back?{" "}
                <AppLink href="/secrets" className="font-medium text-ink underline decoration-line-strong underline-offset-4">
                  Use EnvShare
                </AppLink>
              </>,
            ]}
          />
          {phase !== "loading" && phase !== "gone" ? <ReportAbuse kind="secret" id={id} className="ml-1" /> : null}
        </>
      }
    >
      {body}
    </ToolLayout>
  );
}
