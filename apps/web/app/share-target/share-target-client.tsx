"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileLock, FileUp, Share2, Trash2, type LucideIcon } from "lucide-react";
import { Button, Panel, Spinner, buttonVariants } from "@protectedshare/ui";
import AppLink from "../../components/app-link";
import EmptyState from "../../components/empty-state";
import QuickShare from "../../components/home/quick-share";
import { formatSize } from "../../lib/file-drop";
import { isStandalone, refreshServiceWorker, registerServiceWorker } from "../../lib/push";
import { approveSharedItem, clearSharedItem, peekSharedItem, sharedText } from "./inbox";

type View =
  | { phase: "loading" }
  | { phase: "review"; text: string; files: File[]; at: number }
  | { phase: "files" }
  | { phase: "text"; text: string }
  | { phase: "empty" }
  | { phase: "discarded" }
  | { phase: "setup"; ready: boolean }
  | { phase: "unreadable" };

type Review = Extract<View, { phase: "review" }>;

function Intro() {
  return (
    <>
      <p className="eyebrow mb-3">Shared to ProtectedShare</p>
      <h1 className="text-[32px] font-semibold leading-[36px] tracking-[-0.035em] text-ink sm:text-h1">Seal what you shared.</h1>
      <p className="mt-3 max-w-[560px] text-[16px] leading-[25px] text-ink-2 sm:text-lead">
        It&apos;s still only on this device. Check it, then create a link: it&apos;s encrypted here before anything is sent.
      </p>
    </>
  );
}

const toolLinks = (
  <>
    <AppLink href="/notes" className={buttonVariants({ size: "sm" })}>
      <FileLock aria-hidden="true" /> Secure note
    </AppLink>
    <AppLink href="/files" className={buttonVariants({ variant: "secondary", size: "sm" })}>
      <FileUp aria-hidden="true" /> File drop
    </AppLink>
  </>
);

function Message({ icon = Share2, title, children }: { icon?: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[640px]">
      <h1 className="sr-only">Share to ProtectedShare</h1>
      <EmptyState icon={icon} title={title} description={children} action={toolLinks} />
    </main>
  );
}

/**
 * What arrived, shown as plain text and a file list, before anything else happens. Any website can
 * post to the share target, so nothing moves on to a composer or to File drop without a click here.
 */
