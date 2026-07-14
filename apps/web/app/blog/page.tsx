import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "../../lib/blog";

export const metadata: Metadata = {
  title: "Security & Cryptographic Guides Blog",
  description:
    "Secure note-sharing guides, zero-knowledge encryption explainers, .env file tips, and privacy-focused comparisons.",
  alternates: {
    canonical: "https://protectedshare.me/blog",
  },
  openGraph: {
    title: "Security & Cryptographic Guides Blog",
    description:
      "Secure note-sharing guides, zero-knowledge encryption explainers, .env file tips, and privacy-focused comparisons.",
    url: "https://protectedshare.me/blog",
    type: "website",
  },
};

export default function BlogIndexPage() {
  const posts = [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-blue-600 dark:text-emerald-400 mb-4">
          Security Blog
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          Secure note sharing, explained clearly.
        </h1>
        <p className="mt-5 text-base md:text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          These guides cover browser-side encryption, burn-after-read secrets,
          .env sharing, and practical privacy workflows for teams, freelancers,
          and developers.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/secrets"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors"
          >
            Share a Secret
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 p-5">
          <p className="text-xs font-mono uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
            Popular guides and tools
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/vs/protectedtext" className="rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-emerald-400 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors">
              ProtectedText alternative
            </Link>
            <Link href="/vs/privnote" className="rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-emerald-400 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors">
              Privnote alternative
            </Link>
            <Link href="/vs/envshare" className="rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-emerald-400 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors">
              EnvShare alternative
            </Link>
            <Link href="/chat" className="rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-emerald-400 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors">
              Anonymous encrypted chatroom
            </Link>
            <Link href="/notes" className="rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-emerald-400 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors">
              Secure notes
            </Link>
            <Link href="/secrets" className="rounded-full border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-blue-400 dark:hover:border-emerald-400 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors">
              Share API keys securely
            </Link>
          </div>
        </div>
      </div>

      <section className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-500">
              <span className="rounded-full bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 font-medium text-zinc-600 dark:text-zinc-400">
                {post.category}
              </span>
              <span>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(post.publishedAt))}</span>
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
              <Link href={`/blog/${post.slug}`} className="hover:text-blue-600 dark:hover:text-emerald-400 transition-colors">
                {post.title}
              </Link>
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              {post.description}
            </p>
            <div className="mt-5 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
              <span>{post.readingTime}</span>
              <Link
                href={`/blog/${post.slug}`}
                className="font-semibold text-blue-600 dark:text-emerald-400 hover:underline"
              >
                Read article
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
