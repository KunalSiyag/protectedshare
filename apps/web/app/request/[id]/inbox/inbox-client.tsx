"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clock,
  Copy,
  Download,
  Eye,
  EyeOff,
  Flame,
  Inbox,
  KeyRound,
  LockKeyholeOpen,
  RotateCw,
  ShieldAlert,
} from "lucide-react";
import { deriveInboxToken, openWithPrivateKey } from "@protectedshare/crypto";
import { AUTH_TOKEN_HEADER, type PublicRequestResponse, type RequestResponseSealed } from "@protectedshare/contracts";
import { Button, Panel, PanelBody, Spinner, StatusChip, buttonVariants, cn } from "@protectedshare/ui";
import AppLink from "../../../../components/app-link";
import CopyField from "../../../../components/copy-field";
import EmptyState from "../../../../components/empty-state";
import ServerView from "../../../../components/server-view";
import ToolLayout, { ToolNotes } from "../../../../components/tool-layout";
import { useToast } from "../../../../components/toast";
import { apiUrl } from "../../../../lib/api";
import { copyText } from "../../../../lib/clipboard";
import { readApiError } from "../../../../lib/feedback";
import { readFragmentParams, withFragmentParams } from "../../../../lib/share-window";
import RequestFlow from "../../request-flow";
import {
  POLL_MS,
  fetchPublicRequest,
  formatRelativeExpiry,
  formatTime,
  openLabel,
  parseAnswer,
  publicKeyFromPrivate,
  senderPath,
  type LabelState,
  type RequestAnswer,
} from "../../request-shared";

type Keys = { privateKey: string; labelKey?: string; inboxToken: string; publicKey: string };

type Phase =
  | { name: "loading" }
  | { name: "missing-key" }
  | { name: "bad-key" }
  | { name: "gone" }
  | { name: "error"; message: string }
  | { name: "waiting"; request: PublicRequestResponse; label: LabelState }
  | { name: "arrived"; request: PublicRequestResponse; label: LabelState; error?: string }
  | { name: "revealed"; label: LabelState; answer: RequestAnswer; respondedAt: number }
  | { name: "broken"; label: LabelState };

function titleOf(label: LabelState): string | null {
  return label.status === "ok" && label.label.title ? label.label.title : null;
}

