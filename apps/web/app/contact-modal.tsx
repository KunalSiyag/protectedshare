"use client";

import { useEffect, useState } from "react";
import { CircleCheck, X } from "lucide-react";
import { Button, Field, Input, Textarea } from "@protectedshare/ui";
import { apiUrl } from "../lib/api";
import { describeRequestFailure, readApiError } from "../lib/feedback";
import ModalDialog from "../components/modal-dialog";
import AppLink from "../components/app-link";

type ContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setEmail("");
      setCompany("");
      setMessage("");
      setSentTo(null);
      setError(null);
      setEmailError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canSubmit = Boolean(name.trim() && email.trim() && message.trim());

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError("Enter a valid email so we can reply.");
      return;
    }

    setLoading(true);
    setError(null);
    setEmailError(null);

    try {
      const res = await fetch(apiUrl("/api/inquiries"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: trimmedEmail,
          company: company.trim() || undefined,
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error(await readApiError(res, "Could not send your message. Try again in a moment."));
      }

      setSentTo(trimmedEmail);
    } catch (caughtError: unknown) {
      setError(describeRequestFailure(caughtError, "Could not send your message. Try again in a moment."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalDialog
      titleId="contact-dialog-title"
      descriptionId="contact-dialog-description"
      focusToken={sentTo ? "success" : "form"}
      onClose={onClose}
      panelClassName="relative w-full max-w-[520px] max-h-[calc(100dvh-2rem)] animate-rise overflow-y-auto rounded-panel border border-line bg-surface shadow-float"
    >
      <button
        type="button"
        onClick={onClose}
        className="focus-ring absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-control text-ink-3 transition-colors duration-150 hover:bg-ink/[0.05] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal/45"
        aria-label="Close"
      >
        <X aria-hidden="true" className="size-4" />
      </button>

      {!sentTo ? (
        <form onSubmit={handleSubmit} noValidate>
          <div className="border-b border-line px-5 pb-4 pt-5 pr-12">
            <p className="eyebrow">Contact</p>
            <h2 id="contact-dialog-title" className="mt-2 text-[20px] font-semibold leading-7 tracking-[-0.02em] text-ink">
              Write to us
            </h2>
            <p id="contact-dialog-description" className="mt-1.5 text-small text-ink-3">
              Questions, bug reports, or a dedicated instance for your team. We reply by email.
            </p>
          </div>

          <div className="flex flex-col gap-4 px-5 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="inquiry-name">
                <Input
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                />
              </Field>
              <Field label="Email" htmlFor="inquiry-email" error={emailError}>
                <Input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  invalid={Boolean(emailError)}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (emailError) setEmailError(null);
                  }}
                />
              </Field>
            </div>

            <Field label="Company" htmlFor="inquiry-company" optional>
              <Input
                name="company"
                type="text"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                autoComplete="organization"
              />
            </Field>

            <Field label="Message" htmlFor="inquiry-message" hint="Don't paste secrets here. This form is not encrypted end to end.">
              <Textarea
                name="message"
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                className="resize-y"
              />
            </Field>

            {error ? (
              <p role="alert" className="rounded-field bg-danger-soft px-3 py-2.5 text-small text-danger">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 rounded-b-panel border-t border-line bg-surface-2/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-meta text-ink-3">
              We store what you send here to reply.{" "}
              <AppLink href="/privacy#contact" className="underline decoration-line-strong underline-offset-2 hover:text-ink" onClick={onClose}>
                Privacy
              </AppLink>
            </p>
            <Button type="submit" size="sm" loading={loading} disabled={!canSubmit}>
              Send message
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col items-center px-6 py-10 text-center" role="status">
          <span className="flex size-10 items-center justify-center rounded-full bg-ok-soft text-ok">
            <CircleCheck aria-hidden="true" className="size-5" strokeWidth={1.75} />
          </span>
          <h2 id="contact-dialog-title" className="mt-4 text-[17px] font-semibold tracking-[-0.01em] text-ink">
            Message sent
          </h2>
          <p id="contact-dialog-description" className="mt-1.5 max-w-[36ch] text-small text-ink-3">
            We&apos;ll reply to <span className="font-medium text-ink-2">{sentTo}</span>.
          </p>
          <Button variant="secondary" size="sm" className="mt-6" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </ModalDialog>
  );
}
