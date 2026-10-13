import { makeOgImage } from "../../../lib/og";

export const alt = "Breached Password Checker — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Breached Password Checker",
    "Is it in a known breach? Only 5 characters of its hash leave your browser, never the password."
  );
}
