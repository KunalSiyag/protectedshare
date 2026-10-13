"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  Bell,
  BellRing,
  Check,
  Copy,
  FileLock,
  FileUp,
  Flame,
  Inbox,
  KeyRound,
  Laptop,
  Link2,
  QrCode as QrIcon,
  RotateCw,
  Search,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { type ManageBatchItem, type ManageBatchResponse, type ManageStatusResponse } from "@protectedshare/contracts";
import { MANAGE_TOKEN_HEADER } from "@protectedshare/contracts/constants";
import { Button, Input, Panel, Segmented, Spinner, StatusChip, buttonVariants, cn, type Tone } from "@protectedshare/ui";
import AppLink from "../../components/app-link";
import ConfirmDialog from "../../components/confirm-dialog";
import CopyField from "../../components/copy-field";
import EmptyState from "../../components/empty-state";
import ModalDialog from "../../components/modal-dialog";
import QrCode from "../../components/qr-code";
import ToolLayout, { ToolNotes } from "../../components/tool-layout";
import { useToast } from "../../components/toast";
import { apiUrl } from "../../lib/api";
import { copyText } from "../../lib/clipboard";
import { addLink, clearLinks, removeLink, useMyLinks, type MyLink, type MyLinkKind } from "../../lib/my-links";
import {
  forgetWatched,
  pruneWatched,
  refreshServiceWorker,
  unwatchLink,
  usePushAvailability,
  useWatchedKeys,
  watchLink,
  type WatchResult,
} from "../../lib/push";

const REFRESH_MS = 20_000;
const BATCH = 50;

type StatusEntry = ManageBatchItem | { kind: MyLinkKind; id: string; status: "error" };
type Filter = "all" | "active" | "done";

const KIND: Record<MyLinkKind, { icon: LucideIcon; name: string; untitled: string; unit: [string, string] }> = {
  note: { icon: FileLock, name: "Secure note", untitled: "Untitled note", unit: ["open", "opens"] },
  secret: { icon: KeyRound, name: "EnvShare", untitled: "Untitled secret", unit: ["read", "reads"] },
  drop: { icon: FileUp, name: "File drop", untitled: "Untitled files", unit: ["download", "downloads"] },
  request: { icon: Inbox, name: "Secret request", untitled: "Untitled request", unit: ["answer", "answers"] },
};

const keyOf = (kind: string, id: string) => `${kind}:${id}`;

/* ───────────── time ───────────── */

function relative(ms: number, now: number): string {
  const diff = ms - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (abs < 45_000) return diff > 0 ? "in a moment" : "just now";
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), "hour");
  return rtf.format(Math.round(diff / 86_400_000), "day");
}

