import type { Metadata } from "next";
import AppLink from "../components/app-link";
import { HOME_FAQS } from "../lib/home-faq";
import { DEFAULT_DESCRIPTION, faqPageJsonLd, webApplicationJsonLd } from "../lib/seo";
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
  title: {
    absolute: "Zero-Knowledge Secure Note Sharing | ProtectedShare",
  },
  description: DEFAULT_DESCRIPTION,
  alternates: {
    canonical: "https://protectedshare.me",
  },
  openGraph: {
    title: "Zero-Knowledge Secure Note Sharing | ProtectedShare",
    description: DEFAULT_DESCRIPTION,
    url: "https://protectedshare.me",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ProtectedShare — encrypted notes, EnvShare, and one-time secrets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zero-Knowledge Secure Note Sharing | ProtectedShare",
    description: DEFAULT_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
};

export default function HomePage() {
  return (
    <main className="flex flex-col items-center bg-zinc-50 dark:bg-[#09090b] text-zinc-800 dark:text-zinc-300 transition-colors duration-300 w-full overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(HOME_FAQS)) }}
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
              Privacy-first secret sharing. Encrypt credentials, configuration <code className="font-mono text-xs bg-zinc-200/50 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded">.env</code> files, join anonymous chatrooms, and write private text directly in your browser. Raw keys never touch the cloud. No signup, no tracking.
            </p>

            {/* Call to Action Group */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-8 w-full">
              <AppLink
                href="/secrets"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 text-xs sm:text-sm font-semibold transition-colors duration-200 shadow-lg cursor-pointer shrink-0"
              >
                <FileCode className="h-4 w-4" />
                <span>Share .env / Keys</span>
              </AppLink>
              <AppLink
                href="/notes"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors duration-200 cursor-pointer shadow-sm shrink-0"
              >
                <Lock className="h-4 w-4 text-amber-500" />
                <span>Secure Notes</span>
              </AppLink>
              <AppLink
                href="/chat"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors duration-200 cursor-pointer shadow-sm shrink-0"
              >
                <svg className="h-4 w-4 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Chatroom</span>
              </AppLink>
              <AppLink
                href="/notepad"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors duration-200 cursor-pointer shadow-sm shrink-0"
              >
                <FileText className="h-4 w-4 text-blue-500" />
                <span>Encrypted Notepad</span>
              </AppLink>
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
            <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/85 shadow-2xl overflow-hidden font-sans">
              {/* Window Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 select-none">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="flex items-center gap-1 px-3 py-1 rounded border border-zinc-200/30 dark:border-zinc-800/80 bg-zinc-200/50 dark:bg-zinc-800/50 text-[10px] text-zinc-550 dark:text-zinc-400 font-mono w-48 justify-center select-none truncate">
                  <Lock className="w-2.5 h-2.5 text-emerald-500" />
                  <span>protectedshare.me/secrets/…#</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Note Sharing Card */}
            <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/40 p-6 shadow-sm dark:shadow-none hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:shadow-[0_12px_40px_-15px_rgba(245,158,11,0.18)] hover:scale-[1.015] hover:bg-amber-500/[0.01] transition-all duration-300 group">
              <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500 w-fit mb-5">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Secure Notes &amp; Letters</h3>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed mb-6 flex-1">
                Encrypt a letter in the browser. Open it from the link, or send the password on a separate channel.
              </p>
              <AppLink
                href="/notes"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-emerald-400 group-hover:gap-2.5 transition-all"
              >
                <span>Write Secure Note</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </AppLink>
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
              <AppLink
                href="/secrets"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-emerald-400 group-hover:gap-2.5 transition-all"
              >
                <span>Share Secrets Safely</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </AppLink>
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
              <AppLink
                href="/notepad"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-emerald-400 group-hover:gap-2.5 transition-all"
              >
                <span>Open Private Notepad</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </AppLink>
            </div>

            {/* Chatroom Card */}
            <div className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/40 p-6 shadow-sm dark:shadow-none hover:border-pink-500/40 dark:hover:border-pink-500/30 hover:shadow-[0_12px_40px_-15px_rgba(236,72,153,0.18)] hover:scale-[1.015] hover:bg-pink-500/[0.01] transition-all duration-300 group">
              <div className="p-3 rounded-lg bg-pink-500/10 text-pink-500 w-fit mb-5">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Encrypted Chatroom</h3>
              <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed mb-6 flex-1">
                An anonymous, real-time end-to-end encrypted chatroom. Share the link over a secure channel. Keys never leave the browser.
              </p>
              <AppLink
                href="/chat"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-emerald-400 group-hover:gap-2.5 transition-all"
              >
                <span>Join Secure Chat</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </AppLink>
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
            <AppLink
              href="/vs/protectedtext"
              className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 hover:border-blue-500/60 dark:hover:border-emerald-500/60 hover:shadow-[0_4px_25px_-12px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_4px_25px_-12px_rgba(16,185,129,0.15)] hover:scale-[1.01] transition-all cursor-pointer group shadow-sm duration-300"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">ProtectedText Alternative</h3>
                <p className="text-[10px] text-zinc-500">AES-256-GCM vs AES-256-CBC comparison</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-emerald-400 transition-all" />
            </AppLink>

            <AppLink
              href="/vs/privnote"
              className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 hover:border-blue-500/60 dark:hover:border-emerald-500/60 hover:shadow-[0_4px_25px_-12px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_4px_25px_-12px_rgba(16,185,129,0.15)] hover:scale-[1.01] transition-all cursor-pointer group shadow-sm duration-300"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">Privnote Alternative</h3>
                <p className="text-[10px] text-zinc-500">True zero-tracking, ad-free notepad sharing</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-emerald-400 transition-all" />
            </AppLink>

            <AppLink
              href="/vs/envshare"
              className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 hover:border-blue-500/60 dark:hover:border-emerald-500/60 hover:shadow-[0_4px_25px_-12px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_4px_25px_-12px_rgba(16,185,129,0.15)] hover:scale-[1.01] transition-all cursor-pointer group shadow-sm duration-300"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">EnvShare Alternative</h3>
                <p className="text-[10px] text-zinc-500">Self-hosted worker configurations &amp; UI upgrades</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-emerald-400 transition-all" />
            </AppLink>

            <AppLink
              href="/vs/onetimesecret"
              className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/40 hover:border-blue-500/60 dark:hover:border-emerald-500/60 hover:shadow-[0_4px_25px_-12px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_4px_25px_-12px_rgba(16,185,129,0.15)] hover:scale-[1.01] transition-all cursor-pointer group shadow-sm duration-300"
            >
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">OneTimeSecret Alternative</h3>
                <p className="text-[10px] text-zinc-500">Zero-knowledge encryption vs server-held secrets</p>
              </div>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-emerald-400 transition-all" />
            </AppLink>
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
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">In the link, or sent on a separate channel</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">Embedded in link hash (1-click decryption)</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">User-defined master password (zero-knowledge)</td>
                </tr>
                <tr className="border-b border-zinc-150 dark:border-zinc-850">
                  <td className="p-4 font-semibold text-zinc-900 dark:text-white">Persistence</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">Timed expiration (Optional Burn)</td>
                  <td className="p-4 text-zinc-650 dark:text-zinc-450">Deletes after 1 to 100 reads, or when it expires</td>
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
            <AppLink
              href="/blog"
              className="text-xs font-bold text-blue-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Read the security blog for guides and updates</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </AppLink>
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
            <AppLink
              href="/self-host"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-emerald-400 hover:underline"
            >
              <span>Read the Docker self-hosting instructions</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </AppLink>
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
            {HOME_FAQS.map((item) => (
              <FaqItem key={item.question} question={item.question} answer={item.answer} />
            ))}
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
