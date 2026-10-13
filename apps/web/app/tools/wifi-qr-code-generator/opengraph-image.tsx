import { makeOgImage } from "../../../lib/og";

export const alt = "WiFi QR Code Generator — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage("WiFi QR Code Generator", "Guests scan to join. Drawn in your browser; the password is never sent.");
}
