"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Clock, Flame, Link2, Plus, QrCode as QrIcon } from "lucide-react";
import { Button, StatusChip, cn } from "@protectedshare/ui";
import AppLink from "./app-link";
import CopyField from "./copy-field";
import QrCode from "./qr-code";
import SealMark from "./seal-mark";
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
  const headingRef = useRef<HTMLHeadingElement>(null);
  const qrId = useId();

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: false });
  }, []);

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
          {showQr ? (
            <div id={qrId} className="mt-4 flex animate-fade-in flex-col items-start gap-2 sm:flex-row sm:items-end sm:gap-4">
              <QrCode value={url} size={168} />
              <p className="max-w-[240px] text-small text-ink-3">
                Scan to open on another device. The code holds the full link{password ? "" : ", key included"}.
              </p>
            </div>
          ) : null}
        </div>

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
