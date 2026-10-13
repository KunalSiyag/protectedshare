import { makeOgImage } from "../../../lib/og";

export const alt = "Firefox Send Alternative — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Firefox Send Alternative",
    "Send closed in 2020. Encrypted file drops up to 25 MB, with a download limit."
  );
}
