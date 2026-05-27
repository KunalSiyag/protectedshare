import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/notes", "/secrets", "/notepad"],
      disallow: [
        "/notes/*",
        "/secrets/*",
        "/api/*",
        "/n/*",
        "/s/*",
        "/workspace",
      ],
    },
    sitemap: "https://protectedshare.me/sitemap.xml",
  };
}
