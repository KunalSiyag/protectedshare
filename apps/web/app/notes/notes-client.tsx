"use client";

import { useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FileText, Flame, KeyRound, Link2, LockKeyhole } from "lucide-react";
import type { CreateNoteV2Request } from "@protectedshare/contracts";
import {
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
} from "./_shared/share-client";
import { loadCrypto, sealTextLazy, useDraftSecrets, useLiveSeal } from "./_shared/use-live-seal";
import { useModKey } from "./_shared/use-mod-key";

/*
 * Not needed to paint the composer, so they load on demand: the share result (QR code, copy
 * fields) appears only after sealing, and the password field (passphrase word list, strength
 * estimate) only in the password modes. The first keystroke prefetches both.
 */
const ShareResult = dynamic(() => import("../../components/share-result"), {
  loading: () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-panel border border-line bg-surface text-ink-3">
      <Spinner size={18} label="Preparing your link" />
    </div>
  ),
});
const PasswordField = dynamic(() => import("./_shared/password-field"), {
  loading: () => <div aria-hidden="true" className="h-[66px]" />,
});

function prefetchAfterFirstInput() {
  void import("../../components/share-result");
  void import("./_shared/password-field");
  void import("../../lib/crypto-task");
}

/** The manage token is kept in this browser, but it is sent when you check a receipt or revoke. */
const MANAGE_TOKEN_LABEL = "Manage token (sent only to check or revoke)";

type Mode = "key" | "key+password" | "password";

const MAX_CHARS = 50_000;

function ModeLabel({ icon, short, long }: { icon: React.ReactNode; short: string; long: string }) {
  return (
    <>
      <span className="hidden sm:inline-flex">{icon}</span>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{long}</span>
    </>
  );
}

const MODES: { value: Mode; label: React.ReactNode }[] = [
  { value: "key", label: <ModeLabel icon={<Link2 aria-hidden="true" />} short="Link" long="Link opens it" /> },
  { value: "key+password", label: <ModeLabel icon={<KeyRound aria-hidden="true" />} short="Link + password" long="Link + password" /> },
  { value: "password", label: <ModeLabel icon={<LockKeyhole aria-hidden="true" />} short="Password" long="Password only" /> },
];

const MODE_HELP: Record<Mode, string> = {
  key: "The key rides in the link after the #. Anyone with the whole link can open the note.",
  "key+password":
    "Strongest. The link carries a key and they also type a password you send another way. A leaked link alone opens nothing.",
  password: "The link has no key. They type a password you send separately. Pick a long one: it's all that protects the note.",
};

type Result = {
  url: string;
  mode: Mode;
  body: CreateNoteV2Request;
  key?: string;
  manageToken: string;
  password?: string;
  expiresAt: number;
  burn: boolean;
  saved: boolean;
};

