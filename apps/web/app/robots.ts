import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/notes/*",
        "/secrets/*",
      ],
    },
    sitemap: "https://protectedshare.me/sitemap.xml",
  };
}
