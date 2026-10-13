"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  Clock,
  Download,
  Eye,
  EyeOff,
  Flame,
  KeyRound,
  Link2Off,
  MessageSquareText,
  RotateCw,
  X,
} from "lucide-react";
import type { ConsumeDropResponse, DropMetaResponse } from "@protectedshare/contracts";
import { Button, Panel, PanelBody, PanelFooter, Spinner, StatusChip, buttonVariants, cn } from "@protectedshare/ui";
import AppLink from "../../../components/app-link";
import ReportAbuse from "../../../components/report-abuse";
import ServerView from "../../../components/server-view";
import ToolLayout, { ToolNotes } from "../../../components/tool-layout";
import {
  DropError,
  assembleFiles,
  downloadChunks,
  fetchDropMeta,
  finishDownload,
  formatSize,
  hasLiveSession,
  isAbort,
  newDownloadState,
  openDrop,
  plainSizeFor,
  saveBlob,
  withPreviews,
  type DecryptedFile,
  type DownloadSession,
  type DownloadState,
  type OpenedDrop,
  type TransferProgress,
} from "../../../lib/file-drop";
import { formatShareDeadline, readFragmentParams } from "../../../lib/share-window";
import { FileName, FileTile, TransferMeter, useTransferRate } from "../drop-ui";

type View =
  | { s: "loading" }
  | { s: "gone" }
  | { s: "missing_key"; meta: DropMetaResponse }
  | { s: "wrong_key"; meta: DropMetaResponse }
  | { s: "error"; message: string }
  | { s: "ready"; opened: OpenedDrop }
  | { s: "downloading"; opened: OpenedDrop }
  | {
      s: "download_failed";
      opened: OpenedDrop;
      message: string;
      /** The download session closed: trying again starts (and counts) a new download. */
      sessionEnded: boolean;
      /** Downloads left on the link as far as this page knows. */
      left: number;
    }
  | {
      s: "done";
      opened: OpenedDrop;
      files: DecryptedFile[];
      /** Downloads left on the link, as counted by the server when this one started. */
      remaining: number;
      consume: ConsumeDropResponse | null;
      consumeError: boolean;
    };

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

