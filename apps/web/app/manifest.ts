import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Same identity as before (it defaulted to start_url), so existing installs stay the same app.
    id: "/",
    name: "ProtectedShare — Encrypted links for secrets and files",
    short_name: "ProtectedShare",
    description:
      "Encrypt passwords, .env files, notes and files in your browser, then share a link. Our server never sees the plaintext or the key.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F6F7F7",
    theme_color: "#F6F7F7",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    // "Share to ProtectedShare" from other apps once installed. public/sw.js takes this POST on the
    // device and keeps what was shared in IndexedDB; /share-target then seals it.
    share_target: {
      action: "/share-target/receive",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
        files: [{ name: "files", accept: ["*/*"] }],
      },
    },
  };
}
