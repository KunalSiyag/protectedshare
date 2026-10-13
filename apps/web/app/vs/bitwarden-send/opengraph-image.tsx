import { makeOgImage } from "../../../lib/og";

export const alt = "Bitwarden Send Alternative — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Bitwarden Send Alternative",
    "Encrypted in your browser, like Send, with no account on either side."
  );
}
