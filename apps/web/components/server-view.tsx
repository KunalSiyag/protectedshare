"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { ArrowUpRight, Eye, EyeOff, Info, Laptop } from "lucide-react";
import { cn } from "@protectedshare/ui";

export type ServerViewLocalItem = { label: string; value: string };

export type ServerViewProps = {
  /** The exact JSON body that will be sent. null before there is anything to send. */
  outgoing: object | null;
  /** Things that never leave the browser (key, password, plaintext length...). */
  localOnly: ServerViewLocalItem[];
  /** One plain-language line under the panel. */
  note?: ReactNode;
  /** e.g. "POST /api/notes". Shown under the title in mono. */
  endpoint?: string;
  /** Strings longer than this are middle-truncated. Default 32. */
  truncateAt?: number;
  /** Override the panel title. Default "What leaves this browser". */
  title?: string;
  /** Shown while `outgoing` is null. */
  emptyText?: ReactNode;
  className?: string;
};

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const HEAD = 14;
const TAIL = 8;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function StringValue({ value, truncateAt }: { value: string; truncateAt: number }) {
  if (value.length <= truncateAt) {
    return <span className="text-ink-2">&quot;{value}&quot;</span>;
  }
  const hidden = value.length - HEAD - TAIL;
  return (
    <span className="text-ink-2" title={`${value.length.toLocaleString()} characters`}>
      &quot;{value.slice(0, HEAD)}
      <span className="mx-0.5 inline-block whitespace-nowrap rounded-[4px] indent-0 bg-ink/[0.06] px-1 align-[1px] text-[10.5px] leading-[15px] text-ink-2">
        …{hidden.toLocaleString()} chars…
      </span>
      {value.slice(-TAIL)}&quot;
    </span>
  );
}

type Line = { depth: number; content: ReactNode[] };

const punct = (text: string, key?: string) => (
  <span key={key} className="text-ink-3">
    {text}
  </span>
);

/** Flattens JSON into display lines so wrapped values get a hanging indent. */
function buildLines(value: Json, depth: number, prefix: ReactNode[], comma: boolean, truncateAt: number, lines: Line[]) {
  const tail = comma ? [punct(",", "comma")] : [];
  if (value === null || typeof value !== "object") {
    let node: ReactNode;
    if (value === null) node = <span key="v" className="text-ink-3">null</span>;
    else if (typeof value === "string") node = <StringValue key="v" value={value} truncateAt={truncateAt} />;
    else node = <span key="v" className="font-medium text-ink">{String(value)}</span>;
    lines.push({ depth, content: [...prefix, node, ...tail] });
    return;
  }
  const isArray = Array.isArray(value);
  const entries: [string | null, Json][] = isArray
    ? (value as Json[]).map((item) => [null, item])
    : Object.entries(value as Record<string, Json>).filter(([, entry]) => entry !== undefined);
  const [open, close] = isArray ? ["[", "]"] : ["{", "}"];
  if (entries.length === 0) {
    lines.push({ depth, content: [...prefix, punct(open + close, "empty"), ...tail] });
    return;
  }
  lines.push({ depth, content: [...prefix, punct(open, "open")] });
  entries.forEach(([key, entry], index) => {
    const childPrefix: ReactNode[] =
      key === null
        ? []
        : [
            <span key="k" className="text-ink-3">
              &quot;{key}&quot;
            </span>,
            punct(": ", "colon"),
          ];
    buildLines(entry, depth + 1, childPrefix, index < entries.length - 1, truncateAt, lines);
  });
  lines.push({ depth, content: [punct(close, "close"), ...tail] });
}

