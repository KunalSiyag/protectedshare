import * as React from "react";
import { cn } from "./utils";

export interface FieldProps {
  label: React.ReactNode;
  /** id of the control. Hint and error get `${htmlFor}-hint` / `${htmlFor}-error` ids. */
  htmlFor: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Shows "Optional" next to the label. */
  optional?: boolean;
  /** Small control on the right of the label row (e.g. a "Generate" ghost button). */
  labelAction?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label + control + hint/error. If `children` is a single element, Field wires
 * `id`, `aria-describedby` and `aria-invalid` onto it.
 */
export function Field({ label, htmlFor, hint, error, optional, labelAction, className, children }: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  let control = children;
  if (React.isValidElement<Record<string, unknown>>(children)) {
    const existing = children.props["aria-describedby"] as string | undefined;
    control = React.cloneElement(children, {
      id: (children.props.id as string | undefined) ?? htmlFor,
      "aria-describedby": [existing, describedBy].filter(Boolean).join(" ") || undefined,
      "aria-invalid": error ? true : children.props["aria-invalid"],
    });
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex min-h-5 items-end justify-between gap-3">
        <label htmlFor={htmlFor} className="text-small font-medium text-ink">
          {label}
          {optional ? <span className="ml-1.5 font-normal text-ink-3">Optional</span> : null}
        </label>
        {labelAction}
      </div>
      {control}
      {error ? (
        <p id={errorId} className="flex items-start gap-1.5 text-small text-danger">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-px size-4 shrink-0" fill="none">
            <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.75v3.75M8 11h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={hintId} className="text-small text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
