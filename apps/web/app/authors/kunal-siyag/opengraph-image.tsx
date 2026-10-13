import { KUNAL_SIYAG } from "../../../lib/authors";
import { makeOgImage } from "../../../lib/og";

export const alt = `${KUNAL_SIYAG.name}, ${KUNAL_SIYAG.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    KUNAL_SIYAG.name,
    `${KUNAL_SIYAG.role}. Articles on browser-side encryption, one-time links and sharing secrets safely.`
  );
}
