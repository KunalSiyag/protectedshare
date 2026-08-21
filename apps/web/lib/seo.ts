export const SITE_URL = "https://protectedshare.me";
export const SITE_NAME = "ProtectedShare";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

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
      "Privacy-first zero-knowledge platform for encrypted notes, secret sharing, .env file sharing, and secure communication.",
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
    description:
      "Free zero-knowledge encrypted notes, .env file sharing, self-destructing secrets, and anonymous chatrooms. No signup, no tracking.",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    inLanguage: "en-US",
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
