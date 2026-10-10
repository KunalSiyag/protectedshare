import type { SVGAttributes } from "react";

/** Scalloped wax-seal outline, 16 lobes on a 24px grid. */
export const SEAL_PATH =
  "M12 1.8A2.25 2.25 0 0 1 15.9 2.58A2.25 2.25 0 0 1 19.21 4.79A2.25 2.25 0 0 1 21.42 8.1A2.25 2.25 0 0 1 22.2 12A2.25 2.25 0 0 1 21.42 15.9A2.25 2.25 0 0 1 19.21 19.21A2.25 2.25 0 0 1 15.9 21.42A2.25 2.25 0 0 1 12 22.2A2.25 2.25 0 0 1 8.1 21.42A2.25 2.25 0 0 1 4.79 19.21A2.25 2.25 0 0 1 2.58 15.9A2.25 2.25 0 0 1 1.8 12A2.25 2.25 0 0 1 2.58 8.1A2.25 2.25 0 0 1 4.79 4.79A2.25 2.25 0 0 1 8.1 2.58A2.25 2.25 0 0 1 12 1.8Z";

/** Keyhole pressed into the seal. */
export const KEYHOLE_PATH = "M12 7.55a2.35 2.35 0 0 0-1.2 4.37l-.62 3.88a.6.6 0 0 0 .6.7h2.44a.6.6 0 0 0 .6-.7l-.62-3.88A2.35 2.35 0 0 0 12 7.55Z";

export interface SealMarkProps extends Omit<SVGAttributes<SVGSVGElement>, "children"> {
  /** Pixel size. Defaults to 24. */
  size?: number;
  /** Accessible name. When omitted the mark is decorative. */
  title?: string;
}

/**
 * The ProtectedShare mark: a vermilion seal with a keyhole. Uses the `--seal` token,
 * so it follows the theme. One of the few places the seal color is allowed.
 */
export default function SealMark({ size = 24, title, className, ...props }: SealMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
      {...props}
    >
      <path d={SEAL_PATH} fill="rgb(var(--seal))" />
      <circle cx="12" cy="12" r="7.6" fill="none" stroke="#fff" strokeOpacity="0.38" strokeWidth="0.75" />
      <path d={KEYHOLE_PATH} fill="#fff" />
    </svg>
  );
}
