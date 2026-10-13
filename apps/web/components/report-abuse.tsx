"use client";

import { useState } from "react";
import { CircleCheck, Flag, KeyRound, X } from "lucide-react";
import { type CreateReportRequest, type ReportReason, type ShareKind } from "@protectedshare/contracts";
import { MAX_REPORT_DETAILS_CHARS, containsLinkKey } from "@protectedshare/contracts/constants";
import { Button, Field, Input, Select, Textarea, cn } from "@protectedshare/ui";
import ModalDialog from "./modal-dialog";
import { apiUrl } from "../lib/api";
import { describeRequestFailure, readApiError } from "../lib/feedback";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "phishing", label: "Phishing or a scam" },
  { value: "malware", label: "Malware or a harmful file" },
  { value: "illegal", label: "Illegal content" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Something else" },
];

const NOUN: Record<ShareKind, string> = { note: "note", secret: "secret", drop: "file drop", request: "request" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const KEY_WARNING = "Remove the link's key (the part after #). This form already knows which link it is.";

type ReportAbuseProps = {
  kind: ShareKind;
  /** The share id from the page route. The form never reads the address bar or its #fragment. */
  id: string;
  className?: string;
};

/** A quiet "Report abuse" link for recipient pages, opening a short report form. */
export default function ReportAbuse({ kind, id, className }: ReportAbuseProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 self-start rounded-control text-meta text-ink-3 underline-offset-4 outline-none transition-colors hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-seal/45",
          className
        )}
      >
        <Flag aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
        Report abuse
      </button>
      {open ? <ReportDialog kind={kind} id={id} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function ReportDialog({ kind, id, onClose }: { kind: ShareKind; id: string; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [details, setDetails] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const noun = NOUN[kind];
  const detailsHasKey = containsLinkKey(details);
  const contactHasKey = containsLinkKey(contact);
  const contactValue = contact.trim();
  const reasonError = submitted && !reason ? "Choose the closest reason." : null;
  const detailsError = detailsHasKey
    ? KEY_WARNING
    : details.length > MAX_REPORT_DETAILS_CHARS
      ? `Keep it under ${MAX_REPORT_DETAILS_CHARS} characters.`
      : null;
  const contactError = contactHasKey
    ? KEY_WARNING
    : submitted && contactValue && !EMAIL_PATTERN.test(contactValue)
      ? "Check the email address, or leave it empty."
      : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!reason || detailsError || contactHasKey || (contactValue && !EMAIL_PATTERN.test(contactValue))) return;

    setBusy(true);
    setError(null);
    const body: CreateReportRequest = {
      kind,
      id,
      reason,
      ...(details.trim() ? { details: details.trim() } : {}),
      ...(contactValue ? { contact: contactValue } : {}),
    };
    try {
      const response = await fetch(apiUrl("/api/reports"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Couldn't send the report. Try again in a moment."));
      }
      setSent(true);
    } catch (caught: unknown) {
      setError(describeRequestFailure(caught, "Couldn't send the report. Try again in a moment."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalDialog
      titleId="report-dialog-title"
      descriptionId="report-dialog-description"
      focusToken={sent ? "sent" : "form"}
      onClose={onClose}
      panelClassName="relative w-full max-w-[480px] max-h-[calc(100dvh-2rem)] animate-rise overflow-y-auto rounded-panel border border-line bg-surface shadow-float"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-control text-ink-3 transition-colors duration-150 hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal/45"
        aria-label="Close"
      >
        <X aria-hidden="true" className="size-4" />
      </button>

      {!sent ? (
        <form onSubmit={handleSubmit} noValidate>
          <div className="border-b border-line px-5 pb-4 pt-5 pr-12">
            <p className="eyebrow">Report abuse</p>
            <h2 id="report-dialog-title" className="mt-2 text-[20px] font-semibold leading-7 tracking-[-0.02em] text-ink">
              Report this {noun}
            </h2>
            <p id="report-dialog-description" className="mt-1.5 text-small text-ink-3">
              Tell us if this link is used for phishing, malware or anything illegal. We can&apos;t decrypt what&apos;s inside,
              so your description is what we go on. We can delete it from our server.
            </p>
          </div>

          <div className="flex flex-col gap-4 px-5 py-5">
            <Field label="Reason" htmlFor="report-reason" error={reasonError}>
              <Select
                value={reason}
                onChange={(event) => setReason(event.target.value as ReportReason | "")}
                invalid={Boolean(reasonError)}
                required
              >
                <option value="" disabled>
                  Choose a reason
                </option>
                {REASONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="What did you see?"
              htmlFor="report-details"
              optional
              error={detailsError}
              hint={
                <span className="flex justify-between gap-3">
                  <span>What it asked for or contained. Don&apos;t paste passwords.</span>
                  <span className="tabular shrink-0">
                    {details.length}/{MAX_REPORT_DETAILS_CHARS}
                  </span>
                </span>
              }
            >
              <Textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={4}
                maxLength={MAX_REPORT_DETAILS_CHARS + 50}
                invalid={Boolean(detailsError)}
                className="resize-y"
              />
            </Field>

            <Field
              label="Your email"
              htmlFor="report-contact"
              optional
              error={contactError}
              hint="Only if you're happy for us to ask a follow-up question."
            >
              <Input
                type="email"
                autoComplete="email"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                invalid={Boolean(contactError)}
              />
            </Field>

            <p className="flex items-start gap-2.5 rounded-field border border-line bg-surface-2/60 px-3.5 py-3 text-small text-ink-2">
              <KeyRound aria-hidden="true" className="mt-px size-4 shrink-0 text-ink-3" strokeWidth={1.75} />
              <span>
                Never include the link&apos;s key (the part after <span className="font-mono text-ink">#</span>). This form sends only the{" "}
                {noun}&apos;s ID, which isn&apos;t enough to open it.
              </span>
            </p>

            {error ? (
              <p role="alert" className="rounded-field bg-danger-soft px-3 py-2.5 text-small text-danger">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 rounded-b-panel border-t border-line bg-surface-2/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-meta text-ink-3">Reports are kept for 180 days.</p>
            <Button type="submit" size="sm" loading={busy}>
              Send report
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center px-6 py-10 text-center" role="status">
          <span className="flex size-10 items-center justify-center rounded-full bg-ok-soft text-ok">
            <CircleCheck aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </span>
          <h2 id="report-dialog-title" className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-ink">
            Report sent. Thank you.
          </h2>
          <p id="report-dialog-description" className="mt-1.5 max-w-[36ch] text-small text-ink-3">
            We review every report. If this {noun} breaks our terms, we delete it from the server.
          </p>
          <Button variant="secondary" size="sm" className="mt-6" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </ModalDialog>
  );
}
