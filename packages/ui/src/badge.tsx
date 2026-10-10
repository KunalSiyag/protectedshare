import * as React from "react";
import { cn } from "./utils";

export type Tone = "neutral" | "seal" | "ok" | "warn" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-ink/[0.06] text-ink-2",
  seal: "bg-seal-soft text-seal",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
};

const dots: Record<Tone, string> = {
  neutral: "bg-ink-3",
  seal: "bg-seal",
  ok: "bg-ok",
  warn: "bg-warn",
  danger: "bg-danger",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Leading icon (e.g. a lucide icon). Sized to 12px. */
  icon?: React.ReactNode;
  /** Leading status dot. */
  dot?: boolean;
  /** Pulses the dot (live / waiting). Respects reduced motion. */
  pulse?: boolean;
}

/** Small rectangular label: counts, kinds, metadata. */
export function Badge({ tone = "neutral", icon, dot, pulse, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-[6px] px-1.5 text-meta font-medium [&_svg]:size-3 [&_svg]:shrink-0",
        tones[tone],
        className
      )}
      {...props}
    >
      {dot ? <StatusDot tone={tone} pulse={pulse} /> : icon}
      {children}
    </span>
  );
}

function StatusDot({ tone, pulse }: { tone: Tone; pulse?: boolean }) {
  return (
    <span aria-hidden="true" className="relative inline-flex size-1.5 shrink-0">
      {pulse ? <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", dots[tone])} /> : null}
      <span className={cn("relative inline-flex size-1.5 rounded-full", dots[tone])} />
    </span>
  );
}

/** Pill for a share's state: Sealed, Opened, Expired, Burned. Always pair color with text. */
export function StatusChip({ tone = "neutral", icon, dot = !icon, pulse, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-meta font-medium [&_svg]:size-3.5 [&_svg]:shrink-0",
        tones[tone],
        className
      )}
      {...props}
    >
      {dot ? <StatusDot tone={tone} pulse={pulse} /> : icon}
      {children}
    </span>
  );
}
