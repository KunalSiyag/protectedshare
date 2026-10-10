"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { CircleAlert, Lock, RotateCw, Trash2, Upload, X } from "lucide-react";
import type { CreateDropRequest } from "@protectedshare/contracts";
import {
  Button,
  Field,
  Input,
  Panel,
  PanelBody,
  PanelFooter,
  Segmented,
  Spinner,
  StatusChip,
  Textarea,
  cn,
} from "@protectedshare/ui";
import ConfirmDialog from "../../components/confirm-dialog";
import ExpiryPicker, { useExpiry } from "../../components/expiry-picker";
import ServerView from "../../components/server-view";
import ShareResult from "../../components/share-result";
import ToolLayout, { ToolNotes } from "../../components/tool-layout";
import { useToast } from "../../components/toast";
import {
  MAX_DROP_FILES,
  MAX_DROP_MESSAGE,
  MAX_DROP_PLAINTEXT_BYTES,
  DROP_CHUNK_OVERHEAD,
  buildCreateBody,
  chunkCountFor,
  createDropSession,
  formatSize,
  isAbort,
  newUploadState,
  revokeDrop,
  uploadDrop,
  type DropSession,
  type TransferProgress,
  type UploadState,
} from "../../lib/file-drop";
import { addLink, makeLinkLabel } from "../../lib/my-links";
import { resolveExpiresAt, withFragmentParams } from "../../lib/share-window";
import { FileName, FileTile, ProgressBar, TransferMeter, useTransferRate } from "./drop-ui";

type LimitChoice = "1" | "3" | "5" | "10" | "custom";

const LIMIT_OPTIONS: { value: LimitChoice; label: string }[] = [
  { value: "1", label: "1" },
  { value: "3", label: "3" },
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "custom", label: "Custom" },
];

type Phase = "compose" | "uploading" | "failed" | "done";

type Result = {
  id: string;
  url: string;
  manageToken: string;
  expiresAt: number;
  maxDownloads: number;
  fileCount: number;
  plainBytes: number;
  savedToLinks: boolean;
};

const fileKey = (file: File) => `${file.name}:${file.size}:${file.lastModified}`;

