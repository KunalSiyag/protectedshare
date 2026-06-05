import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Free EnvShare Alternative (Active & Polished) — ProtectedShare",
  description:
    "Why ProtectedShare is the best free alternative to EnvShare. AES-256-GCM zero-knowledge encryption, self-destructing links, and a complete suite of notes and offline notepad tools.",
  alternates: {
    canonical: "https://protectedshare.me/vs/envshare",
  },
};

export default function EnvShareComparisonPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 transition-colors duration-300">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
          The best free <span className="text-blue-600 dark:text-emerald-400">EnvShare</span> alternative
        </h1>
        <p className="mt-4 text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
          Compare EnvShare and ProtectedShare side-by-side. Upgrade to a modern, actively maintained environment variable sharing utility.
        </p>
      </div>

      <div className="overflow-x-auto border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl bg-white/40 dark:bg-zinc-900/10 mb-12">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40">
              <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Feature</th>
              <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">EnvShare</th>
              <th className="p-4 font-semibold text-blue-600 dark:text-emerald-400">ProtectedShare</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Project Maintenance</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">❌ Inactive (last commit 2+ years ago)</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ Actively Maintained &amp; Supported</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Dark / Light Mode</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">❌ Dark mode only</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ Seamless Dual Theme (System, Light, Dark)</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Secure Notes Interface</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">❌ No (secrets only)</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ Yes (dedicated separate password notepad)</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Offline-first Encrypted Notepad</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">❌ No</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ Yes (local browser-encrypted storage)</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Configurable Read Limits</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">✅ 1 to 100 reads</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">✅ Yes (1, 3, 5, or 10 reads)</td>
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
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Why choose an active project?</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            EnvShare was a great project, but it has not been updated in over two years. In security and web technology, staying active is crucial. 
            ProtectedShare is actively maintained, built on Next.js 15, and is regularly audited for dependency updates and modern cryptographic best practices.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">A unified workspace for secret sharing</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            While EnvShare only supports monospaced env file sharing, ProtectedShare is a complete, multi-tool privacy suite:
          </p>
          <ul className="list-disc pl-5 mt-2.5 text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5">
            <li>**EnvShare Mode:** Share monospaced config blocks that delete after N reads.</li>
            <li>**Secure Notes:** Write rich messages, lock them with custom passwords, and share keys separately.</li>
            <li>**Notepad:** Use your browser as an encrypted workspace for local notes that are never sent to any server.</li>
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
