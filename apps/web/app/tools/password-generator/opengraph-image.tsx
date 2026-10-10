import { makeOgImage } from "../../../lib/og";

export const alt = "Strong Password Generator — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Strong Password Generator",
    "Passwords, passphrases and PINs made in your browser, with an honest strength estimate."
  );
}
