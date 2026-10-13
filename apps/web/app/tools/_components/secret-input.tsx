"use client";

import type { KeyboardEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input, cn } from "@protectedshare/ui";

/**
 * A password-style input with a show/hide button. The parent owns `show` so other views of the
 * same value (a payload preview, a breakdown) can follow it. Password managers are told to stay out.
 */
export default function SecretInput({
  id,
  value,
  onChange,
  show,
  onToggle,
  label = "password",
  placeholder,
  describedBy,
  invalid,
  autoComplete = "off",
  onKeyDown,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  /** Lowercase noun for the toggle's accessible name: "Show password", "Show secret". */
  label?: string;
  placeholder?: string;
  describedBy?: string;
  invalid?: boolean;
  autoComplete?: string;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        type={show ? "text" : "password"}
        mono
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        autoComplete={autoComplete}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder}
        aria-describedby={describedBy}
        invalid={invalid}
        className="pr-11"
        data-lpignore="true"
        data-1p-ignore="true"
        data-bwignore="true"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? `Hide ${label}` : `Show ${label}`}
        aria-pressed={show}
        className="absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-control text-ink-3 outline-none transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45"
      >
        {show ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
      </button>
    </div>
  );
}
