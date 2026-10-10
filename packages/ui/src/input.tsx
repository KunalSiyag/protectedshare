import * as React from "react";
import { cn } from "./utils";

/** Shared look for text-like controls. Exported so custom controls can match. */
export const fieldClasses =
  "focus-ring w-full rounded-field border border-line-strong bg-surface text-ui text-ink " +
  "shadow-[inset_0_1px_1px_rgb(0_0_0/0.02)] placeholder:text-ink-3/80 " +
  "transition-[border-color,box-shadow] duration-150 ease-seal " +
  "hover:border-ink-3/50 focus-visible:outline-none focus-visible:border-ink-3 focus-visible:ring-[3px] focus-visible:ring-seal/20 " +
  "aria-[invalid=true]:border-danger/70 aria-[invalid=true]:focus-visible:ring-danger/20 " +
  "disabled:cursor-not-allowed disabled:bg-surface-2 disabled:opacity-60 [&[readonly]]:bg-surface-2/50";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Use the mono face (keys, IDs, tokens, URLs). */
  mono?: boolean;
  /** Marks the field invalid (also settable via aria-invalid). */
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", mono, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || props["aria-invalid"] || undefined}
        className={cn(
          fieldClasses,
          "h-10 px-3 file:mr-3 file:border-0 file:bg-transparent file:text-small file:font-medium file:text-ink",
          mono && "font-mono text-small tracking-tight",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
