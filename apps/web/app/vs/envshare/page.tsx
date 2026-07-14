import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Free EnvShare Alternative (Active & Polished)",
  description:
    "Why ProtectedShare is the best free alternative to EnvShare. AES-256-GCM zero-knowledge encryption, self-destructing links, and a complete suite of notes and offline notepad tools.",
  keywords: [
    "EnvShare alternative",
    "share env file securely",
    "share api key securely",
    "secret share",
    "secure text sharing link",
    "self destruct link",
    "self-destructing link",
    "envshare replacement",
    "developer secret sharing",
    "temporary secret link",
  ],
  alternates: {
    canonical: "https://protectedshare.me/vs/envshare",
  },
  openGraph: {
    title: "Best Free EnvShare Alternative (Active & Polished) — ProtectedShare",
    description: "Why ProtectedShare is the best free alternative to EnvShare. AES-256-GCM zero-knowledge encryption, self-destructing links, and a complete suite of notes and offline notepad tools.",
    url: "https://protectedshare.me/vs/envshare",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ProtectedShare - Zero-Knowledge Secure Notes & Online Notepad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Free EnvShare Alternative (Active & Polished) — ProtectedShare",
    description: "Why ProtectedShare is the best free alternative to EnvShare. AES-256-GCM zero-knowledge encryption, self-destructing links, and a complete suite of notes and offline notepad tools.",
    images: ["/og-image.png"],
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

        {/* FAQ Section */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4 text-sm leading-relaxed">
            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-white/40 dark:bg-zinc-900/10 overflow-hidden shadow-sm hover:border-blue-500/30 dark:hover:border-emerald-500/20 transition-all duration-300">
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3.5 font-bold text-zinc-700 dark:text-zinc-300 select-none hover:bg-zinc-55/50 dark:hover:bg-zinc-900/25 transition-colors">
                What makes ProtectedShare a good EnvShare alternative?
                <svg className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-zinc-650 dark:text-zinc-400">
                While EnvShare is an excellent tool for sharing monospaced .env files and API keys, the original project has been unmaintained for over two years. ProtectedShare is an active, modern implementation that incorporates the same zero-knowledge URL-hash based encryption, but adds secure notes (for two-channel password delivery), an offline-first encrypted notepad, dark/light themes, and regular dependency updates.
              </div>
            </details>

            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-white/40 dark:bg-zinc-900/10 overflow-hidden shadow-sm hover:border-blue-500/30 dark:hover:border-emerald-500/20 transition-all duration-300">
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3.5 font-bold text-zinc-700 dark:text-zinc-300 select-none hover:bg-zinc-55/50 dark:hover:bg-zinc-900/25 transition-colors">
                How does EnvShare compare to ProtectedShare's Secure Notes?
                <svg className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-zinc-650 dark:text-zinc-400">
                In EnvShare mode, the decryption key is appended as a URL hash fragment (e.g. <code>#key=...</code>) allowing one-click decryption for developers. In Secure Notes mode, you set a custom password or auto-generate one, and must deliver the password separately to the recipient. This allows true multi-channel verification for high-security credentials.
              </div>
            </details>

            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-white/40 dark:bg-zinc-900/10 overflow-hidden shadow-sm hover:border-blue-500/30 dark:hover:border-emerald-500/20 transition-all duration-300">
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3.5 font-bold text-zinc-700 dark:text-zinc-300 select-none hover:bg-zinc-55/50 dark:hover:bg-zinc-900/25 transition-colors">
                Can I self-host my own instance of ProtectedShare?
                <svg className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-zinc-650 dark:text-zinc-400">
                Yes! ProtectedShare is 100% open-source and provides full Docker deployment guides. You can pull the Next.js frontend package and host it on your own server, pointing it to your own Cloudflare Worker database instance.
              </div>
            </details>
          </div>
        </div>

        {/* JSON-LD: FAQPage Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What makes ProtectedShare a good EnvShare alternative?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "While EnvShare is an excellent tool for sharing monospaced .env files and API keys, the original project has been unmaintained for over two years. ProtectedShare is an active, modern implementation that incorporates the same zero-knowledge URL-hash based encryption, but adds secure notes (for two-channel password delivery), an offline-first encrypted notepad, dark/light themes, and regular dependency updates.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How does EnvShare compare to ProtectedShare's Secure Notes?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "In EnvShare mode, the decryption key is appended as a URL hash fragment (e.g. #key=...) allowing one-click decryption for developers. In Secure Notes mode, you set a custom password or auto-generate one, and must deliver the password separately to the recipient. This allows true multi-channel verification for high-security credentials.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can I self-host my own instance of ProtectedShare?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes! ProtectedShare is 100% open-source and provides full Docker deployment guides. You can pull the Next.js frontend package and host it on your own server, pointing it to your own Cloudflare Worker database instance.",
                  },
                },
              ],
            }),
          }}
        />

        <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 text-xs text-zinc-500 flex flex-wrap gap-x-6 gap-y-2 justify-center sm:justify-start font-mono">
          <span className="text-zinc-700 dark:text-zinc-400 font-semibold">Other Comparisons:</span>
          <Link href="/vs/privnote" className="hover:underline text-blue-600 dark:text-emerald-400">ProtectedShare vs Privnote</Link>
          <Link href="/vs/protectedtext" className="hover:underline text-blue-600 dark:text-emerald-400">ProtectedShare vs ProtectedText</Link>
          <Link href="/" className="hover:underline">Home</Link>
        </div>
      </div>
    </main>
  );
}
