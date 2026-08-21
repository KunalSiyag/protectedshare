import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Share Passwords Securely Online (Free Tool, No Signup)",
  description:
    "Send passwords safely with browser-side AES-256 encryption, expiring links, and two-channel delivery. Free password sharing tool — no account required.",
  keywords: [
    "share passwords securely",
    "how to share a password",
    "send password safely",
    "password sharing tool",
    "share password online",
    "safe way to send passwords",
    "send wifi password",
  ],
  alternates: {
    canonical: "https://protectedshare.me/share-password-securely",
  },
  openGraph: {
    title: "How to Share Passwords Securely Online — ProtectedShare",
    description:
      "Browser-side AES-256 encryption, expiring links, and two-channel delivery. Free, no signup.",
    url: "https://protectedshare.me/share-password-securely",
  },
  twitter: {
    card: "summary_large_image",
    title: "How to Share Passwords Securely Online — ProtectedShare",
    description:
      "Browser-side AES-256 encryption, expiring links, and two-channel delivery. Free, no signup.",
  },
};

export default function SharePasswordSecurelyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <div className="max-w-3xl">
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-blue-600 dark:text-emerald-400 mb-4">
          Password Sharing
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          The safe way to share a password online.
        </h1>
        <p className="mt-5 text-base md:text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Chat apps, email, and SMS keep permanent copies of everything you send. A better habit takes one extra minute:
          encrypt the password in your browser, share an expiring link, and let the secret delete itself after it is read.
        </p>
      </div>

      <section className="mt-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6 md:p-8">
        <h2 className="text-xl font-bold text-zinc-950 dark:text-white">Three steps, about one minute</h2>
        <ol className="mt-4 space-y-4 text-sm leading-7 text-zinc-600 dark:text-zinc-400 list-decimal pl-5">
          <li>
            <strong className="text-zinc-900 dark:text-zinc-200">Paste the password into Secure Notes.</strong> It is
            encrypted with AES-256-GCM in your browser before anything leaves your device.
          </li>
          <li>
            <strong className="text-zinc-900 dark:text-zinc-200">Set an expiration and read limit.</strong> For a
            credential used once, burn-after-read is ideal. For onboarding, allow a few reads within a short window.
          </li>
          <li>
            <strong className="text-zinc-900 dark:text-zinc-200">Send the link and key separately.</strong> Link by email
            or chat, decryption password by SMS or a phone call. No single message reveals everything.
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/notes" className="rounded-md bg-blue-600 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors">
            Share a Password Now
          </Link>
          <Link href="/secrets" className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors">
            Sharing .env files instead?
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white">When this matters most</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            <li>Onboarding a contractor or client onto a tool.</li>
            <li>Sending a Wi-Fi password to a guest.</li>
            <li>Handing over database or API credentials.</li>
            <li>Passing a recovery code to a family member.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white">Why not just email it?</h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            Email archives messages indefinitely across providers and devices. Chat histories sync to every logged-in
            phone and laptop. An encrypted link that self-destructs after reading leaves none of those copies behind.
          </p>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: "How to share a password securely online",
            step: [
              { "@type": "HowToStep", name: "Encrypt the password", text: "Paste the password into a zero-knowledge secure note so it is encrypted in your browser before upload." },
              { "@type": "HowToStep", name: "Set expiration", text: "Choose a short expiration and a read limit, such as burn-after-read for one-time use." },
              { "@type": "HowToStep", name: "Split the channels", text: "Send the link through one channel and the decryption password through another." },
            ],
          }),
        }}
      />
    </main>
  );
}
