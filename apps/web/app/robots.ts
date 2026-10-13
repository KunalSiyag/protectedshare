import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/seo";

/**
 * Share links, request inboxes, "My links" and the PWA share target hold nothing worth indexing.
 * `/notes/*` matches `/notes/<id>` but not `/notes`, so the tool pages themselves stay crawlable.
 * The opengraph-image routes under those prefixes stay fetchable: X's crawler honours robots.txt
 * for card images, and the longer Allow rule wins over the Disallow.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/*/opengraph-image"],
      disallow: ["/api/", "/notes/*", "/secrets/*", "/files/*", "/request/*", "/links", "/share-target"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
