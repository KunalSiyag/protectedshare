import { makeOgImage } from "../../lib/og";

export const alt = "Secret Request — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Ask for a secret, sealed",
    "They paste it, it's encrypted to your key, you open it once. No accounts."
  );
}
