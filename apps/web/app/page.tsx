import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ProtectedShare — Free Zero-Knowledge Encrypted Notes & One-Time Secret Sharing",
  description:
    "Share passwords, API keys, and sensitive data securely with military-grade AES-256 encryption. Self-destructing messages, burn-after-read, and an offline-first encrypted notepad. No signup required. Free and open source.",
  alternates: {
    canonical: "https://protectedshare.me",
  },
  openGraph: {
    title: "ProtectedShare — Zero-Knowledge Encrypted Sharing",
    description:
      "Military-grade AES-256 encryption for passwords, API keys, and secrets. Self-destructing links. No signup. Free.",
    url: "https://protectedshare.me",
  },
};

export default function HomePage() {
  return (
    <main className="flex flex-col items-center px-6 py-12 md:py-20 text-center transition-colors duration-300">
      {/* JSON-LD Structured Data for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "ProtectedShare",
            url: "https://protectedshare.me",
            description:
              "Zero-knowledge encrypted note sharing and one-time secret links with AES-256-GCM encryption. Self-destructing messages with burn-after-read.",
            applicationCategory: "SecurityApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            featureList: [
              "AES-256-GCM client-side encryption",
              "Self-destructing one-time secrets",
              "Burn-after-read notes",
              "Offline-first encrypted notepad",
              "Zero signup required",
              "No tracking or cookies",
            ],
          }),
        }}
      />

      {/* Hero */}
      <div className="max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-emerald-500/5 border border-blue-200/60 dark:border-emerald-500/20 text-xs font-semibold text-blue-700 dark:text-emerald-400 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-emerald-500 animate-pulse" />
          AES-256 · Zero-Knowledge · No Signup
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
          Share secrets that
          <span className="text-blue-600 dark:text-emerald-400"> disappear</span>
        </h1>

        <p className="mt-5 text-base md:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
          End-to-end encrypted notes and self-destructing links.
          Your plaintext never leaves your browser. No accounts, no tracking, no compromise.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/notes"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 dark:bg-white text-white dark:text-zinc-900 font-semibold text-sm hover:bg-blue-700 dark:hover:bg-zinc-100 shadow-md hover:shadow-lg transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Create Encrypted Note
          </Link>
          <Link
            href="/secrets"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Share One-Time Secret
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-16 w-full max-w-2xl">
        <FeatureCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          }
          title="Browser Encryption"
          description="AES-256-GCM encryption happens entirely in your browser. The server never sees your plaintext."
        />
        <FeatureCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
            </svg>
          }
          title="Burn After Read"
          description="Secrets self-destruct on first view. Permanently deleted from the database — no traces."
        />
        <FeatureCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          }
          title="Zero Tracking"
          description="No cookies, no analytics beacons, no signup. Your session is completely anonymous."
        />
      </div>

      {/* How It Works */}
      <div className="mt-16 w-full max-w-xl">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">How it works</h2>
        <div className="space-y-4 text-left">
          <Step number="1" title="Write your secret" description="Type your password, API key, or private note into the editor." />
          <Step number="2" title="Encrypted in your browser" description="AES-256-GCM encryption with PBKDF2 key derivation (210K iterations). Plaintext never leaves your device." />
          <Step number="3" title="Share the link" description="Get a unique link. For notes, share the password separately via a different channel for maximum security." />
          <Step number="4" title="Auto-destruct" description="Secrets are permanently deleted after being viewed. Notes expire automatically based on your chosen duration." />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 p-6 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/20 w-full max-w-xl">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">Need dedicated infrastructure?</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
          We deploy completely isolated, private zero-knowledge instances for enterprises.
          Custom domains, dedicated databases, and full compliance support.
        </p>
        <a
          href="mailto:admin@protectedshare.me"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-emerald-400 hover:underline"
        >
          Contact us →
        </a>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-900/10 transition-colors hover:border-blue-200 dark:hover:border-emerald-500/20">
      <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-emerald-500/5 text-blue-600 dark:text-emerald-400 mb-3">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">{title}</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 dark:bg-emerald-500 text-white dark:text-zinc-900 flex items-center justify-center text-xs font-bold">
        {number}
      </div>
      <div className="pt-0.5">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
