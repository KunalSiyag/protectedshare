"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Pages that open or hold shared content. Analytics never loads on them, and if it was loaded
 * earlier in the session it is switched off (the gtag `ga-disable-<id>` flag) while one is open.
 */
const SENSITIVE_PATTERNS = [
  /^\/notes\/[^/]+/, // open a note
  /^\/secrets\/[^/]+/, // open an env secret
  /^\/files\/[^/]+/, // download a drop
  /^\/request\/[^/]+/, // answer a request, and its inbox
  /^\/chat(\/|$)/,
  /^\/links(\/|$)/,
  /^\/notepad(\/|$)/,
];

export function isSensitivePath(pathname: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(pathname));
}

type GtagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
} & Record<`ga-disable-${string}`, boolean | undefined>;

/** Queues commands on dataLayer; gtag.js replays them in order once it loads. */
function gtag(...args: unknown[]) {
  const w = window as unknown as GtagWindow;
  if (!w.gtag) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () {
      // gtag.js expects the Arguments object itself, not an array.
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
    w.gtag("js", new Date());
    w.gtag("config", GA_ID, {
      send_page_view: false,
      page_location: `${window.location.origin}${window.location.pathname}`,
    });
  }
  w.gtag(...args);
}

/**
 * Google Analytics, only when NEXT_PUBLIC_GA_ID is set. Page views are sent by hand with the
 * origin and path only — never the query string or the #fragment, which is where keys live.
 */
export default function Analytics() {
  const pathname = usePathname() || "/";
  const sensitive = isSensitivePath(pathname);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (!GA_ID) return;
    const w = window as unknown as GtagWindow;
    w[`ga-disable-${GA_ID}`] = sensitive;
    if (sensitive) return;
    const pageLocation = `${window.location.origin}${pathname}`;
    gtag("set", { page_location: pageLocation });
    gtag("event", "page_view", { page_location: pageLocation, page_title: document.title });
    setLoad(true);
  }, [pathname, sensitive]);

  if (!GA_ID || !load) return null;
  return (
    <Script
      id="ga-gtag"
      strategy="afterInteractive"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`}
    />
  );
}
