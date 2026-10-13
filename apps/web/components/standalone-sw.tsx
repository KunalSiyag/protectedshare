"use client";

import { useEffect } from "react";

/**
 * In the installed app, register the share-target worker on first launch, so the very first
 * "Share to ProtectedShare" is handled on the device instead of reaching the server fallback.
 * Browsers that aren't running the installed app skip this; the worker is scoped to /share-target/.
 */
export default function StandaloneServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (!window.matchMedia("(display-mode: standalone)").matches) return;
    const register = () => {
      void import("../lib/push").then(({ registerServiceWorker }) => registerServiceWorker()).catch(() => null);
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) idle(register);
    else window.setTimeout(register, 1500);
  }, []);
  return null;
}
