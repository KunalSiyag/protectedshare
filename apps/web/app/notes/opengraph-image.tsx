import { makeOgImage } from "../../lib/og";

export const alt = "Secure Notes Sharing — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Secure Encrypted Notes",
    "Share passwords and sensitive messages with zero-knowledge AES-256-GCM encryption. Burn-after-read supported."
  );
}
