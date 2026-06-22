import * as React from "react";
import { cn } from "./utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-[1.008] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/20 dark:focus-visible:ring-zinc-400/20 disabled:pointer-events-none disabled:opacity-50 disabled:hover:scale-100 disabled:active:scale-100 h-10 px-4 py-2 shadow-sm",
          {
            "bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200/95": variant === "default",
            "border border-zinc-200 hover:bg-zinc-50 text-zinc-900 dark:border-zinc-800 dark:bg-transparent dark:hover:bg-zinc-900/60 dark:text-zinc-100": variant === "outline",
            "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50 text-zinc-700 dark:text-zinc-300": variant === "ghost",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
