import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProtectedShare — Zero-Knowledge Secure Notes & Secret Sharing",
    short_name: "ProtectedShare",
    description:
      "Encrypt notes, .env files, and one-time secrets in the browser, then share a link. No account required.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
