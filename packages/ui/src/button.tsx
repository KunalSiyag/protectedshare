import * as React from "react";
import { Spinner } from "./spinner";
import { cn } from "./utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon-sm" | "icon";

/** Legacy names kept so older pages compile: default -> primary, outline -> secondary. */
type LegacyVariant = "default" | "outline";

const base =
  "focus-ring relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-seal " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal/45 focus-visible:ring-offset-2 focus-visible:ring-offset-bg " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-busy:pointer-events-none " +
  "[&_svg]:shrink-0";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-ink text-on-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] hover:bg-ink/[0.86] dark:shadow-none",
  secondary:
    "border border-line-strong bg-surface text-ink shadow-[0_1px_0_rgb(0_0_0/0.03)] hover:border-ink-3/60 hover:bg-surface-2/60",
  ghost: "text-ink-2 hover:bg-ink/[0.05] hover:text-ink",
  danger: "border border-danger/35 bg-surface text-danger hover:border-danger/60 hover:bg-danger-soft",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-control px-3 text-small [&_svg]:size-[15px]",
  md: "h-10 rounded-field px-4 text-ui [&_svg]:size-4",
  lg: "h-12 rounded-field px-5 text-[16px] [&_svg]:size-[18px]",
  "icon-sm": "size-8 rounded-control [&_svg]:size-4",
  icon: "size-10 rounded-field [&_svg]:size-[18px]",
};

export interface ButtonVariantOptions {
  variant?: ButtonVariant | LegacyVariant;
  size?: ButtonSize;
  className?: string;
}

function resolveVariant(variant: ButtonVariant | LegacyVariant = "primary"): ButtonVariant {
  if (variant === "default") return "primary";
  if (variant === "outline") return "secondary";
  return variant;
}

/** Class string for anything that should look like a Button (e.g. a Next <Link>). */
export function buttonVariants({ variant, size = "md", className }: ButtonVariantOptions = {}) {
  return cn(base, variants[resolveVariant(variant)], sizes[size], className);
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | LegacyVariant;
  size?: ButtonSize;
  /** Shows a spinner, sets aria-busy and blocks clicks. Keeps the label so width does not jump. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size = "md", loading = false, disabled, children, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        aria-busy={loading || undefined}
        className={buttonVariants({ variant, size, className })}
        {...props}
      >
        {loading ? (
          <>
            <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
              <Spinner size={size === "lg" ? 18 : 16} />
            </span>
            <span className="invisible inline-flex items-center justify-center gap-2">{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