export default function DropClient({ id }: { id: string }) {
  const [view, setView] = useState<View>({ s: "loading" });
  const [progress, setProgress] = useState<TransferProgress | null>(null);
  const [saved, setSaved] = useState<Set<number>>(() => new Set());
  const rate = useTransferRate();
  /** Set once the server has counted this download (POST /start). Resumes reuse it. */
  const [session, setSession] = useState<DownloadSession | null>(null);
  const downloadRef = useRef<DownloadState | null>(null);
  const lastRemaining = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const keyRef = useRef("");

  const load = useCallback(async () => {
    setView({ s: "loading" });
    const key = readFragmentParams().k ?? "";
    keyRef.current = key;
    let meta: DropMetaResponse;
    try {
      meta = await fetchDropMeta(id);
    } catch (error) {
      if (error instanceof DropError && error.code === "not_found") return setView({ s: "gone" });
      return setView({ s: "error", message: error instanceof Error ? error.message : "Couldn't load this drop." });
    }
    if (!key) return setView({ s: "missing_key", meta });
    try {
      const opened = await openDrop(id, key, meta);
      downloadRef.current = newDownloadState(meta.chunkCount);
      lastRemaining.current = null;
      setSession(null);
      setView({ s: "ready", opened });
    } catch (error) {
      if (error instanceof DropError) {
        if (error.code === "not_found") return setView({ s: "gone" });
        if (error.code === "wrong_key" || error.code === "missing_key") return setView({ s: "wrong_key", meta });
      }
      setView({ s: "error", message: error instanceof Error ? error.message : "Couldn't open this drop." });
    }
  }, [id]);

  useEffect(() => {
    void load();
    const onHash = () => void load();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [load]);

  const start = async (opened: OpenedDrop) => {
    const state = downloadRef.current ?? newDownloadState(opened.meta.chunkCount);
    downloadRef.current = state;
    const controller = new AbortController();
    abortRef.current = controller;
    rate.reset();
    setView({ s: "downloading", opened });
    try {
      // Starts the download on the server first (that's when it's counted), unless this is a
      // resume of a download that already started.
      await downloadChunks(id, opened, state, {
        signal: controller.signal,
        onSession: (next) => {
          lastRemaining.current = next.downloadsRemaining;
          setSession(next);
        },
        onProgress: (next) => {
          setProgress(next);
          rate.push(next.done);
        },
      });
    } catch (error) {
      abortRef.current = null;
      if (isAbort(error)) return setView({ s: "ready", opened });
      if (error instanceof DropError && error.code === "not_found") return setView({ s: "gone" });
      const sessionEnded = error instanceof DropError && error.code === "session_expired";
      const left = lastRemaining.current ?? opened.meta.downloadsRemaining;
      if (sessionEnded) setSession(null);
      return setView({
        s: "download_failed",
        opened,
        sessionEnded,
        left,
        message: error instanceof Error ? error.message : "The download stopped.",
      });
    }
    abortRef.current = null;

    let files: DecryptedFile[];
    try {
      files = await withPreviews(assembleFiles(opened.manifest, state));
    } catch (error) {
      return setView({
        s: "download_failed",
        opened,
        sessionEnded: false,
        left: lastRemaining.current ?? opened.meta.downloadsRemaining,
        message: error instanceof Error ? error.message : "A part is missing.",
      });
    }

    // Every chunk is here and decrypted: end the download session so the server can delete
    // the drop now if this was the last download (it was counted when it started).
    const remaining = state.session?.downloadsRemaining ?? 0;
    let consume: ConsumeDropResponse | null = null;
    let consumeError = false;
    try {
      if (state.session) consume = await finishDownload(id, state.session.token);
    } catch {
      consumeError = true;
    }
    downloadRef.current = null;
    setSaved(new Set());
    setView({ s: "done", opened, files, remaining, consume, consumeError });
    // The key has done its job. Take it out of the address bar and history.
    try {
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    } catch {
      // ignore
    }
  };

  // If the drop is gone from the server and nothing is saved yet, closing the tab loses the files.
  const unsaved = view.s === "done" && saved.size < view.files.length;
  useEffect(() => {
    if (!unsaved && view.s !== "downloading") return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [unsaved, view.s]);

  const saveOne = (file: DecryptedFile, index: number) => {
    saveBlob(file.blob, file.name);
    setSaved((current) => new Set(current).add(index));
  };

  const saveAll = async (files: DecryptedFile[]) => {
    for (let index = 0; index < files.length; index += 1) {
      saveOne(files[index], index);
      // Browsers drop rapid back-to-back downloads; give each one a beat.
      if (index < files.length - 1) await new Promise((resolve) => window.setTimeout(resolve, 350));
    }
  };

  const opened = "opened" in view ? view.opened : null;
  const meta = opened?.meta ?? ("meta" in view ? view.meta : null);
  const plainTotal = meta ? plainSizeFor(meta.totalBytes, meta.chunkCount) : 0;
  const fileCount = opened?.manifest.files.length;

  const aside = (
    <>
      <ServerView
        title="What this page sends"
        endpoint={
          meta
            ? session
              ? `GET /api/drops/${id}/chunks/0…${meta.chunkCount - 1}`
              : `POST /api/drops/${id}/start, then GET /chunks/0…${meta.chunkCount - 1}`
            : `GET /api/drops/${id}/meta`
        }
        outgoing={
          opened
            ? { headers: { "X-Auth-Token": opened.authToken, ...(session ? { "X-Download-Token": session.token } : {}) } }
            : null
        }
        localOnly={[
          { label: "Key (from the link)", value: keyRef.current },
          { label: "File names", value: opened ? opened.manifest.files.map((file) => file.name).join(", ") : "" },
        ]}
        note="The auth token is derived from the key: it proves you hold the link without revealing it. The download token comes from the server when the download starts, and the files decrypt here."
      />
      <ToolNotes
        title="What happens"
        items={[
          "Your browser fetches the encrypted pieces and decrypts them. The server never has the key.",
          "The server counts a download when it starts. Cancelling doesn't give it back, but you can resume it here for up to an hour.",
          "When the last allowed download finishes, the server deletes the files.",
        ]}
      />
      {view.s !== "loading" ? <ReportAbuse kind="drop" id={id} className="ml-1" /> : null}
    </>
  );

  return (
    <ToolLayout
      eyebrow="File drop"
      title={fileCount ? `${plural(fileCount, "encrypted file")} for you` : "Encrypted files"}
      description="They decrypt in this browser. The server only hands over ciphertext."
      meta={
        meta && view.s !== "gone" ? (
          <>
            <StatusChip tone="neutral" icon={<Clock aria-hidden="true" />}>
              Expires {formatShareDeadline(meta.expiresAt * 1000)}
            </StatusChip>
            {view.s === "done" ? null : session ? (
              <StatusChip tone="seal" icon={<Flame aria-hidden="true" />}>
                {session.downloadsRemaining === 0 ? "Last download, counted" : `Counted · ${session.downloadsRemaining} left`}
              </StatusChip>
            ) : (
              <StatusChip tone="seal" icon={<Flame aria-hidden="true" />}>
                {meta.downloadsRemaining === 1 ? "Last download" : `${meta.downloadsRemaining} downloads left`}
              </StatusChip>
            )}
          </>
        ) : null
      }
      aside={view.s === "gone" ? undefined : aside}
    >
      {view.s === "loading" ? (
        <Panel>
          <PanelBody className="flex items-center gap-3 py-10" role="status">
            <Spinner size={18} />
            <span className="text-ui text-ink-2">Opening the drop…</span>
          </PanelBody>
        </Panel>
      ) : view.s === "gone" ? (
        <GonePanel />
      ) : view.s === "missing_key" ? (
        <ProblemPanel
          icon={<KeyRound aria-hidden="true" className="size-4" />}
          title="This link is missing its key"
          body={
            <>
              The drop exists ({formatSize(plainTotal)}), but the part of the link after <span className="font-mono">#k=</span> didn&apos;t
              arrive. Ask the sender to copy the whole link again. Some chat apps cut it off.
            </>
          }
        />
      ) : view.s === "wrong_key" ? (
        <ProblemPanel
          icon={<KeyRound aria-hidden="true" className="size-4" />}
          title="This key doesn't open the drop"
          body="The link was probably cut off or changed. Ask the sender to copy the whole link again. Nothing was downloaded and no download was used."
        />
      ) : view.s === "error" ? (
        <ProblemPanel
          icon={<CircleAlert aria-hidden="true" className="size-4" />}
          title="Couldn't load this drop"
          body={view.message}
          action={
            <Button variant="secondary" onClick={() => void load()}>
              <RotateCw aria-hidden="true" />
              Try again
            </Button>
          }
        />
      ) : view.s === "done" ? (
        <DonePanel
          files={view.files}
          message={view.opened.manifest.message}
          remaining={view.remaining}
          consume={view.consume}
          consumeError={view.consumeError}
          saved={saved}
          onSave={saveOne}
          onSaveAll={() => void saveAll(view.files)}
        />
      ) : opened ? (
        <Panel>
          <PanelBody className="flex flex-col gap-5">
            {opened.manifest.message ? <MessageBlock message={opened.manifest.message} /> : null}
            <FileList files={opened.manifest.files} />
            <p className="tabular -mt-1 text-small text-ink-3">
              {plural(opened.manifest.files.length, "file")} · {formatSize(plainTotal)} in total
            </p>

            {view.s === "downloading" || view.s === "download_failed" ? (
              <div className="rounded-field border border-line bg-surface-2/40 p-4">
                {view.s === "download_failed" ? (
                  <p role="alert" className="mb-4 flex items-start gap-2 text-small text-danger">
                    <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
                    <span>
                      {view.message}{" "}
                      {view.sessionEnded
                        ? view.left > 0
                          ? "Trying again starts a new download, which uses another one."
                          : "No downloads are left on this link, so ask the sender for a new one."
                        : session
                          ? "Pieces that arrived are kept. Trying again picks up where it stopped without using another download."
                          : "Nothing was counted yet. Trying again starts the download."}
                    </span>
                  </p>
                ) : null}
                <TransferMeter
                  progress={progress}
                  rate={view.s === "downloading" ? rate.rate : 0}
                  verb="Download progress"
                  display={(bytes) => (meta && meta.totalBytes > 0 ? Math.round((bytes / meta.totalBytes) * plainTotal) : bytes)}
                />
              </div>
            ) : (
              <p
                className={cn(
                  "flex items-start gap-2.5 rounded-field px-3.5 py-3 text-small",
                  !session && opened.meta.downloadsRemaining === 1 ? "bg-surface-2 text-ink" : "bg-surface-2 text-ink-2"
                )}
              >
                <Flame
                  aria-hidden="true"
                  className={cn("mt-px size-4 shrink-0", !session && opened.meta.downloadsRemaining === 1 ? "text-seal" : "text-ink-3")}
                />
                <span>
                  {session
                    ? "This download is already counted. Resuming it here doesn't use another one, for up to an hour after it started."
                    : opened.meta.downloadsRemaining === 1
                      ? "This is the last download. Starting it uses it up, and the server deletes the files once it finishes, so save them somewhere safe."
                      : `${opened.meta.downloadsRemaining} downloads left. Starting a download uses one, even if you cancel it.`}
                </span>
              </p>
            )}
          </PanelBody>
          <PanelFooter>
            <span className="text-small text-ink-3">
              {view.s === "downloading" ? "Decrypting as pieces arrive." : "Decrypted in this browser, not on the server."}
            </span>
            {view.s === "downloading" ? (
              <Button variant="secondary" onClick={() => abortRef.current?.abort()} className="w-full sm:w-auto">
                <X aria-hidden="true" />
                Cancel
              </Button>
            ) : (
              <Button size="lg" onClick={() => void start(opened)} className="w-full sm:w-auto">
                {view.s === "download_failed" ? <RotateCw aria-hidden="true" /> : <Download aria-hidden="true" />}
                {view.s === "download_failed"
                  ? "Try again"
                  : hasLiveSession(downloadRef.current)
                    ? "Resume download"
                    : `Download and decrypt${opened.manifest.files.length > 1 ? " all" : ""}`}
              </Button>
            )}
          </PanelFooter>
        </Panel>
      ) : null}
    </ToolLayout>
  );
}

function MessageBlock({ message }: { message: string }) {
  return (
    <div className="rounded-field border border-line bg-surface-2/40 px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-meta font-medium text-ink-3">
        <MessageSquareText aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
        Message from the sender
      </p>
      <p className="mt-1.5 whitespace-pre-wrap break-words text-prose text-ink">{message}</p>
    </div>
  );
}

function FileList({ files }: { files: { name: string; type: string; size: number }[] }) {
  return (
    <ul aria-label="Files in this drop" className="divide-y divide-line overflow-hidden rounded-field border border-line">
      {files.map((file, index) => (
        <li key={`${file.name}-${index}`} className="flex items-center gap-3 bg-surface px-3 py-2.5">
          <FileTile name={file.name} type={file.type} size={36} />
          <FileName name={file.name} className="min-w-0 flex-1 text-[14px]" />
          <span className="tabular shrink-0 text-small text-ink-3">{formatSize(file.size)}</span>
        </li>
      ))}
    </ul>
  );
}

function DonePanel({
  files,
  message,
  remaining,
  consume,
  consumeError,
  saved,
  onSave,
  onSaveAll,
}: {
  files: DecryptedFile[];
  message?: string;
  remaining: number;
  consume: ConsumeDropResponse | null;
  consumeError: boolean;
  saved: Set<number>;
  onSave: (file: DecryptedFile, index: number) => void;
  onSaveAll: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [preview, setPreview] = useState<number | null>(null);
  useEffect(() => headingRef.current?.focus(), []);
  const deleted = consume?.deleted ?? false;
  const left = consume ? consume.downloadsRemaining : remaining;
  const allSaved = saved.size >= files.length;

  return (
    <Panel className="animate-rise">
      <div className="flex items-start gap-3.5 border-b border-line px-5 py-5">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-ok-soft text-ok">
          <CircleCheck aria-hidden="true" className="size-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 ref={headingRef} tabIndex={-1} className="text-h3 text-ink outline-none">
            Decrypted. Save your files.
          </h2>
          <p className="mt-1 text-ui text-ink-3">
            {deleted
              ? "That was the last download, so the server has deleted them. These copies only live in this tab until you save them."
              : left === 0
                ? "That was the last download. The server deletes the files as soon as any other running download ends, within the hour. These copies only live in this tab until you save them."
                : `${plural(left, "download")} left on the link. These copies live in this tab until you save them.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {deleted ? (
              <StatusChip tone="ok" icon={<CircleCheck aria-hidden="true" />}>
                Deleted from the server
              </StatusChip>
            ) : left === 0 ? (
              <StatusChip tone="neutral">No downloads left</StatusChip>
            ) : (
              <StatusChip tone="neutral">{plural(left, "download")} left</StatusChip>
            )}
            {allSaved ? <StatusChip tone="ok">Saved</StatusChip> : null}
          </div>
          {consumeError && left === 0 ? (
            <p className="mt-3 text-small text-warn">
              Couldn&apos;t tell the server this download finished. Your files are fine, and the server deletes its copy within the hour.
            </p>
          ) : null}
        </div>
      </div>

      <PanelBody className="flex flex-col gap-5">
        {message ? <MessageBlock message={message} /> : null}
        <ul aria-label="Decrypted files" className="divide-y divide-line overflow-hidden rounded-field border border-line">
          {files.map((file, index) => {
            const image = Boolean(file.preview);
            const open = preview === index;
            return (
              <li key={`${file.name}-${index}`} className="bg-surface">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <FileTile name={file.name} type={file.preview?.type ?? file.type} blob={file.preview?.blob} size={44} />
                  <div className="min-w-0 flex-1">
                    <FileName name={file.name} className="text-[14px]" />
                    <p className="tabular text-meta text-ink-3">
                      {formatSize(file.size)}
                      {saved.has(index) ? <span className="text-ok"> · Saved</span> : null}
                    </p>
                  </div>
                  {image ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${open ? "Hide" : "Show"} preview of ${file.name}`}
                      aria-expanded={open}
                      onClick={() => setPreview(open ? null : index)}
                    >
                      {open ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </Button>
                  ) : null}
                  <Button variant="secondary" size="sm" onClick={() => onSave(file, index)} aria-label={`Save ${file.name}`}>
                    <Download aria-hidden="true" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                </div>
                {open ? <ImagePreview file={file} /> : null}
              </li>
            );
          })}
        </ul>
      </PanelBody>
      <PanelFooter>
        <span className="text-small text-ink-3">The key was removed from the address bar.</span>
        <Button size="lg" onClick={onSaveAll} className="w-full sm:w-auto">
          <Download aria-hidden="true" />
          {files.length > 1 ? `Save all ${files.length} files` : "Save file"}
        </Button>
      </PanelFooter>
    </Panel>
  );
}

