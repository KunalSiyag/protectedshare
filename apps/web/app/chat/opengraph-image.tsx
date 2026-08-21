import { makeOgImage } from "../../lib/og";

export const alt = "Anonymous Encrypted Chatroom — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Anonymous Encrypted Chatroom",
    "End-to-end encrypted rooms with keys that never leave your browser. No signup required."
  );
}
