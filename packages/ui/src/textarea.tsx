import * as React from "react";
import { cn } from "./utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-transparent text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm shadow-sm placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 dark:focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-300",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
