"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, Eye, EyeOff, Gauge, Info, Laptop, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button, Panel, PanelBody, PanelFooter, PanelHeader, StatusChip, buttonVariants, cn } from "@protectedshare/ui";
import AppLink from "../../../components/app-link";
import ToolLayout, { ToolNotes } from "../../../components/tool-layout";
import SecretInput from "../_components/secret-input";
import { PwnedRequestError, hashPassword, queryRange, rangeUrl, type PasswordHash, type RangeResult } from "./pwned";

type Status = "idle" | "checking" | "found" | "clear" | "error";

const HIBP_PASSWORDS_URL = "https://haveibeenpwned.com/Passwords";

function LocalRow({ label, value, shown, onToggle }: { label: string; value: string; shown: boolean; onToggle: () => void }) {
  const id = useId();
  const empty = value.length === 0;
  return (
    <li className="flex min-h-9 items-center gap-3 py-1.5">
      <span id={id} className="w-[42%] shrink-0 text-small text-ink-2">
        {label}
      </span>
      <span
        aria-labelledby={id}
        className={cn(
          "min-w-0 flex-1 truncate text-right font-mono text-[12px]",
          empty ? "text-ink-3" : shown ? "text-ink" : "text-[13px] tracking-[0.02em] text-ink-3"
        )}
      >
        {empty ? "—" : shown ? value : "•".repeat(Math.min(value.length, 14))}
      </span>
      <button
        type="button"
        disabled={empty}
        onClick={onToggle}
        aria-pressed={shown}
        aria-label={`${shown ? "Hide" : "Show"} ${label.toLowerCase()}`}
        className="-mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-[7px] text-ink-3 outline-none transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45 disabled:opacity-30"
      >
        {shown ? <EyeOff aria-hidden="true" className="size-3.5" /> : <Eye aria-hidden="true" className="size-3.5" />}
      </button>
    </li>
  );
}

/** The one request this tool makes, shown literally, and what stays behind. */
function RequestPanel({
  hash,
  password,
  status,
  blocked,
  showPassword,
  onTogglePassword,
}: {
  hash: PasswordHash | null;
  password: string;
  status: Status;
  blocked: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
}) {
  const headingId = useId();
  const [showHash, setShowHash] = useState(false);
  const label =
    status === "checking"
      ? "Sending…"
      : status === "found" || status === "clear"
        ? "Sent. This was the whole request."
        : status === "error"
          ? blocked
            ? "Blocked by this page's security policy. Nothing was sent."
            : "Not answered. Nothing else was sent."
          : hash
            ? "Sent only when you press Check"
            : "Nothing yet. Type a password to see the request.";

  return (
    <section aria-labelledby={headingId} className="overflow-hidden rounded-panel border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-[7px] border border-line bg-surface-2/60 text-ink-2">
            <ArrowUpRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 id={headingId} className="text-small font-semibold tracking-[-0.005em] text-ink">
              What leaves this browser
            </h2>
            <p className="mt-0.5 truncate font-mono text-[11px] text-ink-3">GET api.pwnedpasswords.com</p>
          </div>
        </div>
        <span className="tabular mt-0.5 shrink-0 font-mono text-[11px] text-ink-3">{hash ? "5 chars" : "0 B"}</span>
      </header>

      <div className="bg-surface-2/40 px-4 py-3.5">
        <p className="text-meta text-ink-3" aria-live="polite">
          {label}
        </p>
        <div className="mt-2 font-mono text-[12px] leading-[19px] [overflow-wrap:anywhere]">
          <p>
            <span className="text-ink-3">GET </span>
            <span id="pwned-request-url" className="text-ink-2">
              {hash ? (
                <>
                  https://api.pwnedpasswords.com/range/
                  <span className="rounded-[4px] bg-ink/[0.07] px-0.5 font-semibold text-ink">{hash.prefix}</span>
                </>
              ) : (
                <>
                  https://api.pwnedpasswords.com/range/<span className="text-ink-3">•••••</span>
                </>
              )}
            </span>
          </p>
          <p>
            <span className="text-ink-3">Add-Padding: </span>
            <span className="text-ink-2">true</span>
          </p>
        </div>
      </div>

      <div className="border-t border-line px-4 pb-2 pt-3">
        <h3 className="flex items-center gap-1.5 text-meta font-medium text-ink-3">
          <Laptop aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
          Stays in this browser
        </h3>
        <ul className="mt-1 divide-y divide-line/70">
          <LocalRow label="Password" value={password} shown={showPassword} onToggle={onTogglePassword} />
          <LocalRow label="Rest of the hash" value={hash ? hash.suffix : ""} shown={showHash} onToggle={() => setShowHash((value) => !value)} />
        </ul>
      </div>

      <p className="flex items-start gap-2 border-t border-line px-4 py-3 text-meta leading-[17px] text-ink-3">
        <Info aria-hidden="true" className="mt-px size-3.5 shrink-0" strokeWidth={1.75} />
        <span>
          Hundreds of hashes in the list start with the same five characters, so the service can&apos;t tell which one, if any, is yours.
          It still sees your IP address and this site as the origin, like any request. No cookies, no referrer.
        </span>
      </p>
    </section>
  );
}

