"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@protectedshare/ui";
import { formatSize, isPreviewableImage, type TransferProgress } from "../../lib/file-drop";

const EXT_ARCHIVE = /\.(zip|tar|gz|tgz|bz2|xz|7z|rar)$/i;
const EXT_CODE = /\.(env|json|ya?ml|toml|ini|js|mjs|ts|tsx|jsx|py|rb|go|rs|java|kt|swift|c|h|cpp|cs|php|sh|sql|xml|html|css|pem|key|crt)$/i;
const EXT_SHEET = /\.(csv|tsv|xlsx?|ods|numbers)$/i;
const EXT_TEXT = /\.(txt|md|rtf|pdf|docx?|odt|pages|log)$/i;

export function iconFor(name: string, type: string): LucideIcon {
  if (type.startsWith("image/")) return FileImage;
  if (type.startsWith("video/")) return FileVideo;
  if (type.startsWith("audio/")) return FileAudio;
  if (EXT_ARCHIVE.test(name) || /zip|compressed|x-tar/.test(type)) return FileArchive;
  if (EXT_SHEET.test(name) || /spreadsheet|csv/.test(type)) return FileSpreadsheet;
  if (EXT_CODE.test(name) || /json|javascript|xml|x-sh/.test(type)) return FileCode;
  if (EXT_TEXT.test(name) || type.startsWith("text/") || type === "application/pdf") return FileText;
  return FileIcon;
}

/** Square tile: an image thumbnail when we have the bytes and it's a safe raster type, else a type icon. */
export function FileTile({
  name,
  type,
  blob,
  size = 40,
  className,
}: {
  name: string;
  type: string;
  blob?: Blob;
  size?: number;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const previewable = Boolean(blob) && isPreviewableImage(type);

  useEffect(() => {
    if (!blob || !previewable) return;
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => {
      URL.revokeObjectURL(next);
      setUrl(null);
    };
  }, [blob, previewable]);

  const Icon = iconFor(name, type);
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-[9px] border border-line bg-surface-2/70 text-ink-3",
        className
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <Icon className="size-[18px]" strokeWidth={1.6} />
      )}
    </span>
  );
}

/** Splits a file name so the extension stays visible when the stem truncates. */
export function FileName({ name, className }: { name: string; className?: string }) {
  const dot = name.lastIndexOf(".");
  const hasExt = dot > 0 && name.length - dot <= 8;
  const stem = hasExt ? name.slice(0, dot) : name;
  const ext = hasExt ? name.slice(dot) : "";
  return (
    <span className={cn("flex min-w-0 text-ui font-medium text-ink", className)} title={name}>
      <span className="truncate">{stem}</span>
      {ext ? <span className="shrink-0">{ext}</span> : null}
    </span>
  );
}

/** A thin determinate bar. */
export function ProgressBar({
  value,
  max,
  label,
  tone = "ink",
  className,
}: {
  value: number;
  max: number;
  label: string;
  tone?: "ink" | "warn" | "danger" | "ok";
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07]", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-200 ease-seal motion-reduce:transition-none",
          tone === "ink" && "bg-ink",
          tone === "warn" && "bg-warn",
          tone === "danger" && "bg-danger",
          tone === "ok" && "bg-ok"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Rolling transfer rate (bytes/s) over the last few seconds. */
export function useTransferRate() {
  const samples = useRef<{ t: number; done: number }[]>([]);
  const [rate, setRate] = useState(0);

  const push = useCallback((done: number) => {
    const now = performance.now();
    const list = samples.current;
    list.push({ t: now, done });
    while (list.length > 2 && now - list[0].t > 4000) list.shift();
    const first = list[0];
    const elapsed = (now - first.t) / 1000;
    if (elapsed > 0.4) setRate(Math.max(0, (done - first.done) / elapsed));
  }, []);

  const reset = useCallback(() => {
    samples.current = [];
    setRate(0);
  }, []);

  return { rate, push, reset };
}

function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  if (seconds < 5) return "A few seconds left";
  if (seconds < 60) return `About ${Math.ceil(seconds / 5) * 5} seconds left`;
  const minutes = Math.round(seconds / 60);
  return `About ${minutes} minute${minutes === 1 ? "" : "s"} left`;
}

/** Bar + "12.4 MB of 24 MB · 3.1 MB/s · About 5 seconds left", with a coarse live region. */
export function TransferMeter({
  progress,
  rate,
  verb,
  /** Plaintext sizes read better than ciphertext; pass a converter if you want them. */
  display = (bytes) => bytes,
  footer,
}: {
  progress: TransferProgress | null;
  rate: number;
  verb: string;
  display?: (bytes: number) => number;
  footer?: ReactNode;
}) {
  const done = progress?.done ?? 0;
  const total = progress?.total ?? 0;
  const pct = total > 0 ? Math.floor((done / total) * 100) : 0;
  const announced = Math.floor(pct / 25) * 25;
  const eta = rate > 0 ? formatEta((total - done) / rate) : "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="tabular text-[28px] font-semibold leading-none tracking-[-0.03em] text-ink">
          {pct}
          <span className="ml-0.5 text-[18px] text-ink-3">%</span>
        </p>
        <p className="tabular text-small text-ink-3">
          {progress ? `Chunk ${Math.min(progress.chunksDone + 1, progress.chunkCount)} of ${progress.chunkCount}` : ""}
        </p>
      </div>
      <ProgressBar value={done} max={total} label={verb} />
      <p className="tabular flex flex-wrap gap-x-3 gap-y-1 text-small text-ink-2">
        <span>
          {formatSize(display(done))} of {formatSize(display(total))}
        </span>
        {rate > 0 ? (
          <>
            <span aria-hidden="true" className="text-ink-3/60">
              ·
            </span>
            <span>{formatSize(rate)}/s</span>
          </>
        ) : null}
        {eta ? (
          <>
            <span aria-hidden="true" className="text-ink-3/60">
              ·
            </span>
            <span className="text-ink-3">{eta}</span>
          </>
        ) : null}
      </p>
      <p className="sr-only" aria-live="polite">
        {progress ? `${verb}: ${announced}%` : ""}
      </p>
      {footer}
    </div>
  );
}