/** Only for files whose bytes sniffed as PNG/JPEG/GIF/WebP; the blob carries that type, never the sender's. */
function ImagePreview({ file }: { file: DecryptedFile }) {
  const [url, setUrl] = useState<string | null>(null);
  const blob = file.preview?.blob;
  useEffect(() => {
    if (!blob) return;
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  if (!url) return null;
  return (
    <div className="animate-fade-in border-t border-line bg-surface-2/50 p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={`Preview of ${file.name}`} className="mx-auto max-h-[420px] w-auto rounded-[8px] border border-line object-contain" />
    </div>
  );
}

function ProblemPanel({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Panel>
      <PanelBody className="flex items-start gap-3.5 py-6">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-warn-soft text-warn">{icon}</span>
        <div className="min-w-0" role="alert">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
          <p className="mt-1.5 max-w-[56ch] text-ui text-ink-2">{body}</p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </PanelBody>
    </Panel>
  );
}

function GonePanel() {
  return (
    <div className="flex flex-col items-center rounded-panel border border-dashed border-line-strong px-6 py-16 text-center">
      <span className="mb-4 flex size-10 items-center justify-center rounded-[10px] border border-line bg-surface text-ink-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
        <Link2Off aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
      </span>
      <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">This drop is gone</h2>
      <p className="mt-2 max-w-[46ch] text-ui text-ink-2">
        It expired, the sender deleted it, or its downloads were used up. The files were deleted from the server, so there&apos;s nothing
        left to recover. Ask the sender for a new link.
      </p>
      <AppLink href="/files" className={cn(buttonVariants({ variant: "secondary" }), "mt-6")}>
        Send your own files
      </AppLink>
    </div>
  );
}
