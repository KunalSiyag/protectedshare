import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { BLOG_POSTS, getBlogPost, getBlogSlugs } from "../../../lib/blog";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

const markdownComponents: Components = {
  h2: ({ children }) => (
    <h2 className="mt-10 text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mt-4 text-base leading-8 text-zinc-600 dark:text-zinc-400">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-8 text-zinc-600 dark:text-zinc-400">
      {children}
    </ul>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
      {children}
    </strong>
  ),
};

export async function generateStaticParams() {
  return getBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `https://protectedshare.me/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://protectedshare.me/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
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
    notFound();
  }

  const currentIndex = BLOG_POSTS.findIndex((item) => item.slug === post.slug);
  const previousPost = currentIndex > 0 ? BLOG_POSTS[currentIndex - 1] : undefined;
  const nextPost = currentIndex < BLOG_POSTS.length - 1 ? BLOG_POSTS[currentIndex + 1] : undefined;
  const primaryTopic = post.title.split(" ")[0]?.toLowerCase() ?? "";
  const relatedPosts = BLOG_POSTS
    .filter((item) => item.slug !== post.slug)
    .map((item) => ({
      item,
      score: (item.category === post.category ? 3 : 0) +
        (primaryTopic && item.title.toLowerCase().includes(primaryTopic) ? 1 : 0),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ item }) => item);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            author: {
              "@type": "Organization",
              name: "ProtectedShare Team",
            },
            publisher: {
              "@type": "Organization",
              name: "ProtectedShare",
              url: "https://protectedshare.me",
            },
            mainEntityOfPage: `https://protectedshare.me/blog/${post.slug}`,
          }),
        }}
      />

      <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.24em] text-blue-600 dark:text-emerald-400">
        <Link href="/blog" className="hover:underline">
          Blog
        </Link>
        <span className="text-zinc-400 dark:text-zinc-600">/</span>
        <span>{post.category}</span>
      </div>

      <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
        {post.title}
      </h1>
      <p className="mt-5 text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-3xl">
        {post.description}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-500 dark:text-zinc-500">
        <span>{formatDate(post.publishedAt)}</span>
        <span>•</span>
        <span>{post.readingTime}</span>
        <span>•</span>
        <span>Updated {formatDate(post.updatedAt)}</span>
      </div>

      <article className="mt-10">
        <ReactMarkdown components={markdownComponents}>{post.content}</ReactMarkdown>
      </article>

      <div className="mt-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
          Related guides
        </h2>
        <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          More pages that match the same search intent or security workflow.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {relatedPosts.map((relatedPost) => (
            <Link
              key={relatedPost.slug}
              href={`/blog/${relatedPost.slug}`}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-blue-300 dark:hover:border-emerald-500/60 transition-colors"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                {relatedPost.category}
              </p>
              <p className="mt-2 font-semibold text-zinc-950 dark:text-white">
                {relatedPost.title}
              </p>
              <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                {relatedPost.description}
              </p>
            </Link>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/vs/protectedtext" className="rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-emerald-400 hover:border-blue-300 dark:hover:border-emerald-500/60 transition-colors">
            ProtectedText alternative
          </Link>
          <Link href="/vs/privnote" className="rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-emerald-400 hover:border-blue-300 dark:hover:border-emerald-500/60 transition-colors">
            Privnote alternative
          </Link>
          <Link href="/vs/envshare" className="rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-emerald-400 hover:border-blue-300 dark:hover:border-emerald-500/60 transition-colors">
            EnvShare alternative
          </Link>
          <Link href="/chat" className="rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-emerald-400 hover:border-blue-300 dark:hover:border-emerald-500/60 transition-colors">
            Anonymous encrypted chatroom
          </Link>
        </div>
      </div>

      <div className="mt-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
          Continue reading
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {previousPost ? (
            <Link
              href={`/blog/${previousPost.slug}`}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-blue-300 dark:hover:border-emerald-500/60 transition-colors"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Previous</p>
              <p className="mt-2 font-semibold text-zinc-950 dark:text-white">
                {previousPost.title}
              </p>
            </Link>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-500">
              You are at the first post.
            </div>
          )}
          {nextPost ? (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-blue-300 dark:hover:border-emerald-500/60 transition-colors"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Next</p>
              <p className="mt-2 font-semibold text-zinc-950 dark:text-white">
                {nextPost.title}
              </p>
            </Link>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-4 text-sm text-zinc-500">
              That is the latest post.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
