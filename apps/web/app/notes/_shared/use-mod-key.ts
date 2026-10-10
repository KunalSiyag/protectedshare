"use client";

import { useEffect, useState } from "react";

/** "⌘" on Apple platforms, "Ctrl" elsewhere. Starts as "Ctrl" so server and client markup match. */
export function useModKey(): string {
  const [label, setLabel] = useState("Ctrl");
  useEffect(() => {
    const platform =
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || "";
    if (/mac|iphone|ipad|ipod/i.test(platform)) setLabel("⌘");
  }, []);
  return label;
}
