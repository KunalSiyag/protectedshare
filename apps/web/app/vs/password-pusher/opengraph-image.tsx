import { makeOgImage } from "../../../lib/og";

export const alt = "Password Pusher Alternative — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Password Pusher Alternative",
    "Links that expire by views and days, encrypted in your browser before upload."
  );
}