function pastedName(file: File, index: number): string {
  const generic = !file.name || /^image\.(png|jpe?g|gif|webp)$/i.test(file.name);
  if (!generic) return file.name;
  const ext = (file.type.split("/")[1] || "png").replace("jpeg", "jpg");
  const d = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}.${pad(d.getMinutes())}.${pad(d.getSeconds())}`;
  return `Pasted image ${stamp}${index ? ` (${index + 1})` : ""}.${ext}`;
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

export default function FilesClient() {
  const { toast } = useToast();
  const ids = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [limit, setLimit] = useState<LimitChoice>("1");
  const [customLimit, setCustomLimit] = useState("20");
  const [label, setLabel] = useState("");
  const expiry = useExpiry("86400");
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const [formError, setFormError] = useState<string | null>(null);

  const [session, setSession] = useState<DropSession | null>(null);
  const [preview, setPreview] = useState<CreateDropRequest | null>(null);

  const [phase, setPhase] = useState<Phase>("compose");
  const [progress, setProgress] = useState<TransferProgress | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const rate = useTransferRate();
  const uploadRef = useRef<{ state: UploadState; files: File[]; session: DropSession; expiresAtMs: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const totalBytes = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const overBy = totalBytes - MAX_DROP_PLAINTEXT_BYTES;
  const over = overBy > 0;
  const limitNumber = limit === "custom" ? Number(customLimit) : Number(limit);
  const limitValid = Number.isInteger(limitNumber) && limitNumber >= 1 && limitNumber <= 100;
  const fileNames = files.map((file) => file.name).join(", ");

  // A fresh key, salt and manage token for every drop.
  useEffect(() => {
    if (session) return;
    let cancelled = false;
    void createDropSession().then((next) => {
      if (!cancelled) setSession(next);
    });
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Live server view: the real POST body, re-encrypted as the form changes.
  useEffect(() => {
    if (!session || files.length === 0 || phase !== "compose") {
      if (files.length === 0) setPreview(null);
      return;
    }
    let cancelled = false;
    const resolved = resolveExpiresAt(expiry.choice, expiry.custom);
    const expiresAt = Math.floor(("expiresAt" in resolved ? resolved.expiresAt : Date.now() + 86_400_000) / 1000);
    const timer = window.setTimeout(() => {
      void buildCreateBody(session, files, {
        message: message.slice(0, MAX_DROP_MESSAGE),
        maxDownloads: limitValid ? limitNumber : 1,
        expiresAt,
      }).then((body) => {
        if (!cancelled) setPreview(body);
      });
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [session, files, message, limitNumber, limitValid, expiry.choice, expiry.custom, phase]);

  const addFiles = useCallback(
    (incoming: File[], source: "pick" | "drop" | "paste" = "pick") => {
      if (incoming.length === 0) return;
      setFormError(null);
      const renamed =
        source === "paste"
          ? incoming.map((file, index) => new File([file], pastedName(file, index), { type: file.type, lastModified: file.lastModified }))
          : incoming;
      setFiles((current) => {
        const seen = new Set(current.map(fileKey));
        const fresh = renamed.filter((file) => {
          const key = fileKey(file);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        const room = MAX_DROP_FILES - current.length;
        if (fresh.length > room) {
          toast({ title: `Up to ${MAX_DROP_FILES} files per drop`, description: "Zip the rest, or send another drop.", tone: "danger" });
        }
        return [...current, ...fresh.slice(0, Math.max(0, room))];
      });
      if (source === "paste") {
        toast({ title: `Added ${plural(incoming.length, "pasted file")}`, tone: "ok" });
      }
    },
    [toast]
  );

  const removeFile = (target: File) => {
    setFiles((current) => current.filter((file) => file !== target));
  };

  // Paste images or files from the clipboard anywhere on the page.
  useEffect(() => {
    if (phase !== "compose") return;
    const onPaste = (event: ClipboardEvent) => {
      const list = event.clipboardData?.files;
      if (!list || list.length === 0) return;
      event.preventDefault();
      addFiles(Array.from(list), "paste");
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [phase, addFiles]);

  // Dropping a file anywhere on the page adds it instead of navigating away.
  useEffect(() => {
    if (phase !== "compose") return;
    const hasFiles = (event: globalThis.DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");
    const onOver = (event: globalThis.DragEvent) => {
      if (hasFiles(event)) event.preventDefault();
    };
    const onDrop = (event: globalThis.DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      addFiles(Array.from(event.dataTransfer?.files ?? []), "drop");
    };
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [phase, addFiles]);

  // Leaving mid-upload loses the link. Ask first.
  useEffect(() => {
    if (phase !== "uploading" && phase !== "failed") return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [phase]);

  const onZoneDragEnter = (event: DragEvent) => {
    if (!Array.from(event.dataTransfer.types).includes("Files")) return;
    dragDepth.current += 1;
    setDragging(true);
  };
  const onZoneDragLeave = () => {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const runUpload = async () => {
    const job = uploadRef.current;
    if (!job) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase("uploading");
    setUploadError(null);
    rate.reset();
    // The progress panel is shorter than the form; keep it in view.
    window.requestAnimationFrame(() => {
      const top = formRef.current?.getBoundingClientRect().top ?? 0;
      if (top < 0) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        formRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      }
    });
    try {
      const { id } = await uploadDrop(job.session, job.files, job.state, {
        signal: controller.signal,
        onProgress: (next) => {
          setProgress(next);
          rate.push(next.done);
        },
      });
      const url = withFragmentParams(`${window.location.origin}/files/${id}`, { k: job.session.key });
      const maxDownloads = job.state.body.maxDownloads;
      const savedToLinks = addLink({
        kind: "drop",
        id,
        url,
        manageToken: job.session.manageToken,
        label: makeLinkLabel(label.trim() || job.files.map((file) => file.name).join(", ")),
        createdAt: Date.now(),
        expiresAt: job.expiresAtMs,
        maxReads: maxDownloads,
      });
      setResult({
        id,
        url,
        manageToken: job.session.manageToken,
        expiresAt: job.expiresAtMs,
        maxDownloads,
        fileCount: job.files.length,
        plainBytes: job.files.reduce((sum, file) => sum + file.size, 0),
        savedToLinks,
      });
      setPhase("done");
      uploadRef.current = null;
    } catch (error) {
      if (isAbort(error)) return;
      setUploadError(error instanceof Error ? error.message : "The upload stopped.");
      setPhase("failed");
    } finally {
      abortRef.current = null;
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session) return;
    if (files.length === 0) {
      setFormError("Add at least one file.");
      return;
    }
    if (over) {
      setFormError(`That's ${formatSize(overBy)} over the 25 MB limit. Remove a file to continue.`);
      return;
    }
    if (!limitValid) {
      setFormError("Pick a download limit between 1 and 100.");
      return;
    }
    const resolved = expiry.resolve();
    if ("error" in resolved) return;
    setFormError(null);
    const snapshot = [...files];
    const body = await buildCreateBody(session, snapshot, {
      message: message.slice(0, MAX_DROP_MESSAGE),
      maxDownloads: limitNumber,
      expiresAt: Math.floor(resolved.expiresAt / 1000),
    });
    setPreview(body);
    setProgress({ done: 0, total: body.totalBytes, chunksDone: 0, chunkCount: body.chunkCount });
    uploadRef.current = { state: newUploadState(body), files: snapshot, session, expiresAtMs: resolved.expiresAt };
    await runUpload();
  };

  /** Stop, delete whatever reached the server, and go back to the form with the files still listed. */
  const cancelUpload = () => {
    abortRef.current?.abort();
    const job = uploadRef.current;
    if (job?.state.id) void revokeDrop(job.state.id, job.session.manageToken);
    uploadRef.current = null;
    setProgress(null);
    setUploadError(null);
    setPhase("compose");
    setSession(null); // never reuse a key after a cancelled upload
    toast({ title: "Upload cancelled", description: "Anything already uploaded was deleted." });
  };

  const reset = () => {
    setFiles([]);
    setMessage("");
    setLabel("");
    setLimit("1");
    setResult(null);
    setRevoked(false);
    setProgress(null);
    setPreview(null);
    setSession(null);
    setPhase("compose");
  };

  const revokeNow = async () => {
    if (!result) return;
    setRevoking(true);
    await revokeDrop(result.id, result.manageToken);
    setRevoking(false);
    setConfirmRevoke(false);
    setRevoked(true);
    toast({ title: "Drop deleted", description: "The link no longer works.", tone: "ok" });
  };

  const meterTone = over ? "danger" : totalBytes > MAX_DROP_PLAINTEXT_BYTES * 0.9 ? "warn" : "ink";
  const busy = phase === "uploading" || phase === "failed";
  const chunkCount = files.length ? chunkCountFor(totalBytes) : 0;

  const aside = (
    <>
      <ServerView
        outgoing={preview}
        endpoint={phase === "done" ? "POST /api/drops · sent" : "POST /api/drops"}
        emptyText="Nothing yet. Add files and the encrypted request appears here."
        localOnly={[
          { label: "Key (in the link)", value: session?.key ?? "" },
          { label: "File names", value: fileNames },
          ...(message.trim() ? [{ label: "Message", value: message.trim() }] : []),
        ]}
        note={
          files.length ? (
            <>
              Then {plural(chunkCount, "encrypted chunk")} {phase === "done" ? "went" : "go"} up with{" "}
              <span className="font-mono text-[11px]">PUT /api/drops/:id/chunks/:n</span>. The server sees their sizes ({formatSize(totalBytes + chunkCount * DROP_CHUNK_OVERHEAD)} in all), not the names or contents.
            </>
          ) : (
            "Add files to see the request. Names, types and your message go inside the encrypted manifest."
          )
        }
      />
      <ToolNotes
        items={[
          "File names, types and your message are encrypted. The server sees the total encrypted size, the chunk count, the download limit and the expiry.",
          "The server counts a download when it starts, and My links shows it as opened then. After the last download finishes, the files are deleted. Unused drops are deleted when they expire.",
          "The key in the link is the only way in. Anyone with the full link can download, so share it like a key.",
        ]}
      />
    </>
  );

  return (
    <ToolLayout
      eyebrow="Share"
      title="File drop"
      description="Send files up to 25 MB. They're encrypted in this browser, then deleted after the downloads you allow."
      meta={
        <>
          <StatusChip tone="seal">Encrypted before upload</StatusChip>
          <StatusChip>Up to 25 MB</StatusChip>
          <StatusChip>No account</StatusChip>
        </>
      }
      aside={aside}
    >
      {phase === "done" && result ? (
        <ShareResult
          url={result.url}
          expiresAt={result.expiresAt}
          burnLabel={result.maxDownloads === 1 ? "Deleted after 1 download" : `Deleted after ${result.maxDownloads} downloads`}
          savedToLinks={result.savedToLinks}
          title="Sealed. Your files are ready."
          description={`${plural(result.fileCount, "file")}, ${formatSize(result.plainBytes)}. Anyone with this link can download them until it expires or the downloads run out.`}
          resetLabel="Send more files"
          onReset={reset}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-small text-ink-3">
              {revoked ? "Deleted. The link no longer opens anything." : "Sent it to the wrong person? Delete it now."}
            </p>
            <Button variant="danger" size="sm" disabled={revoked} onClick={() => setConfirmRevoke(true)}>
              <Trash2 aria-hidden="true" />
              {revoked ? "Deleted" : "Delete drop"}
            </Button>
          </div>
        </ShareResult>
      ) : (
        <form ref={formRef} onSubmit={onSubmit} noValidate className="scroll-mt-24">
          <Panel>
            {busy ? (
              <UploadPanel
                files={uploadRef.current?.files ?? files}
                progress={progress}
                rate={rate.rate}
                error={phase === "failed" ? uploadError : null}
                onRetry={() => void runUpload()}
                onCancel={cancelUpload}
              />
            ) : (
              <PanelBody className="flex flex-col gap-6">
                {/* Drop zone */}
                <div className="flex flex-col gap-3">
                  <div
                    onDragEnter={onZoneDragEnter}
                    onDragLeave={onZoneDragLeave}
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest("button")) return;
                      inputRef.current?.click();
                    }}
                    className={cn(
                      "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-field border border-dashed px-6 text-center transition-[background-color,border-color] duration-150 ease-seal",
                      files.length ? "py-7" : "py-12 sm:py-14",
                      dragging ? "border-ink bg-ink/[0.035]" : "border-line-strong bg-surface-2/40 hover:border-ink-3/60 hover:bg-surface-2/70"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-11 items-center justify-center rounded-[11px] border border-line bg-surface text-ink-2 shadow-[0_1px_2px_rgb(0_0_0/0.05)] transition-transform duration-150 ease-seal",
                        dragging && "-translate-y-0.5"
                      )}
                    >
                      <Upload className="size-5" strokeWidth={1.75} />
                    </span>
                    <div>
                      <p className="text-ui font-medium text-ink">{dragging ? "Drop to add" : files.length ? "Add more files" : "Drop files here"}</p>
                      <p className="mt-1 text-small text-ink-3">
                        or{" "}
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          className="rounded-[4px] font-medium text-ink underline decoration-line-strong underline-offset-4 outline-none hover:decoration-ink focus-visible:ring-2 focus-visible:ring-seal/45"
                        >
                          choose from your device
                        </button>
                        . You can also paste an image.
                      </p>
                    </div>
                    <input
                      ref={inputRef}
                      id={`${ids}-input`}
                      type="file"
                      multiple
                      className="sr-only"
                      tabIndex={-1}
                      aria-hidden="true"
                      onChange={(event) => {
                        addFiles(Array.from(event.target.files ?? []));
                        event.target.value = "";
                      }}
                    />
                  </div>

                  {files.length ? (
                    <ul aria-label="Files to send" className="divide-y divide-line overflow-hidden rounded-field border border-line">
                      {files.map((file) => (
                        <li key={fileKey(file)} className="flex animate-fade-in items-center gap-3 bg-surface px-3 py-2.5">
                          <FileTile name={file.name} type={file.type} blob={file} size={36} />
                          <div className="min-w-0 flex-1">
                            <FileName name={file.name} className="text-[14px]" />
                            <p className="tabular text-meta text-ink-3">{formatSize(file.size)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove ${file.name}`}
                            onClick={() => removeFile(file)}
                          >
                            <X aria-hidden="true" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {/* Size meter */}
                  <div className="flex flex-col gap-1.5" aria-live="polite">
                    <div className="flex items-baseline justify-between gap-3 text-small">
                      <span className={cn("tabular", over ? "font-medium text-danger" : "text-ink-2")}>
                        {formatSize(totalBytes)} <span className="text-ink-3">of 25 MB</span>
                      </span>
                      <span className="tabular text-ink-3">{files.length ? plural(files.length, "file") : "No files yet"}</span>
                    </div>
                    <ProgressBar value={totalBytes} max={MAX_DROP_PLAINTEXT_BYTES} label="Total size against the 25 MB limit" tone={meterTone} />
                    {over ? (
                      <p className="flex items-start gap-1.5 text-small text-danger">
                        <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
                        {formatSize(overBy)} over the limit. Remove a file to continue.
                      </p>
                    ) : null}
                  </div>
                </div>

                <Field
                  label="Message"
                  htmlFor={`${ids}-message`}
                  optional
                  hint={
                    message.length > MAX_DROP_MESSAGE * 0.8
                      ? `${message.length.toLocaleString()} / ${MAX_DROP_MESSAGE.toLocaleString()} characters`
                      : "Encrypted with the files. Shown to whoever opens the link."
                  }
                  error={message.length > MAX_DROP_MESSAGE ? `Keep it under ${MAX_DROP_MESSAGE.toLocaleString()} characters.` : undefined}
                >
                  <Textarea
                    rows={3}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Here are the contracts. The password for the PDF is on the call."
                  />
                </Field>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <span id={`${ids}-limit-label`} className="text-small font-medium text-ink">
                      Download limit
                    </span>
                    <Segmented
                      value={limit}
                      onChange={setLimit}
                      options={LIMIT_OPTIONS}
                      aria-labelledby={`${ids}-limit-label`}
                      aria-describedby={`${ids}-limit-hint`}
                      fullWidth
                    />
                    {limit === "custom" ? (
                      <div className="mt-1 animate-fade-in">
                        <label htmlFor={`${ids}-limit-custom`} className="sr-only">
                          Number of downloads, 1 to 100
                        </label>
                        <Input
                          id={`${ids}-limit-custom`}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={100}
                          value={customLimit}
                          invalid={!limitValid}
                          onChange={(event) => setCustomLimit(event.target.value)}
                          className="tabular"
                        />
                      </div>
                    ) : null}
                    <p id={`${ids}-limit-hint`} className={cn("text-small", limitValid ? "text-ink-3" : "text-danger")}>
                      {!limitValid
                        ? "Pick a number from 1 to 100."
                        : limitNumber === 1
                          ? "One download. It counts when it starts, and the files are deleted when it finishes."
                          : `${limitNumber} downloads. Each counts when it starts; the files are deleted after the last one.`}
                    </p>
                  </div>
                  <ExpiryPicker {...expiry.pickerProps} id={`${ids}-expiry`} hint="Deleted at this time even if nobody downloads it." />
                </div>

                <Field
                  label="Name in My links"
                  htmlFor={`${ids}-label`}
                  optional
                  hint="Kept only in this browser so you can find this drop later. Never sent."
                >
                  <Input
                    value={label}
                    maxLength={40}
                    onChange={(event) => setLabel(event.target.value)}
                    placeholder={files.length ? makeLinkLabel(fileNames) : "Q3 contracts for Dana"}
                  />
                </Field>

                {formError ? (
                  <p role="alert" className="flex items-start gap-1.5 text-small text-danger">
                    <CircleAlert aria-hidden="true" className="mt-px size-4 shrink-0" />
                    {formError}
                  </p>
                ) : null}
              </PanelBody>
            )}

            {!busy ? (
              <PanelFooter>
                <span className="text-small text-ink-3">Encrypted in this tab before anything is uploaded.</span>
                <Button type="submit" size="lg" disabled={!session || files.length === 0 || over || message.length > MAX_DROP_MESSAGE} className="w-full sm:w-auto">
                  <Lock aria-hidden="true" />
                  Encrypt and upload
                </Button>
              </PanelFooter>
            ) : null}
          </Panel>
        </form>
      )}

      <ConfirmDialog
        open={confirmRevoke}
        tone="danger"
        title="Delete this drop?"
        description="The encrypted files are deleted from the server now. Anyone who opens the link will see that it's gone."
        confirmLabel="Delete drop"
        loading={revoking}
        onConfirm={() => void revokeNow()}
        onCancel={() => setConfirmRevoke(false)}
      />
    </ToolLayout>
  );
}

function UploadPanel({
  files,
  progress,
  rate,
  error,
  onRetry,
  onCancel,
}: {
  files: File[];
  progress: TransferProgress | null;
  rate: number;
  error: string | null;
  onRetry: () => void;
  onCancel: () => void;
}) {
  const sealing = !error && progress && progress.chunksDone === progress.chunkCount;
  const total = files.reduce((sum, file) => sum + file.size, 0);
  const toPlain = (bytes: number) => (progress && progress.total > 0 ? Math.round((bytes / progress.total) * total) : bytes);
  return (
    <>
      <PanelBody className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          {error ? (
            <span className="flex size-8 items-center justify-center rounded-full bg-danger-soft text-danger">
              <CircleAlert aria-hidden="true" className="size-4" />
            </span>
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-surface-2 text-ink-2">
              <Spinner size={16} />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink" role="status">
              {error ? "Upload paused" : sealing ? "Sealing the drop" : "Encrypting and uploading"}
            </h2>
            <p className="text-small text-ink-3">
              {error ? error : "Each 1 MB piece is encrypted here, then sent. Keep this tab open."}
            </p>
          </div>
        </div>

        <TransferMeter progress={progress} rate={error ? 0 : rate} verb="Upload progress" display={toPlain} />

        <ul aria-label="Files being sent" className="flex flex-col gap-2">
          {files.slice(0, 6).map((file) => (
            <li key={fileKey(file)} className="flex items-center gap-3">
              <FileTile name={file.name} type={file.type} blob={file} size={28} className="rounded-[7px] [&_svg]:size-[15px]" />
              <FileName name={file.name} className="flex-1 text-small font-normal text-ink-2" />
              <span className="tabular shrink-0 text-meta text-ink-3">{formatSize(file.size)}</span>
            </li>
          ))}
          {files.length > 6 ? <li className="pl-10 text-small text-ink-3">and {files.length - 6} more</li> : null}
        </ul>
      </PanelBody>
      <PanelFooter>
        <span className="text-small text-ink-3">
          {error ? "Pieces that already arrived are kept. Trying again sends the rest." : "Cancelling deletes anything already uploaded."}
        </span>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button type="button" variant={error ? "ghost" : "secondary"} onClick={onCancel} className="flex-1 sm:flex-none">
            <X aria-hidden="true" />
            Cancel upload
          </Button>
          {error ? (
            <Button type="button" onClick={onRetry} className="flex-1 sm:flex-none">
              <RotateCw aria-hidden="true" />
              Try again
            </Button>
          ) : null}
        </div>
      </PanelFooter>
    </>
  );
}

