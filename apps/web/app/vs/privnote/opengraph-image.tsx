import { makeOgImage } from "../../../lib/og";

export const alt = "Privnote Alternative — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Privnote Alternative",
    "One-time self-destructing secret links with true zero-tracking. No ads, no accounts."
  );
}
