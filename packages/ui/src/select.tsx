import * as React from "react";
import { fieldClasses } from "./input";
import { cn } from "./utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  /** Optional option list; children also work. */
  options?: { value: string; label: string; disabled?: boolean }[];
}

/** Native select (best keyboard + mobile behavior) with the field look and a drawn chevron. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, options, children, ...props }, ref) => {
    return (
      <div className={cn("relative w-full", className)}>
        <select
          ref={ref}
          aria-invalid={invalid || props["aria-invalid"] || undefined}
          className={cn(fieldClasses, "h-10 cursor-pointer appearance-none pl-3 pr-9")}
          {...props}
        >
          {options?.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-3"
          fill="none"
        >
          <path d="m4.5 6.25 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
);
Select.displayName = "Select";
