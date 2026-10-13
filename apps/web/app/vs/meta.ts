import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "../../lib/seo";

/**
 * Metadata for a comparison page. No image is set here on purpose: each route has its own
 * opengraph-image.tsx, which Next.js uses for both Open Graph and Twitter.
 */
export function comparisonMetadata({
  title,
  description,
  path,
  keywords,
}: {
  /** The page part of the title; the root layout appends " | ProtectedShare". Keep it to 45 characters. */
  title: string;
  /** 155 characters at most. */
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const url = `${SITE_URL}${path}`;
  const socialTitle = `${title} — ${SITE_NAME}`;
  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title: socialTitle,
      description,
      url,
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
  };
}
