"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
/** Cloudflare Web Analytics site token. Cookieless; reports origin and path only. */
const CF_BEACON_TOKEN = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
const CF_BEACON_SRC = "https://static.cloudflareinsights.com/beacon.min.js";

/**
 * Pages that open or hold shared content. Analytics never loads on them, and if it was loaded
 * earlier in the session it is switched off while one is open (the gtag `ga-disable-<id>` flag,
 * or the Cloudflare beacon's config held aside).
 */
const SENSITIVE_PATTERNS = [
  /^\/notes\/[^/]+/, // open a note
  /^\/secrets\/[^/]+/, // open an env secret
  /^\/files\/[^/]+/, // download a drop
  /^\/request\/[^/]+/, // answer a request, and its inbox
  /^\/chat(\/|$)/,
  /^\/links(\/|$)/,
  /^\/notepad(\/|$)/,
  /^\/share-target(\/|$)/, // text or files handed over by the OS share sheet
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

type BeaconWindow = Window & { __cfBeacon?: Record<string, unknown> };

/**
 * Cloudflare's beacon checks `window.__cfBeacon` before every send and skips sending when it is
 * unset; a beacon script that finds `{ load: "single" }` there doesn't start at all. So on a
 * sensitive page the running beacon's config is held aside, or, if the script hasn't run yet,
 * this placeholder stops it from starting.
 */
const CF_BEACON_BLOCK = { load: "single" };
let heldBeacon: Record<string, unknown> | undefined;

function pauseCloudflareBeacon(paused: boolean) {
  const w = window as BeaconWindow;
  if (paused) {
    if (w.__cfBeacon && w.__cfBeacon !== CF_BEACON_BLOCK) heldBeacon = w.__cfBeacon;
    w.__cfBeacon = heldBeacon ? undefined : CF_BEACON_BLOCK;
  } else if (heldBeacon) {
    w.__cfBeacon = heldBeacon;
    heldBeacon = undefined;
  } else if (w.__cfBeacon === CF_BEACON_BLOCK) {
    delete w.__cfBeacon;
  }
}

/**
 * Google Analytics when NEXT_PUBLIC_GA_ID is set, Cloudflare Web Analytics when
 * NEXT_PUBLIC_CF_BEACON_TOKEN is set; either, both or neither. GA page views are sent by hand with
 * the origin and path only — never the query string or the #fragment, which is where keys live.
 * The Cloudflare beacon strips the query and fragment itself. Its SPA mode stays off because it
 * reports a route change from inside history.pushState, before this component can pause it for a
 * sensitive page, so it counts full page loads only.
 */
export default function Analytics() {
  const pathname = usePathname() || "/";
  const sensitive = isSensitivePath(pathname);
  const [load, setLoad] = useState(false);
  const [loadBeacon, setLoadBeacon] = useState(false);

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

  useEffect(() => {
    if (!CF_BEACON_TOKEN) return;
    pauseCloudflareBeacon(sensitive);
    if (!sensitive) setLoadBeacon(true);
  }, [sensitive]);

  return (
    <>
      {GA_ID && load ? (
        <Script
          id="ga-gtag"
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`}
        />
      ) : null}
      {CF_BEACON_TOKEN && loadBeacon ? (
        <Script
          id="cf-beacon"
          strategy="afterInteractive"
          src={CF_BEACON_SRC}
          data-cf-beacon={JSON.stringify({ token: CF_BEACON_TOKEN, spa: false })}
        />
      ) : null}
    </>
  );
}
