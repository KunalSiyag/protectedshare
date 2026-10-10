import { makeOgImage } from "../../lib/og";

export const alt = "Security model — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "What our server can see, and what it can't",
    "AES-256-GCM in the browser, keys in the link fragment, and an honest threat model."
  );
}
