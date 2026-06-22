import * as React from "react";
import { cn } from "./utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 px-3.5 py-2 text-sm shadow-sm placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/10 dark:focus-visible:ring-emerald-500/15 focus-visible:border-blue-500 dark:focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
