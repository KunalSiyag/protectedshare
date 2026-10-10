"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { cn } from "@protectedshare/ui";

const track =
  "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full " +
  "[&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,rgb(var(--ink))_var(--fill),rgb(var(--ink)/0.1)_var(--fill))] " +
  "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-ink/10 " +
  "[&::-moz-range-progress]:h-1.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-ink";

const thumb =
  "[&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none " +
  "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-line-strong " +
  "[&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgb(0_0_0/0.18)] " +
  "[&::-webkit-slider-thumb]:transition-[box-shadow,transform] [&::-webkit-slider-thumb]:duration-150 " +
  "active:[&::-webkit-slider-thumb]:scale-110 " +
  "focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgb(var(--seal)/0.3)] " +
  "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border " +
  "[&::-moz-range-thumb]:border-line-strong [&::-moz-range-thumb]:bg-surface " +
  "focus-visible:[&::-moz-range-thumb]:shadow-[0_0_0_4px_rgb(var(--seal)/0.3)]";

/** Label, number input and slider for one integer setting. */
export default function RangeField({
  label,
  value,
  min,
  max,
  onChange,
  unit,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Visible unit after the number input, e.g. "characters". */
  unit?: string;
  hint?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  const fill = `${((value - min) / (max - min)) * 100}%`;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={`${id}-range`} className="text-small font-medium text-ink">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input
            id={`${id}-num`}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={draft}
            aria-label={`${label}, number`}
            onChange={(event) => {
              setDraft(event.target.value);
              const parsed = Number.parseInt(event.target.value, 10);
              if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) onChange(parsed);
            }}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit(event.currentTarget.value);
            }}
            className="tabular h-8 w-[64px] rounded-control border border-line-strong bg-surface px-2 text-center font-mono text-small text-ink outline-none transition-[border-color,box-shadow] duration-150 [appearance:textfield] hover:border-ink-3/50 focus-visible:border-ink-3 focus-visible:ring-[3px] focus-visible:ring-seal/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {unit ? <span className="w-[72px] text-small text-ink-3">{unit}</span> : null}
        </div>
      </div>
      <input
        id={`${id}-range`}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-valuetext={`${value}${unit ? ` ${unit}` : ""}`}
        style={{ "--fill": fill } as CSSProperties}
        className={cn("h-5 w-full cursor-pointer appearance-none bg-transparent outline-none", track, thumb)}
      />
      <div className="tabular -mt-1 flex justify-between font-mono text-[11px] text-ink-3" aria-hidden="true">
        <span>{min}</span>
        <span>{max}</span>
      </div>
      {hint ? <p className="text-small text-ink-3">{hint}</p> : null}
    </div>
  );
}
