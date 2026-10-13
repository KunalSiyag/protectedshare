import { makeOgImage } from "../../../lib/og";

export const alt = "Password Strength Checker — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage("Password Strength Checker", "Entropy, crack times and plain reasons. Checked in your browser, never sent.");
}
