import { makeOgImage } from "../../lib/og";

export const alt = "EnvShare — Share .env Files & API Keys Securely";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Share .env Files & API Keys Securely",
    "1 to 100 reads. Expiry up to 30 days. The password stays in the link hash."
  );
}
