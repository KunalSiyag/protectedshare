import { makeOgImage } from "../../../lib/og";

export const alt = "Yopass Alternative — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Yopass Alternative",
    "Browser-side encryption, 1 to 100 reads, 25 MB file drops and secret requests."
  );
}
