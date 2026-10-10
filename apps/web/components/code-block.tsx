"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@protectedshare/ui";
import { copyText } from "../lib/clipboard";

/** Mono code on surface-2 with an optional label and a copy button. */
export default function CodeBlock({
  code,
  label,
  className,
  copy = true,
}: {
  code: string;
  /** Small caption in the top bar, e.g. "Terminal" or a file name. */
  label?: string;
  className?: string;
  copy?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <div className={cn("overflow-hidden rounded-field border border-line bg-surface-2/70", className)}>
      {label || copy ? (
        <div className="flex h-9 items-center justify-between gap-3 border-b border-line pl-3.5 pr-1.5">
          <span className="truncate text-meta font-medium text-ink-3">{label}</span>
          {copy ? (
            <button
              type="button"
              onClick={async () => setCopied(await copyText(code))}
              className="focus-ring inline-flex h-7 items-center gap-1.5 rounded-control px-2 text-meta font-medium text-ink-2 transition-colors duration-150 hover:bg-ink/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-seal/45"
            >
              {copied ? (
                <Check aria-hidden="true" className="size-3.5 text-ok" />
              ) : (
                <Copy aria-hidden="true" className="size-3.5" />
              )}
              <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
            </button>
          ) : null}
        </div>
      ) : null}
      <pre className="overflow-x-auto px-3.5 py-3 font-mono text-[12.5px] leading-[20px] text-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}
