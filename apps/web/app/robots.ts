import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/notes/*", "/secrets/*", "/api/*"],
    },
    sitemap: "https://protectedshare.me/sitemap.xml",
  };
}
