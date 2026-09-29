import { MetadataRoute } from "next";
import { BLOG_POSTS } from "../lib/blog";

const STATIC_ROUTES: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/notes", changeFrequency: "weekly", priority: 0.9 },
  { path: "/secrets", changeFrequency: "weekly", priority: 0.9 },
  { path: "/notepad", changeFrequency: "weekly", priority: 0.8 },
  { path: "/chat", changeFrequency: "weekly", priority: 0.8 },
  { path: "/vs/privnote", changeFrequency: "monthly", priority: 0.7 },
  { path: "/vs/protectedtext", changeFrequency: "monthly", priority: 0.7 },
  { path: "/vs/envshare", changeFrequency: "monthly", priority: 0.7 },
  { path: "/vs/onetimesecret", changeFrequency: "monthly", priority: 0.7 },
  { path: "/self-host", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.4 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://protectedshare.me";
  const latestPost = BLOG_POSTS.reduce((latest, post) =>
    post.updatedAt > latest ? post.updatedAt : latest,
  BLOG_POSTS[0]?.updatedAt ?? "2026-01-08");

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${baseUrl}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(latestPost),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...BLOG_POSTS.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