export default function BreachCheckerClient() {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [hash, setHash] = useState<PasswordHash | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<(RangeResult & { prefix: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const latest = useRef("");
  const hashSeq = useRef(0);

  // Hash locally as you type so the panel can show the exact prefix before anything is sent.
  useEffect(() => {
    latest.current = password;
    const id = ++hashSeq.current;
    if (!password) {
      setHash(null);
      return;
    }
    hashPassword(password)
      .then((value) => {
        if (hashSeq.current === id) setHash(value);
      })
      .catch(() => setHash(null));
  }, [password]);

  // The CSP exception for api.pwnedpasswords.com arrives with this page's own document. A client-side
  // navigation from another page keeps that page's policy, which would block the check, so load this
  // page for real once. Runs before anything can be typed; nothing is lost.
  useEffect(() => {
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!entry) return;
    let loadedPath: string;
    try {
      loadedPath = new URL(entry.name).pathname;
    } catch {
      return;
    }
    const trim = (path: string) => path.replace(/\/+$/, "") || "/";
    if (trim(loadedPath) !== trim(window.location.pathname)) window.location.replace(window.location.href);
  }, []);

  // A Content-Security-Policy block never reaches the network; say so plainly instead of "network error".
  useEffect(() => {
    const onViolation = (event: SecurityPolicyViolationEvent) => {
      if (event.blockedURI.includes("pwnedpasswords.com")) setBlocked(true);
    };
    document.addEventListener("securitypolicyviolation", onViolation);
    return () => document.removeEventListener("securitypolicyviolation", onViolation);
  }, []);

  const onChange = (value: string) => {
    setPassword(value);
    setStatus("idle");
    setResult(null);
    setError(null);
    setBlocked(false);
  };

  const check = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!password || status === "checking") return;
    const checked = password;
    setStatus("checking");
    setResult(null);
    setError(null);
    setBlocked(false);
    try {
      const value = await hashPassword(checked);
      setHash(value);
      const range = await queryRange(value);
      if (latest.current !== checked) return;
      setResult({ ...range, prefix: value.prefix });
      setStatus(range.count > 0 ? "found" : "clear");
    } catch (failure) {
      if (latest.current !== checked) return;
      setStatus("error");
      setError(
        failure instanceof PwnedRequestError && failure.reason === "timeout"
          ? "Have I Been Pwned didn't answer in time. Try again in a moment."
          : failure instanceof PwnedRequestError && failure.reason === "http"
            ? `${failure.message} Try again in a moment.`
            : "Couldn't reach Have I Been Pwned. Check your connection, or whether an extension blocks the request, and try again."
      );
    }
  };

  return (
    <ToolLayout
      as="div"
      eyebrow="Free tool"
      title="Breached password checker"
      description="See if a password has turned up in a data breach. Only the first five characters of its SHA-1 hash leave your browser, never the password."
      meta={
        <>
          <StatusChip icon={<ShieldCheck aria-hidden="true" />} tone="ok">
            Password stays here
          </StatusChip>
          <StatusChip>Sends 5 hash characters</StatusChip>
        </>
      }
      aside={
        <>
          <RequestPanel
            hash={hash}
            password={password}
            status={status}
            blocked={blocked}
            showPassword={show}
            onTogglePassword={() => setShow((value) => !value)}
          />
          <ToolNotes
            items={[
              "Nothing is sent while you type. One request goes out when you press Check.",
              "Found in a breach means attackers already have it on their lists. Change it everywhere it's used.",
              "Not found doesn't mean strong. It means it isn't in this list yet.",
            ]}
          />
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Panel>
          <form onSubmit={check} noValidate>
            <PanelHeader
              icon={<ShieldAlert aria-hidden="true" />}
              title="Check a password"
              description="Hashed in this tab first. Five characters of the hash are all that's sent."
            />
            <PanelBody className="flex flex-col gap-1.5">
              <label htmlFor="breach-password" className="text-small font-medium text-ink">
                Password
              </label>
              <SecretInput
                id="breach-password"
                value={password}
                onChange={onChange}
                show={show}
                onToggle={() => setShow((value) => !value)}
                placeholder="Type or paste"
                describedBy="breach-password-hint"
              />
              <p id="breach-password-hint" className="text-small text-ink-3">
                Press Check, or Enter, to look it up. Each check sends one request with five characters of the hash.
              </p>
            </PanelBody>
            <PanelFooter>
              <span className="text-small text-ink-3">
                Data:{" "}
                <a href={HIBP_PASSWORDS_URL} className="font-medium text-ink-2 underline decoration-line-strong underline-offset-[3px] hover:text-ink">
                  Pwned Passwords
                </a>{" "}
                by Have I Been Pwned
              </span>
              <Button type="submit" disabled={!password} loading={status === "checking"} className="max-sm:w-full">
                <ShieldAlert aria-hidden="true" />
                Check password
              </Button>
            </PanelFooter>
          </form>
        </Panel>

        <p className="sr-only" role="status" aria-live="polite">
          {status === "checking"
            ? "Checking."
            : status === "found" && result
              ? `Found ${result.count.toLocaleString("en-US")} times in known breaches.`
              : status === "clear"
                ? "Not found in known breaches."
                : ""}
        </p>

        <div>
          {status === "found" && result ? (
            <Panel className="animate-rise border-danger/35">
              <PanelBody className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StatusChip tone="danger">Found in breaches</StatusChip>
                </div>
                <p className="text-ink">
                  <span id="pwned-count" className="tabular text-[32px] font-semibold leading-9 tracking-[-0.03em]">
                    {result.count.toLocaleString("en-US")}
                  </span>
                  <span className="ml-2 text-ui text-ink-2">{result.count === 1 ? "time" : "times"} in known breaches</span>
                </p>
                <p className="text-ui text-ink-2">
                  This password is on the lists attackers try first. Don&apos;t use it anywhere. If it&apos;s yours, change it on every site that
                  uses it, starting with email and banking.
                </p>
              </PanelBody>
              <ResultFooter result={result} matched />
            </Panel>
          ) : null}

          {status === "clear" && result ? (
            <Panel className="animate-rise">
              <PanelBody className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StatusChip tone="ok">Not found</StatusChip>
                </div>
                <p className="text-ink">
                  <span id="pwned-count" className="tabular text-[32px] font-semibold leading-9 tracking-[-0.03em]">
                    0
                  </span>
                  <span className="ml-2 text-ui text-ink-2">times in known breaches</span>
                </p>
                <p className="text-ui text-ink-2">
                  Good: it isn&apos;t in the Pwned Passwords list. That doesn&apos;t make it strong, only unleaked so far. Check its strength, and
                  keep it to one account.
                </p>
              </PanelBody>
              <ResultFooter result={result} matched={false} />
            </Panel>
          ) : null}

          {status === "error" && error ? (
            <p role="alert" className="rounded-field bg-danger-soft px-3.5 py-3 text-small text-danger">
              {blocked ? "This page's security policy blocked the request, so nothing was sent. Please try again later." : error}
            </p>
          ) : null}
        </div>
      </div>
    </ToolLayout>
  );
}

