"use client";

import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { Copy, Download, Eye, EyeOff, LockKeyhole, LockKeyholeOpen, RotateCcw, Sparkles, WifiOff } from "lucide-react";
import { generatePassphrase, looksArmored } from "@protectedshare/crypto";
import {
  Button,
  Input,
  Kbd,
  Panel,
  PanelBody,
  PanelFooter,
  PanelHeader,
  Segmented,
  StatusChip,
  Textarea,
  cn,
} from "@protectedshare/ui";
import ToolLayout, { ToolNotes } from "../../../components/tool-layout";
import { useToast } from "../../../components/toast";
import { copyText } from "../../../lib/clipboard";
import { StrengthMeter } from "../_components/strength-meter";
import { estimateTypedBits, strengthFromBits } from "../_lib/strength";
import { armorTask, dearmorTask, warmArmorWorker } from "./armor-task";

type Tab = "encrypt" | "decrypt";

const MIN_PASSWORD = 8;

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function b64urlBytes(value: string): number {
  return Math.floor((value.length * 3) / 4);
}

/** Pull salt / iv / ciphertext back out of a block, for the "Inside the block" view. */
function parseBlock(armored: string): { salt: string; iv: string; ciphertext: string } | null {
  const lines = armored.split(/\r?\n/).filter((line) => line.trim() && !line.startsWith("-----") && !/^[A-Za-z-]+:\s/.test(line.trim()));
  const [salt, iv, ciphertext] = lines.join("").split(".");
  if (!salt || !iv || !ciphertext) return null;
  return { salt, iv, ciphertext };
}

function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.startsWith("Could not decrypt")) return "That password doesn't open this block. Check it, and make sure the block wasn't edited.";
  if (message.includes("doesn't look like") || message.includes("incomplete")) return message;
  if (message.includes("Malformed") || message.includes("atob") || message.includes("decoded")) {
    return "This block is damaged. Copy it again, from the BEGIN line to the END line.";
  }
  return message || "Something went wrong. Try again.";
}

