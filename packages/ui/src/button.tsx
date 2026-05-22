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
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 dark:focus-visible:ring-zinc-300 disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2",
          {
            "bg-blue-600 hover:bg-blue-700 text-white dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90": variant === "default",
            "border border-zinc-300 hover:bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:bg-transparent dark:hover:bg-zinc-800 dark:text-zinc-100": variant === "outline",
            "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 text-zinc-700 dark:text-zinc-300": variant === "ghost",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
