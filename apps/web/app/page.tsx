import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileCode,
  Lock,
  FileText,
  CheckCircle,
  Shield,
  Sparkles,
  Server,
  HelpCircle,
} from "lucide-react";


export const metadata: Metadata = {
  title: "ProtectedText Alternative | Secret Sharing Website, Online Notepad & EnvShare — No Signup",
  description:
    "The modern ProtectedText alternative and secret sharing website. Free encrypted online notepad, .env file sharing (EnvShare), and self-destructing secret links — all with AES-256 zero-knowledge encryption. No signup, no tracking.",
  alternates: {
    canonical: "https://protectedshare.me",
  },
  openGraph: {
    title: "ProtectedText Alternative | Secret Sharing Website, Online Notepad & EnvShare",
    description:
      "Free encrypted notes, secret sharing, online notepad, and .env sharing with AES-256 encryption. No signup. No tracking. Self-destructing links.",
    url: "https://protectedshare.me",
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
    title: "ProtectedText Alternative | Secret Sharing Website, Online Notepad & EnvShare",
    description:
      "Free encrypted notes, secret sharing, online notepad, and .env sharing with AES-256 encryption. No signup. No tracking. Self-destructing links.",
    images: ["/og-image.png"],
  },
};

export default function HomePage() {
  return (
    <main className="flex flex-col items-center bg-zinc-50 dark:bg-[#09090b] text-zinc-800 dark:text-zinc-300 transition-colors duration-300 w-full overflow-hidden">
      {/* JSON-LD: WebApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "ProtectedShare",
            url: "https://protectedshare.me",
            description:
              "Free zero-knowledge encrypted note sharing, EnvShare (.env file sharing), and self-destructing secret links. Hosted securely on Cloudflare.",
            applicationCategory: "SecurityApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            featureList: [
              "AES-256-GCM client-side encryption",
              "Share .env files securely (EnvShare)",
              "Self-destructing one-time secrets",
              "Burn-after-read notes",
              "Configurable read limits (1-10 reads)",
              "Offline-first encrypted notepad",
              "Zero signup required",
              "No tracking or cookies",
              "Free ProtectedText alternative",
              "Free Privnote alternative",
            ],
          }),
        }}
      />

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
                name: "Is ProtectedShare really free?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, ProtectedShare is 100% free with no signup, no accounts, and no usage limits. You can create unlimited encrypted notes, share .env files, and generate self-destructing secret links at no cost.",
                },
              },
              {
                "@type": "Question",
                name: "How is ProtectedShare different from EnvShare?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "ProtectedShare includes all EnvShare features (AES-256 encrypted .env sharing with configurable TTL and read limits) plus additional tools: encrypted notes with separate password delivery, an offline-first encrypted notepad, dark/light mode, and a mobile-optimized interface. EnvShare is no longer actively maintained, while ProtectedShare is actively developed.",
                },
              },
              {
                "@type": "Question",
                name: "What is the difference between Secure Notes and EnvShare?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Secure Notes is designed for two-channel sharing (you send the link via one app like email, and the password via another like SMS/Signal). EnvShare is built for quick one-click sharing of code/dotenv files where the password is automatically embedded in the link's hash fragment (e.g. #password) so the recipient doesn't have to enter it manually.",
                },
              },
              {
                "@type": "Question",
                name: "Can the server read my secrets?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No. ProtectedShare uses zero-knowledge architecture. Your data is encrypted with AES-256-GCM entirely in your browser before being sent to the server. The encryption key never leaves your device, making it mathematically impossible for anyone — including our servers — to decrypt your data.",
                },
              },
              {
                "@type": "Question",
                name: "How do I share API keys and .env files securely?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Go to the EnvShare page, paste your API keys or .env file content, choose an expiration time (1 hour, 24 hours, or 7 days) and read limit (1 to 10 reads), then click 'Encrypt & Generate Link'. The decryption key stays in the URL hash fragment and is never sent to the server.",
                },
              },
              {
                "@type": "Question",
                name: "Is ProtectedShare a good alternative to ProtectedText?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. ProtectedShare offers stronger encryption (AES-256-GCM vs. AES-256-CBC), a modern mobile-friendly interface, self-destructing notes, .env file sharing, and an offline-first encrypted notepad — all without requiring signup or accounts.",
                },
              },
              {
                "@type": "Question",
                name: "What happens after someone opens my secret link?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "It depends on your read limit setting. If set to 1 read (burn-after-read), the encrypted data is permanently deleted from the database immediately after the first view. If set to multiple reads (3, 5, or 10), the counter decrements with each view and the data is deleted when it reaches zero.",
                },
              },
            ],
          }),
        }}
      />

      {/* ═══ SECTION 1: HERO ═══ */}
      <section className="relative w-full min-h-[85vh] flex flex-col items-center justify-center py-16 md:py-24 px-6 bg-gradient-to-b from-zinc-100/50 via-zinc-50 to-zinc-50 dark:from-[#09090b]/80 dark:via-[#09090b] dark:to-[#09090b]">
        {/* Background glow grids */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-blue-500/10 dark:bg-emerald-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Column: Title and CTAs */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* GitHub Announcement Badge */}
            <a
              href="https://github.com/KunalSiyag/protectedshare"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/80 dark:bg-zinc-900/60 text-xs font-semibold text-zinc-650 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 hover:border-zinc-350 dark:hover:border-zinc-700 transition-all mb-8 shadow-sm cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Open Source on GitHub</span>
              <ArrowRight className="h-3 w-3" />
            </a>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.12] max-w-2xl">
              Zero-Knowledge <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-emerald-400 dark:to-teal-500">Secure Note Sharing</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-sm md:text-base text-zinc-650 dark:text-zinc-400 max-w-xl leading-relaxed">
              Privacy-first secret sharing. Encrypt credentials, configuration <code className="font-mono text-xs bg-zinc-200/50 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded">.env</code> files, and private text directly in your browser. Raw keys never touch the cloud. No signup, no tracking.
            </p>

            {/* Call to Action Group */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-8 w-full">
              <Link
                href="/secrets"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-xs sm:text-sm font-semibold transition-all duration-200 shadow-lg cursor-pointer shrink-0"
              >
                <FileCode className="h-4 w-4" />
                <span>Share .env / Keys</span>
              </Link>
              <Link
                href="/notes"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:white hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer shadow-sm shrink-0"
              >
                <Lock className="h-4 w-4 text-amber-500" />
                <span>Secure Notes</span>
              </Link>
              <Link
                href="/notepad"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:white hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all duration-200 cursor-pointer shadow-sm shrink-0"
              >
                <FileText className="h-4 w-4 text-blue-500" />
                <span>Encrypted Notepad</span>
              </Link>
            </div>

            {/* Checkmarks */}
            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-zinc-550 dark:text-zinc-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                AES-256-GCM
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-350 dark:bg-zinc-700" />
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                Zero Signup
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-350 dark:bg-zinc-700" />
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                Self-Destructing
              </span>
            </div>
          </div>

          {/* Right Column: Visual Mockup */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/85 shadow-2xl overflow-hidden font-sans hover:border-blue-500/40 dark:hover:border-emerald-500/40 hover:shadow-[0_0_50px_-12px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_0_50px_-12px_rgba(16,185,129,0.12)] transition-all duration-500">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 select-none">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded border border-zinc-200/30 dark:border-zinc-800/80 bg-zinc-200/50 dark:bg-zinc-800/50 text-[10px] text-zinc-550 dark:text-zinc-400 font-mono w-48 justify-center select-none truncate">
                  <Lock className="w-2.5 h-2.5 text-emerald-500" />
                  <span>protectedshare.me/s#key=...</span>
                </div>
                <div className="w-12" />
              </div>
              {/* Window Body */}
              <div className="p-5 space-y-4 text-left">
                {/* Plaintext block */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-550 dark:text-zinc-500 font-semibold font-mono uppercase tracking-wider">
                    <span>1. Input (Your Browser)</span>
                    <span className="text-emerald-500 dark:text-teal-400 font-mono text-[9px]">Plaintext</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 font-mono text-[11px] text-zinc-700 dark:text-zinc-350 break-all">
                    DATABASE_URL=postgresql://db_user:••••••••@host:5432/production
                  </div>
                </div>
                {/* Encryption arrow & shield */}
                <div className="flex items-center justify-center gap-2 py-1">
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800/80 flex-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/50 dark:via-emerald-500/50 to-transparent" />
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-blue-200/80 dark:border-emerald-800/80 bg-blue-50/50 dark:bg-emerald-950/20 text-[10px] text-blue-600 dark:text-emerald-400 font-semibold font-mono uppercase tracking-wider select-none">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Client AES-256-GCM</span>
                  </div>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800/80 flex-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/50 dark:via-emerald-500/50 to-transparent" />
                  </div>
                </div>
                {/* Encrypted blob block */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-zinc-555 dark:text-zinc-500 font-semibold font-mono uppercase tracking-wider">
                    <span>2. Stored (Database)</span>
                    <span className="text-blue-500 dark:text-indigo-400 font-mono text-[9px]">Encrypted Blob</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 font-mono text-[10px] text-zinc-550 dark:text-zinc-500 select-all break-all leading-normal max-h-16 overflow-y-auto">
                    {"{ \"iv\": \"e6f1a8c9...\", \"ciphertext\": \"U2FsdGVkX1+v8vKxL6vYh3s7M...\", \"tag\": \"b1f49...\" }"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: THE SECURE SUITE ═══ */}
      <section id="services" className="w-full py-24 px-6 border-y border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs uppercase font-mono font-bold tracking-widest text-blue-600 dark:text-emerald-400 mb-3">
              ZERO-KNOWLEDGE UTILITIES
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">
              Explore Our Core Features
            </h2>
            <p className="text-sm text-zinc-650 dark:text-zinc-400">
              Each utility operates entirely within your browser runtime. Choose the application that fits your security workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Note Sharing Card */}
            <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/40 p-6 shadow-sm dark:shadow-none hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:shadow-[0_12px_40px_-15px_rgba(245,158,11,0.18)] hover:scale-[1.015] hover:bg-amber-500/[0.01] transition-all duration-300 group">
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500 w-fit mb-5">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Secure Notes &amp; Letters</h3>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed mb-6 flex-1">
                Create password-protected letters and configurations. Send the decryption key separate from the secure link to achieve high-grade two-channel security.
              </p>
              <Link
                href="/notes"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-emerald-400 group-hover:gap-2.5 transition-all"
              >
                <span>Write Secure Note</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* EnvShare Card */}
            <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/40 p-6 shadow-sm dark:shadow-none hover:border-blue-500/40 dark:hover:border-emerald-500/30 hover:shadow-[0_12px_40px_-15px_rgba(59,130,246,0.18)] dark:hover:shadow-[0_12px_40px_-15px_rgba(16,185,129,0.12)] hover:scale-[1.015] hover:bg-blue-500/[0.01] dark:hover:bg-emerald-500/[0.005] transition-all duration-300 group">
              <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500 dark:bg-emerald-500/10 dark:text-emerald-400 w-fit mb-5">
                <FileCode className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">EnvShare (Developer Keys)</h3>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed mb-6 flex-1">
                Share database strings, configurations, and API keys. The decryption key remains stored inside the URL hash fragment, never reaching database log servers.
              </p>
              <Link
                href="/secrets"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-emerald-400 group-hover:gap-2.5 transition-all"
              >
                <span>Share Secrets Safely</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Notepad Card */}
            <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/40 p-6 shadow-sm dark:shadow-none hover:border-purple-500/40 dark:hover:border-purple-500/30 hover:shadow-[0_12px_40px_-15px_rgba(168,85,247,0.18)] hover:scale-[1.015] hover:bg-purple-500/[0.01] transition-all duration-300 group">
              <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500 w-fit mb-5">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Encrypted Notepad</h3>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed mb-6 flex-1">
                An offline-first personal scratchpad. Encrypts documents with client-side SHA-256 account credentials and supports markdown rendering and custom styling themes.
              </p>
              <Link
                href="/notepad"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-emerald-400 group-hover:gap-2.5 transition-all"
              >
                <span>Open Private Notepad</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: ALTERNATIVES & COMPARISONS (SEO) ═══ */}
      <section id="vs" className="w-full py-24 px-6 bg-zinc-50 dark:bg-[#09090b] relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs uppercase font-mono font-bold tracking-widest text-blue-600 dark:text-emerald-400 mb-3">
              PRODUCT COMPARISONS
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">
              ProtectedShare vs. Alternatives
            </h2>
            <p className="text-sm text-zinc-650 dark:text-zinc-400">
              Read how our zero-knowledge implementation compares to other privacy solutions and note-sharing utilities.
            </p>
          </div>

          {/* Internal linking grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16 w-full">
            <Link
              href="/vs/protectedtext"
              className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 hover:border-blue-500/60 dark:hover:border-emerald-500/60 hover:shadow-[0_4px_25px_-12px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_4px_25px_-12px_rgba(16,185,129,0.15)] hover:scale-[1.01] transition-all cursor-pointer group shadow-sm duration-300"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">ProtectedText Alternative</h3>
                <p className="text-[10px] text-zinc-500">AES-256-GCM vs AES-256-CBC comparison</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-emerald-400 transition-all" />
            </Link>

            <Link
              href="/vs/privnote"
              className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 hover:border-blue-500/60 dark:hover:border-emerald-500/60 hover:shadow-[0_4px_25px_-12px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_4px_25px_-12px_rgba(16,185,129,0.15)] hover:scale-[1.01] transition-all cursor-pointer group shadow-sm duration-300"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">Privnote Alternative</h3>
                <p className="text-[10px] text-zinc-500">True zero-tracking, ad-free notepad sharing</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-emerald-400 transition-all" />
            </Link>

            <Link
              href="/vs/envshare"
              className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 hover:border-blue-500/60 dark:hover:border-emerald-500/60 hover:shadow-[0_4px_25px_-12px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_4px_25px_-12px_rgba(16,185,129,0.15)] hover:scale-[1.01] transition-all cursor-pointer group shadow-sm duration-300"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">EnvShare Alternative</h3>
                <p className="text-[10px] text-zinc-500">Self-hosted worker configurations &amp; UI upgrades</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-emerald-400 transition-all" />
            </Link>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/20 rounded-2xl shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all duration-300">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-150/40 dark:bg-zinc-900/40">
                  <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Feature</th>
                  <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Secure Notes</th>
                  <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">EnvShare</th>
                  <th className="p-4 font-semibold text-zinc-700 dark:text-zinc-300">Notepad</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-zinc-150 dark:border-zinc-850">
                  <td className="p-4 font-semibold text-zinc-900 dark:text-white">Primary Use Case</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">Passwords, private notes, letters</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">.env files, API keys, developer secrets</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">Cross-device scratchpad, personal logs</td>
                </tr>
                <tr className="border-b border-zinc-150 dark:border-zinc-850">
                  <td className="p-4 font-semibold text-zinc-900 dark:text-white">Password Delivery</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">Custom/auto, sent via separate channel</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">Embedded in link hash (1-click decryption)</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">User-defined master password (zero-knowledge)</td>
                </tr>
                <tr className="border-b border-zinc-150 dark:border-zinc-850">
                  <td className="p-4 font-semibold text-zinc-900 dark:text-white">Persistence</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">Timed expiration (Optional Burn)</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">Self-destructs after 1-10 reads</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">Cloud-synced vault (persists until deleted)</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-zinc-900 dark:text-white">Security Rating</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-blue-500 dark:text-emerald-400 font-bold">★★★★★</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Cloudflare isolation, split keys</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-655 dark:text-zinc-455">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-blue-500 dark:text-emerald-400 font-bold">★★★★☆</span>
                      <span className="text-[10px] text-zinc-500 font-mono">Cloudflare isolation, url hash keys</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-655 dark:text-zinc-455">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-blue-500 dark:text-emerald-400 font-bold">★★★★★</span>
                      <span className="text-[10px] text-zinc-500 font-mono">SHA-256 hashed account verifiers</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex flex-col items-center gap-2">
            <Link
              href="/blog"
              className="text-xs font-bold text-blue-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Read the security blog for guides and updates</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-500 leading-relaxed font-mono">
              * Note: Cloudflare&apos;s global worker network powers our backend database routines, ensuring high availability and edge isolation.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 4: SECURITY MODEL ═══ */}
      <section id="security" className="w-full py-24 px-6 border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/20 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs uppercase font-mono font-bold tracking-widest text-blue-600 dark:text-emerald-400 mb-3">
              ZERO-KNOWLEDGE TRUST MODEL
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">
              True Client-Side Encryption
            </h2>
            <p className="text-sm text-zinc-650 dark:text-zinc-400">
              Encryption keys never leave your machine, providing a mathematical guarantee of security.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/10 shadow-sm">
              <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 mb-4">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Browser Encryption</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Plaintext is encrypted in the browser using <strong>AES-256-GCM</strong>. Raw keys and unencrypted text are never sent to the network.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/10 shadow-sm">
              <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Burn After Reading</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Secrets are permanently expunged from memory and database tables immediately upon decryption. Zero remnants remain on server logs.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/10 shadow-sm">
              <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 mb-4">
                <CheckCircle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Zero Tracking</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                We use no tracking scripts, no third-party cookies, and collect zero telemetry logs. Your IP address is never stored with database items.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 5: SELF-HOSTING (SEO LINK) ═══ */}
      <section id="self-host" className="w-full py-24 px-6 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-200 dark:border-zinc-900">
        <div className="max-w-4xl mx-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-8 rounded-2xl shadow-sm hover:border-blue-500/40 dark:hover:border-emerald-500/30 hover:shadow-[0_12px_45px_-15px_rgba(59,130,246,0.12)] dark:hover:shadow-[0_12px_45px_-15px_rgba(16,185,129,0.08)] hover:scale-[1.002] transition-all duration-300 flex flex-col md:flex-row items-center gap-8">
          <div className="p-4 rounded-xl bg-blue-500/10 dark:bg-emerald-500/10 text-blue-600 dark:text-emerald-400 shrink-0">
            <Server className="h-10 w-10" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              Deploy Your Own Instance
            </h2>
            <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed mb-4">
              Need dedicated infrastructure for your enterprise? ProtectedShare supports quick deployment via Docker. You can provision completely isolated, self-hosted frontend and API nodes.
            </p>
            <Link
              href="/self-host"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-emerald-400 hover:underline"
            >
              <span>Read the Docker self-hosting instructions</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6: FAQs ═══ */}
      <section id="faq" className="w-full py-24 px-6 border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-[#09090b]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-16">
            <HelpCircle className="h-8 w-8 text-zinc-450 dark:text-zinc-500 mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-650 dark:text-zinc-400">
              Clear answers regarding our encryption flow and technical operations.
            </p>
          </div>

          <div className="space-y-4">
            <FaqItem
              question="Is ProtectedShare really free?"
              answer="Yes, 100% free with no signup, no accounts, and no usage limits. Create unlimited encrypted notes, share .env files, and generate self-destructing secret links at zero cost."
            />
            <FaqItem
              question="What is the difference between Secure Notes and EnvShare?"
              answer="Secure Notes is designed for high-security, 2-channel sharing (you send the note link via one app like Slack, and the password via another like SMS or Signal). EnvShare is built for quick 1-click sharing of code/dotenv files where the decryption key is embedded in the link's hash fragment (e.g. #password) so the recipient doesn't need to manually copy-paste passwords."
            />
            <FaqItem
              question="How is this different from EnvShare?"
              answer="ProtectedShare includes all EnvShare features (AES-256 encrypted .env sharing with configurable TTL and read limits) plus: encrypted notes with separate password delivery, an offline-first encrypted notepad, dark/light mode, and a mobile-optimized interface. EnvShare is no longer actively maintained."
            />
            <FaqItem
              question="Can the server read my secrets?"
              answer="No. Your data is encrypted with AES-256-GCM entirely in your browser before being sent to the server. For the Encrypted Notepad, usernames are hashed client-side using SHA-256 before transit so we don't know who owns which notepad, and passwords are never transmitted. The encryption keys never leave your device, making it cryptographically impossible for anyone — including hosts and administrators — to decrypt your data."
            />
            <FaqItem
              question="Is this a good ProtectedText alternative?"
              answer="Yes. ProtectedShare offers stronger encryption (AES-256-GCM), a modern mobile-friendly interface, self-destructing notes, .env file sharing, and an encrypted notepad — all without accounts."
            />
            <FaqItem
              question="Is ProtectedShare a secret sharing website?"
              answer="Yes. ProtectedShare is built for sharing secrets, notes, API keys, and .env files through encrypted links that can expire or self-destruct after a set number of reads."
            />
            <FaqItem
              question="How do I share API keys securely?"
              answer="Go to the EnvShare page, paste your API keys or .env file, choose an expiration time and read limit, then click 'Encrypt & Generate Link'. The decryption key stays in the URL hash fragment and is never sent to the server."
            />
            <FaqItem
              question="What happens after someone opens my link?"
              answer="It depends on your read limit. If set to 1 read (burn-after-read), the data is permanently deleted after the first view. With multiple reads (3, 5, or 10), the counter decrements and deletes at zero."
            />
          </div>
        </div>
      </section>

      {/* ═══ SECTION 7: ENTERPRISE INFO ═══ */}
      <section id="enterprise" className="w-full py-16 px-6 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950/20 text-center">
        <div className="max-w-2xl mx-auto p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/10 shadow-sm hover:border-blue-500/30 dark:hover:border-emerald-500/20 hover:shadow-[0_10px_35px_-12px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_10px_35px_-12px_rgba(255,255,255,0.01)] transition-all duration-300">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-2">Need dedicated infrastructure?</h2>
          <p className="text-xs text-zinc-650 dark:text-zinc-400 mb-6 leading-relaxed">
            We deploy completely isolated, private zero-knowledge instances for enterprises. Custom domains, dedicated databases, and compliance support.
          </p>
          <a
            href="mailto:admin@protectedshare.me"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-white hover:underline"
          >
            <span>Contact our team</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>
    </main>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-white/70 dark:bg-zinc-900/10 overflow-hidden shadow-sm dark:shadow-none hover:border-blue-500/30 dark:hover:border-emerald-500/20 transition-all duration-300">
      <summary className="flex items-center justify-between cursor-pointer px-4 py-3.5 text-sm font-bold text-zinc-700 dark:text-zinc-300 select-none hover:bg-zinc-50/50 dark:hover:bg-zinc-900/25 transition-colors">
        {question}
        <svg className="w-4 h-4 shrink-0 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-4 pb-4 pt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
        {answer}
      </div>
    </details>
  );
}
