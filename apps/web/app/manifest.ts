import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProtectedShare — Encrypted links for secrets and files",
    short_name: "ProtectedShare",
    description:
      "Encrypt passwords, .env files, notes and files in your browser, then share a link. Our server never sees the plaintext or the key.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F7F7",
    theme_color: "#F6F7F7",
    icons: [
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
