import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Free Privnote Alternative (Zero-Knowledge)",
  description:
    "Why ProtectedShare is the best free alternative to Privnote. Zero-knowledge client-side AES-256-GCM encryption, self-destructing links, .env file sharing, and no signup or ads.",
  keywords: [
    "Privnote alternative",
    "privnote alternatives",
    "secret share",
    "secure text sharing link",
    "self destruct link",
    "self-destructing link",
    "free privnote alternative",
    "burn after read note",
    "anonymous encrypted note sharing",
    "zero knowledge secret link",
  ],
  alternates: {
    canonical: "https://protectedshare.me/vs/privnote",
  },
  openGraph: {
    title: "Best Free Privnote Alternative (Zero-Knowledge) — ProtectedShare",
    description: "Why ProtectedShare is the best free alternative to Privnote. Zero-knowledge client-side AES-256-GCM encryption, self-destructing links, .env file sharing, and no signup or ads.",
    url: "https://protectedshare.me/vs/privnote",
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
    title: "Best Free Privnote Alternative (Zero-Knowledge) — ProtectedShare",
    description: "Why ProtectedShare is the best free alternative to Privnote. Zero-knowledge client-side AES-256-GCM encryption, self-destructing links, .env file sharing, and no signup or ads.",
    images: ["/og-image.png"],
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

        {/* FAQ Section */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4 text-sm leading-relaxed">
            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-white/40 dark:bg-zinc-900/10 overflow-hidden shadow-sm hover:border-blue-500/30 dark:hover:border-emerald-500/20 transition-all duration-300">
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3.5 font-bold text-zinc-700 dark:text-zinc-300 select-none hover:bg-zinc-55/50 dark:hover:bg-zinc-900/25 transition-colors">
                What makes ProtectedShare a good Privnote alternative?
                <svg className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-zinc-650 dark:text-zinc-400">
                ProtectedShare provides client-side zero-knowledge encryption using the browser Web Crypto API. Unlike older tools like Privnote, which can run intrusive display ads and third-party trackers, ProtectedShare is 100% open-source, runs zero tracking scripts or cookies, and supports advanced developer features like EnvShare (.env configuration sharing).
              </div>
            </details>

            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-white/40 dark:bg-zinc-900/10 overflow-hidden shadow-sm hover:border-blue-500/30 dark:hover:border-emerald-500/20 transition-all duration-300">
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3.5 font-bold text-zinc-700 dark:text-zinc-300 select-none hover:bg-zinc-55/50 dark:hover:bg-zinc-900/25 transition-colors">
                Is Privnote really end-to-end encrypted?
                <svg className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-zinc-650 dark:text-zinc-400">
                While legacy services claim encryption, many perform decryption on their servers or require the key to be sent to their backends. ProtectedShare performs AES-256-GCM encryption client-side, storing the decryption key in the browser's URL hash (after the `#` symbol), ensuring that not even the hosting server can read your secret.
              </div>
            </details>

            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-white/40 dark:bg-zinc-900/10 overflow-hidden shadow-sm hover:border-blue-500/30 dark:hover:border-emerald-500/20 transition-all duration-300">
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3.5 font-bold text-zinc-700 dark:text-zinc-300 select-none hover:bg-zinc-55/50 dark:hover:bg-zinc-900/25 transition-colors">
                Does ProtectedShare store logs of my IP or secrets?
                <svg className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-zinc-650 dark:text-zinc-400">
                No, ProtectedShare operates a zero-tracking model. We do not store IP addresses or connection details, and our database records are set to immediately auto-destruct upon reading or expiration.
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
                  name: "What makes ProtectedShare a good Privnote alternative?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "ProtectedShare provides client-side zero-knowledge encryption using the browser Web Crypto API. Unlike older tools like Privnote, which can run intrusive display ads and third-party trackers, ProtectedShare is 100% open-source, runs zero tracking scripts or cookies, and supports advanced developer features like EnvShare (.env configuration sharing).",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Privnote really end-to-end encrypted?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "While legacy services claim encryption, many perform decryption on their servers or require the key to be sent to their backends. ProtectedShare performs AES-256-GCM encryption client-side, storing the decryption key in the browser's URL hash (after the `#` symbol), ensuring that not even the hosting server can read your secret.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Does ProtectedShare store logs of my IP or secrets?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No, ProtectedShare operates a zero-tracking model. We do not store IP addresses or connection details, and our database records are set to immediately auto-destruct upon reading or expiration.",
                  },
                },
              ],
            }),
          }}
        />

        <div className="mt-12 pt-6 border-t border-zinc-200 dark:border-zinc-800/60 text-xs text-zinc-500 flex flex-wrap gap-x-6 gap-y-2 justify-center sm:justify-start font-mono">
          <span className="text-zinc-700 dark:text-zinc-400 font-semibold">Other Comparisons:</span>
          <Link href="/vs/protectedtext" className="hover:underline text-blue-600 dark:text-emerald-400">ProtectedShare vs ProtectedText</Link>
          <Link href="/vs/envshare" className="hover:underline text-blue-600 dark:text-emerald-400">ProtectedShare vs EnvShare</Link>
          <Link href="/" className="hover:underline">Home</Link>
        </div>
      </div>
    </main>
  );
}