function middle(value: string, keep = 10): string {
  return value.length <= keep * 2 + 1 ? value : `${value.slice(0, keep)}…${value.slice(-keep)}`;
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

function PasswordInput({
  id,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  describedBy,
  invalid,
  onKeyDown,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete: string;
  describedBy?: string;
  invalid?: boolean;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        mono
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        autoComplete={autoComplete}
        spellCheck={false}
        aria-describedby={describedBy}
        invalid={invalid}
        className="pr-11"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-control text-ink-3 outline-none transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
      >
        {show ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
      </button>
    </div>
  );
}

export default function EncryptTextClient() {
  const { toast } = useToast();
  const online = useOnline();
  const [tab, setTab] = useState<Tab>("encrypt");

  // Encrypt
  const [plain, setPlain] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedBits, setGeneratedBits] = useState<{ value: string; bits: number } | null>(null);
  const [encrypting, setEncrypting] = useState(false);
  const [encryptError, setEncryptError] = useState<string | null>(null);
  const [armored, setArmored] = useState<string | null>(null);

  // Decrypt
  const [block, setBlock] = useState("");
  const [openPassword, setOpenPassword] = useState("");
  const [showOpenPassword, setShowOpenPassword] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);

  const [elapsed, setElapsed] = useState<number | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    warmArmorWorker();
  }, []);

  const strength = useMemo(() => {
    if (!password) return null;
    if (generatedBits && generatedBits.value === password) return { info: strengthFromBits(generatedBits.bits), exact: true };
    return { info: strengthFromBits(estimateTypedBits(password)), exact: false };
  }, [password, generatedBits]);

  const needsConfirm = !showPassword && !(generatedBits && generatedBits.value === password);
  const confirmMismatch = needsConfirm && confirm.length > 0 && confirm !== password;
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;
  const canEncrypt = plain.length > 0 && password.length >= MIN_PASSWORD && (!needsConfirm || confirm === password) && !encrypting;

  const blockStatus = block.trim() ? (looksArmored(block) ? "ok" : "bad") : null;
  const canDecrypt = blockStatus === "ok" && openPassword.length > 0 && !decrypting;

  const generate = () => {
    const result = generatePassphrase({ words: 5, separator: "-" });
    setPassword(result.value);
    setGeneratedBits({ value: result.value, bits: result.entropyBits });
    setShowPassword(true);
    setConfirm("");
  };

  const encrypt = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!canEncrypt) return;
    setEncrypting(true);
    setEncryptError(null);
    const started = performance.now();
    try {
      const result = await armorTask(plain, password);
      setElapsed(performance.now() - started);
      setArmored(result);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      setEncryptError(friendlyError(error));
    } finally {
      setEncrypting(false);
    }
  };

  const decrypt = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!canDecrypt) return;
    setDecrypting(true);
    setDecryptError(null);
    setOpened(null);
    try {
      const text = await dearmorTask(block, openPassword);
      setOpened(text);
      requestAnimationFrame(() => resultRef.current?.focus());
    } catch (error) {
      setDecryptError(friendlyError(error));
    } finally {
      setDecrypting(false);
    }
  };

  const submitOnModEnter = (handler: () => void) => (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handler();
    }
  };

  const onPlainPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const text = event.clipboardData.getData("text");
    if (text && looksArmored(text) && !plain.trim()) {
      event.preventDefault();
      setBlock(text);
      setTab("decrypt");
      setDecryptError(null);
      setOpened(null);
      toast({ title: "That's an encrypted block", description: "Switched to Decrypt. Enter its password to open it." });
      window.setTimeout(() => document.getElementById("open-password")?.focus(), 50);
    }
  };

  const copy = async (text: string, title: string) => {
    const ok = await copyText(text);
    toast(ok ? { title, tone: "ok" } : { title: "Couldn't copy", description: "Select the text and copy it by hand.", tone: "danger" });
  };

  const resetEncrypt = () => {
    setArmored(null);
    setPlain("");
    setPassword("");
    setConfirm("");
    setGeneratedBits(null);
    setShowPassword(false);
    setElapsed(null);
    window.setTimeout(() => document.getElementById("plain-text")?.focus(), 30);
  };

  const parsed = armored ? parseBlock(armored) : null;
  const plainBytes = byteLength(plain);

  return (
    <ToolLayout
      eyebrow="Free tool"
      title="Encrypt text"
      description="Lock text with a password into a block you can paste anywhere. Only the password opens it. Nothing is uploaded."
      meta={
        <>
          <StatusChip tone="seal">AES-256-GCM</StatusChip>
          <StatusChip icon={<WifiOff aria-hidden="true" />}>Network: none</StatusChip>
        </>
      }
      aside={
        <>
          <Panel>
            <PanelHeader
              title="Offline"
              description="What this tool sends over the network."
              actions={<StatusChip tone="ok">Network: none</StatusChip>}
            />
            <PanelBody className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-small text-ink-2">Bytes sent by this tool</span>
                <span className="tabular text-[28px] font-semibold leading-8 tracking-[-0.02em] text-ink">0</span>
              </div>
              <p className="text-small text-ink-3">
                Encryption runs in a worker inside this tab. There is no upload endpoint for it. The page itself loaded from our server like any
                website; after that you can disconnect and it keeps working.
              </p>
              <div
                className={cn(
                  "flex items-center gap-2 rounded-field border px-3 py-2 text-small",
                  online ? "border-line bg-surface-2/50 text-ink-2" : "border-ok/30 bg-ok-soft text-ok"
                )}
                aria-live="polite"
              >
                <span aria-hidden="true" className={cn("size-1.5 rounded-full", online ? "bg-ink-3" : "bg-ok")} />
                {online ? "Your device is online. Try turning Wi-Fi off." : "You're offline. Encrypt and decrypt still work."}
              </div>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Inside the block" description={parsed ? "Your last result, decoded." : "What an encrypted block holds."} />
            <PanelBody className="p-0">
              <dl className="divide-y divide-line font-mono text-[12px] leading-5">
                {[
                  { k: "salt", v: parsed ? middle(parsed.salt, 8) : "16 random bytes", n: parsed ? `${b64urlBytes(parsed.salt)} B` : "" },
                  { k: "iv", v: parsed ? middle(parsed.iv, 8) : "12 random bytes", n: parsed ? `${b64urlBytes(parsed.iv)} B` : "" },
                  {
                    k: "ciphertext",
                    v: parsed ? middle(parsed.ciphertext, 8) : "your text + 16-byte tag",
                    n: parsed ? `${b64urlBytes(parsed.ciphertext)} B` : "",
                  },
                  { k: "kdf", v: "PBKDF2-SHA256 × 600,000 → HKDF", n: "" },
                ].map((row) => (
                  <div key={row.k} className="flex items-center gap-3 px-5 py-2.5">
                    <dt className="w-[78px] shrink-0 text-ink-3">{row.k}</dt>
                    <dd className={cn("min-w-0 flex-1 truncate", parsed ? "text-ink" : "text-ink-3")}>{row.v}</dd>
                    {row.n ? <dd className="tabular shrink-0 text-ink-3">{row.n}</dd> : null}
                  </div>
                ))}
              </dl>
            </PanelBody>
          </Panel>

          <ToolNotes
            items={[
              "There's no reset. Lose the password and the text is gone for good.",
              "Long random passwords matter here: anyone with the block can guess offline.",
              "To send a secret that deletes itself after reading, use a secure note instead.",
            ]}
          />
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <Segmented
              aria-label="Mode"
              value={tab}
              onChange={setTab}
              options={[
                { value: "encrypt", label: "Encrypt", icon: <LockKeyhole aria-hidden="true" /> },
                { value: "decrypt", label: "Decrypt", icon: <LockKeyholeOpen aria-hidden="true" /> },
              ]}
            />
            <p className="hidden items-center gap-1.5 text-meta text-ink-3 sm:flex">
              <Kbd>Ctrl</Kbd>
              <Kbd>Enter</Kbd> to {tab}
            </p>
          </div>

          {tab === "encrypt" ? (
            <form onSubmit={encrypt} noValidate>
              <PanelBody className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-end justify-between gap-3">
                    <label htmlFor="plain-text" className="text-small font-medium text-ink">
                      Text to encrypt
                    </label>
                    <span className="tabular text-meta text-ink-3">{plainBytes.toLocaleString("en-US")} bytes</span>
                  </div>
                  <Textarea
                    id="plain-text"
                    value={plain}
                    onChange={(event) => {
                      setPlain(event.target.value);
                      setArmored(null);
                    }}
                    onPaste={onPlainPaste}
                    onKeyDown={submitOnModEnter(() => void encrypt())}
                    rows={8}
                    placeholder="A password, a recovery code, a private message…"
                    spellCheck={false}
                    className="min-h-[180px]"
                    aria-describedby="plain-text-hint"
                  />
                  <p id="plain-text-hint" className="text-small text-ink-3">
                    Pasting an encrypted block here switches to Decrypt.
                  </p>
                </div>

                <div className="grid items-start gap-5 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex min-h-5 items-end justify-between gap-3">
                      <label htmlFor="lock-password" className="text-small font-medium text-ink">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={generate}
                        className="inline-flex items-center gap-1 rounded-[6px] px-1 text-small font-medium text-ink-2 outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
                      >
                        <Sparkles aria-hidden="true" className="size-3.5" />
                        Generate
                      </button>
                    </div>
                    <PasswordInput
                      id="lock-password"
                      value={password}
                      onChange={(value) => {
                        setPassword(value);
                        setArmored(null);
                      }}
                      show={showPassword}
                      onToggle={() => setShowPassword((value) => !value)}
                      autoComplete="new-password"
                      describedBy="lock-password-hint"
                      invalid={tooShort}
                      onKeyDown={submitOnModEnter(() => void encrypt())}
                    />
                    <p id="lock-password-hint" className={cn("text-small", tooShort ? "text-danger" : "text-ink-3")}>
                      {tooShort ? `Use at least ${MIN_PASSWORD} characters.` : "Send it to the other person a different way than the block."}
                    </p>
                    {password ? <StrengthMeter info={strength?.info ?? null} approximate={!strength?.exact} className="mt-2" /> : null}
                  </div>

                  {needsConfirm ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex min-h-5 items-end">
                        <label htmlFor="lock-confirm" className="text-small font-medium text-ink">
                          Repeat password
                        </label>
                      </div>
                      <Input
                        id="lock-confirm"
                        type="password"
                        mono
                        value={confirm}
                        onChange={(event) => setConfirm(event.target.value)}
                        onKeyDown={submitOnModEnter(() => void encrypt())}
                        autoComplete="new-password"
                        invalid={confirmMismatch}
                        aria-describedby="lock-confirm-hint"
                      />
                      <p id="lock-confirm-hint" className={cn("text-small", confirmMismatch ? "text-danger" : "text-ink-3")}>
                        {confirmMismatch ? "Doesn't match yet." : "A typo here would lock you out."}
                      </p>
                    </div>
                  ) : null}
                </div>

                {encryptError ? (
                  <p role="alert" className="rounded-field bg-danger-soft px-3.5 py-3 text-small text-danger">
                    {encryptError}
                  </p>
                ) : null}
              </PanelBody>
              <PanelFooter>
                <span className="text-small text-ink-3">The password is stretched 600,000 times. Takes a moment.</span>
                <Button type="submit" disabled={!canEncrypt && !encrypting} loading={encrypting} className="max-sm:w-full">
                  <LockKeyhole aria-hidden="true" />
                  Encrypt
                </Button>
              </PanelFooter>
            </form>
          ) : (
            <form onSubmit={decrypt} noValidate>
              <PanelBody className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-end justify-between gap-3">
                    <label htmlFor="armored-block" className="text-small font-medium text-ink">
                      Encrypted block
                    </label>
                    {blockStatus === "ok" ? (
                      <StatusChip tone="ok" className="h-5">Block found</StatusChip>
                    ) : blockStatus === "bad" ? (
                      <StatusChip tone="warn" className="h-5">Missing BEGIN or END line</StatusChip>
                    ) : null}
                  </div>
                  <Textarea
                    ref={blockRef}
                    id="armored-block"
                    value={block}
                    onChange={(event) => {
                      setBlock(event.target.value);
                      setDecryptError(null);
                      setOpened(null);
                    }}
                    onKeyDown={submitOnModEnter(() => void decrypt())}
                    rows={8}
                    spellCheck={false}
                    placeholder={"-----BEGIN PROTECTEDSHARE MESSAGE-----\n…\n-----END PROTECTEDSHARE MESSAGE-----"}
                    className="min-h-[180px] font-mono text-small leading-5"
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:w-1/2 md:pr-2.5">
                  <label htmlFor="open-password" className="text-small font-medium text-ink">
                    Password
                  </label>
                  <PasswordInput
                    id="open-password"
                    value={openPassword}
                    onChange={(value) => {
                      setOpenPassword(value);
                      setDecryptError(null);
                    }}
                    show={showOpenPassword}
                    onToggle={() => setShowOpenPassword((value) => !value)}
                    autoComplete="off"
                    invalid={Boolean(decryptError)}
                    describedBy={decryptError ? "decrypt-error" : undefined}
                    onKeyDown={submitOnModEnter(() => void decrypt())}
                  />
                </div>
                {decryptError ? (
                  <p id="decrypt-error" role="alert" className="rounded-field bg-danger-soft px-3.5 py-3 text-small text-danger">
                    {decryptError}
                  </p>
                ) : null}
              </PanelBody>
              <PanelFooter>
                <span className="text-small text-ink-3">Decrypted here. The text is never sent anywhere.</span>
                <Button type="submit" disabled={!canDecrypt && !decrypting} loading={decrypting} className="max-sm:w-full">
                  <LockKeyholeOpen aria-hidden="true" />
                  Decrypt
                </Button>
              </PanelFooter>
            </form>
          )}
        </Panel>

        {tab === "encrypt" && armored ? (
          <Panel className="animate-rise">
            <PanelHeader
              title="Encrypted block"
              description={elapsed !== null ? `Sealed in ${(elapsed / 1000).toFixed(1)} s. Paste it anywhere.` : "Paste it anywhere."}
              actions={<StatusChip tone="seal">Sealed</StatusChip>}
            />
            <PanelBody>
              <div
                ref={resultRef}
                tabIndex={-1}
                aria-label="Encrypted block"
                className="max-h-[320px] overflow-auto rounded-field border border-line bg-surface-2/60 px-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-seal/45"
              >
                <pre className="whitespace-pre font-mono text-[12.5px] leading-5 text-ink">{armored}</pre>
              </div>
            </PanelBody>
            <PanelFooter>
              <Button variant="ghost" size="sm" onClick={resetEncrypt}>
                <RotateCcw aria-hidden="true" />
                Encrypt something else
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => downloadText(armored, "encrypted-message.txt")}>
                  <Download aria-hidden="true" />
                  Download .txt
                </Button>
                <Button size="sm" onClick={() => void copy(armored, "Block copied")}>
                  <Copy aria-hidden="true" />
                  Copy block
                </Button>
              </div>
            </PanelFooter>
          </Panel>
        ) : null}

        {tab === "decrypt" && opened !== null ? (
          <Panel className="animate-rise">
            <PanelHeader title="Decrypted text" description="Visible only in this tab." actions={<StatusChip tone="ok">Opened</StatusChip>} />
            <PanelBody>
              <div
                ref={resultRef}
                tabIndex={-1}
                aria-label="Decrypted text"
                className="max-h-[420px] overflow-auto rounded-field border border-line bg-surface-2/60 px-4 py-3.5 outline-none focus-visible:ring-2 focus-visible:ring-seal/45"
              >
                <pre className="whitespace-pre-wrap break-words font-mono text-small leading-6 text-ink">{opened || " "}</pre>
              </div>
            </PanelBody>
            <PanelFooter>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setOpened(null);
                  setBlock("");
                  setOpenPassword("");
                }}
              >
                <RotateCcw aria-hidden="true" />
                Clear
              </Button>
              <Button size="sm" onClick={() => void copy(opened, "Text copied")}>
                <Copy aria-hidden="true" />
                Copy text
              </Button>
            </PanelFooter>
          </Panel>
        ) : null}
      </div>
    </ToolLayout>
  );
}
