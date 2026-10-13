import Link from "next/link";
import { BLOG_POSTS } from "../../lib/blog";
import JsonLd from "../../components/json-ld";
import AppLink from "../../components/app-link";
import { MetaDot, PageHeader } from "../../components/marketing";
import { itemListJsonLd, pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Guides to Sharing Passwords and Secrets",
  description:
    "Practical guides to sending passwords, API keys, .env files and documents safely, with sources, decision tables and honest limits.",
  path: "/blog",
});

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const COMPARISONS = [
  { href: "/vs/privnote", label: "ProtectedShare vs Privnote" },
  { href: "/vs/onetimesecret", label: "ProtectedShare vs OneTimeSecret" },
  { href: "/vs/envshare", label: "ProtectedShare vs EnvShare" },
  { href: "/vs/protectedtext", label: "ProtectedShare vs ProtectedText" },
  { href: "/vs/bitwarden-send", label: "ProtectedShare vs Bitwarden Send" },
  { href: "/vs", label: "All comparisons" },
] as const;

const TOOLS = [
  { href: "/notes", label: "Secure note" },
  { href: "/secrets", label: "EnvShare for API keys" },
  { href: "/files", label: "Encrypted file drop" },
  { href: "/request", label: "Ask for a secret" },
  { href: "/chat", label: "Encrypted chat room" },
  { href: "/notepad", label: "Encrypted notepad" },
  { href: "/tools", label: "Free security tools" },
] as const;

export default function BlogIndexPage() {
  const posts = [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return (
    <main className="w-full">
      <JsonLd data={itemListJsonLd(posts.map((post) => ({ name: post.title, path: `/blog/${post.slug}` })))} />

      <PageHeader
        eyebrow="Blog"
        title="Guides to sending secrets safely"
        lead="Practical guides to sharing passwords, API keys, .env files and documents without leaving copies in chat logs and inboxes. Each one says what to do, why, and when a different tool is the better choice."
      />

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
        <section aria-label={`${posts.length} articles`}>
          <ol className="border-t border-line">
            {posts.map((post) => (
              <li key={post.slug} className="border-b border-line">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group grid gap-1.5 py-5 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-6"
                >
                  <time dateTime={post.publishedAt} className="tabular pt-0.5 text-small text-ink-3">
                    {dateFormat.format(new Date(post.publishedAt))}
                  </time>
                  <span className="min-w-0">
                    <span className="block text-[17px] font-semibold leading-6 tracking-[-0.015em] text-ink decoration-line-strong underline-offset-[4px] group-hover:underline">
                      {post.title}
                    </span>
                    <span className="mt-1.5 block max-w-[62ch] text-small text-ink-2">{post.description}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta text-ink-3">
                      <span>{post.category}</span>
                      <MetaDot />
                      <span>{post.readingTime}</span>
                      {post.updatedAt !== post.publishedAt ? (
                        <>
                          <MetaDot />
                          <span>
                            Updated <time dateTime={post.updatedAt}>{dateFormat.format(new Date(post.updatedAt))}</time>
                          </span>
                        </>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <aside className="flex flex-col gap-10 lg:sticky lg:top-[84px] lg:self-start">
          <nav aria-labelledby="blog-compare">
            <h2 id="blog-compare" className="eyebrow">
              Comparisons
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {COMPARISONS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-small text-ink-2 transition-colors hover:text-ink">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-labelledby="blog-tools">
            <h2 id="blog-tools" className="eyebrow">
              Tools
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {TOOLS.map((item) => (
                <li key={item.href}>
                  <AppLink href={item.href} className="text-small text-ink-2 transition-colors hover:text-ink">
                    {item.label}
                  </AppLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </main>
  );
}
