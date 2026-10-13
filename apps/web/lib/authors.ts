/** People credited on published pages. Keep this factual: no invented titles or credentials. */
export type Author = {
  slug: string;
  name: string;
  role: string;
  url: string;
  github: string;
};

export const KUNAL_SIYAG: Author = {
  slug: "kunal-siyag",
  name: "Kunal Siyag",
  role: "Maintainer of ProtectedShare",
  url: "https://protectedshare.me/authors/kunal-siyag",
  github: "https://github.com/KunalSiyag",
};

export const AUTHORS: Author[] = [KUNAL_SIYAG];

export function personJsonLd(author: Author) {
  return {
    "@type": "Person",
    name: author.name,
    url: author.url,
    sameAs: [author.github],
  };
}
