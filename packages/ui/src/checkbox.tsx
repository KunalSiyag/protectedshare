import * as React from "react";
import { cn } from "./utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}

/** Native checkbox, restyled. Label and box share one hit target. */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, id, disabled, ...props }, ref) => {
    const generated = React.useId();
    const controlId = id ?? `cb-${generated}`;
    const descriptionId = description ? `${controlId}-desc` : undefined;

    const box = (
      <span className="relative inline-flex size-4 shrink-0">
        <input
          ref={ref}
          id={controlId}
          type="checkbox"
          disabled={disabled}
          aria-describedby={descriptionId}
          className={cn(
            "focus-ring peer size-4 cursor-pointer appearance-none rounded-[5px] border border-line-strong bg-surface transition-colors duration-150",
            "checked:border-ink checked:bg-ink hover:border-ink-3",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          {...props}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          fill="none"
          className="pointer-events-none absolute inset-0 hidden size-4 text-on-ink peer-checked:block"
        >
          <path d="m4.5 8.25 2.25 2.25 4.75-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );

    if (!label) return <span className={className}>{box}</span>;

    return (
      <label
        htmlFor={controlId}
        className={cn("flex cursor-pointer items-start gap-2.5", disabled && "cursor-not-allowed opacity-60", className)}
      >
        <span className="pt-[3px]">{box}</span>
        <span className="min-w-0">
          <span className="block text-small font-medium text-ink">{label}</span>
          {description ? (
            <span id={descriptionId} className="mt-0.5 block text-small text-ink-3">
              {description}
            </span>
          ) : null}
        </span>
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
