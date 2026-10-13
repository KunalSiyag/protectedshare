"use client";

import { useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FileUp, ScanSearch } from "lucide-react";
import type { CreateSecretV2Request } from "@protectedshare/contracts";
import {
  Badge,
  Button,
  Field,
  Input,
  Kbd,
  Panel,
  PanelBody,
  PanelFooter,
  Segmented,
  Spinner,
  StatusChip,
  Switch,
  Textarea,
  cn,
} from "@protectedshare/ui";
import AppLink from "../../components/app-link";
import ExpiryPicker, { useExpiry } from "../../components/expiry-picker";
import ServerView from "../../components/server-view";
import ToolLayout, { ToolNotes } from "../../components/tool-layout";
import { useToast } from "../../components/toast";
import { addLink } from "../../lib/my-links";
import { resolveExpiresAt, withFragmentParams } from "../../lib/share-window";
import {
  ESTIMATED_AUTH_HASH,
  createManageToken,
  createShare,
  describeError,
  estimatedPayload,
  toEpochSeconds,
} from "../notes/_shared/share-client";
import { loadCrypto, sealTextLazy, useDraftSecrets, useLiveSeal } from "../notes/_shared/use-live-seal";
import { useModKey } from "../notes/_shared/use-mod-key";
import { countEnvVars, detectSecretTypes } from "./detect";

/*
 * Loaded on demand, as on Secure Note: the share result (QR code, copy fields) appears only after
 * sealing, and the password field only when a password is turned on. The first edit prefetches both.
 */
const ShareResult = dynamic(() => import("../../components/share-result"), {
  loading: () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-panel border border-line bg-surface text-ink-3">
      <Spinner size={18} label="Preparing your link" />
    </div>
  ),
});
const PasswordField = dynamic(() => import("../notes/_shared/password-field"), {
  loading: () => <div aria-hidden="true" className="h-[66px]" />,
});

function prefetchAfterFirstInput() {
  void import("../../components/share-result");
  void import("../notes/_shared/password-field");
  void import("../../lib/crypto-task");
}

/** The manage token is kept in this browser, but it is sent when you check a receipt or revoke. */
const MANAGE_TOKEN_LABEL = "Manage token (sent only to check or revoke)";

const MAX_CHARS = 200_000;
const MAX_FILE_BYTES = 256 * 1024;

type ReadChoice = "1" | "2" | "3" | "5" | "10" | "custom";
const READ_OPTIONS: { value: ReadChoice; label: string }[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "custom", label: "Custom" },
];

const PLACEHOLDER = `DATABASE_URL=postgres://app:…@db.internal:5432/prod
STRIPE_SECRET_KEY=sk_live_…
NEXT_PUBLIC_APP_URL=https://example.com`;

type Result = {
  url: string;
  password?: string;
  expiresAt: number;
  reads: number;
  saved: boolean;
  body: CreateSecretV2Request;
  key: string;
  manageToken: string;
};

function readsLabel(reads: number): string {
  return reads === 1 ? "Deleted after 1 read" : `Deleted after ${reads} reads`;
}

