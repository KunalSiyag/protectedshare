import type { Metadata } from "next";
import ComparisonPage, { PS, type ComparisonRow, type Faq } from "../comparison";

const DESCRIPTION =
  "EnvShare vs ProtectedShare: both encrypt .env files in the browser with AES-GCM. ProtectedShare adds notes with a separate password, encrypted file drops, secret requests, receipts and revoke.";

export const metadata: Metadata = {
  title: "Best Free EnvShare Alternative (Active & Polished)",
  description: DESCRIPTION,
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
    description: DESCRIPTION,
    url: "https://protectedshare.me/vs/envshare",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Free EnvShare Alternative (Active & Polished) — ProtectedShare",
    description: DESCRIPTION,
  },
};

const rows: ComparisonRow[] = [
  {
    feature: "Encrypts in your browser before upload",
    them: { status: "yes", note: "AES-GCM; the key never leaves the browser" },
    us: PS.browserCrypto,
  },
  { feature: "Read limits", them: { status: "yes", note: "Optional" }, us: PS.readCount },
  { feature: "Expires after a set time", them: { status: "yes", note: "Configurable TTL" }, us: PS.expiry },
  {
    feature: "Separate password instead of a key in the link",
    them: { status: "unknown", note: "Not covered in the README" },
    us: PS.separatePassword,
  },
  {
    feature: "Check status or revoke after sending",
    them: { status: "unknown", note: "Not covered in the README" },
    us: PS.receipts,
  },
  { feature: "Encrypted file sharing", them: { status: "no", note: "Text and .env content" }, us: PS.files },
  { feature: "Ask someone to send you a secret", them: { status: "no" }, us: PS.request },
  { feature: "Open source", them: { status: "yes", note: "MIT license" }, us: PS.openSource },
  { feature: "Self-hostable", them: { status: "yes", note: "Vercel + Upstash Redis" }, us: PS.selfHost },
  { feature: "Works without an account", them: { status: "yes" }, us: PS.noAccount },
];

const faqs: Faq[] = [
  {
    q: "What makes ProtectedShare a good EnvShare alternative?",
    a: "EnvShare and ProtectedShare share the same core idea: encrypt in the browser with AES-GCM and keep the key in the link. ProtectedShare builds around it with secure notes that can use a separate password, encrypted file drops up to 25 MB, secret requests, and a My links page to check whether a link was opened or revoke it.",
  },
  {
    q: "How does EnvShare compare to ProtectedShare's Secure Notes?",
    a: "ProtectedShare's EnvShare tool works like EnvShare: the key is in the link and the secret deletes after a set number of reads. Secure Notes can do the same, or keep the password off the link so you can send it through a second channel.",
  },
  {
    q: "Can I self-host my own instance of ProtectedShare?",
    a: "Yes. It's MIT licensed. The API runs as a Cloudflare Worker with a D1 database and a 30-minute cleanup cron, and the web app is published as a Docker image you point at your API with API_BACKEND_URL. The self-host page walks through it.",
  },
];

export default function EnvShareComparisonPage() {
  return (
    <ComparisonPage
      slug="envshare"
      competitor="EnvShare"
      title="ProtectedShare vs EnvShare"
      lead="EnvShare showed how simple sharing a .env file can be: encrypt in the browser, put the key in the link, limit the reads. ProtectedShare keeps that model and adds the tools around it."
      rows={rows}
      sources={[
        { label: "EnvShare on GitHub", href: "https://github.com/chronark/envshare" },
        { label: "envshare.dev", href: "https://envshare.dev" },
      ]}
      differences={[
        {
          title: "Same core, different stack",
          body: (
            <>
              <p>
                Both encrypt with AES-GCM before upload and keep the key out of the server&apos;s hands. EnvShare stores
                ciphertext in Upstash Redis and deploys on Vercel. ProtectedShare stores it in Cloudflare D1, behind a
                Worker, with a cron that deletes expired rows every 30 minutes.
              </p>
              <p>
                ProtectedShare&apos;s v2 format derives two values from your key with HKDF: one encrypts, the other is a
                token whose hash the server checks before releasing ciphertext. So a guessed link id alone gets nothing.
              </p>
            </>
          ),
        },
        {
          title: "What ProtectedShare adds",
          body: (
            <ul className="list-disc pl-5 marker:text-ink-3 [&>li]:mt-2">
              <li>Secure notes that can burn after reading and use a separately sent password.</li>
              <li>File drop: encrypted files up to 25 MB, with a download limit.</li>
              <li>Secret request: ask someone for a credential, encrypted to a key only you hold.</li>
              <li>My links: see if a link was opened, and revoke it, from the browser that made it.</li>
            </ul>
          ),
        },
      ]}
      whenThem={[
        "You want the smallest possible tool that does one thing: share a .env.",
        "You already deploy on Vercel with Upstash and want to self-host there.",
      ]}
      faqs={faqs}
    />
  );
}
