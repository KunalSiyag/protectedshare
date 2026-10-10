import * as React from "react";
import { cn } from "./utils";

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  /** Pixel size. Defaults to 16. */
  size?: number;
  /** Accessible label. When omitted the spinner is decorative (aria-hidden). */
  label?: string;
}

export function Spinner({ size = 16, label, className, ...props }: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0 animate-spin [animation-duration:900ms]", className)}
      {...props}
    >
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
      <path d="M14.25 8A6.25 6.25 0 0 0 8 1.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
