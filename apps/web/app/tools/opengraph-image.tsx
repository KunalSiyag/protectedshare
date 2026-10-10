import { makeOgImage } from "../../lib/og";

export const alt = "Free Security Tools — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage("Free Security Tools", "A password generator and offline text encryption. Both run in your browser.");
}
