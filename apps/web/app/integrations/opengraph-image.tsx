import { makeOgImage } from "../../lib/og";

export const alt = "Integrations — ProtectedShare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage("Use ProtectedShare from your AI assistant", "An MCP server for Claude and other clients, remote or local.");
}
