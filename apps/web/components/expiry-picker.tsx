"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { Segmented, cn } from "@protectedshare/ui";
import {
  EXPIRY_PRESETS,
  MAX_SHARE_TTL_MS,
  MIN_SHARE_TTL_MS,
  resolveExpiresAt,
  toDatetimeLocal,
  type ExpiryChoice,
} from "../lib/share-window";

export type ExpiryPickerProps = {
  value: ExpiryChoice;
  onChange: (value: ExpiryChoice) => void;
  /** datetime-local string, used when value is "custom". */
  customValue: string;
  onCustomChange: (value: string) => void;
  error?: string;
  /** Default "Expires after". */
  label?: string;
  hint?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
};

const OPTIONS = [...EXPIRY_PRESETS.map((preset) => ({ value: preset.value, label: preset.label })), { value: "custom" as const, label: "Custom" }];

/** Presets (1 hour / 1 day / 7 days) plus a custom date up to 30 days out. Pair with `useExpiry`. */
export default function ExpiryPicker({
  value,
  onChange,
  customValue,
  onCustomChange,
  error,
  label = "Expires after",
  hint = "After this, the link stops working and the ciphertext is deleted.",
  disabled,
  id,
  className,
}: ExpiryPickerProps) {
  const generated = useId();
  const baseId = id ?? `expiry-${generated}`;
  const labelId = `${baseId}-label`;
  const customId = `${baseId}-custom`;
  const messageId = `${baseId}-msg`;

  const bounds = useMemo(() => {
    const now = Date.now();
    return { min: toDatetimeLocal(now + MIN_SHARE_TTL_MS), max: toDatetimeLocal(now + MAX_SHARE_TTL_MS) };
    // Recompute when switching to custom so the bounds are fresh.
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const select = (next: ExpiryChoice) => {
    if (next === "custom" && !customValue) onCustomChange(toDatetimeLocal(Date.now() + 2 * 86_400_000));
    onChange(next);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span id={labelId} className="text-small font-medium text-ink">
        {label}
      </span>
      <Segmented
        value={value}
        onChange={select}
        options={OPTIONS}
        disabled={disabled}
        aria-labelledby={labelId}
        aria-describedby={messageId}
        fullWidth
      />
      {value === "custom" ? (
        <div className="mt-1 animate-fade-in">
          <label htmlFor={customId} className="sr-only">
            Custom expiry date and time
          </label>
          <input
            id={customId}
            type="datetime-local"
            value={customValue}
            min={bounds.min}
            max={bounds.max}
            disabled={disabled}
            onChange={(event) => onCustomChange(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={messageId}
            className={cn(
              "focus-ring tabular h-10 w-full rounded-field border border-line-strong bg-surface px-3 text-ui text-ink outline-none transition-[border-color,box-shadow] duration-150",
              "hover:border-ink-3/50 focus-visible:border-ink-3 focus-visible:ring-[3px] focus-visible:ring-seal/20",
              error && "border-danger/70"
            )}
          />
        </div>
      ) : null}
      <p id={messageId} className={cn("text-small", error ? "text-danger" : "text-ink-3")} role={error ? "alert" : undefined}>
        {error ?? (value === "custom" ? "Pick a time between 5 minutes and 30 days from now." : hint)}
      </p>
    </div>
  );
}

/** State for ExpiryPicker. `resolve()` returns `{ expiresAt }` or `{ error }` (and shows the error). */
export function useExpiry(initial: ExpiryChoice = "86400") {
  const [choice, setChoice] = useState<ExpiryChoice>(initial);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | undefined>();

  const resolve = useCallback(() => {
    const result = resolveExpiresAt(choice, custom);
    setError("error" in result ? result.error : undefined);
    return result;
  }, [choice, custom]);

  const pickerProps: Pick<ExpiryPickerProps, "value" | "onChange" | "customValue" | "onCustomChange" | "error"> = {
    value: choice,
    onChange: (next) => {
      setChoice(next);
      setError(undefined);
    },
    customValue: custom,
    onCustomChange: (next) => {
      setCustom(next);
      setError(undefined);
    },
    error,
  };

  return { choice, setChoice, custom, setCustom, error, resolve, pickerProps };
}
