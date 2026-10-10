import { cn } from "@protectedshare/ui";
import { OFFLINE_RATE, ONLINE_RATE, crackSeconds, formatDuration, type StrengthInfo } from "../_lib/strength";

const FILL: Record<StrengthInfo["tone"], string> = {
  danger: "bg-danger",
  warn: "bg-warn",
  ok: "bg-ok",
};

const TEXT: Record<StrengthInfo["tone"], string> = {
  danger: "text-danger",
  warn: "text-warn",
  ok: "text-ok",
};

/** Five-segment bar + label + bits. The label always carries the meaning; color only helps. */
export function StrengthMeter({
  info,
  approximate,
  className,
}: {
  info: StrengthInfo | null;
  /** Typed passwords: bits are an estimate, shown with "~". */
  approximate?: boolean;
  className?: string;
}) {
  const filled = info ? info.level + 1 : 0;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("text-small font-medium", info ? TEXT[info.tone] : "text-ink-3")} aria-live="polite">
          {info ? info.label : "No password yet"}
        </span>
        <span className="tabular font-mono text-meta text-ink-3">
          {info ? `${approximate ? "~" : ""}${Math.round(info.bits)} bits` : "0 bits"}
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 rounded-full transition-colors duration-200 ease-seal",
              info && index < filled ? FILL[info.tone] : "bg-ink/[0.08]"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** Two honest attack scenarios. Average time = half the keyspace. */
export function CrackTimes({ bits, className }: { bits: number | null; className?: string }) {
  const rows = [
    {
      label: "Offline, fast hash",
      rate: "10 billion/s",
      detail: "A leaked database hashed with MD5 or SHA-1, on a GPU rig.",
    },
    {
      label: "Online, against a login",
      rate: "10,000/s",
      detail: "A service that doesn't throttle wrong attempts well.",
    },
  ];
  return (
    <dl className={cn("divide-y divide-line", className)}>
      {rows.map((row, index) => (
        <div key={row.label} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
          <dt className="flex items-baseline justify-between gap-3 text-small text-ink-2">
            <span>{row.label}</span>
            <span className="tabular font-mono text-meta text-ink-3">{row.rate}</span>
          </dt>
          <dd className="text-ui font-medium text-ink">
            {bits === null ? "—" : formatDuration(crackSeconds(bits, index === 0 ? OFFLINE_RATE : ONLINE_RATE))}
          </dd>
          <dd className="text-meta text-ink-3">{row.detail}</dd>
        </div>
      ))}
    </dl>
  );
}