function clock(ms: number): string {
  const date = new Date(ms);
  const sameDay = new Date().toDateString() === date.toDateString();
  return new Intl.DateTimeFormat(undefined, sameDay ? { timeStyle: "short" } : { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/* ───────────── status ───────────── */

type Described = {
  tone: Tone;
  label: string;
  icon?: React.ReactNode;
  pulse?: boolean;
  detail?: string;
  done: boolean;
  revocable: boolean;
};

function isFull(entry: StatusEntry | undefined): entry is ManageStatusResponse {
  return Boolean(entry && "reads" in entry);
}

function describe(link: MyLink, entry: StatusEntry | undefined, now: number): Described {
  const locallyExpired = link.expiresAt <= now;
  if (!entry) {
    return { tone: "neutral", label: "Checking", done: locallyExpired, revocable: false };
  }
  if (entry.status === "error") {
    return locallyExpired
      ? { tone: "neutral", label: "Expired", done: true, revocable: false }
      : { tone: "neutral", label: "Status unavailable", detail: "Couldn't reach the server. Retrying.", done: false, revocable: true };
  }
  if (entry.status === "not_found") {
    return locallyExpired
      ? { tone: "neutral", label: "Expired", detail: "The server's record is gone.", done: true, revocable: false }
      : { tone: "warn", label: "Not found", detail: "The server has no record of this link.", done: true, revocable: false };
  }
  if (!isFull(entry)) return { tone: "neutral", label: "Unknown", done: true, revocable: false };

  const last = entry.lastReadAt ? entry.lastReadAt * 1000 : null;
  if (entry.status === "revoked") return { tone: "danger", label: "Revoked", detail: "You deleted it. The link no longer opens.", done: true, revocable: false };
  if (entry.status === "expired") {
    return {
      tone: "neutral",
      label: "Expired",
      detail: entry.reads > 0 && last ? `Last opened ${clock(last)}` : "Never opened",
      done: true,
      revocable: false,
    };
  }
  if (entry.status === "consumed") {
    const when = last ? clock(last) : null;
    const labels: Record<MyLinkKind, string> = { note: "Burned", secret: "All reads used", drop: "All downloads used", request: "Collected" };
    const details: Record<MyLinkKind, string> = {
      note: when ? `Opened ${when}, then deleted` : "Opened, then deleted",
      secret: when ? `Last read ${when}, then deleted` : "Deleted after the last read",
      drop: when ? `Last download ${when}, then deleted` : "Deleted after the last download",
      request: "You collected the answer. It's deleted from the server.",
    };
    return { tone: "ok", label: labels[link.kind], icon: <Flame aria-hidden="true" />, detail: details[link.kind], done: true, revocable: false };
  }
  // active
  if (entry.reads > 0 && last) {
    if (link.kind === "request") return { tone: "ok", label: "Answer waiting", detail: `Answered ${clock(last)}. Open your inbox.`, done: false, revocable: true };
    return { tone: "ok", label: `Opened ${clock(last)}`, done: false, revocable: true };
  }
  return { tone: "seal", label: link.kind === "request" ? "Waiting for answer" : "Active", detail: link.kind === "request" ? undefined : "Not opened yet", done: false, revocable: true };
}

function readsLine(link: MyLink, entry: StatusEntry | undefined): string | null {
  if (!isFull(entry) || link.kind === "request") return null;
  const [one, many] = KIND[link.kind].unit;
  if (entry.maxReads) return `${entry.reads} of ${entry.maxReads} ${entry.maxReads === 1 ? one : many}`;
  return `${entry.reads} ${entry.reads === 1 ? one : many}`;
}

/* ───────────── API ───────────── */

async function fetchStatuses(links: readonly MyLink[]): Promise<Map<string, StatusEntry>> {
  const map = new Map<string, StatusEntry>();
  for (let start = 0; start < links.length; start += BATCH) {
    const slice = links.slice(start, start + BATCH);
    try {
      const response = await fetch(apiUrl("/api/manage/batch"), {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: slice.map((link) => ({ kind: link.kind, id: link.id, token: link.manageToken })) }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as ManageBatchResponse;
      data.items.forEach((item, index) => {
        const link = slice[index];
        if (link) map.set(keyOf(link.kind, link.id), item);
      });
    } catch {
      slice.forEach((link) => map.set(keyOf(link.kind, link.id), { kind: link.kind, id: link.id, status: "error" }));
    }
  }
  return map;
}

/* ───────────── pieces ───────────── */

function IconAction({
  label,
  onClick,
  children,
  tone = "default",
  pressed,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "default" | "danger";
  /** Makes it a toggle button (aria-pressed). */
  pressed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      title={label}
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-control text-ink-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-seal/45 disabled:opacity-45 [&_svg]:size-4",
        tone === "danger" ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-ink/[0.05] hover:text-ink",
        pressed && "bg-ink/[0.06] text-ink"
      )}
    >
      {children}
    </button>
  );
}

const WATCH_VERB: Record<MyLinkKind, string> = { note: "opened", secret: "opened", drop: "downloaded", request: "answered" };

const WATCH_TOASTS: Record<Exclude<WatchResult, "on">, { title: string; description: string }> = {
  denied: { title: "Notifications are blocked", description: "Allow them for this site in your browser's settings, then try again." },
  closed: { title: "Nothing left to watch", description: "This link is already used up or expired." },
  limit: { title: "Already at the limit", description: "A link can notify up to 5 browsers." },
  unavailable: { title: "Notifications aren't available", description: "This browser can't show them." },
  failed: { title: "Couldn't turn on notifications", description: "Your browser couldn't set them up. Try again in a moment." },
};

type WatchControl = { on: boolean; busy: boolean; onToggle: () => void };

/** Bell: "Notify me when it's opened" for one row (Web Push through this browser). */
function WatchButton({ kind, watch }: { kind: MyLinkKind; watch: WatchControl }) {
  return (
    <IconAction
      label={watch.on ? "Stop notifications for this link" : `Notify me when it's ${WATCH_VERB[kind]}`}
      onClick={watch.onToggle}
      pressed={watch.on}
      disabled={watch.busy}
    >
      {watch.on ? <BellRing aria-hidden="true" /> : <Bell aria-hidden="true" />}
    </IconAction>
  );
}

function CopyLinkButton({ url }: { url: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  return (
    <Button
      variant="secondary"
      size="sm"
      className="h-8 px-2.5"
      onClick={async () => {
        const ok = await copyText(url);
        setState(ok ? "ok" : "fail");
        window.setTimeout(() => setState("idle"), 1600);
      }}
    >
      {state === "ok" ? <Check aria-hidden="true" className="text-ok" /> : <Copy aria-hidden="true" />}
      {state === "ok" ? "Copied" : state === "fail" ? "Copy failed" : "Copy link"}
    </Button>
  );
}

function LinkRow({
  link,
  entry,
  now,
  onQr,
  onRevoke,
  onForget,
  watch,
}: {
  link: MyLink;
  entry: StatusEntry | undefined;
  now: number;
  onQr: () => void;
  onRevoke: () => void;
  onForget: () => void;
  /** Present when this browser can do read notifications. */
  watch?: WatchControl;
}) {
  const meta = KIND[link.kind];
  const Icon = meta.icon;
  const status = describe(link, entry, now);
  const reads = readsLine(link, entry);
  const expired = link.expiresAt <= now;
  const forgetButton = (
    <IconAction label="Forget: remove from this list only" onClick={onForget}>
      <X aria-hidden="true" />
    </IconAction>
  );

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:px-5 lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[9px] border border-line bg-surface-2/60 text-ink-2">
          <Icon aria-hidden="true" className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-ui font-medium", link.label ? "text-ink" : "text-ink-2")}>{link.label || meta.untitled}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-meta text-ink-3">
            <span>{meta.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{link.id}</span>
            <span aria-hidden="true">·</span>
            <span title={new Date(link.createdAt).toLocaleString()}>Created {relative(link.createdAt, now)}</span>
          </p>
        </div>
        <span className="-mr-1.5 -mt-1 lg:hidden">{forgetButton}</span>
      </div>

      <div className="flex min-w-0 flex-col items-start gap-1 pl-12 lg:pl-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip tone={status.tone} icon={status.icon} pulse={status.pulse}>
            {status.label}
          </StatusChip>
          {reads ? <span className="tabular text-meta text-ink-3">{reads}</span> : null}
        </div>
        <p className="text-meta text-ink-3">
          {status.detail ? <span>{status.detail}{status.done ? "" : ". "}</span> : null}
          {!status.done ? (
            <span title={new Date(link.expiresAt).toLocaleString()}>
              {expired ? "Expired" : "Expires"} {relative(link.expiresAt, now)}
            </span>
          ) : null}
        </p>
      </div>

      <div className={cn("flex-wrap items-center gap-1 pl-12 lg:flex lg:justify-end lg:pl-0", status.done && link.kind !== "request" ? "hidden" : "flex")}>
        {link.kind === "request" && link.inboxUrl ? (
          <a href={link.inboxUrl} className={buttonVariants({ variant: "secondary", size: "sm", className: "h-8 px-2.5" })}>
            <Inbox aria-hidden="true" />
            Open inbox
          </a>
        ) : null}
        {!status.done ? <CopyLinkButton url={link.url} /> : null}
        {!status.done ? (
          <IconAction label="Show QR code" onClick={onQr}>
            <QrIcon aria-hidden="true" />
          </IconAction>
        ) : null}
        {!status.done && watch ? <WatchButton kind={link.kind} watch={watch} /> : null}
        {status.revocable ? (
          <IconAction label="Revoke: delete it from the server" onClick={onRevoke} tone="danger">
            <Trash2 aria-hidden="true" />
          </IconAction>
        ) : null}
        <span className="hidden lg:inline-flex">{forgetButton}</span>
      </div>
    </li>
  );
}

/* ───────────── page ───────────── */

export default function LinksClient() {
  const uid = useId();
  const links = useMyLinks();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [statuses, setStatuses] = useState<Map<string, StatusEntry>>(new Map());
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [qrFor, setQrFor] = useState<MyLink | null>(null);
  const [revokeFor, setRevokeFor] = useState<MyLink | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const pushAvailability = usePushAvailability();
  const watched = useWatchedKeys();
  const [watchBusy, setWatchBusy] = useState<ReadonlySet<string>>(() => new Set());
  const latest = useRef(links);
  latest.current = links;

  useEffect(() => setMounted(true), []);

  // Keeps an existing /share-target worker current (it shows notifications) without registering
  // one, and drops the labels of expired links from its IndexedDB mirror.
  useEffect(() => {
    void refreshServiceWorker();
    void pruneWatched();
  }, []);

  const refresh = useCallback(async () => {
    const current = latest.current;
    if (current.length === 0) return;
    setLoading(true);
    const map = await fetchStatuses(current);
    setStatuses((previous) => {
      const next = new Map(previous);
      map.forEach((value, key) => next.set(key, value));
      return next;
    });
    setUpdatedAt(Date.now());
    setNow(Date.now());
    setLoading(false);
  }, []);

  const idsKey = links.map((link) => keyOf(link.kind, link.id)).join(",");
  useEffect(() => {
    void refresh();
  }, [idsKey, refresh]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = window.setInterval(tick, REFRESH_MS);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 15_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(clockTimer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);

  const described = useMemo(
    () => links.map((link) => ({ link, entry: statuses.get(keyOf(link.kind, link.id)), status: describe(link, statuses.get(keyOf(link.kind, link.id)), now) })),
    [links, statuses, now]
  );

  // A finished link has no watch left on the server; forget its local label too.
  useEffect(() => {
    if (!watched || watched.size === 0) return;
    for (const { link, status } of described) {
      if (status.done && watched.has(keyOf(link.kind, link.id))) void forgetWatched(link.kind, link.id);
    }
  }, [described, watched]);

  const toggleWatch = async (link: MyLink) => {
    const key = keyOf(link.kind, link.id);
    const wasOn = watched?.has(key) ?? false;
    setWatchBusy((previous) => new Set(previous).add(key));
    try {
      if (wasOn) {
        toast(
          (await unwatchLink(link))
            ? { title: "Notifications off", description: "You won't hear about this link anymore." }
            : { title: "Couldn't turn notifications off", description: "The server didn't respond. Nothing changed. Try again.", tone: "danger" }
        );
      } else {
        // First await inside watchLink is the permission prompt, so it still counts as this click.
        const result = await watchLink(link);
        toast(
          result === "on"
            ? { title: "Notifications on", description: `Your browser will tell you when it's ${WATCH_VERB[link.kind]}.`, tone: "ok" }
            : { ...WATCH_TOASTS[result], tone: result === "closed" || result === "limit" ? "neutral" : "danger" }
        );
      }
    } finally {
      setWatchBusy((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
    }
  };

  const watchFor = (link: MyLink): WatchControl | undefined => {
    if (pushAvailability !== "available" || !watched) return undefined;
    const key = keyOf(link.kind, link.id);
    return { on: watched.has(key), busy: watchBusy.has(key), onToggle: () => void toggleWatch(link) };
  };
  const counts = {
    all: described.length,
    active: described.filter((row) => !row.status.done).length,
    done: described.filter((row) => row.status.done).length,
  };
  const needle = query.trim().toLowerCase();
  const visible = described.filter(
    (row) =>
      (filter === "all" || (filter === "active" ? !row.status.done : row.status.done)) &&
      (!needle || `${row.link.label} ${KIND[row.link.kind].untitled} ${KIND[row.link.kind].name} ${row.link.id}`.toLowerCase().includes(needle))
  );

  const revoke = async () => {
    if (!revokeFor) return;
    const link = revokeFor;
    setRevoking(true);
    try {
      const response = await fetch(apiUrl(`/api/manage/${link.kind}/${encodeURIComponent(link.id)}`), {
        method: "DELETE",
        cache: "no-store",
        headers: { [MANAGE_TOKEN_HEADER]: link.manageToken },
      });
      if (response.status === 404) {
        setStatuses((prev) => new Map(prev).set(keyOf(link.kind, link.id), { kind: link.kind, id: link.id, status: "not_found" }));
        toast({ title: "Already gone", description: "The server has no record of it anymore.", tone: "neutral" });
      } else if (!response.ok) {
        throw new Error(String(response.status));
      } else {
        const data = (await response.json()) as ManageStatusResponse;
        setStatuses((prev) => new Map(prev).set(keyOf(link.kind, link.id), data));
        // Revoking also ends its notifications on the server.
        void forgetWatched(link.kind, link.id);
        toast({ title: "Link revoked", description: "It's deleted from the server. The link won't open anymore.", tone: "ok" });
      }
      setRevokeFor(null);
    } catch {
      toast({ title: "Couldn't revoke", description: "The server didn't respond. Nothing changed. Try again.", tone: "danger" });
    } finally {
      setRevoking(false);
    }
  };

  const forget = (link: MyLink) => {
    // Without the row there'd be no way to turn its notifications off, so they end here too.
    const wasWatched = watched?.has(keyOf(link.kind, link.id)) ?? false;
    if (wasWatched) void unwatchLink(link);
    removeLink(link.kind, link.id);
    toast({
      title: "Removed from this list",
      description: wasWatched
        ? "The link itself still works until it expires. Its notifications are off."
        : "The link itself still works until it expires.",
      action: { label: "Undo", onClick: () => addLink(link) },
    });
  };

  const statement = (
    <div className="flex items-start gap-3 rounded-panel border border-line bg-surface px-4 py-3.5">
      <Laptop aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-2" strokeWidth={1.75} />
      <p className="text-small text-ink-2">
        <span className="font-medium text-ink">Saved only in this browser.</span> Clear your browser data and this list is gone; the
        links still work until they expire.
      </p>
    </div>
  );

  let content: React.ReactNode;
  if (!mounted) {
    content = (
      <Panel aria-busy="true" className="flex items-center gap-3 px-5 py-8 text-small text-ink-3">
        <Spinner /> Loading your links…
      </Panel>
    );
  } else if (links.length === 0) {
    content = (
      <EmptyState
        icon={Link2}
        title="No links on this device yet"
        description="Shares you create in this browser show up here, with whether they've been opened. Nothing is synced anywhere."
        action={
          <>
            <AppLink href="/notes" className={buttonVariants({ size: "sm" })}>
              <FileLock aria-hidden="true" /> Secure note
            </AppLink>
            <AppLink href="/secrets" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <KeyRound aria-hidden="true" /> EnvShare
            </AppLink>
            <AppLink href="/files" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <FileUp aria-hidden="true" /> File drop
            </AppLink>
            <AppLink href="/request" className={buttonVariants({ variant: "secondary", size: "sm" })}>
              <Inbox aria-hidden="true" /> Secret request
            </AppLink>
          </>
        }
      />
    );
  } else {
    content = (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            value={filter}
            onChange={setFilter}
            aria-label="Filter links"
            options={[
              { value: "all", label: <>All <span className="tabular text-ink-3">{counts.all}</span></> },
              { value: "active", label: <>Active <span className="tabular text-ink-3">{counts.active}</span></> },
              { value: "done", label: <>Done <span className="tabular text-ink-3">{counts.done}</span></> },
            ]}
          />
          <div className="relative sm:w-[260px]">
            <label htmlFor={`${uid}-search`} className="sr-only">
              Search by label
            </label>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <Input
              id={`${uid}-search`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by label"
              className="pl-9"
              autoComplete="off"
            />
          </div>
        </div>

        <Panel className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2/40 px-4 py-2.5 sm:px-5">
            <p className="text-meta text-ink-3" aria-live="polite">
              {loading ? "Checking status…" : updatedAt ? `Status checked ${relative(updatedAt, Math.max(now, updatedAt))}. Refreshes every 20 seconds.` : " "}
            </p>
            <Button variant="ghost" size="sm" className="-mr-2 h-7 px-2 text-meta" onClick={() => void refresh()} disabled={loading}>
              <RotateCw aria-hidden="true" className={cn("!size-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
          {visible.length > 0 ? (
            <ul className="divide-y divide-line">
              {visible.map(({ link, entry }) => (
                <LinkRow
                  key={keyOf(link.kind, link.id)}
                  link={link}
                  entry={entry}
                  now={now}
                  onQr={() => setQrFor(link)}
                  onRevoke={() => setRevokeFor(link)}
                  onForget={() => forget(link)}
                  watch={watchFor(link)}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              compact
              icon={Search}
              title={needle ? "No labels match" : filter === "active" ? "Nothing active" : "Nothing finished yet"}
              description={needle ? "Labels are the names you gave links when you created them." : undefined}
            />
          )}
        </Panel>
      </div>
    );
  }

  return (
    <ToolLayout
      meta={<div className="w-full lg:hidden">{statement}</div>}
      eyebrow="This device"
      title="My links"
      description="Everything you've shared from this browser, and whether it's been opened. Revoke anything you no longer want out there."
      aside={
        <>
          <div className="hidden lg:block">{statement}</div>
          <ToolNotes
            title="How status works"
            items={[
              "Each link has a manage token kept in this list. The server stores only its hash and answers status checks with no content.",
              "Opened times come from the server's read receipt. It knows when, not who.",
              "Revoke deletes the ciphertext now. Forget only removes the row here.",
              "Receipts are kept until 30 days after a link expires, then purged.",
              ...(pushAvailability === "available"
                ? [
                    "The bell turns on a notification for the first open and for the last read or download. Your browser's push service delivers it. The server keeps the push address until the link is used up or expires.",
                  ]
                : pushAvailability === "home-screen"
                  ? ["On iPhone and iPad, open notifications work only in the Home Screen app: tap Share, then Add to Home Screen."]
                  : []),
            ]}
          />
          {mounted && links.length > 0 ? (
            <div className="px-1">
              <Button variant="ghost" size="sm" className="-ml-3 text-danger hover:bg-danger-soft hover:text-danger" onClick={() => setConfirmClear(true)}>
                <Trash2 aria-hidden="true" />
                Clear this list
              </Button>
            </div>
          ) : null}
        </>
      }
    >
      {content}

      {qrFor ? (
        <ModalDialog
          titleId={`${uid}-qr-title`}
          onClose={() => setQrFor(null)}
          panelClassName="relative w-full max-w-[400px] animate-rise rounded-panel border border-line bg-surface p-5 shadow-float"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id={`${uid}-qr-title`} className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink">
                {qrFor.label || KIND[qrFor.kind].untitled}
              </h2>
              <p className="mt-0.5 text-small text-ink-3">Scan to open on another device. The code holds the full link, key included.</p>
            </div>
            <IconAction label="Close" onClick={() => setQrFor(null)}>
              <X aria-hidden="true" />
            </IconAction>
          </div>
          <div className="mt-4 flex justify-center">
            <QrCode value={qrFor.url} size={220} />
          </div>
          <CopyField className="mt-4" value={qrFor.url} label="Link" />
        </ModalDialog>
      ) : null}

      <ConfirmDialog
        open={Boolean(revokeFor)}
        tone="danger"
        title="Revoke this link?"
        description="The ciphertext is deleted from the server now. Anyone who opens the link will see that it's gone. This can't be undone."
        confirmLabel="Revoke link"
        loading={revoking}
        onConfirm={() => void revoke()}
        onCancel={() => setRevokeFor(null)}
      />
      <ConfirmDialog
        open={confirmClear}
        tone="danger"
        title="Clear this list?"
        description="This only empties the list in this browser. The links keep working until they expire, and you won't be able to revoke them from here."
        confirmLabel="Clear list"
        onConfirm={() => {
          // The manage tokens go with the list, so end any notifications while they still can be.
          for (const link of links) {
            if (watched?.has(keyOf(link.kind, link.id))) void unwatchLink(link);
          }
          clearLinks();
          setStatuses(new Map());
          setConfirmClear(false);
          toast({ title: "List cleared", description: "The links themselves still work until they expire." });
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </ToolLayout>
  );
}
