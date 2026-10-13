import { makeOgImage } from "../../../lib/og";

export const alt = "PrivateBin Alternative — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "PrivateBin Alternative",
    "AES-256-GCM in your browser, with read limits, file drops and secret requests."
  );
}
