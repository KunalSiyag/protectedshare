import { makeOgImage } from "../../../lib/og";

export const alt = "Use ProtectedShare from Claude — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Use ProtectedShare from Claude",
    "Encrypted, self-destructing links from a conversation. A remote connector with no sign-in, or a local MCP server."
  );
}
