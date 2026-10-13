import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "../lib/blog";
import { SITE_URL } from "../lib/seo";

type ChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

/** Last content change per route (YYYY-MM-DD). Bump a route's date when its page content changes. */
const REDESIGN = "2026-10-10";
const GROWTH_BATCH = "2026-10-11";

const STATIC_ROUTES: { path: string; lastModified: string; changeFrequency: ChangeFrequency; priority: number }[] = [
  { path: "", lastModified: GROWTH_BATCH, changeFrequency: "weekly", priority: 1 },

  // Sharing tools
  { path: "/notes", lastModified: GROWTH_BATCH, changeFrequency: "weekly", priority: 0.9 },
  { path: "/secrets", lastModified: GROWTH_BATCH, changeFrequency: "weekly", priority: 0.9 },
  { path: "/files", lastModified: GROWTH_BATCH, changeFrequency: "weekly", priority: 0.9 },
  { path: "/request", lastModified: GROWTH_BATCH, changeFrequency: "weekly", priority: 0.8 },
  { path: "/chat", lastModified: GROWTH_BATCH, changeFrequency: "weekly", priority: 0.8 },
  { path: "/notepad", lastModified: GROWTH_BATCH, changeFrequency: "weekly", priority: 0.8 },

  // Free tools (run in the browser)
  { path: "/tools", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.7 },
  { path: "/tools/password-generator", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.7 },
  { path: "/tools/encrypt-text", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools/password-strength-checker", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.7 },
  { path: "/tools/breached-password-checker", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.7 },
  { path: "/tools/secret-key-generator", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.7 },
  { path: "/tools/jwt-decoder", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.6 },
  { path: "/tools/wifi-qr-code-generator", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.6 },

  // Trust and product
  { path: "/security", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.8 },
  { path: "/self-host", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.7 },
  { path: "/pricing", lastModified: REDESIGN, changeFrequency: "monthly", priority: 0.6 },

  // Comparisons
  { path: "/vs", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.7 },
  { path: "/vs/privnote", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.6 },
  { path: "/vs/onetimesecret", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.6 },
  { path: "/vs/envshare", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.6 },
  { path: "/vs/protectedtext", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.6 },
  { path: "/vs/bitwarden-send", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.6 },
  { path: "/vs/yopass", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.6 },
  { path: "/vs/password-pusher", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.6 },
  { path: "/vs/privatebin", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.6 },
  { path: "/vs/firefox-send", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.6 },
  { path: "/vs/wetransfer", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.6 },

  // Company and legal
  { path: "/about", lastModified: REDESIGN, changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", lastModified: REDESIGN, changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.4 },
  { path: "/terms", lastModified: REDESIGN, changeFrequency: "yearly", priority: 0.3 },
  { path: "/integrations", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.5 },
  { path: "/integrations/claude", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.7 },
  { path: "/authors", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.3 },
  { path: "/authors/kunal-siyag", lastModified: GROWTH_BATCH, changeFrequency: "monthly", priority: 0.4 },
];

/** The blog index changes whenever a post does, and it was itself reworked in this batch. */
const BLOG_INDEX_UPDATED = GROWTH_BATCH;

export default function sitemap(): MetadataRoute.Sitemap {
  const latestPost = BLOG_POSTS.reduce(
    (latest, post) => (post.updatedAt > latest ? post.updatedAt : latest),
    BLOG_INDEX_UPDATED
  );

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${SITE_URL}${route.path}`,
      lastModified: route.lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    {
      url: `${SITE_URL}/blog`,
      lastModified: latestPost,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...BLOG_POSTS.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
