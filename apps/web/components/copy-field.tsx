"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { cn } from "@protectedshare/ui";
import { copyText } from "../lib/clipboard";

export type CopyFieldProps = {
  value: string;
  /** Visible label above the field. */
  label?: string;
  /** Short text under the field. */
  hint?: React.ReactNode;
  /** md (40px) or lg (52px, for the main share link). */
  size?: "md" | "lg";
  /** Mono face. Default true (links, keys, tokens). */
  mono?: boolean;
  /** Mask the value with a reveal toggle (passwords). Copy still copies the real value. */
  secret?: boolean;
  /** Button text. Default "Copy". */
  copyLabel?: string;
  onCopy?: () => void;
  id?: string;
  className?: string;
};

/** Read-only value with a copy button and a "Copied" state. Selecting the field selects all. */
export default function CopyField({
  value,
  label,
  hint,
  size = "md",
  mono = true,
  secret = false,
  copyLabel = "Copy",
  onCopy,
  id,
  className,
}: CopyFieldProps) {
  const generated = useId();
  const fieldId = id ?? `copy-${generated}`;
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const [revealed, setRevealed] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const handleCopy = async () => {
    const ok = await copyText(value);
    setCopied(ok ? "copied" : "failed");
    if (ok) onCopy?.();
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied("idle"), 1800);
  };

  const masked = secret && !revealed;
  const lg = size === "lg";

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={fieldId} className="text-small font-medium text-ink">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "group flex min-w-0 items-center gap-1 rounded-field border border-line-strong bg-surface-2/50 pl-3 pr-1 transition-[border-color,box-shadow] duration-150 focus-within:border-ink-3 focus-within:ring-[3px] focus-within:ring-seal/20",
          lg ? "h-[52px] pr-1.5" : "h-10"
        )}
      >
        <input
          id={fieldId}
          readOnly
          value={masked ? "•".repeat(Math.min(Math.max(value.length, 8), 28)) : value}
          aria-label={label ? undefined : "Value to copy"}
          aria-describedby={hint ? `${fieldId}-hint` : undefined}
          onFocus={(event) => event.currentTarget.select()}
          spellCheck={false}
          className={cn(
            "min-w-0 flex-1 truncate bg-transparent text-ink outline-none",
            mono ? "font-mono tracking-[-0.01em]" : "",
            lg ? "text-[14px]" : "text-small",
            masked && "tracking-[0.12em]"
          )}
        />
        {secret ? (
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            aria-label={revealed ? "Hide value" : "Show value"}
            aria-pressed={revealed}
            className="flex size-8 shrink-0 items-center justify-center rounded-control text-ink-3 outline-none transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
          >
            {revealed ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-control font-medium outline-none transition-[background-color,color] duration-150 focus-visible:ring-2 focus-visible:ring-seal/45 focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
            lg ? "h-10 min-w-[96px] px-3.5 text-small" : "h-8 min-w-[80px] px-2.5 text-small",
            copied === "copied" ? "bg-ok-soft text-ok" : "bg-ink text-on-ink hover:bg-ink/[0.86]"
          )}
        >
          {copied === "copied" ? (
            <Check aria-hidden="true" className="size-4 animate-fade-in" strokeWidth={2.25} />
          ) : (
            <Copy aria-hidden="true" className="size-[15px]" />
          )}
          {copied === "copied" ? "Copied" : copied === "failed" ? "Select" : copyLabel}
        </button>
      </div>
      <span aria-live="polite" className="sr-only">
        {copied === "copied" ? "Copied to clipboard" : copied === "failed" ? "Copy failed. Select the text and copy it manually." : ""}
      </span>
      {hint ? (
        <p id={`${fieldId}-hint`} className="text-small text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
