import type { Metadata } from "next";

export const SITE_URL = "https://protectedshare.me";
export const SITE_NAME = "ProtectedShare";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
export const DEFAULT_DESCRIPTION =
  "Encrypt notes, .env files, and one-time secrets in the browser. Share a link, set an expiry up to 30 days, or limit EnvShare to 1–100 reads. No account required.";

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
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: socialTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: ["/og-image.jpg"],
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
      "Open-source web app for handing off an encrypted note, .env file, or one-time secret without an account.",
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
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "AES-256-GCM encryption in the browser",
      "Secure notes that open from the link or with a separate password",
      "EnvShare for .env files and API keys",
      "Read limits from 1 to 100",
      "Expiry presets or a custom time up to 30 days",
      "Optional burn after reading for notes",
      "Offline-first encrypted notepad",
      "Anonymous encrypted chatroom",
      "Open source and self-hostable",
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