export default function InboxClient({ id }: { id: string }) {
  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>({ name: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [opening, setOpening] = useState(false);
  const keys = useRef<Keys | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [senderUrl, setSenderUrl] = useState("");

  // First load: check the request exists, then that the key in the link belongs to it.
  useEffect(() => {
    const controller = new AbortController();
    setPhase({ name: "loading" });
    (async () => {
      const result = await fetchPublicRequest(id, controller.signal);
      if (result.status === "gone") return setPhase({ name: "gone" });
      if (result.status === "error") return setPhase({ name: "error", message: result.message });
      const request = result.request;

      const params = readFragmentParams();
      if (!params.p) return setPhase({ name: "missing-key" });
      try {
        if ((await publicKeyFromPrivate(params.p)) !== request.publicKey) return setPhase({ name: "bad-key" });
      } catch {
        return setPhase({ name: "bad-key" });
      }
      const inboxToken = await deriveInboxToken(params.p);
      keys.current = { privateKey: params.p, labelKey: params.k, inboxToken, publicKey: request.publicKey };
      setToken(inboxToken);
      // Only a link with #k= can answer, so don't offer one without it.
      setSenderUrl(params.k ? withFragmentParams(`${window.location.origin}${senderPath(id)}`, { k: params.k }) : "");

      const label = await openLabel(request.label, params.k);
      setPhase(request.hasResponse ? { name: "arrived", request, label } : { name: "waiting", request, label });
    })().catch(() => {
      // Aborted on unmount.
    });
    return () => controller.abort();
  }, [id, attempt]);

  // A new inbox link pasted into this tab only changes the fragment. Start over, unless an
  // answer is on screen: that's the only copy, so don't throw it away.
  const revealedRef = useRef(false);
  revealedRef.current = phase.name === "revealed";
  useEffect(() => {
    const onHashChange = () => {
      if (!revealedRef.current) setAttempt((value) => value + 1);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const waiting = phase.name === "waiting";
  const [lastChecked, setLastChecked] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const result = await fetchPublicRequest(id);
      setLastChecked(Date.now());
      if (result.status === "gone") {
        setPhase({ name: "gone" });
      } else if (result.status === "ok" && result.request.hasResponse) {
        setPhase((current) =>
          current.name === "waiting" ? { name: "arrived", request: result.request, label: current.label } : current
        );
        toast({ title: "Their answer is here", description: "Open it when you're ready.", tone: "ok" });
      }
    } finally {
      setChecking(false);
    }
  }, [id, toast]);

  // Poll the public status every 8 s while this tab is visible. The answer itself is only
  // fetched when you choose to open it, because fetching it deletes it.
  useEffect(() => {
    if (!waiting) return;
    let timer: number | undefined;
    const schedule = () => {
      window.clearTimeout(timer);
      if (document.visibilityState === "visible") timer = window.setTimeout(tick, POLL_MS);
    };
    const tick = async () => {
      await check().catch(() => undefined);
      schedule();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void tick();
      else window.clearTimeout(timer);
    };
    setLastChecked(Date.now());
    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [waiting, check]);

  const reveal = async () => {
    if (phase.name !== "arrived" || !keys.current || opening) return;
    const current = keys.current;
    const label = phase.label;
    setOpening(true);
    let sealed: RequestResponseSealed;
    try {
      const response = await fetch(apiUrl(`/api/requests/${encodeURIComponent(id)}/response`), {
        headers: { [AUTH_TOKEN_HEADER]: current.inboxToken },
        cache: "no-store",
      });
      if (response.status === 401) return setPhase({ name: "bad-key" });
      if (response.status === 404) {
        const data = (await response.json().catch(() => null)) as { code?: string } | null;
        if (data?.code === "NO_RESPONSE_YET") return setPhase({ name: "waiting", request: phase.request, label });
        return setPhase({ name: "gone" });
      }
      if (!response.ok) {
        const message = await readApiError(response, "Could not open it. Try again in a moment.");
        return setPhase({ ...phase, error: message });
      }
      sealed = (await response.json()) as RequestResponseSealed;
    } catch {
      return setPhase({ ...phase, error: "Could not reach the server. Nothing was opened. Try again." });
    } finally {
      setOpening(false);
    }

    // The server copy is gone now. Drop the key from the address bar too.
    try {
      window.history.replaceState(window.history.state, "", window.location.pathname);
    } catch {
      // ignore
    }
    try {
      const plaintext = await openWithPrivateKey(sealed, current.privateKey, current.publicKey);
      setPhase({ name: "revealed", label, answer: parseAnswer(plaintext), respondedAt: sealed.respondedAt * 1000 });
    } catch {
      setPhase({ name: "broken", label });
    }
  };

  const title = "label" in phase ? titleOf(phase.label) : null;

  const aside =
    phase.name === "waiting" || phase.name === "arrived" || phase.name === "revealed" ? (
      <>
        <ServerView
          title="What opening it sends"
          outgoing={token ? { headers: { [AUTH_TOKEN_HEADER]: token } } : null}
          endpoint={`GET /api/requests/${id}/response`}
          localOnly={[
            { label: "Private key", value: keys.current?.privateKey ?? "" },
            { label: "Their answer", value: phase.name === "revealed" ? phase.answer.text : "" },
          ]}
          note="Only this token goes out. It's derived from your private key, and the server checks it against a hash. The answer is decrypted here."
        />
        <ToolNotes
          items={
            phase.name === "revealed"
              ? [
                  "Put it in a password manager, not a chat or a shared doc.",
                  "The request is gone from the server. Their link and this inbox link no longer work.",
                ]
              : [
                  "We check for an answer every 8 seconds while this tab is visible, and pause when it isn't.",
                  "You can close this tab and come back with the same link any time before it expires.",
                  "The server holds only ciphertext it can't open.",
                ]
          }
        />
      </>
    ) : undefined;

  return (
    <ToolLayout
      eyebrow="Secret request · Your inbox"
      title={title ?? "Your inbox"}
      description={
        phase.name === "revealed"
          ? "Decrypted in this browser. The server copy has been deleted."
          : "Only this link can open the answer. Keep it to yourself."
      }
      aside={aside}
    >
      <Body
        phase={phase}
        id={id}
        senderUrl={senderUrl}
        opening={opening}
        checking={checking}
        lastChecked={lastChecked}
        onCheck={() => void check()}
        onReveal={() => void reveal()}
        onRetry={() => setAttempt((value) => value + 1)}
      />
    </ToolLayout>
  );
}

function Body({
  phase,
  id,
  senderUrl,
  opening,
  checking,
  lastChecked,
  onCheck,
  onReveal,
  onRetry,
}: {
  phase: Phase;
  id: string;
  senderUrl: string;
  opening: boolean;
  checking: boolean;
  lastChecked: number | null;
  onCheck: () => void;
  onReveal: () => void;
  onRetry: () => void;
}) {
  switch (phase.name) {
    case "loading":
      return (
        <Panel aria-busy="true">
          <PanelBody className="flex items-center gap-3 py-10 text-small text-ink-3">
            <Spinner /> <span role="status">Checking your inbox…</span>
          </PanelBody>
        </Panel>
      );
    case "gone":
      return (
        <EmptyState
          icon={Inbox}
          title="This inbox is empty"
          description="The answer was already opened, and answers are deleted after one view. Or the request expired before anyone answered."
          action={
            <AppLink href="/request" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Make a new request
            </AppLink>
          }
        />
      );
    case "missing-key":
      return (
        <EmptyState
          icon={KeyRound}
          title="This inbox link is missing its key"
          description="The private key is the part after # in the link. Open the full inbox link you saved, or find it in My links on the device you made the request on."
          action={
            <AppLink href="/links" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Open My links
            </AppLink>
          }
        />
      );
    case "bad-key":
      return (
        <EmptyState
          icon={KeyRound}
          title="This key doesn't open this inbox"
          description="The link may have been cut off when it was copied. Nothing was opened or deleted. Try the full inbox link again."
        />
      );
    case "error":
      return (
        <EmptyState
          icon={ShieldAlert}
          title="Couldn't check your inbox"
          description={phase.message}
          action={
            <Button size="sm" variant="secondary" onClick={onRetry}>
              <RotateCw aria-hidden="true" /> Try again
            </Button>
          }
        />
      );
    case "broken":
      return (
        <EmptyState
          icon={ShieldAlert}
          title="The answer arrived but couldn't be decrypted"
          description="It doesn't match your key, so it may have been changed on the way. It has been deleted from the server. Ask them to answer a new request."
          action={
            <AppLink href="/request" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              Make a new request
            </AppLink>
          }
        />
      );
    case "waiting":
      return (
        <WaitingPanel
          request={phase.request}
          label={phase.label}
          senderUrl={senderUrl}
          checking={checking}
          lastChecked={lastChecked}
          onCheck={onCheck}
        />
      );
    case "arrived":
      return <ArrivedPanel id={id} phase={phase} opening={opening} onReveal={onReveal} />;
    case "revealed":
      return <RevealedPanel phase={phase} />;
  }
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function NoteLine({ label }: { label: LabelState }) {
  if (label.status === "ok" && label.label.note) {
    return <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-small text-ink-3 [overflow-wrap:anywhere]">{label.label.note}</p>;
  }
  if (label.status === "missing-key" || label.status === "unreadable") {
    return <p className="mt-1.5 text-small text-ink-3">The title is hidden: this link doesn&apos;t carry its key.</p>;
  }
  return null;
}

function WaitingPanel({
  request,
  label,
  senderUrl,
  checking,
  lastChecked,
  onCheck,
}: {
  request: PublicRequestResponse;
  label: LabelState;
  senderUrl: string;
  checking: boolean;
  lastChecked: number | null;
  onCheck: () => void;
}) {
  const now = useNow(1000);
  const seconds = lastChecked ? Math.max(0, Math.round((now - lastChecked) / 1000)) : null;

  return (
    <Panel>
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="min-w-0">
          <StatusChip tone="warn" pulse>
            Waiting for their answer
          </StatusChip>
          <p className="mt-3 text-ui text-ink-2">
            Nothing yet. This page checks on its own, so you can leave it open or come back later.
          </p>
          <NoteLine label={label} />
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
          <Button variant="secondary" size="sm" onClick={onCheck} loading={checking}>
            <RotateCw aria-hidden="true" />
            Check now
          </Button>
          <p className="tabular text-meta text-ink-3" aria-live="off">
            {seconds === null ? "Not checked yet" : seconds < 2 ? "Checked just now" : `Checked ${seconds}s ago`}
          </p>
        </div>
      </div>
      <div className="border-t border-line px-5 py-5 sm:px-6">
        <RequestFlow current={2} compact />
      </div>
      {senderUrl ? (
        <div className="border-t border-line px-5 py-5 sm:px-6">
          <CopyField
            value={senderUrl}
            label="Haven't sent the request yet?"
            hint="This is the link for them. It can answer once, but it can't open the answer."
          />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-b-panel border-t border-line bg-surface-2/40 px-5 py-3.5 text-small text-ink-3 sm:px-6">
        <span className="flex items-center gap-2">
          <Clock aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Closes {formatRelativeExpiry(request.expiresAt, now)}, {formatTime(request.expiresAt * 1000)}
        </span>
      </div>
    </Panel>
  );
}

function ArrivedPanel({
  id,
  phase,
  opening,
  onReveal,
}: {
  id: string;
  phase: Extract<Phase, { name: "arrived" }>;
  opening: boolean;
  onReveal: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <Panel className="animate-rise overflow-hidden">
      <div className="px-5 pb-5 pt-6 sm:px-6">
        <StatusChip tone="ok">Answer received</StatusChip>
        <h2 ref={headingRef} tabIndex={-1} className="mt-3 text-h3 text-ink outline-none">
          Their answer is here, still sealed.
        </h2>
        <NoteLine label={phase.label} />
      </div>
      <div className="border-t border-line px-5 py-5 sm:px-6">
        <RequestFlow current={3} compact />
      </div>
      <div className="flex flex-col gap-4 border-t border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-seal-soft text-seal">
            <Flame aria-hidden="true" className="size-4" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-ui font-medium text-ink">Opening it deletes it from the server.</p>
            <p className="mt-0.5 max-w-[46ch] text-small text-ink-3">
              You&apos;ll see it once, in this tab. Have somewhere safe to put it, like your password manager.
            </p>
          </div>
        </div>
        <Button size="lg" onClick={onReveal} loading={opening} className="w-full shrink-0 sm:w-auto" aria-describedby={`${id}-gate-error`}>
          <LockKeyholeOpen aria-hidden="true" />
          Open the answer
        </Button>
      </div>
      <p id={`${id}-gate-error`} role="alert" className={cn("px-5 pb-4 text-small text-danger sm:px-6", !phase.error && "sr-only")}>
        {phase.error ?? ""}
      </p>
    </Panel>
  );
}

function RevealedPanel({ phase }: { phase: Extract<Phase, { name: "revealed" }> }) {
  const { toast } = useToast();
  const [hidden, setHidden] = useState(false);
  const [kept, setKept] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const text = phase.answer.text;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // Until it's copied or saved, ask before the tab closes. It's the only copy.
  useEffect(() => {
    if (kept) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [kept]);

  const handleCopy = async () => {
    if (await copyText(text)) {
      setKept(true);
      toast({ title: "Copied", description: "Paste it somewhere safe.", tone: "ok" });
    } else {
      toast({ title: "Couldn't copy", description: "Select the text and copy it by hand.", tone: "danger" });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const base = (titleOf(phase.label) ?? "secret").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "secret";
    anchor.href = url;
    anchor.download = `${base}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setKept(true);
  };

  return (
    <Panel className="animate-rise overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-4 pt-6 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <StatusChip tone="ok">Decrypted in this browser</StatusChip>
            <StatusChip tone="seal" icon={<Flame aria-hidden="true" />}>
              Deleted from the server
            </StatusChip>
          </div>
          <h2 ref={headingRef} tabIndex={-1} className="mt-3 text-h3 text-ink outline-none">
            Their answer
          </h2>
          <p className="mt-0.5 text-small text-ink-3">
            {phase.answer.sentAt ? `Sent ${formatTime(phase.answer.sentAt)}` : `Sent ${formatTime(phase.respondedAt)}`}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setHidden((value) => !value)}
          aria-pressed={hidden}
          aria-controls="answer-text"
        >
          {hidden ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
          {hidden ? "Show" : "Hide"}
        </Button>
      </div>

      <div className="px-5 sm:px-6">
        <pre
          id="answer-text"
          tabIndex={0}
          aria-label="Their answer"
          className={cn(
            "max-h-[420px] min-h-[88px] overflow-auto whitespace-pre-wrap rounded-field border border-line-strong bg-surface-2/50 px-3.5 py-3 font-mono text-small leading-[1.6] text-ink outline-none [overflow-wrap:anywhere] focus-visible:border-ink-3 focus-visible:ring-[3px] focus-visible:ring-seal/20",
            hidden && "select-none"
          )}
        >
          {hidden ? "•".repeat(Math.min(Math.max(text.length, 8), 32)) : text}
        </pre>
      </div>

      <div className="flex flex-col gap-2 px-5 pt-4 sm:flex-row sm:px-6">
        <Button onClick={() => void handleCopy()}>
          <Copy aria-hidden="true" />
          Copy
        </Button>
        <Button variant="secondary" onClick={handleDownload}>
          <Download aria-hidden="true" />
          Download .txt
        </Button>
      </div>

      <div className="mx-5 mb-5 mt-5 flex items-start gap-2.5 rounded-field border border-warn/25 bg-warn-soft px-3.5 py-3 sm:mx-6">
        <ShieldAlert aria-hidden="true" className="mt-px size-4 shrink-0 text-warn" strokeWidth={2} />
        <p className="text-small text-ink-2">
          <span className="font-medium text-ink">This is the only copy.</span> It&apos;s gone from the server, so refreshing
          or closing this tab loses it.
        </p>
      </div>
    </Panel>
  );
}
