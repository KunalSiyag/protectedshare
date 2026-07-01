import { MetadataRoute } from "next";
import { BLOG_POSTS } from "../lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://protectedshare.me";
  const blogEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date("2026-07-02"),
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

  return [
    {
      url: baseUrl,
      lastModified: new Date("2026-07-02"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/notes`,
      lastModified: new Date("2026-07-02"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/secrets`,
      lastModified: new Date("2026-07-02"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/notepad`,
      lastModified: new Date("2026-07-02"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2026-07-02"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2026-07-02"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date("2026-07-02"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date("2026-07-02"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/vs/privnote`,
      lastModified: new Date("2026-07-02"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vs/protectedtext`,
      lastModified: new Date("2026-07-02"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vs/envshare`,
      lastModified: new Date("2026-07-02"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/self-host`,
      lastModified: new Date("2026-07-02"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...blogEntries,
  ];
}
