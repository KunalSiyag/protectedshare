import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { buttonVariants } from "@protectedshare/ui";
import { BLOG_POSTS, countWords, getBlogPost, getBlogRedirect, getBlogSlugs, getRelatedPosts } from "../../../lib/blog";
import { personJsonLd } from "../../../lib/authors";
import JsonLd from "../../../components/json-ld";
import AppLink from "../../../components/app-link";
import { Breadcrumb } from "../../../components/breadcrumb";
import { MetaDot } from "../../../components/marketing";
import { SITE_NAME, SITE_URL, ogImageUrl } from "../../../lib/seo";
import Markdown, { extractHeadings } from "../markdown";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateString));
}

const COMPARISONS = [
  { href: "/vs/privnote", label: "vs Privnote" },
  { href: "/vs/onetimesecret", label: "vs OneTimeSecret" },
  { href: "/vs/envshare", label: "vs EnvShare" },
  { href: "/vs/protectedtext", label: "vs ProtectedText" },
  { href: "/vs/bitwarden-send", label: "vs Bitwarden Send" },
] as const;

const DEFAULT_PRACTICE = {
  primary: { href: "/notes", label: "New secure note" },
  secondary: { href: "/secrets", label: "Share a .env" },
};

/** A table of contents only earns its place on longer posts. */
const TOC_MIN_HEADINGS = 3;

