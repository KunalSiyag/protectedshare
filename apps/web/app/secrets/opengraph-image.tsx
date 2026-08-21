import { makeOgImage } from "../../lib/og";

export const alt = "EnvShare — Share .env Files & API Keys Securely";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Share .env Files & API Keys Securely",
    "Client-side AES-256-GCM encryption with read limits and auto-destruction. The key stays in the URL hash."
  );
}
