import { makeOgImage } from "../../../lib/og";

export const alt = "WeTransfer Alternative — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "WeTransfer Alternative",
    "Files up to 25 MB, encrypted in your browser before upload, with a download limit."
  );
}