function LocalRow({ item }: { item: ServerViewLocalItem }) {
  const [revealed, setRevealed] = useState(false);
  const id = useId();
  const empty = item.value.length === 0;
  return (
    <li className="flex min-h-9 items-center gap-3 py-1.5">
      <span id={id} className="w-[38%] shrink-0 text-small text-ink-2">
        {item.label}
      </span>
      <span
        aria-labelledby={id}
        className={cn(
          "min-w-0 flex-1 truncate text-right font-mono text-[12px]",
          empty ? "text-ink-3" : revealed ? "text-ink" : "text-[13px] tracking-[0.02em] text-ink-3"
        )}
      >
        {empty ? "—" : revealed ? item.value : "•".repeat(Math.min(item.value.length, 14))}
      </span>
      <button
        type="button"
        disabled={empty}
        onClick={() => setRevealed((value) => !value)}
        aria-pressed={revealed}
        aria-label={`${revealed ? "Hide" : "Show"} ${item.label}`}
        className="-mr-1.5 flex size-7 shrink-0 items-center justify-center rounded-[7px] text-ink-3 outline-none transition-colors hover:bg-ink/[0.05] hover:text-ink focus-visible:ring-2 focus-visible:ring-seal/45 disabled:opacity-30"
      >
        {revealed ? <EyeOff aria-hidden="true" className="size-3.5" /> : <Eye aria-hidden="true" className="size-3.5" />}
      </button>
    </li>
  );
}

/**
 * The signature panel: the literal JSON body this page will send, and the things that stay local.
 * Feed it the real request body, not a mock.
 */
export default function ServerView({
  outgoing,
  localOnly,
  note,
  endpoint,
  truncateAt = 32,
  title = "What leaves this browser",
  emptyText = "Nothing yet. Type something and it'll appear here as ciphertext.",
  className,
}: ServerViewProps) {
  const headingId = useId();
  const bytes = useMemo(() => {
    if (!outgoing) return 0;
    try {
      return new TextEncoder().encode(JSON.stringify(outgoing)).length;
    } catch {
      return 0;
    }
  }, [outgoing]);

  const lines = useMemo(() => {
    const result: Line[] = [];
    if (outgoing) buildLines(outgoing as Json, 0, [], false, truncateAt, result);
    return result;
  }, [outgoing, truncateAt]);

  return (
    <section
      aria-labelledby={headingId}
      className={cn("overflow-hidden rounded-panel border border-line bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.03)]", className)}
    >
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-[7px] border border-line bg-surface-2/60 text-ink-2">
            <ArrowUpRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h2 id={headingId} className="text-small font-semibold tracking-[-0.005em] text-ink">
              {title}
            </h2>
            {endpoint ? <p className="mt-0.5 truncate font-mono text-[11px] text-ink-3">{endpoint}</p> : null}
          </div>
        </div>
        <span className="tabular mt-0.5 shrink-0 font-mono text-[11px] text-ink-3" aria-live="off">
          {outgoing ? formatBytes(bytes) : "0 B"}
        </span>
      </header>

      {/* A light tint: text-ink-3 keeps 4.5:1 on it in both themes. */}
      <div className="bg-surface-2/[0.15]">
        {outgoing ? (
          <div
            role="group"
            aria-label="Request body"
            className="max-h-[360px] overflow-auto py-3.5 pl-2.5 pr-4 font-mono text-[12px] leading-[19px] [overflow-wrap:anywhere]"
          >
            {lines.map((line, index) => (
              <div key={index} className="flex">
                <span aria-hidden="true" className="w-[2ch] shrink-0 select-none text-right text-ink-3 tabular">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1" style={{ paddingLeft: `${line.depth * 2 + 3.5}ch`, textIndent: "-2ch" }}>
                  {line.content}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-start gap-3 px-4 py-5">
            <span aria-hidden="true" className="whitespace-nowrap font-mono text-[12px] leading-[19px] text-ink-3">
              {"{ }"}
            </span>
            <p className="text-small text-ink-3">{emptyText}</p>
          </div>
        )}
      </div>

      {localOnly.length > 0 ? (
        <div className="border-t border-line px-4 pb-2 pt-3">
          <h3 className="flex items-center gap-1.5 text-meta font-medium text-ink-3">
            <Laptop aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
            Stays in this browser
          </h3>
          <ul className="mt-1 divide-y divide-line/70">
            {localOnly.map((item) => (
              <LocalRow key={item.label} item={item} />
            ))}
          </ul>
        </div>
      ) : null}

      {note ? (
        <p className="flex items-start gap-2 border-t border-line px-4 py-3 text-meta leading-[17px] text-ink-3">
          <Info aria-hidden="true" className="mt-px size-3.5 shrink-0" strokeWidth={1.75} />
          <span>{note}</span>
        </p>
      ) : null}
    </section>
  );
}
