import { makeOgImage } from "../../../lib/og";

export const alt = "EnvShare Alternative — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "EnvShare Alternative",
    ".env sharing with read limits and URL-fragment keys, plus notes, files and requests."
  );
}
