"use client";

import * as React from "react";
import { cn } from "./utils";

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  /** Radio group name. Generated when omitted. */
  name?: string;
  size?: "sm" | "md";
  /** Stretch options to fill the row. */
  fullWidth?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

/**
 * A set of mutually exclusive options. Native radios underneath, so arrow keys,
 * form semantics and screen readers work without extra code.
 */
export function Segmented<T extends string = string>({
  value,
  onChange,
  options,
  name,
  size = "md",
  fullWidth,
  disabled,
  id,
  className,
  ...aria
}: SegmentedProps<T>) {
  const generated = React.useId();
  const groupName = name ?? `seg-${generated}`;

  return (
    <div
      id={id}
      role="radiogroup"
      {...aria}
      className={cn(
        "inline-flex max-w-full gap-0.5 overflow-x-auto rounded-field border border-line bg-surface-2/70 p-[3px] no-scrollbar",
        fullWidth ? "flex w-full" : "w-fit",
        className
      )}
    >
      {options.map((option) => {
        const checked = option.value === value;
        const isDisabled = disabled || option.disabled;
        return (
          <label
            key={option.value}
            className={cn(
              "relative flex min-w-0 cursor-pointer",
              fullWidth && "flex-1",
              isDisabled && "cursor-not-allowed opacity-50"
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={checked}
              disabled={isDisabled}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] font-medium transition-[background-color,color,box-shadow] duration-150 ease-seal [&_svg]:size-[15px] [&_svg]:shrink-0",
                size === "sm" ? "h-7 px-2.5 text-meta" : "h-8 px-3 text-small",
                "text-ink-3 hover:text-ink",
                "peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-[0_1px_2px_rgb(0_0_0/0.08),0_0_0_1px_rgb(var(--line))]",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-seal/45"
              )}
            >
              {option.icon}
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
}
