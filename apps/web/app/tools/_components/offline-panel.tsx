"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Panel, PanelBody, PanelHeader, StatusChip, cn } from "@protectedshare/ui";

/** navigator.onLine, kept current. Starts true so the server render and first paint agree. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}

/**
 * "Network: none" panel for tools that make no requests of their own. It states a fact about the
 * tool's code; the page itself still loaded from our server like any website.
 */
export default function OfflinePanel({
  children,
  offlineText = "You're offline. This tool still works.",
}: {
  /** One or two sentences on where the work happens. */
  children: ReactNode;
  offlineText?: string;
}) {
  const online = useOnline();
  return (
    <Panel>
      <PanelHeader
        title="Offline"
        description="What this tool sends over the network."
        actions={<StatusChip tone="ok">Network: none</StatusChip>}
      />
      <PanelBody className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-small text-ink-2">Bytes sent by this tool</span>
          <span className="tabular text-[28px] font-semibold leading-8 tracking-[-0.02em] text-ink">0</span>
        </div>
        <p className="text-small text-ink-3">{children}</p>
        <div
          className={cn(
            "flex items-center gap-2 rounded-field border px-3 py-2 text-small",
            online ? "border-line bg-surface-2/50 text-ink-2" : "border-ok/30 bg-ok-soft text-ok"
          )}
          aria-live="polite"
        >
          <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", online ? "bg-ink-3" : "bg-ok")} />
          {online ? "Your device is online. Try turning Wi-Fi off." : offlineText}
        </div>
      </PanelBody>
    </Panel>
  );
}