export async function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {};
  }

  const url = `${SITE_URL}/blog/${post.slug}`;

  // No images: the route's opengraph-image.tsx supplies og:image, and Next copies it to twitter:image.
  return {
    // Keep the full title under ~60 characters in results: skip the site suffix for long titles.
    title: post.title.length + " | ProtectedShare".length > 60 ? { absolute: post.title } : post.title,
    description: post.description,
    authors: [{ name: post.author.name, url: post.author.url }],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      siteName: SITE_NAME,
      locale: "en_US",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.url],
      section: post.category,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    const target = getBlogRedirect(slug);
    if (target) permanentRedirect(target);
    notFound();
  }

  const url = `${SITE_URL}/blog/${post.slug}`;
  const currentIndex = BLOG_POSTS.findIndex((item) => item.slug === post.slug);
  const previousPost = currentIndex > 0 ? BLOG_POSTS[currentIndex - 1] : undefined;
  const nextPost = currentIndex < BLOG_POSTS.length - 1 ? BLOG_POSTS[currentIndex + 1] : undefined;
  const relatedPosts = getRelatedPosts(post);

  const headings = extractHeadings(post.content);
  const showToc = headings.length >= TOC_MIN_HEADINGS;
  const updated = post.updatedAt !== post.publishedAt;
  const practice = post.practice ?? DEFAULT_PRACTICE;

  return (
    <main className="w-full">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          image: ogImageUrl(`/blog/${post.slug}`),
          datePublished: post.publishedAt,
          dateModified: post.updatedAt,
          author: personJsonLd(post.author),
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            logo: {
              "@type": "ImageObject",
              url: `${SITE_URL}/logo.svg`,
            },
          },
          articleSection: post.category,
          wordCount: countWords(post.content),
          inLanguage: "en-US",
          url,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": url,
          },
        }}
      />

      <div className="mx-auto max-w-[680px] lg:max-w-none">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_680px_minmax(0,1fr)] lg:gap-10">
          <div className="hidden lg:block" />
          <div className="min-w-0">
            <Breadcrumb
              items={[
                { name: "Home", path: "/" },
                { name: "Blog", path: "/blog" },
                { name: post.title, path: `/blog/${post.slug}` },
              ]}
              className="[&_li:last-child]:hidden"
            />

            <header>
              <p className="eyebrow">{post.category}</p>
              <h1 className="mt-3 text-[32px] font-semibold leading-[36px] tracking-[-0.035em] text-ink sm:text-h1">
                {post.title}
              </h1>
              <p className="mt-4 text-[17px] leading-[27px] text-ink-2 sm:text-lead">{post.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-3">
                <span>
                  By{" "}
                  <Link
                    href={`/authors/${post.author.slug}`}
                    rel="author"
                    className="font-medium text-ink-2 underline decoration-line-strong underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink"
                  >
                    {post.author.name}
                  </Link>
                </span>
                <MetaDot />
                {updated ? (
                  <span>
                    Updated <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
                  </span>
                ) : (
                  <span>
                    Published <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-ink-3">
                {updated ? (
                  <>
                    <span>
                      First published <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                    </span>
                    <MetaDot />
                  </>
                ) : null}
                <span>{post.readingTime}</span>
              </div>
            </header>

            <hr className="mt-8 border-line" />

            <article className="mt-8">
              <Markdown>{post.content}</Markdown>
            </article>

            <aside
              aria-label="Try it"
              className="mt-12 flex flex-col gap-4 border-y border-line py-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-[15px] font-semibold text-ink">Put it into practice</p>
                <p className="mt-0.5 text-small text-ink-3">Encrypted in your browser. No account.</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <AppLink href={practice.primary.href} className={buttonVariants({ variant: "primary", size: "sm" })}>
                  {practice.primary.label}
                </AppLink>
                {practice.secondary ? (
                  <AppLink href={practice.secondary.href} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                    {practice.secondary.label}
                  </AppLink>
                ) : null}
              </div>
            </aside>
          </div>

          {showToc ? (
            <nav aria-label="In this article" className="hidden lg:block">
              <div className="sticky top-[84px] pt-[150px]">
                <p className="eyebrow !text-[11px]">In this article</p>
                <ul className="mt-3 flex flex-col gap-2 border-l border-line">
                  {headings.map((heading) => (
                    <li key={heading.id}>
                      <a
                        href={`#${heading.id}`}
                        className="-ml-px block border-l border-transparent pl-3 text-small text-ink-3 transition-colors hover:border-ink-3 hover:text-ink"
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          ) : (
            <div className="hidden lg:block" />
          )}
        </div>

        <div className="mx-auto mt-14 max-w-[680px]">
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="eyebrow">
              Related guides
            </h2>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {relatedPosts.map((related) => (
                <li key={related.slug}>
                  <Link href={`/blog/${related.slug}`} className="group block py-4">
                    <span className="block text-[15px] font-semibold leading-[22px] tracking-[-0.01em] text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-[3px]">
                      {related.title}
                    </span>
                    <span className="mt-1 block text-small text-ink-3">{related.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <nav aria-label="More posts" className="mt-10 grid gap-3 sm:grid-cols-2">
            {previousPost ? (
              <Link
                href={`/blog/${previousPost.slug}`}
                className="group flex flex-col gap-1 rounded-field border border-line px-4 py-3.5 transition-colors duration-150 hover:border-line-strong hover:bg-surface"
              >
                <span className="flex items-center gap-1.5 text-meta text-ink-3">
                  <ArrowLeft aria-hidden="true" className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                  Previous
                </span>
                <span className="text-small font-medium text-ink">{previousPost.title}</span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {nextPost ? (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="group flex flex-col items-end gap-1 rounded-field border border-line px-4 py-3.5 text-right transition-colors duration-150 hover:border-line-strong hover:bg-surface"
              >
                <span className="flex items-center gap-1.5 text-meta text-ink-3">
                  Next
                  <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="text-small font-medium text-ink">{nextPost.title}</span>
              </Link>
            ) : null}
          </nav>

          <p className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-ink-3">
            <span className="font-medium text-ink-2">Compare</span>
            {COMPARISONS.map((item) => (
              <Link key={item.href} href={item.href} className="transition-colors hover:text-ink">
                {item.label}
              </Link>
            ))}
            <Link href="/vs" className="transition-colors hover:text-ink">
              All comparisons
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
