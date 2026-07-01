import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Review the terms and conditions for using the ProtectedShare zero-knowledge sharing utility.",
  alternates: {
    canonical: "https://protectedshare.me/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-zinc-800 dark:text-zinc-300">
      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-6">Terms of Service</h1>
      <p className="text-xs text-zinc-500 mb-8 font-mono">Last Updated: June 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">1. Acceptance of Terms</h2>
          <p>
            By accessing and using ProtectedShare, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not access or use our services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">2. Description of Service</h2>
          <p>
            ProtectedShare provides free browser-side encrypted tools (Secure Notes, EnvShare, and Offline Notepad) for sharing and local drafting of text payloads. The service is provided &quot;as is&quot; with no operational guarantees.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">3. User Conduct &amp; Prohibitions</h2>
          <p>
            You agree to use this service only for lawful purposes. You are strictly prohibited from using the service to store or transmit illegal material, malware, or coordinate cyberattacks. Since all data is encrypted in the browser, users are solely responsible for all content they submit.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">4. Disclaimer of Warranties</h2>
          <p>
            We provide our platform without warranties of any kind, whether express or implied. We do not guarantee that the service will be uninterrupted, error-free, or fully secure against unknown cryptographic breakthroughs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">5. Limitation of Liability</h2>
          <p>
            In no event shall ProtectedShare, its creators, or administrators be liable for any direct, indirect, incidental, special, or consequential damages arising out of your use of or inability to use this platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">6. Amendments to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Your continued use of the website following any changes signals your acceptance of the updated terms.
          </p>
        </section>
      </div>
    </main>
  );
}
