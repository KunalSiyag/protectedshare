import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Free ProtectedText Alternative (AES-256-GCM) — ProtectedShare",
  description:
    "Why ProtectedShare is the best free alternative to ProtectedText. E2E zero-knowledge AES-256-GCM encryption, self-destructing links, .env file sharing, and a modern mobile-first interface.",
  alternates: {
    canonical: "https://protectedshare.me/vs/protectedtext",
  },
};

export default function ProtectedTextComparisonPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 transition-colors duration-300">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
          The best free <span className="text-blue-600 dark:text-emerald-400">ProtectedText</span> alternative
        </h1>
        <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
          Compare ProtectedText and ProtectedShare side-by-side. Upgrade to modern AES-256-GCM authenticated encryption and a mobile-friendly user experience.
        </p>
      </div>

      <div className="overflow-x-auto border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl bg-white/40 dark:bg-zinc-900/10 mb-12">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40">
              <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Feature</th>
              <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">ProtectedText</th>
              <th className="p-4 font-semibold text-blue-600 dark:text-emerald-400">ProtectedShare</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Encryption Standard</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">AES-256-CBC (vulnerable to padding attacks)</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">AES-256-GCM (modern authenticated encryption)</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Mobile Interface</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">❌ Dated layout, hard to navigate on mobile</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ Fully responsive and mobile-first layout</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Self-Destructing Secrets</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">❌ No (manually delete only)</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ Yes (one-time or multi-read self-destruct)</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Environment File (.env) Sharing</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">❌ No</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ Yes (EnvShare built-in)</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Offline-first Encrypted Notepad</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">❌ No (requires online storage)</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ Yes (works offline using LocalStorage)</td>
            </tr>
            <tr>
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Sign-Up required</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">✅ No signup</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ No signup (fully anonymous)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-8 text-left">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Upgrade to authenticated encryption</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            ProtectedText uses legacy AES-256-CBC encryption. While secure, CBC mode is vulnerable to certain padding attacks if not implemented with message authentication. 
            ProtectedShare uses **AES-256-GCM** (Galois/Counter Mode), which is a modern, high-performance authenticated encryption standard that provides both confidentiality and data integrity verification, preventing tampering.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">A modern suite of privacy tools</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            ProtectedText is just a simple notepad. ProtectedShare gives you a unified ecosystem:
          </p>
          <ul className="list-disc pl-5 mt-2.5 text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5">
            <li>**Secure Notes:** Encrypt notes, set expiry times, and share passwords separately for max security.</li>
            <li>**EnvShare:** Send monospace-styled environment files and API keys directly to developers with one click.</li>
            <li>**Notepad:** Draft personal local files that never touch the server at all.</li>
          </ul>
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
