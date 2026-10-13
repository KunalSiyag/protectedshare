import { makeOgImage } from "../../../lib/og";

export const alt = "Secret Key Generator — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage("Secret Key Generator", "Hex, base64, JWT, Django, Rails and Auth.js secrets. Made in your browser, never sent.");
}
