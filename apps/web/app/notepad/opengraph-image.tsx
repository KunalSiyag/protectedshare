import { makeOgImage } from "../../lib/og";

export const alt = "Encrypted Online Notepad — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Encrypted Online Notepad",
    "Offline-first markdown scratchpad with cloud sync. Zero-knowledge encryption in your browser."
  );
}
