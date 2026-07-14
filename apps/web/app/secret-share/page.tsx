import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Secret Share",
  description:
    "Share a secret with burn-after-read links, expiring messages, and browser-side encryption. No signup and no plaintext exposure.",
  keywords: [
    "secret share",
    "secret sharing website",
    "burn after read",
    "temporary secret link",
    "secure text sharing link",
  ],
  alternates: {
    canonical: "https://protectedshare.me/secret-share",
  },
  openGraph: {
    title: "Secret Share — ProtectedShare",
    description:
      "Share a secret with burn-after-read links, expiring messages, and browser-side encryption.",
    url: "https://protectedshare.me/secret-share",
  },
  twitter: {
    card: "summary_large_image",
    title: "Secret Share — ProtectedShare",
    description:
      "Share a secret with burn-after-read links, expiring messages, and browser-side encryption.",
  },
};

export default function SecretSharePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-blue-600 dark:text-emerald-400 mb-4">
          Exact Match
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          Secret share without the usual friction.
        </h1>
        <p className="mt-5 text-base md:text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          ProtectedShare makes secret sharing simple: create a link, encrypt the content locally, set a read limit or
          expiration, and send it through the channel that makes sense for your workflow.
        </p>
      </div>

      <section className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Use cases</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            <li>Send API keys or passwords for a short handoff.</li>
            <li>Share temporary credentials that should expire fast.</li>
            <li>Deliver private text without leaving a readable inbox trail.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Security model</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Secrets are encrypted in the browser, stored as ciphertext, and can be configured to self-destruct after a
            single read or a small number of opens.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
        <h2 className="text-xl font-bold text-zinc-950 dark:text-white">Ready to share one?</h2>
        <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          Jump into the dedicated tool for secure note creation, or browse the comparison pages if you are evaluating
          alternatives.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/notes" className="rounded-md bg-blue-600 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors">
            Create Secure Note
          </Link>
          <Link href="/vs/privnote" className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
            Compare with Privnote
          </Link>
        </div>
      </section>
    </main>
  );
}
