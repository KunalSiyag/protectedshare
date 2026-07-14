import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ProtectedText Alternative",
  description:
    "ProtectedShare is a modern ProtectedText alternative with browser-side AES-256-GCM encryption, burn-after-read links, .env sharing, and no signup.",
  keywords: [
    "ProtectedText alternative",
    "protected text alternative",
    "protectedtext alternative",
    "free protectedtext alternative",
    "encrypted notepad alternative",
    "zero knowledge note sharing",
  ],
  alternates: {
    canonical: "https://protectedshare.me/protected-text-alternative",
  },
  openGraph: {
    title: "ProtectedText Alternative — ProtectedShare",
    description:
      "Browser-side encryption, no signup, and a modern interface for secure notes, secret links, and developer sharing.",
    url: "https://protectedshare.me/protected-text-alternative",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProtectedText Alternative — ProtectedShare",
    description:
      "Browser-side encryption, no signup, and a modern interface for secure notes, secret links, and developer sharing.",
  },
};

export default function ProtectedTextAlternativePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-blue-600 dark:text-emerald-400 mb-4">
          Comparison Landing Page
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          ProtectedText alternative for modern secure sharing.
        </h1>
        <p className="mt-5 text-base md:text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          ProtectedShare is built for people who want a ProtectedText alternative that feels current: browser-side
          encryption, burn-after-read behavior, a mobile-friendly interface, and developer-focused sharing tools.
        </p>
      </div>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Zero-knowledge by default</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Your browser encrypts notes locally with AES-256-GCM before anything reaches the server.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Flexible secret workflows</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Use secure notes, self-destructing links, or developer secret sharing depending on the task.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white">No signup friction</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Create and share without accounts, cookies, or a long onboarding flow.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
        <h2 className="text-xl font-bold text-zinc-950 dark:text-white">Why teams switch</h2>
        <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          A good ProtectedText alternative should work across everyday workflows, not just personal notes. That means
          secure links for temporary messages, a cleaner mobile experience, and a straightforward path for sharing .env
          files or API keys when developers need them.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/notes" className="rounded-md bg-blue-600 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors">
            Open Secure Notes
          </Link>
          <Link href="/vs/protectedtext" className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
            Read the comparison
          </Link>
        </div>
      </section>
    </main>
  );
}
