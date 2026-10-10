import { makeOgImage } from "../lib/og";

export const alt = "ProtectedShare — encrypted links for passwords, .env files, notes and files";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return makeOgImage(
    "Send a secret our server can't read.",
    "Encrypted in your browser. The key rides in the link after #, which browsers never send to a server."
  );
}