function ReviewShare({
  review,
  busy,
  onNote,
  onFiles,
  onDiscard,
}: {
  review: Review;
  busy: boolean;
  onNote: () => void;
  onFiles: () => void;
  onDiscard: () => void;
}) {
  const { text, files } = review;
  return (
    <main className="mx-auto w-full max-w-[640px]">
      <p className="eyebrow mb-3">Shared to ProtectedShare</p>
      <h1 className="text-[32px] font-semibold leading-[36px] tracking-[-0.035em] text-ink sm:text-h1">Check what arrived.</h1>
      <p className="mt-3 max-w-[560px] text-[16px] leading-[25px] text-ink-2 sm:text-lead">
        This arrived from another app or website. Check it before you seal anything. It&apos;s only on this device, and
        nothing is sent until you create a link.
      </p>
      <Panel className="mt-6 divide-y divide-line">
        {text ? (
          <section aria-labelledby="shared-text-heading" className="px-5 py-4">
            <h2 id="shared-text-heading" className="eyebrow mb-2">
              Text
            </h2>
            <p className="max-h-60 overflow-y-auto whitespace-pre-wrap break-words text-small text-ink">{text}</p>
          </section>
        ) : null}
        {files.length > 0 ? (
          <section aria-labelledby="shared-files-heading" className="px-5 py-4">
            <h2 id="shared-files-heading" className="eyebrow mb-2">
              {files.length === 1 ? "1 file" : `${files.length} files`}
            </h2>
            <ul className="flex flex-col gap-1.5">
              {files.map((file, index) => (
                <li key={index} className="flex items-baseline justify-between gap-3 text-small">
                  <span className="min-w-0 truncate text-ink">{file.name || "Unnamed file"}</span>
                  <span className="tabular shrink-0 font-mono text-[11px] text-ink-3">{formatSize(file.size)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Panel>
      <div className="mt-5 flex flex-wrap gap-2">
        {files.length > 0 ? (
          <Button onClick={onFiles} loading={busy}>
            <FileUp aria-hidden="true" /> Continue to File drop
          </Button>
        ) : null}
        {text ? (
          <Button variant={files.length > 0 ? "secondary" : "primary"} onClick={onNote} disabled={busy}>
            <FileLock aria-hidden="true" /> {files.length > 0 ? "Seal the text as a note" : "Continue to secure note"}
          </Button>
        ) : null}
        <Button variant="ghost" onClick={onDiscard} disabled={busy}>
          <Trash2 aria-hidden="true" /> Discard
        </Button>
      </div>
    </main>
  );
}

/**
 * Shows what was shared for review first. On a click, text goes into the note composer and files go
 * on to File drop (which takes them from IndexedDB only once this page has approved them). Text is
 * cleared from this device as soon as it's read; files when File drop takes them or on Discard.
 */
export default function ShareTargetClient() {
  const router = useRouter();
  const [view, setView] = useState<View>({ phase: "loading" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    const error = new URLSearchParams(window.location.search).get("error");

    void (async () => {
      // After the first await, so the App Router (whose effects run after this one) owns history
      // by then and keeps the cleaned URL instead of restoring ?error=.
      await null;
      if (error && live) window.history.replaceState(null, "", "/share-target");
      if (error === "sw") {
        // The service worker wasn't running, so the POST went to the server's fallback, which read
        // nothing. The installed app sets the worker up now; a browser tab (a link, or another site
        // posting here) doesn't get one.
        if (!isStandalone()) {
          if (live) setView({ phase: "empty" });
          return;
        }
        const ready = await registerServiceWorker().then(Boolean, () => false);
        if (live) setView({ phase: "setup", ready });
        return;
      }
      // The worker that handled this share keeps itself current; this never registers one.
      void refreshServiceWorker();
      if (error) {
        if (live) setView({ phase: "unreadable" });
        return;
      }
      const item = await peekSharedItem();
      if (!live) return;
      const text = item ? sharedText(item) : "";
      const files = item?.files ?? [];
      // Without files, the item is cleared as soon as it's read; the text stays in this page only.
      if (item && files.length === 0) await clearSharedItem();
      if (!live) return;
      setView(item && (text || files.length > 0) ? { phase: "review", text, files, at: item.at } : { phase: "empty" });
    })();

    return () => {
      live = false;
    };
  }, []);

  const continueToNote = (review: Review) => {
    // Choosing the note leaves any files behind: clear them now rather than after 15 minutes.
    if (review.files.length > 0) void clearSharedItem();
    setView({ phase: "text", text: review.text });
  };

  const continueToFiles = async (review: Review) => {
    setBusy(true);
    const approved = await approveSharedItem(review.at);
    setBusy(false);
    if (!approved) {
      // Expired, already taken, or replaced by a newer share: nothing approved goes on.
      setView({ phase: "empty" });
      return;
    }
    setView({ phase: "files" });
    router.replace("/files?from=share");
  };

  const discard = () => {
    void clearSharedItem();
    setView({ phase: "discarded" });
  };

  switch (view.phase) {
    case "loading":
    case "files":
      return (
        <main className="mx-auto w-full max-w-[640px]">
          <Panel aria-busy="true" className="flex items-center gap-3 px-5 py-8 text-small text-ink-3">
            <Spinner /> {view.phase === "files" ? "Taking your files to File drop…" : "Opening what you shared…"}
          </Panel>
        </main>
      );
    case "review":
      return (
        <ReviewShare
          review={view}
          busy={busy}
          onNote={() => continueToNote(view)}
          onFiles={() => void continueToFiles(view)}
          onDiscard={discard}
        />
      );
    case "text":
      // Cancel the page frame's gutters: the composer brings its own, as on the homepage.
      return (
        <main className="-mx-4 -mb-16 -mt-8 sm:-mx-6 md:-mt-12">
          <QuickShare intro={<Intro />} initialText={view.text} />
        </main>
      );
    case "discarded":
      return (
        <Message icon={Trash2} title="Discarded">
          Nothing was sealed or sent, and what was shared is gone from this device.
        </Message>
      );
    case "setup":
      return view.ready ? (
        <Message title="Ready. Share it again">
          Sharing into ProtectedShare needed a one-time setup on this device, and it&apos;s done. Share from the other app again and
          it will stay on this device until you seal it. This first time, it went to our web server, which answered without
          reading it.
        </Message>
      ) : (
        <Message title="This browser can't take shares">
          It can&apos;t keep shared text or files on this device, so nothing was kept. Paste the text into a secure note, or add the
          files to a file drop.
        </Message>
      );
    case "unreadable":
      return (
        <Message title="Couldn't read what was shared">
          The other app sent something this browser couldn&apos;t read. Try sharing it again, or paste it into a secure note.
        </Message>
      );
    default:
      return (
        <Message title="Nothing waiting here">
          When you share text or files to ProtectedShare from another app, they open here, ready to seal. Nothing is waiting, or
          it was already used.
        </Message>
      );
  }
}
