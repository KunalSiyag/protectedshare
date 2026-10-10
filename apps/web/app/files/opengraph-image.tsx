import { makeOgImage } from "../../lib/og";

export const alt = "Encrypted File Drop — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Encrypted File Drop",
    "Files up to 25 MB, encrypted in your browser and deleted after the downloads you allow."
  );
}
