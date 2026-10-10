"use client";

import * as React from "react";
import { cn } from "./utils";

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Visible label. Without it, pass aria-label. */
  label?: React.ReactNode;
  description?: React.ReactNode;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, label, description, disabled, className, id, ...props }, ref) => {
    const generated = React.useId();
    const controlId = id ?? `switch-${generated}`;
    const descriptionId = description ? `${controlId}-desc` : undefined;

    const control = (
      <button
        ref={ref}
        id={controlId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={descriptionId}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "focus-ring relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-150 ease-seal",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "border-ink bg-ink" : "border-line-strong bg-surface-2",
          !label && className
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block size-4 rounded-full shadow-[0_1px_2px_rgb(0_0_0/0.2)] transition-transform duration-150 ease-seal",
            checked ? "translate-x-[17px] bg-on-ink" : "translate-x-[1px] bg-surface"
          )}
        />
      </button>
    );

    if (!label) return control;

    return (
      <div className={cn("flex items-start justify-between gap-4", className)}>
        <div className="min-w-0">
          <label htmlFor={controlId} className="cursor-pointer text-small font-medium text-ink">
            {label}
          </label>
          {description ? (
            <p id={descriptionId} className="mt-0.5 text-small text-ink-3">
              {description}
            </p>
          ) : null}
        </div>
        <div className="pt-px">{control}</div>
      </div>
    );
  }
);
Switch.displayName = "Switch";
