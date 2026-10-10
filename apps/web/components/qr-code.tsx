"use client";

import { useMemo } from "react";
import { encode } from "uqr";
import { cn } from "@protectedshare/ui";

export type QrCodeProps = {
  value: string;
  /** Rendered size in px. Default 176. */
  size?: number;
  /** Accessible name. Default "QR code for the share link". */
  label?: string;
  /** Error correction. Default "M". */
  ecc?: "L" | "M" | "Q" | "H";
  className?: string;
};

/**
 * Inline-SVG QR code. Modules are drawn in currentColor. The tile stays dark-on-white in both
 * themes on purpose: many phone scanners fail on inverted (light-on-dark) codes.
 */
export default function QrCode({ value, size = 176, label = "QR code for the share link", ecc = "M", className }: QrCodeProps) {
  const { path, count } = useMemo(() => {
    const result = encode(value, { ecc, border: 0 });
    let d = "";
    result.data.forEach((row, y) => {
      let x = 0;
      while (x < row.length) {
        if (!row[x]) {
          x += 1;
          continue;
        }
        const start = x;
        while (x < row.length && row[x]) x += 1;
        d += `M${start} ${y}h${x - start}v1h-${x - start}z`;
      }
    });
    return { path: d, count: result.size };
  }, [value, ecc]);

  return (
    <div
      className={cn("inline-flex rounded-[12px] border border-line bg-white p-4 text-[#0A0F0F]", className)}
      style={{ width: size + 34, height: size + 34 }}
    >
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${count} ${count}`}
        width={size}
        height={size}
        shapeRendering="crispEdges"
      >
        <title>{label}</title>
        <path d={path} fill="currentColor" />
      </svg>
    </div>
  );
}
