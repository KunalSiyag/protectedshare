import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the ProtectedShare privacy policy. Learn about our zero-knowledge architecture and why we collect zero tracking data.",
  alternates: {
    canonical: "https://protectedshare.me/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-zinc-800 dark:text-zinc-300">
      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mb-6">Privacy Policy</h1>
      <p className="text-xs text-zinc-500 mb-8 font-mono">Last Updated: June 2026</p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">1. Commitment to Privacy</h2>
          <p>
            At ProtectedShare, we operate a zero-knowledge service. We believe you should not have to sacrifice privacy for convenience. Our infrastructure is specifically engineered so that we do not have access to, nor store, any of your private keys or unencrypted documents.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">2. Encryption &amp; Data Security</h2>
          <p>
            All encryption is performed locally inside your web browser before transmission using the **AES-256-GCM** authenticated encryption standard. The decryption key remains strictly within your device (embedded in the URL hash fragment or custom passwords you define) and is never transmitted to or processed by our servers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">3. Zero-Knowledge Notepad Syncing</h2>
          <p>
            For the Encrypted Notepad (Workspace) feature, multi-device synchronization is achieved using an entirely zero-knowledge architecture:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              **Anonymous Usernames:** Usernames are hashed client-side using a SHA-256 fingerprint before being sent to our database. We do not store or know the actual usernames of registered notepads.
            </li>
            <li>
              **Proof of Password:** Your master password never leaves your browser. Instead, a SHA-256 hash digest is derived to prove ownership and authenticate workspace actions.
            </li>
            <li>
              **Client-Side Cryptography:** Your notepad is encrypted in your browser using AES-256-GCM before it is synced to the database. We cannot read, analyze, or decipher your notebook notes.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">4. Information We Collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>**User Accounts:** We require no signup, registration, email addresses, or accounts. You are fully anonymous.</li>
            <li>**Usage Logs:** We do not track IP addresses, user agents, or deploy tracking beacons.</li>
            <li>**Cookies:** We use no cookies or local tracking tags.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">5. Ephemeral Storage (Auto-Destruction)</h2>
          <p>
            Encrypted messages generated via EnvShare are automatically deleted from our database after they exceed their read limit (1, 3, 5, or 10 reads) or expire according to the chosen TTL (1 hour, 24 hours, or 7 days). Secure Notes are deleted at the end of their expiration timer or immediately upon the first view if the optional burn-after-reading checkbox is selected.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">6. Host / Administrator Zero-Access Guarantee</h2>
          <p>
            Because all decryption keys are kept locally on client devices, the host, administrator, or hosting providers (including Cloudflare) are mathematically locked out of your data. We have zero means of reading, restoring, or decrypting any of the content stored on our systems.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">7. Contact Us</h2>
          <p>
            If you have questions regarding this privacy policy, please contact our administration at{" "}
            <a href="mailto:admin@protectedshare.me" className="text-blue-600 dark:text-emerald-400 hover:underline">
              admin@protectedshare.me
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
