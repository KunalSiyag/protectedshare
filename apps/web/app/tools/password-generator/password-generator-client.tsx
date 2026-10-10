"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Eye, EyeOff, FileLock, History, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import {
  PASSPHRASE_WORDLIST_SIZE,
  generatePassphrase,
  generatePassword,
  randomInt,
} from "@protectedshare/crypto";
import {
  Button,
  Checkbox,
  Input,
  Kbd,
  Panel,
  PanelBody,
  PanelFooter,
  PanelHeader,
  Segmented,
  StatusChip,
  Switch,
  cn,
} from "@protectedshare/ui";
import ToolLayout, { ToolNotes } from "../../../components/tool-layout";
import { useToast } from "../../../components/toast";
import { copyText } from "../../../lib/clipboard";
import ColoredValue from "../_components/colored-value";
import RangeField from "../_components/range-field";
import { CrackTimes, StrengthMeter } from "../_components/strength-meter";
import { estimateTypedBits, strengthFromBits, typedFindings } from "../_lib/strength";

type Mode = "password" | "passphrase" | "pin";
type Separator = "-" | "." | "_" | " ";

type Generated = { value: string; bits: number; mode: Mode; id: number };

const MODE_LABEL: Record<Mode, string> = { password: "Password", passphrase: "Passphrase", pin: "PIN" };

const HISTORY_LIMIT = 10;

function generatePin(digits: number): { value: string; entropyBits: number } {
  let value = "";
  for (let index = 0; index < digits; index += 1) value += String(randomInt(10));
  return { value, entropyBits: digits * Math.log2(10) };
}

/** Bigger type for short values, smaller for long ones, so a 128-char password still fits. */
function sizeFor(length: number): string {
  if (length <= 20) return "text-[26px] leading-[36px] sm:text-[32px] sm:leading-[42px]";
  if (length <= 36) return "text-[20px] leading-[30px] sm:text-[24px] sm:leading-[34px]";
  if (length <= 64) return "text-[16px] leading-[26px] sm:text-[19px] sm:leading-[29px]";
  return "text-[14px] leading-[22px] sm:text-[15px] sm:leading-6";
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function isActivatable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("button, a, summary, [role='button'], [role='switch'], [role='radio'], label"));
}

