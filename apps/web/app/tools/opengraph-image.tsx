import { makeOgImage } from "../../lib/og";

export const alt = "Free Security Tools — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage("Free Security Tools", "Passwords, breach checks, secret keys, JWTs and WiFi QR codes. They run in your browser.");
}
