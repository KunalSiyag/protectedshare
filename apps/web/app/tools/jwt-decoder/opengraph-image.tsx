import { makeOgImage } from "../../../lib/og";

export const alt = "JWT Decoder — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage("JWT Decoder", "Header, claims and expiry in plain words, plus HMAC signature checks. Decoded in your browser.");
}
