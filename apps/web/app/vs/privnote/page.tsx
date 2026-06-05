import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Free Privnote Alternative (Zero-Knowledge) — ProtectedShare",
  description:
    "Why ProtectedShare is the best free alternative to Privnote. Zero-knowledge client-side AES-256-GCM encryption, self-destructing links, .env file sharing, and no signup or ads.",
  alternates: {
    canonical: "https://protectedshare.me/vs/privnote",
  },
};

export default function PrivnoteComparisonPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 transition-colors duration-300">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
          The best free <span className="text-blue-600 dark:text-emerald-400">Privnote</span> alternative
        </h1>
        <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
          Compare Privnote and ProtectedShare side-by-side. Discover why modern developers choose zero-knowledge browser-based encryption without ads or accounts.
        </p>
      </div>

      <div className="overflow-x-auto border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl bg-white/40 dark:bg-zinc-900/10 mb-12">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40">
              <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Feature</th>
              <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Privnote</th>
              <th className="p-4 font-semibold text-blue-600 dark:text-emerald-400">ProtectedShare</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Encryption Method</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">Server-side decryption option / AES</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">AES-256-GCM browser-side (Zero-Knowledge)</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Advertising &amp; Trackers</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">❌ Yes (heavy display ads)</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ 100% Ad-Free &amp; No Cookies</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Environment File (.env) Sharing</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">❌ No</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ Yes (EnvShare built-in)</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Offline-first Notepad</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">❌ No</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ Yes (local browser-encrypted storage)</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Configurable Read Limits</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">❌ 1 read only</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ Yes (1, 3, 5, or 10 reads)</td>
            </tr>
            <tr>
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Required Sign-Up</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">✅ No signup</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ No signup (fully anonymous)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-8 text-left">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Why browser-side encryption matters</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Most self-destructing link services like Privnote decrypt the content on their servers or store keys on their backend database. 
            ProtectedShare uses a **Zero-Knowledge** architecture: all encryption and decryption happens inside your browser using JavaScript's Web Crypto API. The decryption key remains in the URL hash fragment (the part after the `#` symbol), which is never sent to the network or stored in our database. If our database is ever breached, your secrets remain mathematically impossible to read.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">No ads, no trackers, pure privacy</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Unlike legacy tools that monetize via display ads and cookies, ProtectedShare is completely free, open-source, and does not run any analytics trackers or display ads. Your session is completely anonymous.
          </p>
        </div>

        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Ready to share securely?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Choose your tool and get started instantly.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/notes"
              className="px-4 py-2.5 rounded-lg bg-blue-600 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors shadow-sm"
            >
              Secure Notes
            </Link>
            <Link
              href="/secrets"
              className="px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
            >
              EnvShare
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
