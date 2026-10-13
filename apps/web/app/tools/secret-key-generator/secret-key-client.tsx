"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, KeySquare, RefreshCw, ShieldCheck, WifiOff } from "lucide-react";
import { Button, Input, Panel, PanelBody, PanelFooter, PanelHeader, Segmented, StatusChip, cn } from "@protectedshare/ui";
import ToolLayout, { ToolNotes } from "../../../components/tool-layout";
import { useToast } from "../../../components/toast";
import { copyText } from "../../../lib/clipboard";
import ColoredValue from "../_components/colored-value";
import OfflinePanel from "../_components/offline-panel";
import RangeField from "../_components/range-field";
import {
  ENV_NAME,
  MAX_BYTES,
  MIN_BYTES,
  PRESETS,
  cleanPrefix,
  envLine,
  generateKey,
  sha256Hex,
  type Encoding,
  type Generated,
  type PresetId,
} from "./keys";

/** Bigger type for short values, smaller for long ones, so 256 hex characters still fit. */
function sizeFor(length: number): string {
  if (length <= 40) return "text-[19px] leading-[30px] sm:text-[22px] sm:leading-[34px]";
  if (length <= 64) return "text-[16px] leading-[26px] sm:text-[18px] sm:leading-[28px]";
  return "text-[13px] leading-[21px] sm:text-[14px] sm:leading-[22px]";
}

const COMMANDS: Record<PresetId, string> = {
  bytes: "openssl rand -hex 32",
  jwt: "openssl rand -base64 32 | tr '+/' '-_' | tr -d '='",
  django: "python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'",
  rails: "bin/rails secret",
  authjs: "openssl rand -base64 32",
  apikey: "python -c 'import secrets; print(\"sk_\" + secrets.token_urlsafe(24))'",
  uuid: "uuidgen",
};

