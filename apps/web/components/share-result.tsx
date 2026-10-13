"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Bell, Clock, Flame, Link2, Plus, QrCode as QrIcon, Share } from "lucide-react";
import { Button, StatusChip, Switch, cn } from "@protectedshare/ui";
import AppLink from "./app-link";
import CopyField from "./copy-field";
import QrCode from "./qr-code";
import SealMark from "./seal-mark";
import { useMyLinks } from "../lib/my-links";
import {
  shareFromUrl,
  unwatchLink,
  usePushAvailability,
  useWatchedKeys,
  watchKey,
  watchLink,
  type WatchResult,
} from "../lib/push";
import { formatShareDeadline } from "../lib/share-window";

export type ShareResultProps = {
  url: string;
  /** Shown as a separate, masked field when the password is not in the link. */
  password?: string;
  /** Overrides the guidance under the password field. */
  passwordHint?: string;
  /** ms timestamp. */
  expiresAt?: number;
  /** e.g. "Burns after first read" or "3 reads left". */
  burnLabel?: string;
  onReset: () => void;
  /** Shows "Saved to My links on this device". */
  savedToLinks?: boolean;
  /** Default "Sealed. Your link is ready." */
  title?: string;
  /** One line under the title. */
  description?: string;
  /** Default "Create another". */
  resetLabel?: string;
  /** Extra content (e.g. a revoke button) above the footer. */
  children?: React.ReactNode;
  className?: string;
};

const OPENED_VERB = { note: "opened", secret: "opened", drop: "downloaded", request: "answered" } as const;

const WATCH_PROBLEMS: Record<Exclude<WatchResult, "on">, string> = {
  denied: "Notifications are blocked for this site. Allow them in your browser's site settings, then try again.",
  closed: "This link is already used up or expired, so there's nothing left to watch.",
  limit: "This link already notifies 5 browsers, the most it can.",
  unavailable: "This browser can't show notifications.",
  failed: "Your browser couldn't set up notifications. Try again in a moment.",
};

/** "Notify me when it's opened": a Web Push from this browser's push service, no account. */
function NotifyToggle({ url }: { url: string }) {
  const availability = usePushAvailability();
  const links = useMyLinks();
  const watched = useWatchedKeys();
  const share = useMemo(() => shareFromUrl(url), [url]);
  const link = share ? links.find((item) => item.kind === share.kind && item.id === share.id) : undefined;
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  if (availability === "home-screen") {
    return (
      <p className="flex items-start gap-2.5 border-t border-line pt-4 text-small text-ink-3">
        <Bell aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
        <span>
          Want a notification when it&apos;s opened? On iPhone and iPad that works only in the Home Screen app: tap Share, then
          Add to Home Screen, and create your links from there.
        </span>
      </p>
    );
  }
  // Needs Web Push, a configured server key, and this link in My links (its manage token).
  if (availability !== "available" || !link) return null;

  const verb = OPENED_VERB[link.kind];
  const on = watched?.has(watchKey(link.kind, link.id)) ?? false;

  const toggle = async (next: boolean) => {
    setBusy(true);
    setProblem(null);
    if (next) {
      const result = await watchLink(link);
      if (result !== "on") setProblem(WATCH_PROBLEMS[result]);
    } else if (!(await unwatchLink(link))) {
      setProblem("Couldn't reach the server, so notifications are still on. Try again.");
    }
    setBusy(false);
  };

  return (
    <div className="border-t border-line pt-4">
      <Switch
        checked={on}
        disabled={busy || watched === null}
        aria-busy={busy || undefined}
        onCheckedChange={(next) => void toggle(next)}
        label={
          <span className="inline-flex items-center gap-1.5">
            <Bell aria-hidden="true" className="size-3.5 text-ink-3" />
            Notify me when it&apos;s {verb}
          </span>
        }
        description="Delivered by your browser's push service. We keep the push address until the link is used up or expires."
      />
      <p aria-live="polite" className={cn("text-small", problem ? "mt-2 text-danger" : "sr-only")}>
        {problem ?? (on ? `Notifications on. You'll hear when it's ${verb}.` : "")}
      </p>
    </div>
  );
}