function ResultFooter({ result, matched }: { result: RangeResult & { prefix: string }; matched: boolean }) {
  return (
    <>
      <dl className="grid gap-x-6 gap-y-2 border-t border-line px-5 py-4 text-small sm:grid-cols-3">
        <div>
          <dt className="text-ink-3">Prefix sent</dt>
          <dd className="font-mono text-ink">{result.prefix}</dd>
        </div>
        <div>
          <dt className="text-ink-3">Hash endings returned</dt>
          <dd className="tabular text-ink">
            {result.returned.toLocaleString("en-US")}
            <span className="text-ink-3"> ({result.padding.toLocaleString("en-US")} padding)</span>
          </dd>
        </div>
        <div>
          <dt className="text-ink-3">Your ending</dt>
          <dd className="text-ink">{matched ? "In the list, matched here" : "Not in the list"}</dd>
        </div>
      </dl>
      <PanelFooter>
        <span className="text-small text-ink-3">Nothing you typed is carried over to these pages.</span>
        <div className="flex flex-wrap items-center gap-2">
          <AppLink href="/tools/password-strength-checker" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <Gauge aria-hidden="true" />
            Check its strength
          </AppLink>
          <AppLink href="/tools/password-generator" className={buttonVariants({ size: "sm" })}>
            {matched ? "Make a new password" : "Generate a stronger one"}
            <ArrowRight aria-hidden="true" />
          </AppLink>
        </div>
      </PanelFooter>
    </>
  );
}
