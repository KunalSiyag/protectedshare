import { makeOgImage } from "../../../lib/og";

export const alt = "Encrypt Text Online, Offline — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Encrypt Text With a Password",
    "AES-256-GCM in your browser. Paste the block anywhere; only the password opens it."
  );
}
