"use client";

import { useEffect, useMemo, useState } from "react";
import { Braces, Copy, KeyRound, ShieldCheck, Sparkles, Trash2, WifiOff } from "lucide-react";
import { Button, Panel, PanelBody, PanelFooter, PanelHeader, Segmented, StatusChip, Textarea, buttonVariants, cn } from "@protectedshare/ui";
import AppLink from "../../../components/app-link";
import ToolLayout, { ToolNotes } from "../../../components/tool-layout";
import { useToast } from "../../../components/toast";
import { copyText } from "../../../lib/clipboard";
import OfflinePanel from "../_components/offline-panel";
import SecretInput from "../_components/secret-input";
import {
  CLAIM_LABELS,
  cleanToken,
  decodeToken,
  headerNotes,
  isHmacAlg,
  isTimeClaim,
  looksLikeMilliseconds,
  payloadNotes,
  secretBytes,
  signHs256,
  validity,
  verifyHmac,
  type JsonObject,
  type Note,
  type SecretEncoding,
} from "./jwt";

const EXAMPLE_SECRET = "example-secret-for-this-page-only";

type Verification = { state: "idle" } | { state: "ok" } | { state: "bad" } | { state: "error"; message: string };

/* ───────────────────────── Formatting ───────────────────────── */

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "in 3 hours", "2 days ago". Units switch a little early (45 minutes reads as "1 hour") so rounding never says "60 minutes". */
function relativeTime(seconds: number, nowSeconds: number): string {
  const delta = seconds - nowSeconds;
  const abs = Math.abs(delta);
  if (abs < 45) return relative.format(Math.round(delta), "second");
  if (abs < 45 * 60) return relative.format(Math.round(delta / 60), "minute");
  if (abs < 22 * 3600) return relative.format(Math.round(delta / 3600), "hour");
  if (abs < 26 * 86_400) return relative.format(Math.round(delta / 86_400), "day");
  if (abs < 320 * 86_400) return relative.format(Math.round(delta / 2_629_800), "month");
  return relative.format(Math.round(delta / 31_557_600), "year");
}

function absoluteTime(seconds: number): string {
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) return "Not a valid date";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" });
}

function utcTime(seconds: number): string {
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().replace(".000Z", "Z");
}