/** The "sealed" moment after a share is created: link, optional password, QR, deadline. */
export default function ShareResult({
  url,
  password,
  passwordHint,
  expiresAt,
  burnLabel,
  onReset,
  savedToLinks,
  title = "Sealed. Your link is ready.",
  description,
  resetLabel = "Create another",
  children,
  className,
}: ShareResultProps) {
  const [showQr, setShowQr] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const [shareFailed, setShareFailed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const qrId = useId();

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: false });
  }, []);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function" && (typeof navigator.canShare !== "function" || navigator.canShare({ url })));
    // No service worker here: it's registered only when notifications are turned on (watchLink) or
    // by the installed app (components/standalone-sw.tsx).
  }, [url]);

  /** The system share sheet gets the link only, never a password shown separately. */
  const shareLink = async () => {
    setShareFailed(false);
    try {
      await navigator.share({ url });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setShareFailed(true);
    }
  };

  const subtitle =
    description ??
    (password
      ? "The link alone can't open it. They'll also need the password."
      : "Anyone with this link can open it until it expires or burns.");

  return (
    <section
      aria-labelledby={`${qrId}-title`}
      className={cn("animate-rise overflow-hidden rounded-panel border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.03)]", className)}
    >
      <div className="flex items-start gap-4 px-5 pb-5 pt-6 sm:px-6">
        <span className="relative mt-0.5 flex size-11 shrink-0 items-center justify-center">
          <span aria-hidden="true" className="absolute inset-0 animate-ring rounded-full border border-seal/50" />
          <SealMark size={44} className="animate-stamp" />
        </span>
        <div className="min-w-0">
          <h2
            id={`${qrId}-title`}
            ref={headingRef}
            tabIndex={-1}
            className="text-h3 text-ink outline-none"
          >
            {title}
          </h2>
          <p className="mt-1 text-ui text-ink-3">{subtitle}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <StatusChip tone="seal">Encrypted in this browser</StatusChip>
            {expiresAt ? (
              <StatusChip tone="neutral" icon={<Clock aria-hidden="true" />}>
                Expires {formatShareDeadline(expiresAt)}
              </StatusChip>
            ) : null}
            {burnLabel ? (
              <StatusChip tone="seal" icon={<Flame aria-hidden="true" />}>
                {burnLabel}
              </StatusChip>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5 border-t border-line px-5 py-5 sm:px-6">
        <CopyField value={url} label="Share link" size="lg" />

        {password ? (
          <CopyField
            value={password}
            label="Password"
            secret
            hint={passwordHint ?? "Send this through a different channel than the link, like a call or another app."}
          />
        ) : null}

        <div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              aria-expanded={showQr}
              aria-controls={qrId}
              onClick={() => setShowQr((value) => !value)}
            >
              <QrIcon aria-hidden="true" />
              {showQr ? "Hide QR code" : "Show QR code"}
            </Button>
            {canShare ? (
              <Button variant="secondary" size="sm" onClick={() => void shareLink()}>
                <Share aria-hidden="true" />
                Share…
              </Button>
            ) : null}
          </div>
          {shareFailed ? (
            <p role="status" className="mt-2 text-small text-ink-3">
              The share sheet didn&apos;t open. Copy the link instead.
            </p>
          ) : null}
          {showQr ? (
            <div id={qrId} className="mt-4 flex animate-fade-in flex-col items-start gap-2 sm:flex-row sm:items-end sm:gap-4">
              <QrCode value={url} size={168} />
              <p className="max-w-[240px] text-small text-ink-3">
                Scan to open on another device. The code holds the full link{password ? "" : ", key included"}.
              </p>
            </div>
          ) : null}
        </div>

        <NotifyToggle url={url} />

        {children}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line bg-surface-2/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        {savedToLinks ? (
          <p className="flex items-center gap-2 text-small text-ink-3">
            <Link2 aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
            <span>
              Saved to{" "}
              <AppLink href="/links" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                My links
              </AppLink>{" "}
              on this device only.
            </span>
          </p>
        ) : (
          <span className="text-small text-ink-3">Copy the link before you leave this page.</span>
        )}
        <Button variant="secondary" size="sm" onClick={onReset} className="self-start sm:self-auto">
          <Plus aria-hidden="true" />
          {resetLabel}
        </Button>
      </div>
    </section>
  );
}
