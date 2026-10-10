import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@protectedshare/ui";

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  /** Buttons or links. */
  action?: ReactNode;
  /** Tighter padding for use inside panels. */
  compact?: boolean;
  className?: string;
};

export default function EmptyState({ icon: Icon, title, description, action, compact, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "px-4 py-8" : "rounded-panel border border-dashed border-line-strong px-6 py-14",
        className
      )}
    >
      {Icon ? (
        <span className="mb-4 flex size-10 items-center justify-center rounded-[10px] border border-line bg-surface text-ink-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
          <Icon aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
        </span>
      ) : null}
      <h2 className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink">{title}</h2>
      {description ? <p className="mt-1.5 max-w-[42ch] text-small text-ink-3">{description}</p> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