function shortValue(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

/** Pretty JSON with keys, strings and literals told apart. */
function JsonView({ value, id, label }: { value: JsonObject; id: string; label: string }) {
  const text = JSON.stringify(value, null, 2);
  const tokens = text.split(/("(?:\\.|[^"\\])*"(?:\s*:)?|\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g);
  return (
    <pre
      id={id}
      role="region"
      aria-label={label}
      tabIndex={0}
      className="max-h-[420px] overflow-auto rounded-field border border-line bg-surface-2/50 px-4 py-3 font-mono text-[12.5px] leading-5 outline-none focus-visible:ring-2 focus-visible:ring-seal/45"
    >
      {tokens.map((token, index) => {
        if (!token) return null;
        let className = "text-ink-2";
        if (token.startsWith('"')) className = token.trimEnd().endsWith(":") ? "text-ink-2" : "text-ok";
        else if (/^-?\d|^true$|^false$|^null$/.test(token)) className = "font-medium text-ink";
        return (
          <span key={index} className={className}>
            {token}
          </span>
        );
      })}
    </pre>
  );
}

function NoteList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {notes.map((note) => (
        <li key={note.text} className="flex gap-2.5 text-small text-ink-2">
          <span
            aria-hidden="true"
            className={cn(
              "mt-[6px] size-1.5 shrink-0 rounded-full",
              note.tone === "danger" ? "bg-danger" : note.tone === "warn" ? "bg-warn" : "bg-ink-3"
            )}
          />
          <span>
            {note.tone === "danger" ? <span className="sr-only">Problem: </span> : note.tone === "warn" ? <span className="sr-only">Warning: </span> : null}
            {note.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SectionTitle({ dot, title, meta }: { dot: string; title: string; meta?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className={cn("size-2 rounded-full", dot)} />
      <h3 className="text-small font-semibold text-ink">{title}</h3>
      {meta ? <span className="text-meta text-ink-3">{meta}</span> : null}
    </div>
  );
}

/* ───────────────────────── Component ───────────────────────── */

export default function JwtDecoderClient() {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [secret, setSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [encoding, setEncoding] = useState<SecretEncoding>("text");
  const [verification, setVerification] = useState<Verification>({ state: "idle" });
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  // Keep relative times ("expires in 4 minutes") current.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const decoded = useMemo(() => decodeToken(input), [input]);
  const jws = decoded?.kind === "jws" ? decoded : null;
  const header = jws?.header.json ?? (decoded?.kind === "jwe" ? decoded.header.json : null);
  const payload = jws?.payload.json ?? null;
  const alg = typeof header?.alg === "string" ? header.alg : null;
  const hmac = jws && isHmacAlg(alg) ? alg : null;
  const notes = useMemo(() => (jws ? [...headerNotes(jws), ...payloadNotes(payload, now)] : []), [jws, payload, now]);
  const times = validity(payload, now);

  // Verify whenever the token, secret or encoding changes. All local: WebCrypto HMAC.
  useEffect(() => {
    let cancelled = false;
    if (!jws || !hmac || !secret || !jws.signature.bytes) {
      setVerification({ state: "idle" });
      return;
    }
    let key: Uint8Array;
    try {
      key = secretBytes(secret, encoding);
    } catch {
      setVerification({ state: "error", message: "That isn't valid base64. Switch to Text if the secret is a plain string." });
      return;
    }
    verifyHmac(hmac, jws.signingInput, jws.signature.bytes, key)
      .then((ok) => {
        if (!cancelled) setVerification({ state: ok ? "ok" : "bad" });
      })
      .catch(() => {
        if (!cancelled) setVerification({ state: "error", message: "This secret can't be used as an HMAC key." });
      });
    return () => {
      cancelled = true;
    };
  }, [jws, hmac, secret, encoding]);

  const loadExample = async () => {
    const issued = Math.floor(Date.now() / 1000);
    const token = await signHs256(
      { alg: "HS256", typ: "JWT" },
      { sub: "user_8f3a2c", name: "Ada Lovelace", role: "editor", iat: issued, exp: issued + 3600 },
      EXAMPLE_SECRET
    );
    setInput(token);
    setNow(issued);
    setSecret(EXAMPLE_SECRET);
    setEncoding("text");
    setShowSecret(true);
  };

  const copy = async (value: string, title: string) => {
    const ok = await copyText(value);
    toast(ok ? { title, tone: "ok" } : { title: "Couldn't copy", description: "Select the text and copy it by hand.", tone: "danger" });
  };

  const cleaned = useMemo(() => cleanToken(input), [input]);
  const statusText = !decoded
    ? ""
    : decoded.kind === "invalid"
      ? decoded.message
      : decoded.kind === "jwe"
        ? "Encrypted token. Only the header can be read without the key."
        : [
            alg ? `Algorithm ${alg}` : "No algorithm",
            times.expired ? "expired" : times.notYetValid ? "not valid yet" : times.exp !== null ? "not expired" : "no expiry",
            verification.state === "ok" ? "signature verified" : verification.state === "bad" ? "signature does not match" : null,
          ]
            .filter(Boolean)
            .join(", ") + ".";

  return (
    <ToolLayout
      as="div"
      eyebrow="Free tool"
      title="JWT decoder"
      description="Paste a JSON Web Token to read its header and claims, see when it expires, and check an HMAC signature. Decoding happens in your browser; nothing is sent."
      meta={
        <>
          <StatusChip icon={<ShieldCheck aria-hidden="true" />} tone="ok">
            Decoded locally
          </StatusChip>
          <StatusChip icon={<WifiOff aria-hidden="true" />}>Network: none</StatusChip>
        </>
      }
      aside={
        <>
          <OfflinePanel>
            The token and the secret are decoded and checked by JavaScript in this tab, with your browser&apos;s Web Crypto. Nothing is
            uploaded or stored. You can confirm it in your browser&apos;s network tab.
          </OfflinePanel>
          <ToolNotes
            items={[
              "A JWT is signed, not encrypted. Anyone holding it can read the payload, so never put secrets in claims.",
              "Decoding proves nothing about who made a token. Only the signature check does.",
              "Treat a live token like a password while it's valid: whoever holds it is signed in as you.",
            ]}
          />
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Panel>
          <PanelHeader icon={<Braces aria-hidden="true" />} title="Token" description="Whitespace, line breaks and a Bearer prefix are ignored." />
          <PanelBody className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <label htmlFor="jwt-input" className="text-small font-medium text-ink">
                Encoded token
              </label>
              <div className="-mb-1 -mr-2 flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => void loadExample()}>
                  <Sparkles aria-hidden="true" />
                  Example
                </Button>
                {input ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setInput("");
                      setSecret("");
                      setVerification({ state: "idle" });
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                    Clear
                  </Button>
                ) : null}
              </div>
            </div>
            <Textarea
              id="jwt-input"
              mono
              rows={5}
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                setNow(Math.floor(Date.now() / 1000));
              }}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi…"
              className="min-h-[132px] break-all text-[12.5px] leading-5"
              aria-describedby="jwt-status"
            />
            <div id="jwt-status" aria-live="polite" className="flex min-h-6 flex-wrap items-center gap-2">
              <span className="sr-only">{statusText}</span>
              {decoded?.kind === "invalid" ? (
                <p className="text-small text-danger" aria-hidden="true">
                  {decoded.message}
                </p>
              ) : null}
              {decoded?.kind === "jwe" ? (
                <StatusChip tone="neutral" aria-hidden="true">
                  Encrypted (JWE): payload can&apos;t be read without the key
                </StatusChip>
              ) : null}
              {jws ? (
                <span aria-hidden="true" className="contents">
                  <StatusChip tone={alg && alg.toLowerCase() !== "none" ? "neutral" : "danger"}>{alg ? alg : "No alg"}</StatusChip>
                  {times.expired ? (
                    <StatusChip tone="danger">Expired {relativeTime(times.exp as number, now)}</StatusChip>
                  ) : times.notYetValid ? (
                    <StatusChip tone="warn">Valid {relativeTime(times.nbf as number, now)}</StatusChip>
                  ) : times.exp !== null && !looksLikeMilliseconds(times.exp) ? (
                    <StatusChip tone="ok">Expires {relativeTime(times.exp, now)}</StatusChip>
                  ) : times.exp === null ? (
                    <StatusChip tone="neutral">No expiry</StatusChip>
                  ) : null}
                  {verification.state === "ok" ? (
                    <StatusChip tone="ok">Signature verified</StatusChip>
                  ) : verification.state === "bad" ? (
                    <StatusChip tone="danger">Signature doesn&apos;t match</StatusChip>
                  ) : (
                    <StatusChip tone="neutral">Signature not checked</StatusChip>
                  )}
                </span>
              ) : null}
            </div>
          </PanelBody>
        </Panel>

        {decoded && decoded.kind !== "invalid" ? (
          <Panel className="animate-rise">
            <PanelHeader title="Decoded" description="Base64url turned back into JSON. Readable by anyone who has the token." />
            <PanelBody className="flex flex-col gap-6">
              {notes.length > 0 ? <NoteList notes={notes} /> : null}

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-3">
                  <SectionTitle dot="bg-ink" title="Header" meta={header && alg ? "algorithm and token type" : undefined} />
                  {header ? (
                    <Button variant="ghost" size="sm" onClick={() => void copy(JSON.stringify(header, null, 2), "Header copied")}>
                      <Copy aria-hidden="true" />
                      Copy
                    </Button>
                  ) : null}
                </div>
                {header ? (
                  <JsonView id="jwt-header-json" value={header} label="Decoded header" />
                ) : (
                  <p className="text-small text-danger">{decoded.header.error}</p>
                )}
              </div>

              {jws ? (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <SectionTitle dot="bg-ok" title="Payload" meta="the claims" />
                    {payload ? (
                      <Button variant="ghost" size="sm" onClick={() => void copy(JSON.stringify(payload, null, 2), "Payload copied")}>
                        <Copy aria-hidden="true" />
                        Copy
                      </Button>
                    ) : null}
                  </div>
                  {payload ? (
                    <JsonView id="jwt-payload-json" value={payload} label="Decoded payload" />
                  ) : (
                    <div className="flex flex-col gap-2">
                      <p className="text-small text-danger">{jws.payload.error}</p>
                      {jws.payload.text ? (
                        <pre className="max-h-[240px] overflow-auto whitespace-pre-wrap break-all rounded-field border border-line bg-surface-2/50 px-4 py-3 font-mono text-[12.5px] leading-5 text-ink-2">
                          {jws.payload.text}
                        </pre>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}

              {jws ? (
                <div className="flex flex-col gap-2.5">
                  <SectionTitle
                    dot="bg-warn"
                    title="Signature"
                    meta={
                      jws.signature.raw
                        ? `${jws.signature.raw.length} characters${jws.signature.bytes ? `, ${jws.signature.bytes.length} bytes` : ""}`
                        : "empty"
                    }
                  />
                  <p className="break-all rounded-field border border-line bg-surface-2/50 px-4 py-3 font-mono text-[12.5px] leading-5 text-ink-2">
                    {jws.signature.raw || <span className="text-ink-3">No signature</span>}
                  </p>
                </div>
              ) : null}
            </PanelBody>
          </Panel>
        ) : null}

        {payload ? (
          <Panel>
            <PanelHeader title="Claims" description="Registered claims in plain words. Times are shown in your time zone and in UTC." />
            <dl className="divide-y divide-line">
              {Object.entries(payload).map(([name, value]) => {
                const time = isTimeClaim(name) && typeof value === "number" && !looksLikeMilliseconds(value) ? value : null;
                return (
                  <div key={name} className="grid gap-1 px-5 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                    <dt className="min-w-0">
                      <span className="font-mono text-small text-ink">{name}</span>
                      {CLAIM_LABELS[name] ? <span className="ml-2 text-meta text-ink-3">{CLAIM_LABELS[name]}</span> : null}
                    </dt>
                    <dd className="min-w-0 text-small text-ink-2">
                      {time !== null ? (
                        <>
                          <span className="text-ink">{absoluteTime(time)}</span>
                          <span className="text-ink-3"> · {relativeTime(time, now)}</span>
                          <span className="block font-mono text-meta text-ink-3">
                            {utcTime(time)} · {time}
                          </span>
                        </>
                      ) : (
                        <span className="break-all font-mono text-[12.5px]">{shortValue(value)}</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Panel>
        ) : null}

        {jws ? (
          <Panel>
            <PanelHeader
              icon={<KeyRound aria-hidden="true" />}
              title="Verify the signature"
              description="Checked here with Web Crypto. The secret is never sent or saved."
            />
            {hmac ? (
              <PanelBody className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <label htmlFor="jwt-secret" className="text-small font-medium text-ink">
                      {hmac} secret
                    </label>
                    <Segmented
                      size="sm"
                      aria-label="Secret format"
                      value={encoding}
                      onChange={setEncoding}
                      options={[
                        { value: "text", label: "Text" },
                        { value: "base64", label: "Base64" },
                      ]}
                    />
                  </div>
                  <SecretInput
                    id="jwt-secret"
                    value={secret}
                    onChange={setSecret}
                    show={showSecret}
                    onToggle={() => setShowSecret((value) => !value)}
                    label="secret"
                    placeholder="The signing secret"
                    describedBy="jwt-secret-hint"
                  />
                  <p id="jwt-secret-hint" className="text-small text-ink-3">
                    Use Base64 if your app stores the secret encoded (base64 or base64url).
                  </p>
                </div>
                <div id="jwt-verify-result" aria-live="polite" className="min-h-6">
                  {verification.state === "ok" ? (
                    <p className="flex items-center gap-2 text-small font-medium text-ok">
                      <StatusChip tone="ok">Verified</StatusChip>
                      This secret produced this signature.
                    </p>
                  ) : verification.state === "bad" ? (
                    <p className="flex items-center gap-2 text-small font-medium text-danger">
                      <StatusChip tone="danger">No match</StatusChip>
                      Wrong secret, wrong format, or the token was changed.
                    </p>
                  ) : verification.state === "error" ? (
                    <p className="text-small text-danger">{verification.message}</p>
                  ) : (
                    <p className="text-small text-ink-3">Type the secret to check the signature.</p>
                  )}
                </div>
              </PanelBody>
            ) : (
              <PanelBody>
                <p className="text-small text-ink-2">
                  {alg && alg.toLowerCase() === "none"
                    ? "This token is unsigned, so there's nothing to verify. That's the problem."
                    : alg
                      ? `${alg} is verified with the issuer's public key. This tool checks HMAC signatures (HS256, HS384, HS512) only.`
                      : "The header doesn't name an algorithm, so the signature can't be checked."}
                </p>
              </PanelBody>
            )}
            <PanelFooter>
              <span className="text-small text-ink-3">Handing a signing secret to a teammate? Don&apos;t paste it into chat.</span>
              <AppLink href="/secrets" className={buttonVariants({ variant: "secondary", size: "sm" })}>
                <KeyRound aria-hidden="true" />
                Send it with EnvShare
              </AppLink>
            </PanelFooter>
          </Panel>
        ) : null}

        {!decoded ? (
          <p className="px-1 text-small text-ink-3">
            {cleaned ? null : "Paste a token above, or load the example to see how it works."}
          </p>
        ) : null}
      </div>
    </ToolLayout>
  );
}
