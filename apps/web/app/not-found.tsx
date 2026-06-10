import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-20 md:py-28 text-center">
      <p className="text-xs font-mono uppercase tracking-[0.24em] text-blue-600 dark:text-emerald-400">
        404
      </p>
      <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
        Page not found
      </h1>
      <p className="mt-5 text-base md:text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
        The page you&apos;re looking for does not exist, may have moved, or may
        not be public anymore.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
        >
          Read the blog
        </Link>
      </div>
    </main>
  );
}
