import * as React from "react";
import { cn } from "./utils";

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line-strong bg-surface px-1 font-mono text-[11px] font-medium leading-none text-ink-3 shadow-[0_1px_0_rgb(var(--line-strong))]",
        className
      )}
      {...props}
    />
  );
}
