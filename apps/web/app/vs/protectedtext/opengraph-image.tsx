import { makeOgImage } from "../../../lib/og";

export const alt = "ProtectedText Alternative — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "ProtectedText Alternative",
    "AES-256-GCM in the browser, self-destructing notes, and an encrypted notepad. Open source."
  );
}
