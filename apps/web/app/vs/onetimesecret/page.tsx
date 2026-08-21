import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Free OneTimeSecret Alternative (Zero-Knowledge) — ProtectedShare",
  description:
    "Why ProtectedShare is a strong OneTimeSecret alternative. Browser-side AES-256-GCM encryption, expiring links, configurable read limits, .env sharing, an encrypted notepad, and an anonymous chatroom — all free, no signup.",
  keywords: [
    "onetimesecret alternative",
    "one time secret",
    "one-time secret sharing",
    "burn after read link",
    "one time link generator",
    "self destructing secret",
    "private message link",
  ],
  alternates: {
    canonical: "https://protectedshare.me/vs/onetimesecret",
  },
  openGraph: {
    title: "Best Free OneTimeSecret Alternative (Zero-Knowledge) — ProtectedShare",
    description:
      "Browser-side AES-256-GCM encryption, expiring links, configurable read limits, and a full privacy toolkit. Free, no signup.",
    url: "https://protectedshare.me/vs/onetimesecret",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Free OneTimeSecret Alternative (Zero-Knowledge) — ProtectedShare",
    description:
      "Browser-side AES-256-GCM encryption, expiring links, configurable read limits, and a full privacy toolkit. Free, no signup.",
  },
};

export default function OneTimeSecretComparisonPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 transition-colors duration-300">
      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
          The best free <span className="text-blue-600 dark:text-emerald-400">OneTimeSecret</span> alternative
        </h1>
        <p className="mt-5 text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
          OneTimeSecret made one-time links mainstream. ProtectedShare keeps that simplicity and adds true zero-knowledge
          encryption, configurable read limits, and a complete suite of privacy tools — still with no accounts and no cost.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 rounded-2xl shadow-sm mb-10">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40">
              <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Feature</th>
              <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">OneTimeSecret</th>
              <th className="p-4 font-semibold text-blue-600 dark:text-emerald-400">ProtectedShare</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Where encryption happens</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">Server receives and holds the secret until first view</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">Encrypted in your browser; the server only ever stores ciphertext</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Encryption standard</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">Depends on deployment; not client-side by default</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">AES-256-GCM authenticated encryption via Web Crypto</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Read limits</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">Single view focused</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">Configurable 1&ndash;10 reads with auto-deletion at zero</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Expiration control</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">Fixed expiration windows</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">Multiple TTL choices from 1 hour to 7 days</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Two-channel password delivery</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">Optional passphrase</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">Built for split delivery: link in one app, key in another</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Developer tools</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">&#10003; No</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">&#10003; EnvShare for .env files and API keys with hash-fragment keys</td>
            </tr>
            <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Extra privacy tools</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">&#10003; No</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">&#10003; Encrypted notepad and anonymous E2E chatroom included</td>
            </tr>
            <tr>
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">Price &amp; signup</td>
              <td className="p-4 text-zinc-600 dark:text-zinc-400">Free tier, paid plans for teams</td>
              <td className="p-4 text-zinc-900 dark:text-zinc-100 font-medium">100% free, open source, no accounts ever</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-8 text-left">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Zero-knowledge changes the math</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            With a traditional one-time secret service, the platform holds your readable secret until the recipient opens
            it. If that database leaks before the first view, the secret leaks with it. ProtectedShare flips the model:
            your browser encrypts the content with AES-256-GCM before anything is uploaded, so the server transports
            ciphertext it cannot decrypt. A breach yields nothing usable.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">More than one-time links</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Secret delivery is rarely the only job. ProtectedShare bundles the whole workflow into one free toolkit:
          </p>
          <ul className="list-disc pl-5 mt-2.5 text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5">
            <li><strong>Secure Notes:</strong> password-locked messages with TTL expirations and burn-after-read.</li>
            <li><strong>EnvShare:</strong> one-click sharing for .env files and API keys, keys hidden in the URL hash fragment.</li>
            <li><strong>Encrypted Notepad:</strong> an offline-first personal scratchpad with cloud sync.</li>
            <li><strong>Anonymous Chatroom:</strong> end-to-end encrypted rooms with no signup.</li>
          </ul>
        </div>

        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Ready to share securely?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Choose your tool and get started instantly.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/secrets"
              className="px-4 py-2.5 rounded-lg bg-blue-600 dark:bg-white text-white dark:text-zinc-900 font-semibold text-xs hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors shadow-sm"
            >
              Share a Secret
            </Link>
            <Link
              href="/notes"
              className="px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
            >
              Secure Notes
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4 text-sm leading-relaxed">
            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-white/40 dark:bg-zinc-900/10 overflow-hidden shadow-sm hover:border-blue-500/30 dark:hover:border-emerald-500/20 transition-all duration-300">
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3.5 font-bold text-zinc-700 dark:text-zinc-300 select-none hover:bg-zinc-50/50 dark:hover:bg-zinc-900/25 transition-colors">
                What makes ProtectedShare a good OneTimeSecret alternative?
                <svg className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-zinc-650 dark:text-zinc-400">
                Both tools deliver links that expire, but ProtectedShare encrypts your secret in the browser before upload,
                so the server never holds readable content. You also get configurable read limits (1&ndash;10), flexible
                expiration windows, developer-focused .env sharing, an encrypted notepad, and an anonymous chatroom &mdash;
                all free with no accounts.
              </div>
            </details>

            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-white/40 dark:bg-zinc-900/10 overflow-hidden shadow-sm hover:border-blue-500/30 dark:hover:border-emerald-500/20 transition-all duration-300">
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3.5 font-bold text-zinc-700 dark:text-zinc-300 select-none hover:bg-zinc-50/50 dark:hover:bg-zinc-900/25 transition-colors">
                Is ProtectedShare really free?
                <svg className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-zinc-650 dark:text-zinc-400">
                Yes. Every feature is free with no usage limits, no premium tiers, and no signup. The entire project is
                open source, so you can also self-host your own instance with Docker.
              </div>
            </details>

            <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-white/40 dark:bg-zinc-900/10 overflow-hidden shadow-sm hover:border-blue-500/30 dark:hover:border-emerald-500/20 transition-all duration-300">
              <summary className="flex items-center justify-between cursor-pointer px-4 py-3.5 font-bold text-zinc-700 dark:text-zinc-300 select-none hover:bg-zinc-50/50 dark:hover:bg-zinc-900/25 transition-colors">
                Can the server read my one-time secret?
                <svg className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-zinc-650 dark:text-zinc-400">
                No. Encryption happens entirely in your browser using AES-256-GCM with a PBKDF2-stretched key. The
                decryption key stays in the URL hash fragment or travels through a separate channel, and it is never sent
                to the server. Even the operator cannot decrypt stored secrets.
              </div>
            </details>
          </div>
        </div>

        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What makes ProtectedShare a good OneTimeSecret alternative?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Both tools deliver links that expire, but ProtectedShare encrypts your secret in the browser before upload, so the server never holds readable content. You also get configurable read limits (1-10), flexible expiration windows, developer-focused .env sharing, an encrypted notepad, and an anonymous chatroom - all free with no accounts.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is ProtectedShare really free?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Every feature is free with no usage limits, no premium tiers, and no signup. The entire project is open source, so you can also self-host your own instance with Docker.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can the server read my one-time secret?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "No. Encryption happens entirely in your browser using AES-256-GCM with a PBKDF2-stretched key. The decryption key stays in the URL hash fragment or travels through a separate channel, and it is never sent to the server.",
                  },
                },
              ],
            }),
          }}
        />
      </div>
    </main>
  );
}
