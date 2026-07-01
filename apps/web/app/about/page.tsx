import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the mission, philosophy, and technology behind ProtectedShare's zero-knowledge security suite.",
  alternates: {
    canonical: "https://protectedshare.me/about",
  },
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-zinc-800 dark:text-zinc-300">
      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-6">About ProtectedShare</h1>
      <p className="text-sm text-zinc-500 mb-8 font-mono">Reinventing Ephemeral Web Security</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Our Mission</h2>
          <p>
            ProtectedShare was founded with a simple goal: to make end-to-end encrypted sharing as fast and frictionless as possible. We observed that existing platforms for sending passwords, API keys, or taking private notes were either hard to use, required intrusive user logins, or were cluttered with trackers and ads.
          </p>
          <p>
            We built a unified, free, and open-source suite that combines secure note-sharing, monospaced environment code layouts (EnvShare), and offline browser-encrypted local notepads in a single modern interface.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Zero-Knowledge Architecture</h2>
          <p>
            Most sharing platforms decrypt your payload on the server side to store it, or retain access keys in their backend systems. ProtectedShare utilizes the Web Crypto API to guarantee client-side **zero-knowledge** privacy:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your browser generates a cryptographically secure key pair.</li>
            <li>The data is encrypted on your local machine using AES-256-GCM.</li>
            <li>The key never touches the internet (stored strictly in the link's hash `#` segment or in your memory).</li>
            <li>Only the encrypted blob is stored on our server, which self-destructs instantly upon viewing.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Free &amp; Open Source</h2>
          <p>
            We believe that security code must be transparent. The entire codebase of ProtectedShare is open source, allowing you to audit, review, or self-host your own instances.
          </p>
        </section>

        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-850 flex items-center gap-4">
          <Link
            href="/notes"
            className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors shadow-sm"
          >
            Create Encrypted Note
          </Link>
          <Link
            href="/secrets"
            className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
          >
            EnvShare
          </Link>
        </div>
      </div>
    </main>
  );
}