export default function SecretsClient() {
  const uid = useId();
  const textId = `${uid}-text`;
  const { toast } = useToast();
  const modKey = useModKey();
  const draft = useDraftSecrets();
  const expiry = useExpiry("86400");

  const [text, setText] = useState("");
  const [readChoice, setReadChoice] = useState<ReadChoice>("1");
  const [customReads, setCustomReads] = useState("25");
  const [withPassword, setWithPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [label, setLabel] = useState("");
  const [textError, setTextError] = useState<string | undefined>();
  const [readsError, setReadsError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const prefetched = useRef(false);
  const prefetchOnce = () => {
    if (prefetched.current) return;
    prefetched.current = true;
    prefetchAfterFirstInput();
  };

  const detected = useMemo(() => detectSecretTypes(text), [text]);
  const varCount = useMemo(() => countEnvVars(text), [text]);

  const reads = readChoice === "custom" ? Number(customReads) : Number(readChoice);
  const readsValid = Number.isInteger(reads) && reads >= 1 && reads <= 100;

  const secret = { key: draft.key, password: withPassword && password ? password : undefined };
  const kdf = secret.password ? "key+password" : "key";
  const preview = useLiveSeal(text, secret);

  const previewExpiry = resolveExpiresAt(expiry.choice, expiry.custom);
  const outgoing = text
    ? {
        payload: preview.sealed?.payload ?? estimatedPayload(text, kdf),
        authHash: preview.sealed?.authHash ?? (secret.password ? ESTIMATED_AUTH_HASH : "‹sealing…›"),
        manageTokenHash: draft.manage?.hash ?? "‹creating…›",
        expiresAt: "expiresAt" in previewExpiry ? toEpochSeconds(previewExpiry.expiresAt) : "‹pick a date›",
        maxReads: readsValid ? reads : "‹1 to 100›",
      }
    : null;

  const localOnly = [
    { label: "Your secrets", value: text },
    { label: "Link key (after #)", value: draft.key },
    ...(secret.password ? [{ label: "Password", value: password }] : []),
    { label: MANAGE_TOKEN_LABEL, value: draft.manage?.token ?? "" },
    ...(label.trim() ? [{ label: "Label", value: label.trim() }] : []),
  ];

  const serverNote = !text ? (
    "Paste something. This panel shows the exact request body, sealed in this browser."
  ) : !secret.password ? (
    "Live: sealed with this draft's key as you type. Creating the link seals it once more with a fresh salt and IV."
  ) : preview.state === "sealed" ? (
    "Sealed preview with your key and password. Creating the link seals it once more with a fresh salt and IV."
  ) : (
    <>
      Shape and sizes only. The password takes 600,000 PBKDF2 rounds to stretch, so we don&apos;t run it on every keystroke.{" "}
      <button
        type="button"
        onClick={() => void preview.sealNow()}
        disabled={preview.state === "sealing"}
        className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink disabled:text-ink-3 disabled:no-underline"
      >
        {preview.state === "sealing" ? "Sealing…" : "Seal a preview now"}
      </button>
    </>
  );

  const loadFile = (file: File | undefined) => {
    if (!file) return;
    setFileNote(null);
    if (file.size > MAX_FILE_BYTES) {
      setTextError(`That file is ${(file.size / 1024).toFixed(0)} KB. EnvShare takes files up to 256 KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      if (content.includes("\u0000")) {
        setTextError("That looks like a binary file. EnvShare is for text: .env files, keys, tokens.");
        return;
      }
      prefetchOnce();
      setText(content);
      setTextError(undefined);
      setFileNote(`Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB) from your device. It hasn't been sent anywhere.`);
      textRef.current?.focus();
    };
    reader.onerror = () => setTextError("Couldn't read that file. Try pasting its contents instead.");
    reader.readAsText(file);
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitError(null);
    let invalid = false;
    if (!text.trim()) {
      setTextError("Paste a secret or open a .env file first.");
      invalid = true;
    } else if (text.length > MAX_CHARS) {
      setTextError(`EnvShare takes up to ${MAX_CHARS.toLocaleString()} characters.`);
      invalid = true;
    }
    if (!readsValid) {
      setReadsError("Choose a whole number from 1 to 100.");
      invalid = true;
    }
    if (withPassword && password.length < 4) {
      setPasswordError("Use at least 4 characters, or turn the password off.");
      invalid = true;
    }
    const resolved = expiry.resolve();
    if ("error" in resolved || invalid) {
      if (!text.trim()) textRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const manage = draft.manage ?? (await createManageToken());
      // The draft key arrives just after mount; make one here if sealing beats it.
      const key = draft.key || (await loadCrypto()).generateKey();
      const sealed = await sealTextLazy(text, { key, password: secret.password });
      const body: CreateSecretV2Request = {
        payload: sealed.payload,
        authHash: sealed.authHash,
        manageTokenHash: manage.hash,
        expiresAt: toEpochSeconds(resolved.expiresAt),
        maxReads: reads,
      };
      const id = await createShare("secret", body);
      const url = withFragmentParams(`${window.location.origin}/secrets/${id}`, { k: key });
      const saved = addLink({
        kind: "secret",
        id,
        url,
        manageToken: manage.token,
        label: label.trim(),
        createdAt: Date.now(),
        expiresAt: resolved.expiresAt,
        maxReads: reads,
      });
      setResult({
        url,
        password: secret.password,
        expiresAt: resolved.expiresAt,
        reads,
        saved,
        body,
        key,
        manageToken: manage.token,
      });
      setText("");
      setFileNote(null);
    } catch (error) {
      const message = describeError(error, "Couldn't create the link. Nothing was stored. Try again.");
      setSubmitError(message);
      toast({ title: "Couldn't create the link", description: message, tone: "danger" });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setPassword("");
    setLabel("");
    setTextError(undefined);
    setPasswordError(undefined);
    draft.reset();
    window.setTimeout(() => textRef.current?.focus(), 0);
  };

  const overLimit = text.length > MAX_CHARS;

  return (
    <ToolLayout
      eyebrow="Share"
      title="Share .env files and API keys securely"
      description="Send a .env file, an API key or a token. It's sealed in this browser and deleted after the reads you allow."
      meta={
        <>
          <StatusChip tone="seal">Encrypted in your browser</StatusChip>
          <StatusChip>1 to 100 reads</StatusChip>
          <AppLink href="/security" className="ml-1 text-small font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-ink">
            How it works
          </AppLink>
        </>
      }
      aside={
        <>
          {result ? (
            <ServerView
              title="What left this browser"
              outgoing={result.body}
              endpoint="POST /api/secrets · sent once"
              localOnly={[
                { label: "Link key (after #)", value: result.key },
                ...(result.password ? [{ label: "Password", value: result.password }] : []),
                { label: MANAGE_TOKEN_LABEL, value: result.manageToken },
              ]}
              note="This is everything the server got. It counts reads and deletes the row after the last one. It can't decrypt anything."
            />
          ) : (
            <ServerView outgoing={outgoing} endpoint="POST /api/secrets" localOnly={localOnly} note={serverNote} />
          )}
          <ToolNotes
            items={[
              "Each open uses one read. After the last one, the row is deleted from the database.",
              "The reader clicks Open before a read is used, so link previews don't eat reads.",
              "Rotate credentials that matter after you share them. A link is a copy.",
            ]}
          />
        </>
      }
    >
      {result ? (
        <ShareResult
          url={result.url}
          password={result.password}
          passwordHint="Send this another way, like a call or a different app. The link alone won't open it."
          expiresAt={result.expiresAt}
          burnLabel={readsLabel(result.reads)}
          savedToLinks={result.saved}
          onReset={reset}
          resetLabel="Share another"
        />
      ) : (
        <Panel>
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void submit();
              }
            }}
          >
            <PanelBody className="flex flex-col gap-6 p-5 sm:p-6">
              <Field
                label="Secrets"
                htmlFor={textId}
                error={textError}
                labelAction={
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                      onChange={(event) => {
                        loadFile(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                    <Button type="button" variant="ghost" size="sm" className="-my-1.5 -mr-2 h-8 px-2" onClick={() => fileRef.current?.click()}>
                      <FileUp aria-hidden="true" />
                      Open .env file
                    </Button>
                  </>
                }
              >
                <div id={`${textId}-wrap`} className="flex flex-col gap-1.5">
                  <Textarea
                    ref={textRef}
                    id={textId}
                    mono
                    value={text}
                    onChange={(event) => {
                      prefetchOnce();
                      setText(event.target.value);
                      setTextError(undefined);
                    }}
                    onDragOver={(event) => {
                      if (event.dataTransfer.types.includes("Files")) {
                        event.preventDefault();
                        setDragging(true);
                      }
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      if (event.dataTransfer.files.length) {
                        event.preventDefault();
                        setDragging(false);
                        loadFile(event.dataTransfer.files[0]);
                      }
                    }}
                    placeholder={PLACEHOLDER}
                    rows={10}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoCorrect="off"
                    invalid={Boolean(textError)}
                    aria-describedby={`${textId}-count${textError ? ` ${textId}-error` : ""}`}
                    className={cn("min-h-[240px] whitespace-pre text-[13px] leading-[1.7]", dragging && "border-ink-3 ring-[3px] ring-seal/20")}
                    autoFocus
                  />
                  <div className="flex items-center justify-between gap-3 text-meta text-ink-3">
                    <span>{varCount > 0 ? `${varCount} ${varCount === 1 ? "variable" : "variables"}` : "Paste, or drop a file here"}</span>
                    <span id={`${textId}-count`} className={cn("tabular", overLimit && "font-medium text-danger")}>
                      {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                      <span className="sr-only"> characters</span>
                    </span>
                  </div>
                  {fileNote ? <p className="text-meta text-ink-3">{fileNote}</p> : null}
                  {detected.length > 0 ? (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5" aria-live="polite">
                      <span className="mr-0.5 flex items-center gap-1.5 text-meta text-ink-3">
                        <ScanSearch aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
                        Looks like:
                      </span>
                      {detected.map((name) => (
                        <Badge key={name}>{name}</Badge>
                      ))}
                      <span className="text-meta text-ink-3">· checked in this browser, never sent</span>
                    </div>
                  ) : null}
                </div>
              </Field>

              <div className="flex flex-col gap-1.5">
                <span id={`${uid}-reads`} className="text-small font-medium text-ink">
                  Read limit
                </span>
                <Segmented
                  value={readChoice}
                  onChange={(next) => {
                    setReadChoice(next);
                    setReadsError(undefined);
                  }}
                  options={READ_OPTIONS}
                  fullWidth
                  aria-labelledby={`${uid}-reads`}
                  aria-describedby={`${uid}-reads-help`}
                />
                {readChoice === "custom" ? (
                  <div className="mt-1 flex animate-fade-in items-center gap-2">
                    <label htmlFor={`${uid}-custom-reads`} className="sr-only">
                      Number of reads
                    </label>
                    <Input
                      id={`${uid}-custom-reads`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={100}
                      value={customReads}
                      onChange={(event) => {
                        setCustomReads(event.target.value);
                        setReadsError(undefined);
                      }}
                      invalid={Boolean(readsError) || !readsValid}
                      className="tabular w-28"
                    />
                    <span className="text-small text-ink-3">reads, up to 100</span>
                  </div>
                ) : null}
                <p id={`${uid}-reads-help`} className={cn("text-small", readsError ? "text-danger" : "text-ink-3")} role={readsError ? "alert" : undefined}>
                  {readsError ??
                    (readsValid
                      ? reads === 1
                        ? "Opens once, then it's deleted from the server."
                        : `Opens ${reads} times, then it's deleted. Good for a small team.`
                      : "Choose a whole number from 1 to 100.")}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Switch
                  checked={withPassword}
                  onCheckedChange={(next) => {
                    setWithPassword(next);
                    setPasswordError(undefined);
                  }}
                  label="Also require a password"
                  description="The link carries the key. A password sent another way means a leaked link alone opens nothing."
                />
                {withPassword ? (
                  <div className="animate-fade-in">
                    <PasswordField
                      id={`${uid}-password`}
                      label="Password they'll also need"
                      value={password}
                      onChange={(next) => {
                        setPassword(next);
                        setPasswordError(undefined);
                      }}
                      error={passwordError}
                    />
                  </div>
                ) : null}
              </div>

              <div className="grid gap-6 border-t border-line pt-6 md:grid-cols-2 md:gap-5">
                <ExpiryPicker {...expiry.pickerProps} id={`${uid}-expiry`} />
                <Field
                  label="Label for My links"
                  htmlFor={`${uid}-label`}
                  optional
                  hint="Saved only in this browser, never sent."
                >
                  <Input
                    value={label}
                    onChange={(event) => setLabel(event.target.value)}
                    maxLength={40}
                    placeholder="Staging keys for Priya"
                    autoComplete="off"
                  />
                </Field>
              </div>

              {submitError ? (
                <p role="alert" className="rounded-field border border-danger/25 bg-danger-soft px-3 py-2.5 text-small text-danger">
                  {submitError}
                </p>
              ) : null}
            </PanelBody>
            <PanelFooter className="px-5 sm:px-6">
              <span className="hidden items-center gap-1.5 text-small text-ink-3 sm:flex">
                <Kbd>{modKey}</Kbd>
                <Kbd>Enter</Kbd>
                <span className="ml-0.5">to seal</span>
              </span>
              <Button type="submit" loading={submitting} disabled={overLimit} className="w-full sm:w-auto">
                Seal and create link
              </Button>
            </PanelFooter>
          </form>
        </Panel>
      )}
    </ToolLayout>
  );
}
