import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProtectedShare — Zero-Knowledge Secure Notes & Secret Sharing",
    short_name: "ProtectedShare",
    description:
      "Free encrypted notes, .env file sharing, self-destructing secrets, and anonymous chatrooms. No signup, no tracking.",
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
