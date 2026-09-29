import { makeOgImage } from "../../lib/og";

export const alt = "Secure Notes Sharing — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Secure Encrypted Notes",
    "Open a note from the link, or keep the password separate. Expiry up to 30 days."
  );
}
