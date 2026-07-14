import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Secure Text Sharing Link",
  description:
    "Create a secure text sharing link for private messages, passwords, and short-lived notes with browser-side encryption.",
  keywords: [
    "secure text sharing link",
    "secret share",
    "protected text alternative",
    "self destruct link",
    "secure link generator",
  ],
  alternates: {
    canonical: "https://protectedshare.me/secure-text-sharing-link",
  },
  openGraph: {
    title: "Secure Text Sharing Link — ProtectedShare",
    description:
      "Create a secure text sharing link for private messages, passwords, and short-lived notes.",
    url: "https://protectedshare.me/secure-text-sharing-link",
  },
  twitter: {
    card: "summary_large_image",
    title: "Secure Text Sharing Link — ProtectedShare",
    description:
      "Create a secure text sharing link for private messages, passwords, and short-lived notes.",
  },
};

export default function SecureTextSharingLinkPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-blue-600 dark:text-emerald-400 mb-4">
          Utility Landing Page
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          Secure text sharing link for private content.
        </h1>
        <p className="mt-5 text-base md:text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          When you need to send a short message, password, or reminder safely, ProtectedShare gives you a secure text
          sharing link that keeps the plaintext in your browser until encryption is done.
        </p>
      </div>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Fast</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Create a link in a few clicks and share it in the channel that fits your workflow.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Private</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Encryption happens locally and the server only receives encrypted payloads.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Temporary</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Use expiration windows and read limits so the link does not outlive the job.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
        <h2 className="text-xl font-bold text-zinc-950 dark:text-white">Best for</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          <li>Temporary secrets that should not sit in chat logs forever.</li>
          <li>Password handoffs and one-time access codes.</li>
          <li>Private notes you want to burn after reading.</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/secrets" className="rounded-md bg-blue-600 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors">
            Open EnvShare
          </Link>
          <Link href="/chat" className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
            Try the chatroom
          </Link>
        </div>
      </section>
    </main>
  );
}
