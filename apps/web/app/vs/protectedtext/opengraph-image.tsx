import { makeOgImage } from "../../../lib/og";

export const alt = "ProtectedText Alternative — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "ProtectedText Alternative",
    "Stronger AES-256-GCM encryption, self-destructing notes, and a modern interface. Free forever."
  );
}
