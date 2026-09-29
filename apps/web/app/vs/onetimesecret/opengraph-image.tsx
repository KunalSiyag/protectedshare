import { makeOgImage } from "../../../lib/og";

export const alt = "OneTimeSecret Alternative — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "OneTimeSecret Alternative",
    "Browser-side AES-256-GCM, 1 to 100 reads, and an expiry up to 30 days."
  );
}
