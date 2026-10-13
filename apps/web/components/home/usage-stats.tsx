"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import type { UsageStatsResponse } from "@protectedshare/contracts";
import { cn } from "@protectedshare/ui";
import { apiUrl } from "../../lib/api";

/** Below this the line stays hidden. The number shown is always the API's count, never rounded up. */
export const USAGE_STATS_MIN_TOTAL = 250;

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * One quiet line of real usage: links created in the last 30 days, as counted by GET /api/stats
 * (cached for 10 minutes). Fetched once the page is idle; renders nothing until there's a number
 * worth showing, and nothing at all if the request fails.
 */
export default function UsageStats({ className }: { className?: string }) {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch(apiUrl("/api/stats"), { signal: controller.signal });
        if (!response.ok) return;
        const data = (await response.json()) as Partial<UsageStatsResponse>;
        const count = data.last30Days?.total;
        if (typeof count === "number" && Number.isFinite(count)) setTotal(count);
      } catch {
        // Offline, blocked or aborted: show nothing.
      }
    };
    const idleWindow = window as IdleWindow;
    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(() => void load(), { timeout: 4000 });
      return () => {
        idleWindow.cancelIdleCallback?.(handle);
        controller.abort();
      };
    }
    const timer = window.setTimeout(() => void load(), 1500);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  if (total === null || total < USAGE_STATS_MIN_TOTAL) return null;

  return (
    <p className={cn("flex animate-fade-in items-center gap-2 text-small text-ink-3", className)}>
      <Lock aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} />
      <span>
        <span className="tabular font-medium text-ink-2">{total.toLocaleString("en-US")}</span> links sealed in the last 30 days
      </span>
    </p>
  );
}
