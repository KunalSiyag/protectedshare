import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ProtectedText Alternative | Free Online Notepad & EnvShare — No Signup",
  description:
    "The modern ProtectedText alternative. Free encrypted online notepad, .env file sharing (EnvShare), and self-destructing secret links — all with AES-256 zero-knowledge encryption. No signup, no tracking.",
  alternates: {
    canonical: "https://protectedshare.me",
  },
  openGraph: {
    title: "ProtectedText Alternative | Free Online Notepad & EnvShare",
    description:
      "Free encrypted notes, online notepad, and .env sharing with AES-256 encryption. No signup. No tracking. Self-destructing links.",
    url: "https://protectedshare.me",
  },
};

export default function HomePage() {
  return (
    <main className="flex flex-col items-center px-6 py-12 md:py-20 text-center transition-colors duration-300">
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
              "Free zero-knowledge encrypted note sharing, EnvShare (.env file sharing), and self-destructing secret links. No signup required.",
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

      {/* JSON-LD: FAQPage Schema — triggers Google Rich Snippets */}
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

      {/* Hero */}
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
          Protected text,{" "}
          <span className="text-blue-600 dark:text-emerald-400">online notepad</span>
          {" "}&amp; EnvShare
        </h1>

        <p className="mt-5 text-base md:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl mx-auto">
          A <strong className="text-zinc-800 dark:text-zinc-200">free</strong> and <strong className="text-zinc-800 dark:text-zinc-200">encrypted</strong> alternative to ProtectedText — with
          an <strong className="text-zinc-800 dark:text-zinc-200">online notepad</strong>, .env file sharing, and self-destructing secret links.
          Secured with <strong className="text-zinc-800 dark:text-zinc-200">AES-256-GCM zero-knowledge encryption</strong> that
          runs entirely in your browser. <strong className="text-zinc-800 dark:text-zinc-200">No signup</strong>, no tracking, no compromise.
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
            Create Free Encrypted Note
          </Link>
          <Link
            href="/secrets"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Share .env / API Keys
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
            </svg>
          }
          title="Burn After Read"
          description="Secrets self-destruct after 1, 3, 5, or 10 reads. Permanently deleted — zero traces left behind."
        />
        <FeatureCard
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          }
          title="Free · No Signup"
          description="No cookies, no analytics, no accounts. Completely free with zero tracking. Use instantly."
        />
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-16 w-full max-w-2xl text-left">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 text-center">Compare our tools</h2>
        <div className="overflow-x-auto border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl bg-white/40 dark:bg-zinc-900/10">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40">
                <th className="p-3.5 font-semibold text-zinc-700 dark:text-zinc-300">Feature</th>
                <th className="p-3.5 font-semibold text-zinc-700 dark:text-zinc-300">Secure Notes</th>
                <th className="p-3.5 font-semibold text-zinc-700 dark:text-zinc-300">EnvShare</th>
                <th className="p-3.5 font-semibold text-zinc-700 dark:text-zinc-300">Notepad</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
                <td className="p-3.5 font-semibold text-zinc-900 dark:text-zinc-100">Primary Use Case</td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Passwords, private notes, letters</td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400">.env files, API keys, developer secrets</td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Local scratchpad, personal logs</td>
              </tr>
              <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
                <td className="p-3.5 font-semibold text-zinc-900 dark:text-zinc-100">Password Delivery</td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Custom/auto, sent via separate channel</td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Embedded in link hash (1-click decryption)</td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Local master password</td>
              </tr>
              <tr className="border-b border-zinc-200/60 dark:border-zinc-800/60">
                <td className="p-3.5 font-semibold text-zinc-900 dark:text-zinc-100">Persistence</td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Timed expiration (Optional Burn)</td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Self-destructs after 1-10 reads</td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Stored locally in browser (infinite)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold text-zinc-900 dark:text-zinc-100">Security Rating</td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400">⚡ Maximum (2 independent channels)</td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400">🛡️ High (Single link convenience)</td>
                <td className="p-3.5 text-zinc-600 dark:text-zinc-400">🔒 Maximum (Zero server contact)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* How It Works */}
      <div className="mt-16 w-full max-w-xl">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6">How it works</h2>
        <div className="space-y-4 text-left">
          <Step number="1" title="Write your secret" description="Paste your password, API key, .env file, or private note into the editor." />
          <Step number="2" title="Encrypted in your browser" description="AES-256-GCM encryption with PBKDF2 key derivation (210K iterations). Plaintext never leaves your device." />
          <Step number="3" title="Share the link" description="Get a unique link. For notes, share the password separately via a different channel for maximum security." />
          <Step number="4" title="Auto-destruct" description="Secrets are permanently deleted after being viewed. Notes expire automatically based on your chosen duration." />
        </div>
      </div>

      {/* FAQ Section — visible to users AND parsed by Google for rich snippets */}
      <div className="mt-16 w-full max-w-xl text-left">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 text-center">Frequently Asked Questions</h2>
        <div className="space-y-5">
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
            answer="No. Your data is encrypted with AES-256-GCM entirely in your browser before being sent to the server. The encryption key never leaves your device, making it cryptographically impossible for anyone to decrypt your data."
          />
          <FaqItem
            question="Is this a good ProtectedText alternative?"
            answer="Yes. ProtectedShare offers stronger encryption (AES-256-GCM), a modern mobile-friendly interface, self-destructing notes, .env file sharing, and an encrypted notepad — all without accounts."
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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border border-zinc-200/60 dark:border-zinc-800/60 rounded-lg bg-white/40 dark:bg-zinc-900/10 overflow-hidden">
      <summary className="flex items-center justify-between cursor-pointer px-4 py-3.5 text-sm font-bold text-zinc-900 dark:text-zinc-100 select-none hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
        {question}
        <svg className="w-4 h-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-4 pb-4 pt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
        {answer}
      </div>
    </details>
  );
}