export default function PasswordGeneratorClient() {
  const router = useRouter();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("password");
  // Password
  const [length, setLength] = useState(20);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [digits, setDigits] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(false);
  // Passphrase
  const [words, setWords] = useState(5);
  const [separator, setSeparator] = useState<Separator>("-");
  const [capitalize, setCapitalize] = useState(false);
  const [includeNumber, setIncludeNumber] = useState(false);
  // PIN
  const [pinDigits, setPinDigits] = useState(6);

  const [current, setCurrent] = useState<Generated | null>(null);
  const [history, setHistory] = useState<Generated[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [spin, setSpin] = useState(0);
  const nextId = useRef(1);

  const classCount = [lower, upper, digits, symbols].filter(Boolean).length;

  const generate = useCallback(() => {
    try {
      let result: { value: string; entropyBits: number };
      if (mode === "password") {
        result = generatePassword({ length, lower, upper, digits, symbols, avoidAmbiguous });
      } else if (mode === "passphrase") {
        result = generatePassphrase({ words, separator, capitalize, includeNumber });
      } else {
        result = generatePin(pinDigits);
      }
      setCurrent({ value: result.value, bits: result.entropyBits, mode, id: nextId.current++ });
    } catch {
      // Only possible with no character types, which the UI prevents.
    }
  }, [mode, length, lower, upper, digits, symbols, avoidAmbiguous, words, separator, capitalize, includeNumber, pinDigits]);

  // New value whenever settings change (and on first load).
  useEffect(() => {
    generate();
  }, [generate]);

  const remember = useCallback((item: Generated) => {
    setHistory((items) => (items[0]?.id === item.id ? items : [item, ...items.filter((entry) => entry.id !== item.id)].slice(0, HISTORY_LIMIT)));
  }, []);

  // Record a value once it has been on screen for a moment, so dragging a slider doesn't flood history.
  useEffect(() => {
    if (!current) return;
    const timer = window.setTimeout(() => remember(current), 900);
    return () => window.clearTimeout(timer);
  }, [current, remember]);

  const regenerate = useCallback(() => {
    setSpin((value) => value + 1);
    generate();
  }, [generate]);

  // Space or R regenerates, unless you're typing or pressing a control.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      if (isTypingTarget(event.target)) return;
      const key = event.key.toLowerCase();
      if (key === "r" || (key === " " && !isActivatable(event.target))) {
        event.preventDefault();
        regenerate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [regenerate]);

  const copy = useCallback(
    async (value: string, label = "Copied") => {
      const ok = await copyText(value);
      // A copied value is one you might need again, however briefly it was on screen.
      if (ok && current && value === current.value) remember(current);
      if (ok) toast({ title: label, description: "Paste it where it's needed, then copy something else.", tone: "ok" });
      else toast({ title: "Couldn't copy", description: "Select the value and copy it by hand.", tone: "danger" });
      return ok;
    },
    [toast, current, remember]
  );

  const sendSecurely = async () => {
    if (!current) return;
    const ok = await copyText(current.value);
    toast(
      ok
        ? { title: "Copied. Paste it into the note.", description: "It's encrypted in your browser before anything is sent.", tone: "ok" }
        : { title: "Couldn't copy", description: "Copy the value by hand, then paste it into the note.", tone: "danger" }
    );
    router.push("/notes");
  };

  const strength = current ? strengthFromBits(current.bits) : null;

  const detail = useMemo(() => {
    if (!current) return null;
    if (current.mode === "passphrase") {
      return `${words} words from a ${PASSPHRASE_WORDLIST_SIZE.toLocaleString("en-US")}-word list`;
    }
    if (current.mode === "pin") return `${pinDigits} digits, 10 options each`;
    const pool = Math.round(Math.pow(2, current.bits / Math.max(1, current.value.length)));
    return `${current.value.length} characters, ${pool} options each`;
  }, [current, words, pinDigits]);

  return (
    <ToolLayout
      eyebrow="Free tool"
      title="Password generator"
      description="Strong passwords, passphrases and PINs, made in your browser. Nothing is sent or saved."
      meta={
        <>
          <StatusChip icon={<ShieldCheck aria-hidden="true" />} tone="ok">
            Generated locally
          </StatusChip>
          <StatusChip>Not stored</StatusChip>
        </>
      }
      aside={
        <>
          <Panel>
            <PanelHeader title="Time to crack" description="If the attacker knows exactly how it was made." />
            <PanelBody className="flex flex-col gap-4">
              <div>
                <p className="tabular text-[28px] font-semibold leading-8 tracking-[-0.02em] text-ink">
                  {current ? Math.round(current.bits) : 0}
                  <span className="ml-1.5 text-ui font-normal tracking-normal text-ink-3">bits of entropy</span>
                </p>
                {detail ? <p className="mt-1 text-small text-ink-3">{detail}</p> : null}
              </div>
              <CrackTimes bits={current ? current.bits : null} />
            </PanelBody>
          </Panel>
          <ToolNotes
            items={[
              "Random values come from crypto.getRandomValues, with no modulo bias.",
              "History lives in this tab's memory and is gone when you reload.",
              "Use each password in one place only. Reuse is how most accounts fall.",
            ]}
          />
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
            <Segmented
              aria-label="What to generate"
              value={mode}
              onChange={setMode}
              options={[
                { value: "password", label: "Password" },
                { value: "passphrase", label: "Passphrase" },
                { value: "pin", label: "PIN" },
              ]}
            />
            <p className="hidden items-center gap-1.5 text-meta text-ink-3 sm:flex">
              <Kbd>Space</Kbd> or <Kbd>R</Kbd> for a new one
            </p>
          </div>

          {/* Output */}
          <div className="border-b border-line px-5 pb-5 pt-6">
            <div className="flex min-h-[84px] items-center rounded-field bg-surface-2/60 px-4 py-4 sm:px-5">
              <output
                aria-live="polite"
                aria-label={`Generated ${MODE_LABEL[mode].toLowerCase()}`}
                className={cn(
                  "block min-w-0 flex-1 break-all tracking-[-0.01em] selection:bg-ink selection:text-on-ink",
                  current ? sizeFor(current.value.length) : "text-[26px] leading-[36px]"
                )}
              >
                {current ? (
                  <ColoredValue key={current.id} value={current.value} className="animate-fade-in" />
                ) : (
                  <span className="font-mono text-ink-3">Generating…</span>
                )}
              </output>
            </div>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <StrengthMeter info={strength} className="sm:w-[260px]" />
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={regenerate} aria-label="Generate a new one" className="flex-1 sm:flex-none">
                  <RefreshCw
                    aria-hidden="true"
                    className="transition-transform duration-300 ease-seal motion-reduce:transition-none"
                    style={{ transform: `rotate(${spin * 180}deg)` }}
                  />
                  <span>New</span>
                </Button>
                <Button
                  onClick={() => current && void copy(current.value, `${MODE_LABEL[current.mode]} copied`)}
                  disabled={!current}
                  className="flex-1 sm:flex-none"
                >
                  <Copy aria-hidden="true" />
                  Copy
                </Button>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="px-5 py-5">
            {mode === "password" ? (
              <div className="flex flex-col gap-6">
                <RangeField label="Length" value={length} min={8} max={128} onChange={setLength} unit="characters" />
                <fieldset>
                  <legend className="text-small font-medium text-ink">Characters</legend>
                  <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    <Checkbox
                      label={<span>Lowercase <span className="font-mono text-ink-3">a–z</span></span>}
                      checked={lower}
                      disabled={lower && classCount === 1}
                      onChange={(event) => setLower(event.target.checked)}
                    />
                    <Checkbox
                      label={<span>Uppercase <span className="font-mono text-ink-3">A–Z</span></span>}
                      checked={upper}
                      disabled={upper && classCount === 1}
                      onChange={(event) => setUpper(event.target.checked)}
                    />
                    <Checkbox
                      label={<span>Digits <span className="font-mono text-ok">0–9</span></span>}
                      checked={digits}
                      disabled={digits && classCount === 1}
                      onChange={(event) => setDigits(event.target.checked)}
                    />
                    <Checkbox
                      label={<span>Symbols <span className="font-mono text-warn">!@#$%</span></span>}
                      checked={symbols}
                      disabled={symbols && classCount === 1}
                      onChange={(event) => setSymbols(event.target.checked)}
                    />
                  </div>
                  <p className="mt-3 text-small text-ink-3">Every type you pick appears at least once.</p>
                </fieldset>
                <Switch
                  checked={avoidAmbiguous}
                  onCheckedChange={setAvoidAmbiguous}
                  label="Avoid look-alike characters"
                  description={
                    <>
                      Leaves out <span className="font-mono">I l 1 O 0 o</span>. Handy if someone has to read it aloud or type it.
                    </>
                  }
                />
              </div>
            ) : null}

            {mode === "passphrase" ? (
              <div className="flex flex-col gap-6">
                <RangeField label="Words" value={words} min={3} max={12} onChange={setWords} unit="words" />
                <div className="flex flex-col gap-2.5">
                  <span id="separator-label" className="text-small font-medium text-ink">
                    Separator
                  </span>
                  <Segmented
                    aria-labelledby="separator-label"
                    value={separator}
                    onChange={setSeparator}
                    options={[
                      { value: "-", label: <span>Hyphen <span className="font-mono text-ink-3">-</span></span> },
                      { value: ".", label: <span>Period <span className="font-mono text-ink-3">.</span></span> },
                      { value: "_", label: <span>Underscore <span className="font-mono text-ink-3">_</span></span> },
                      { value: " ", label: "Space" },
                    ]}
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <Switch checked={capitalize} onCheckedChange={setCapitalize} label="Capitalize words" description="For sites that demand an uppercase letter." />
                  <Switch
                    checked={includeNumber}
                    onCheckedChange={setIncludeNumber}
                    label="Include a number"
                    description="Adds one digit to a random word. For sites that demand a digit."
                  />
                </div>
              </div>
            ) : null}

            {mode === "pin" ? (
              <div className="flex flex-col gap-4">
                <RangeField label="Digits" value={pinDigits} min={4} max={12} onChange={setPinDigits} unit="digits" />
                <p className="rounded-field bg-warn-soft px-3.5 py-3 text-small text-ink-2">
                  <span className="font-medium text-warn">PINs are short by design.</span> Use them only where wrong attempts are limited, like a
                  phone or a card. Anywhere else, use a password.
                </p>
              </div>
            ) : null}
          </div>

          <PanelFooter>
            <span className="text-small text-ink-3">Need to send it to someone? Don&apos;t paste it into chat.</span>
            <Button variant="secondary" size="sm" onClick={() => void sendSecurely()} disabled={!current}>
              <FileLock aria-hidden="true" />
              Send it in a secure note
            </Button>
          </PanelFooter>
        </Panel>

        <HistoryPanel
          items={history}
          revealed={revealed}
          onToggle={(id) =>
            setRevealed((set) => {
              const next = new Set(set);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            })
          }
          onCopy={(item) => void copy(item.value, `${MODE_LABEL[item.mode]} copied`)}
          onClear={() => {
            setHistory([]);
            setRevealed(new Set());
          }}
        />

        <CheckerPanel />
      </div>
    </ToolLayout>
  );
}

function HistoryPanel({
  items,
  revealed,
  onToggle,
  onCopy,
  onClear,
}: {
  items: Generated[];
  revealed: Set<number>;
  onToggle: (id: number) => void;
  onCopy: (item: Generated) => void;
  onClear: () => void;
}) {
  return (
    <Panel>
      <PanelHeader
        icon={<History aria-hidden="true" />}
        title="Recent"
        description="The last 10, in this tab's memory only. Gone on reload."
        actions={
          items.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <Trash2 aria-hidden="true" />
              Clear
            </Button>
          ) : null
        }
      />
      {items.length === 0 ? (
        <p className="px-5 py-5 text-small text-ink-3">Values you generate show up here.</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => {
            const open = revealed.has(item.id);
            return (
              <li key={item.id} className="flex items-center gap-3 px-5 py-2.5">
                <span className="w-[76px] shrink-0 text-meta text-ink-3">{MODE_LABEL[item.mode]}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-small text-ink">
                  {open ? (
                    <ColoredValue value={item.value} />
                  ) : (
                    <span className="tracking-[0.14em] text-ink-3" aria-label="Hidden value">
                      {"•".repeat(Math.min(item.value.length, 24))}
                    </span>
                  )}
                </span>
                <span className="tabular hidden shrink-0 font-mono text-meta text-ink-3 sm:inline">{Math.round(item.bits)} bits</span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onToggle(item.id)}
                    aria-pressed={open}
                    aria-label={open ? "Hide value" : "Show value"}
                  >
                    {open ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => onCopy(item)} aria-label="Copy value">
                    <Copy aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function CheckerPanel() {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const bits = useMemo(() => (value ? estimateTypedBits(value) : 0), [value]);
  const info = value ? strengthFromBits(bits) : null;
  const findings = useMemo(() => typedFindings(value), [value]);

  return (
    <Panel>
      <PanelHeader
        icon={<ShieldCheck aria-hidden="true" />}
        title="Check a password"
        description="Runs in this page. What you type is never sent or saved."
      />
      <PanelBody className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="check-password" className="text-small font-medium text-ink">
            Password to check
          </label>
          <div className="relative">
            <Input
              id="check-password"
              type={show ? "text" : "password"}
              mono
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="Type or paste"
              aria-describedby="check-password-hint"
              className="pr-11"
              data-lpignore="true"
              data-1p-ignore="true"
            />
            <button
              type="button"
              onClick={() => setShow((state) => !state)}
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
              className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-control text-ink-3 outline-none transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
            >
              {show ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
            </button>
          </div>
          <p id="check-password-hint" className="text-small text-ink-3">
            Don&apos;t type a password you use today into any website, this one included.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:gap-8">
          <div className="flex flex-col gap-4">
            <StrengthMeter info={info} approximate />
            {findings.length > 0 ? (
              <ul className="flex flex-col gap-2" aria-live="polite">
                {findings.map((finding) => (
                  <li key={finding.text} className="flex gap-2.5 text-small text-ink-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-[6px] size-1.5 shrink-0 rounded-full",
                        finding.tone === "danger" ? "bg-danger" : finding.tone === "warn" ? "bg-warn" : "bg-ok"
                      )}
                    />
                    <span>{finding.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-small text-ink-3">Type a password to see an estimate.</p>
            )}
          </div>
          <div>
            <CrackTimes bits={value ? bits : null} />
          </div>
        </div>
        <p className="border-t border-line pt-4 text-meta text-ink-3">
          A rough estimate from a short built-in list of common passwords and patterns. It can tell you a password is weak; it can&apos;t
          prove one is strong. Generated passwords are measured exactly instead.
        </p>
      </PanelBody>
    </Panel>
  );
}
