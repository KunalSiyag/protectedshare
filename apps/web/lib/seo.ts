import type { Metadata } from "next";

export const SITE_URL = "https://protectedshare.me";
export const SITE_NAME = "ProtectedShare";
export const DEFAULT_DESCRIPTION =
  "Encrypt passwords, .env files, notes and files in your browser, then share a link. Our server never sees the plaintext or the key. No account needed.";

/**
 * Social images are file-based: each route's opengraph-image.tsx, else the root
 * app/opengraph-image.tsx. Absolute URL of a route's image, for JSON-LD.
 */
export function ogImageUrl(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}/opengraph-image`;
}

/** The root social image (app/opengraph-image.tsx). public/og-image.jpg stays only for old hotlinks. */
export const DEFAULT_OG_IMAGE = ogImageUrl("/");

/**
 * Routes without an opengraph-image file of their own. Next.js replaces the whole `openGraph`
 * object per segment, so a page that sets og:title and og:url would drop the root image; these
 * name it explicitly. Every other route gets its own file's image automatically. Remove a path
 * from this list when its route gains an opengraph-image.tsx, or that file will be ignored.
 */
const ROOT_OG_IMAGE_PATHS = new Set(["/about", "/blog", "/contact", "/privacy", "/self-host", "/terms"]);

const ROOT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: "ProtectedShare — encrypted links for passwords, .env files, notes and files",
};

export function pageMetadata({
  title,
  description,
  path,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
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
      // The key must be absent, not undefined, for Next to use the route's opengraph-image file.
      ...(ROOT_OG_IMAGE_PATHS.has(path) ? { images: [ROOT_OG_IMAGE] } : {}),
    },
    // No images: Next copies og:image into twitter:image. The card is set here because a twitter
    // object without images would otherwise resolve to the small "summary" card.
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.svg`,
    },
    description:
      "Open-source web app for handing off an encrypted note, .env file, file, or one-time secret without an account.",
    sameAs: ["https://github.com/KunalSiyag/protectedshare"],
    contactPoint: {
      "@type": "ContactPoint",
      email: "admin@protectedshare.me",
      contactType: "customer support",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    inLanguage: "en-US",
  };
}

export function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    applicationCategory: "SecurityApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires a browser with Web Crypto.",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "AES-256-GCM encryption in the browser; the key travels in the link fragment",
      "Secure notes with burn after reading, a link key, a separate password, or both",
      "EnvShare for .env files and API keys with 1 to 100 reads",
      "Encrypted file drops up to 25 MB with a download limit",
      "Secret requests encrypted to the requester's public key (ECDH P-256)",
      "Encrypted chat rooms with disappearing messages and safety words",
      "Read receipts and revoke from the browser that created the link",
      "Expiry presets or a custom time up to 30 days",
      "Encrypted notepad with optional ciphertext sync",
      "Offline password generator and text encryption",
      "Open source (MIT) and self-hostable on Cloudflare Workers and D1",
    ],
  };
}

export function faqPageJsonLd(items: readonly { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function itemListJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: `${SITE_URL}${item.path}`,
    })),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
