import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { buttonVariants } from "@protectedshare/ui";
import AppLink from "../../../components/app-link";
import { Breadcrumb } from "../../../components/breadcrumb";
import JsonLd from "../../../components/json-ld";
import { PageHeader, RailSection } from "../../../components/marketing";
import { KUNAL_SIYAG, personJsonLd } from "../../../lib/authors";
import { BLOG_POSTS } from "../../../lib/blog";
import { SITE_NAME, pageMetadata } from "../../../lib/seo";

const AUTHOR = KUNAL_SIYAG;
const PATH = `/authors/${AUTHOR.slug}`;
const REPO_URL = "https://github.com/KunalSiyag/protectedshare";

export const metadata = pageMetadata({
  title: AUTHOR.name,
  description:
    "Kunal Siyag maintains ProtectedShare. Articles on browser-side encryption, one-time secret links, and sharing passwords, API keys and .env files safely.",
  path: PATH,
});

const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

const linkClass = "font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink";

/** The blog's most common categories, most frequent first. */
function topCategories(posts: typeof BLOG_POSTS, limit: number): string[] {
  const counts = new Map<string, number>();
  for (const post of posts) counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category]) => category);
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export default function AuthorPage() {
  const posts = [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const topics = topCategories(posts, 3);

  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${AUTHOR.name} — ${SITE_NAME}`,
    url: AUTHOR.url,
    mainEntity: {
      ...personJsonLd(AUTHOR),
      description: AUTHOR.role,
      agentInteractionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/WriteAction",
        userInteractionCount: posts.length,
      },
    },
  };

  return (
    <main className="w-full">
      <JsonLd data={profileJsonLd} />
      <Breadcrumb
        items={[
          { name: "Home", path: "/" },
          { name: "Authors", path: "/authors" },
          { name: AUTHOR.name, path: PATH },
        ]}
      />

      <PageHeader
        eyebrow="Author"
        title={AUTHOR.name}
        lead={`${AUTHOR.role}. Writes about browser-side encryption, one-time links, and handing over passwords, API keys and .env files without leaving copies behind.`}
      >
        <a href={AUTHOR.github} className={buttonVariants({ variant: "secondary" })}>
          GitHub profile
          <ArrowUpRight aria-hidden="true" />
        </a>
        <AppLink href="/blog" className={buttonVariants({ variant: "ghost" })}>
          All guides
        </AppLink>
      </PageHeader>

      <div className="mt-14">
        <RailSection
          id="articles"
          title="Articles"
          description={
            topics.length > 0
              ? `${posts.length} on the blog, most often on ${joinList(topics)}.`
              : `${posts.length} on the blog.`
          }
        >
          <ol className="border-t border-line">
            {posts.map((post) => (
              <li key={post.slug} className="border-b border-line">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group grid gap-1.5 py-4 sm:grid-cols-[112px_minmax(0,1fr)] sm:gap-6"
                >
                  <time dateTime={post.publishedAt} className="tabular pt-0.5 text-small text-ink-3">
                    {dateFormat.format(new Date(post.publishedAt))}
                  </time>
                  <span className="min-w-0">
                    <span className="block text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink decoration-line-strong underline-offset-[4px] group-hover:underline">
                      {post.title}
                    </span>
                    <span className="mt-1 block text-meta text-ink-3">{post.category}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </RailSection>

        <RailSection title="Work">
          <p className="max-w-[640px] text-prose text-ink-2">
            Maintains ProtectedShare, which is open source under the MIT license. The code, issues and changes are on{" "}
            <a href={REPO_URL} className={linkClass}>
              GitHub
            </a>
            . More about the project is on the{" "}
            <AppLink href="/about" className={linkClass}>
              about page
            </AppLink>
            .
          </p>
        </RailSection>
      </div>
    </main>
  );
}
