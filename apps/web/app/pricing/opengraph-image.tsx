import { makeOgImage } from "../../lib/og";

export const alt = "Pricing — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage("Free to use. Free to run yourself.", "Every tool, no account. MIT licensed, or ask about a dedicated instance.");
}