export default function SecretKeyClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [preset, setPreset] = useState<PresetId>("jwt");
  const [bytes, setBytes] = useState(32);
  const [encoding, setEncoding] = useState<Encoding>("hex");
  const [prefixDraft, setPrefixDraft] = useState("sk_");
  const [envName, setEnvName] = useState("JWT_SECRET");
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [spin, setSpin] = useState(0);

  const prefix = cleanPrefix(prefixDraft);
  const active = PRESETS.find((item) => item.id === preset) ?? PRESETS[0];

  // The prefix isn't part of the randomness: editing it re-labels the same key instead of making a new one.
  const generate = useCallback(() => {
    setGenerated(generateKey(preset, { bytes, encoding, prefix: "" }));
  }, [preset, bytes, encoding]);

  const current = useMemo<Generated | null>(() => {
    if (!generated || preset !== "apikey") return generated;
    return {
      ...generated,
      value: `${prefix}${generated.value}`,
      detail: `${prefix ? `"${prefix}" + ` : ""}${generated.value.length} characters from A–Z, a–z, 0–9`,
    };
  }, [generated, preset, prefix]);

  // A new value whenever the format or its options change (and on first load, in the browser only).
  useEffect(() => {
    generate();
  }, [generate]);

  // For API keys: the SHA-256 to store server-side instead of the key.
  useEffect(() => {
    let cancelled = false;
    setHash(null);
    if (preset !== "apikey" || !current) return;
    void sha256Hex(current.value).then((value) => {
      if (!cancelled) setHash(value);
    });
    return () => {
      cancelled = true;
    };
  }, [preset, current]);

  const choosePreset = (id: PresetId) => {
    setPreset(id);
    setEnvName(PRESETS.find((item) => item.id === id)?.envName ?? "SECRET_KEY");
  };

  const nameValid = ENV_NAME.test(envName);
  const line = current && nameValid ? envLine(envName, current.value) : null;

  const copy = async (value: string, title: string) => {
    const ok = await copyText(value);
    toast(
      ok
        ? { title, description: "Paste it where it's needed, then copy something else.", tone: "ok" }
        : { title: "Couldn't copy", description: "Select it and copy it by hand.", tone: "danger" }
    );
  };

  const sendWithEnvShare = async () => {
    const text = line ?? current?.value;
    if (!text) return;
    const ok = await copyText(text);
    toast(
      ok
        ? { title: line ? "Copied the .env line. Paste it into EnvShare." : "Copied. Paste it into EnvShare.", description: "It's encrypted in your browser before anything is sent.", tone: "ok" }
        : { title: "Couldn't copy", description: "Copy the value by hand, then paste it into EnvShare.", tone: "danger" }
    );
    router.push("/secrets");
  };

  const regenerate = () => {
    setSpin((value) => value + 1);
    generate();
  };

  return (
    <ToolLayout
      as="div"
      eyebrow="Free tool"
      title="Secret key generator"
      description="Random keys for apps and .env files: hex, base64, UUIDs, and the formats Django, Rails and Auth.js expect. Made in your browser; nothing is sent."
      meta={
        <>
          <StatusChip icon={<ShieldCheck aria-hidden="true" />} tone="ok">
            Generated locally
          </StatusChip>
          <StatusChip icon={<WifiOff aria-hidden="true" />}>Network: none</StatusChip>
        </>
      }
      aside={
        <>
          <Panel>
            <PanelHeader title="Strength" description="How much randomness the key carries." />
            <PanelBody className="flex flex-col gap-4">
              <div>
                <p className="tabular text-[28px] font-semibold leading-8 tracking-[-0.02em] text-ink">
                  {current ? Math.floor(current.bits) : 0}
                  <span className="ml-1.5 text-ui font-normal tracking-normal text-ink-3">bits of entropy</span>
                </p>
                <p className="mt-1 text-small text-ink-3">{current ? current.detail : "Generating…"}</p>
              </div>
              <dl className="divide-y divide-line text-small">
                <div className="flex justify-between gap-3 py-2.5 first:pt-0">
                  <dt className="text-ink-2">Random source</dt>
                  <dd className="font-mono text-meta text-ink-3">crypto.getRandomValues</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-2">Guessing it</dt>
                  <dd className="text-right text-ink">{current && current.bits >= 120 ? "Not feasible" : "—"}</dd>
                </div>
                <div className="flex flex-col gap-1 py-2.5 last:pb-0">
                  <dt className="text-ink-2">Command-line equivalent</dt>
                  <dd className="font-mono text-meta text-ink-3 [overflow-wrap:anywhere]">{COMMANDS[preset]}</dd>
                </div>
              </dl>
            </PanelBody>
          </Panel>
          <OfflinePanel>
            Keys are generated by JavaScript in this tab from your browser&apos;s secure random source. Nothing is uploaded or stored, and the
            page forgets each key when you make a new one.
          </OfflinePanel>
          <ToolNotes
            items={[
              "One key per app and per environment. A shared key leaks everywhere at once.",
              "Keep .env files out of git: add them to .gitignore before the first commit.",
              "If a key ends up in chat, a ticket or a repo, rotate it. Deleting the message isn't enough.",
            ]}
          />
        </>
      }
    >
      <Panel>
        <fieldset className="border-b border-line px-5 py-4">
          <legend className="sr-only">Format</legend>
          <p aria-hidden="true" className="mb-2.5 text-small font-medium text-ink">
            Format
          </p>
          <div className="grid grid-cols-2 gap-0.5 rounded-field border border-line bg-surface-2/70 p-[3px]">
            {PRESETS.map((item) => (
              <label key={item.id} className="relative flex min-w-0 cursor-pointer">
                <input
                  type="radio"
                  name="key-format"
                  value={item.id}
                  checked={preset === item.id}
                  onChange={() => choosePreset(item.id)}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "flex w-full flex-col rounded-[7px] px-3 py-2 text-left transition-[background-color,color,box-shadow] duration-150 ease-seal",
                    "hover:bg-surface/60 peer-checked:bg-surface peer-checked:shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_rgb(var(--line))]",
                    "peer-focus-visible:ring-2 peer-focus-visible:ring-seal/45"
                  )}
                >
                  <span className={cn("text-small font-medium", preset === item.id ? "text-ink" : "text-ink-2")}>{item.label}</span>
                  <span className="text-meta text-ink-3">{item.short}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="border-b border-line px-5 pb-5 pt-6">
          <div className="flex min-h-[84px] items-center rounded-field bg-surface-2/60 px-4 py-4 sm:px-5">
            <output
              id="key-output"
              aria-live="polite"
              aria-label={`Generated ${active.label}`}
              className={cn(
                "block min-w-0 flex-1 break-all tracking-[-0.01em] selection:bg-ink selection:text-on-ink",
                current ? sizeFor(current.value.length) : "text-[19px] leading-[30px]"
              )}
            >
              {current ? <ColoredValue key={current.value} value={current.value} className="animate-fade-in" /> : <span className="font-mono text-ink-3">Generating…</span>}
            </output>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="tabular text-small text-ink-3">
              {current ? `${current.value.length} characters · ${Math.floor(current.bits)} bits` : " "}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={regenerate} className="flex-1 sm:flex-none" aria-label="Generate a new key">
                <RefreshCw
                  aria-hidden="true"
                  className="transition-transform duration-300 ease-seal motion-reduce:transition-none"
                  style={{ transform: `rotate(${spin * 180}deg)` }}
                />
                <span>New</span>
              </Button>
              <Button onClick={() => current && void copy(current.value, "Key copied")} disabled={!current} className="flex-1 sm:flex-none">
                <Copy aria-hidden="true" />
                Copy
              </Button>
            </div>
          </div>
        </div>

        <PanelBody className="flex flex-col gap-6">
          {preset === "bytes" ? (
            <>
              <RangeField label="Length" value={bytes} min={MIN_BYTES} max={MAX_BYTES} onChange={setBytes} unit="bytes" />
              <div className="flex flex-col gap-2.5">
                <span id="key-encoding-label" className="text-small font-medium text-ink">
                  Encoding
                </span>
                <Segmented
                  aria-labelledby="key-encoding-label"
                  value={encoding}
                  onChange={setEncoding}
                  options={[
                    { value: "hex", label: "Hex" },
                    { value: "base64", label: "Base64" },
                    { value: "base64url", label: "Base64url" },
                  ]}
                />
                <p className="text-small text-ink-3">
                  Hex is the most portable. Base64url is shorter and safe in URLs, file names and headers.
                </p>
              </div>
            </>
          ) : null}

          {preset === "apikey" ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="key-prefix" className="text-small font-medium text-ink">
                Prefix
              </label>
              <Input
                id="key-prefix"
                mono
                value={prefixDraft}
                onChange={(event) => setPrefixDraft(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                placeholder="sk_"
                aria-describedby="key-prefix-hint"
                className="sm:max-w-[260px]"
              />
              <p id="key-prefix-hint" className="text-small text-ink-3">
                {prefix !== prefixDraft
                  ? "Only letters, digits, _ and - are kept."
                  : "A prefix like sk_ or myapp_live_ makes keys easy to recognize, and lets secret scanners spot leaked ones."}
              </p>
            </div>
          ) : null}

          {preset === "jwt" ? (
            <p className="text-small text-ink-3">
              256 bits, the minimum RFC 7518 sets for HS256. Use it as the signing secret string, or decode the base64url to 32 raw bytes if
              your library takes bytes.
            </p>
          ) : preset === "django" ? (
            <p className="text-small text-ink-3">
              Same alphabet and length as Django&apos;s own <span className="font-mono">get_random_secret_key()</span>, without the
              &quot;django-insecure-&quot; prefix that only marks development keys.
            </p>
          ) : preset === "rails" ? (
            <p className="text-small text-ink-3">
              Same shape as <span className="font-mono">bin/rails secret</span>: 128 hex characters. Rails reads it from
              SECRET_KEY_BASE or its encrypted credentials.
            </p>
          ) : preset === "authjs" ? (
            <p className="text-small text-ink-3">
              Same shape as <span className="font-mono">openssl rand -base64 32</span>. NextAuth.js v4 calls the variable NEXTAUTH_SECRET.
            </p>
          ) : preset === "uuid" ? (
            <p className="text-small text-ink-3">
              Unguessable, but made to be an ID: UUIDs end up in URLs and logs. For anything secret, use one of the key formats.
            </p>
          ) : null}

          <div className="flex flex-col gap-3 rounded-field border border-line px-4 py-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <label htmlFor="key-env-name" className="text-small font-medium text-ink">
                  .env variable name
                </label>
                <Input
                  id="key-env-name"
                  mono
                  value={envName}
                  onChange={(event) => setEnvName(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  invalid={!nameValid}
                  aria-describedby="key-env-hint"
                  className="sm:max-w-[320px]"
                />
              </div>
              <Button variant="secondary" size="md" onClick={() => line && void copy(line, ".env line copied")} disabled={!line}>
                <Copy aria-hidden="true" />
                Copy .env line
              </Button>
            </div>
            <p id="key-env-hint" className={cn("text-small", nameValid ? "text-ink-3" : "text-danger")}>
              {nameValid ? "Values with symbols are single-quoted so $ and # survive dotenv and the shell." : "Use letters, digits and _, not starting with a digit."}
            </p>
            <pre
              id="key-env-line"
              className="whitespace-pre-wrap break-all rounded-[8px] bg-surface-2/60 px-3 py-2.5 font-mono text-[12.5px] leading-5 text-ink-2"
            >
              {line ?? " "}
            </pre>
            {preset === "apikey" ? (
              <div className="flex flex-col gap-1.5 border-t border-line pt-3">
                <p className="text-small font-medium text-ink">SHA-256 to store server-side</p>
                <p className="text-small text-ink-3">Hand the key out once and keep only this hash. Compare hashes when a request comes in.</p>
                <p id="key-hash" className="break-all font-mono text-[12.5px] leading-5 text-ink-2">
                  {hash ?? "…"}
                </p>
              </div>
            ) : null}
          </div>
        </PanelBody>

        <PanelFooter>
          <span className="text-small text-ink-3">Need to get it to a teammate? Don&apos;t paste it into chat.</span>
          <Button size="sm" onClick={() => void sendWithEnvShare()} disabled={!current}>
            <KeyRound aria-hidden="true" />
            Send it with EnvShare
          </Button>
        </PanelFooter>
      </Panel>
      <p className="mt-4 flex items-center gap-2 px-1 text-meta text-ink-3">
        <KeySquare aria-hidden="true" className="size-3.5" />
        Keys aren&apos;t kept anywhere. Copy what you need before you leave the page.
      </p>
    </ToolLayout>
  );
}