export default function NotesClient() {
  const uid = useId();
  const textId = `${uid}-text`;
  const { toast } = useToast();
  const modKey = useModKey();
  const draft = useDraftSecrets();
  const expiry = useExpiry("86400");

  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("key");
  const [password, setPassword] = useState("");
  const [burn, setBurn] = useState(true);
  const [label, setLabel] = useState("");
  const [textError, setTextError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const prefetched = useRef(false);

  const usesKey = mode !== "password";
  const usesPassword = mode !== "key";
  const secret = { key: usesKey ? draft.key : undefined, password: usesPassword && password ? password : undefined };
  const preview = useLiveSeal(text, secret);

  // Preview expiry without surfacing validation errors while the user is still choosing.
  const previewExpiry = resolveExpiresAt(expiry.choice, expiry.custom);
  const outgoing: CreateNoteV2Request | Record<string, unknown> | null = text
    ? {
        payload: preview.sealed?.payload ?? estimatedPayload(text, mode),
        authHash: preview.sealed?.authHash ?? (usesPassword ? ESTIMATED_AUTH_HASH : "‹sealing…›"),
        manageTokenHash: draft.manage?.hash ?? "‹creating…›",
        expiresAt: "expiresAt" in previewExpiry ? toEpochSeconds(previewExpiry.expiresAt) : "‹pick a date›",
        isBurnAfterRead: burn,
      }
    : null;

  const localOnly = [
    { label: "Your note", value: text },
    ...(usesKey ? [{ label: "Link key (after #)", value: draft.key }] : []),
    ...(usesPassword ? [{ label: "Password", value: password }] : []),
    { label: MANAGE_TOKEN_LABEL, value: draft.manage?.token ?? "" },
    ...(label.trim() ? [{ label: "Label", value: label.trim() }] : []),
  ];

  const serverNote = !text ? (
    "Start typing. This panel shows the exact request body, sealed in this browser."
  ) : !usesPassword ? (
    "Live: sealed with this draft's key as you type. Creating the link seals it once more with a fresh salt and IV."
  ) : preview.state === "sealed" ? (
    "Sealed preview with your password. Creating the link seals it once more with a fresh salt and IV."
  ) : (
    <>
      Shape and sizes only. A password takes 600,000 PBKDF2 rounds to stretch, so we don&apos;t run it on every keystroke.{" "}
      <button
        type="button"
        onClick={() => void preview.sealNow()}
        disabled={!password || preview.state === "sealing"}
        className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink disabled:text-ink-3 disabled:no-underline"
      >
        {preview.state === "sealing" ? "Sealing…" : password ? "Seal a preview now" : "Add a password to preview"}
      </button>
    </>
  );

  const submit = async () => {
    if (submitting) return;
    setSubmitError(null);
    let invalid = false;
    if (!text.trim()) {
      setTextError("Write something to seal first.");
      invalid = true;
    } else if (text.length > MAX_CHARS) {
      setTextError(`Notes can be up to ${MAX_CHARS.toLocaleString()} characters.`);
      invalid = true;
    }
    if (usesPassword) {
      const min = mode === "password" ? 8 : 4;
      if (password.length < min) {
        setPasswordError(
          mode === "password"
            ? "Use at least 8 characters. It's the only thing protecting this note."
            : "Use at least 4 characters."
        );
        invalid = true;
      }
    }
    const resolved = expiry.resolve();
    if ("error" in resolved || invalid) {
      if (!text.trim() || text.length > MAX_CHARS) textRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const manage = draft.manage ?? (await createManageToken());
      // The draft key arrives just after mount; make one here if sealing beats it.
      const key = usesKey ? draft.key || (await loadCrypto()).generateKey() : undefined;
      const sealing = { key, password: secret.password };
      const sealed = await sealTextLazy(text, sealing);
      const body: CreateNoteV2Request = {
        payload: sealed.payload,
        authHash: sealed.authHash,
        manageTokenHash: manage.hash,
        expiresAt: toEpochSeconds(resolved.expiresAt),
        isBurnAfterRead: burn,
      };
      const id = await createShare("note", body);
      const base = `${window.location.origin}/notes/${id}`;
      const url = key ? withFragmentParams(base, { k: key }) : base;
      const saved = addLink({
        kind: "note",
        id,
        url,
        manageToken: manage.token,
        label: label.trim(),
        createdAt: Date.now(),
        expiresAt: resolved.expiresAt,
        maxReads: burn ? 1 : undefined,
      });
      setResult({ url, mode, body, key, manageToken: manage.token, password: sealing.password, expiresAt: resolved.expiresAt, burn, saved });
      setText("");
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

  useEffect(() => {
    if (textError && text.trim() && text.length <= MAX_CHARS) setTextError(undefined);
  }, [text, textError]);

  const overLimit = text.length > MAX_CHARS;

  return (
    <ToolLayout
      eyebrow="Share"
      title="Send a self-destructing note"
      description="Write it, seal it in this browser, send the link. By default it burns after one read."
      meta={
        <>
          <StatusChip tone="seal">Encrypted in your browser</StatusChip>
          <StatusChip>No account</StatusChip>
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
              endpoint="POST /api/notes · sent once"
              localOnly={[
                ...(result.key ? [{ label: "Link key (after #)", value: result.key }] : []),
                ...(result.password ? [{ label: "Password", value: result.password }] : []),
                { label: MANAGE_TOKEN_LABEL, value: result.manageToken },
              ]}
              note="This is everything the server got. It can check a reader's token against authHash, but it can't decrypt the note."
            />
          ) : (
            <ServerView outgoing={outgoing} endpoint="POST /api/notes" localOnly={localOnly} note={serverNote} />
          )}
          <ToolNotes
            items={[
              "A burned note is deleted from the database when it's opened, not hidden.",
              "Link previews in chat apps can't burn it: the reader has to click Open first.",
              "Markdown renders for the reader. Images never load and raw HTML is dropped.",
              <>
                The server keeps ciphertext, a salt, an IV and a hash it can check.{" "}
                <AppLink href="/security" className="font-medium text-ink underline decoration-line-strong underline-offset-4">
                  Security model
                </AppLink>
              </>,
            ]}
          />
        </>
      }
    >
      {result ? (
        <ShareResult
          url={result.url}
          password={result.password}
          passwordHint={
            result.mode === "key+password"
              ? "Send this another way, like a call or a different app. The link alone won't open the note."
              : undefined
          }
          expiresAt={result.expiresAt}
          burnLabel={result.burn ? "Burns after first read" : undefined}
          savedToLinks={result.saved}
          onReset={reset}
          resetLabel="Write another note"
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
              <Field label="Note" htmlFor={textId} error={textError}>
                <div id={`${textId}-wrap`} className="flex flex-col gap-1.5">
                  <Textarea
                    ref={textRef}
                    id={textId}
                    value={text}
                    onChange={(event) => {
                      if (!prefetched.current) {
                        prefetched.current = true;
                        prefetchAfterFirstInput();
                      }
                      setText(event.target.value);
                    }}
                    placeholder={"The Wi‑Fi password is…\n\nMarkdown works: **bold**, `code`, lists."}
                    rows={9}
                    invalid={Boolean(textError)}
                    aria-describedby={`${textId}-count${textError ? ` ${textId}-error` : ""}`}
                    className="min-h-[220px] text-[15px] leading-[1.6]"
                    autoFocus
                  />
                  <div className="flex items-center justify-between gap-3 text-meta text-ink-3">
                    <span className="flex items-center gap-1.5">
                      <FileText aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
                      Markdown supported
                    </span>
                    <span id={`${textId}-count`} className={cn("tabular", overLimit && "font-medium text-danger")}>
                      {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                      <span className="sr-only"> characters</span>
                    </span>
                  </div>
                </div>
              </Field>

              <div className="flex flex-col gap-2">
                <span id={`${uid}-mode`} className="text-small font-medium text-ink">
                  How they open it
                </span>
                <Segmented
                  value={mode}
                  onChange={(next) => {
                    setMode(next);
                    setPasswordError(undefined);
                  }}
                  options={MODES}
                  fullWidth
                  aria-labelledby={`${uid}-mode`}
                  aria-describedby={`${uid}-mode-help`}
                />
                <p id={`${uid}-mode-help`} className="text-small text-ink-3">
                  {MODE_HELP[mode]}
                </p>
                {usesPassword ? (
                  <div className="mt-2 animate-fade-in">
                    <PasswordField
                      id={`${uid}-password`}
                      label={mode === "key+password" ? "Password they'll also need" : "Password"}
                      value={password}
                      onChange={(next) => {
                        setPassword(next);
                        setPasswordError(undefined);
                      }}
                      error={passwordError}
                      meter={mode === "password" || password.length > 0}
                    />
                  </div>
                ) : null}
              </div>

              <div className="grid gap-6 border-t border-line pt-6 md:grid-cols-2 md:gap-5">
                <ExpiryPicker {...expiry.pickerProps} id={`${uid}-expiry`} />
                <div className="flex flex-col gap-1.5">
                  <Switch
                    checked={burn}
                    onCheckedChange={setBurn}
                    label={
                      <span className="inline-flex items-center gap-1.5">
                        Burn after reading
                        {burn ? <Flame aria-hidden="true" className="size-3.5 text-seal" /> : null}
                      </span>
                    }
                    description={
                      burn
                        ? "Deleted from the server the moment it's opened. They get one look."
                        : "Stays readable by anyone with the link until it expires."
                    }
                  />
                </div>
              </div>

              <Field
                label="Label for My links"
                htmlFor={`${uid}-label`}
                optional
                hint="Helps you find it later. Saved only in this browser, never sent."
              >
                <Input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  maxLength={40}
                  placeholder="Wi‑Fi for Sam"
                  autoComplete="off"
                />
              </Field>

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
              <Button type="submit" size="md" loading={submitting} disabled={overLimit} className="w-full sm:w-auto">
                Seal and create link
              </Button>
            </PanelFooter>
          </form>
        </Panel>
      )}
    </ToolLayout>
  );
}
