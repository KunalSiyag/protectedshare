import { makeOgImage } from "../../lib/og";

export const alt = "How ProtectedShare Compares — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "How ProtectedShare Compares",
    "Ten tools for sending a password, a note or a file, compared row by row, with sources."
  );
}
