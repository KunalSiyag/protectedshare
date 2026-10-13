import { makeOgImage } from "../../lib/og";

export const alt = "Authors — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage("Who writes here", "The people behind the ProtectedShare guides.");
}
