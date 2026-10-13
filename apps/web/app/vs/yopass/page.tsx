import type { Metadata } from "next";
import AppLink from "../../../components/app-link";
import ComparisonPage, { PS, type ComparisonRow, type Faq } from "../comparison";
import { comparisonMetadata } from "../meta";

export const metadata: Metadata = comparisonMetadata({
  title: "Yopass Alternative, Hosted and Open Source",
  description:
    "Yopass vs ProtectedShare: both encrypt in your browser and keep the key in the link. ProtectedShare adds 1 to 100 reads, 25 MB file drops and requests.",
  path: "/vs/yopass",
  keywords: [
    "Yopass alternative",
    "yopass",
    "share secrets securely",
    "one-time secret link",
    "self-hosted secret sharing",
    "encrypted secret link",
  ],
});

const rows: ComparisonRow[] = [
  {
    feature: "Encrypts in your browser before upload",
    them: { status: "yes", note: "OpenPGP; the key is in the link after #" },
    us: PS.browserCrypto,
  },
  { feature: "One-time links", them: { status: "yes", note: "One-time by default" }, us: PS.burn },
  {
    feature: "Expires after a set time",
    them: { status: "yes", note: "1 hour, 1 day or 1 week; up to 90 days if the operator allows custom times" },
    us: PS.expiry,
  },
  {
    feature: "Allow a set number of reads",
    them: { status: "no", note: "One view, or any number until it expires" },
    us: PS.readCount,
  },
  { feature: "Optional password", them: { status: "yes" }, us: PS.separatePassword },
  {
    feature: "Encrypted file sharing",
    them: { status: "partial", note: "512 KB by default, 1 MB at most without a license" },
    us: PS.files,
  },
  {
    feature: "Ask someone to send you a secret",
    them: { status: "partial", note: "With a paid business license" },
    us: PS.request,
  },
  {
    feature: "See whether it was opened",
    them: { status: "partial", note: "Read receipts, with a paid business license" },
    us: PS.receipts,
  },
  {
    feature: "Hosted for you",
    them: { status: "partial", note: "A public demo; their README says to self-host for sensitive data" },
    us: { status: "yes", note: "protectedshare.me" },
  },
  { feature: "Open source", them: { status: "yes", note: "Apache 2.0" }, us: PS.openSource },
  {
    feature: "Self-hostable",
    them: { status: "yes", note: "Docker or Kubernetes, with Memcached or Redis" },
    us: PS.selfHost,
  },
  { feature: "Works without an account", them: { status: "yes" }, us: PS.noAccount },
];

const faqs: Faq[] = [
  {
    q: "Is Yopass free?",
    a: "The open-source edition is free to self-host under the Apache 2.0 license, and there's a public demo at share.yopass.se. A paid business license adds features such as secret requests, read receipts and file uploads over 1 MB. ProtectedShare's hosted tools are free with no sign-up, and its MIT-licensed code includes every feature.",
  },
  {
    q: "Does Yopass encrypt secrets in the browser?",
    a: "Yes. Its README says Yopass encrypts the secret in your browser with OpenPGP and puts the decryption key in the URL fragment, so the server stores only the encrypted message. ProtectedShare does the same with AES-256-GCM through Web Crypto.",
  },
  {
    q: "Can Yopass share files?",
    a: "Yes, small ones. The default limit is 512 KB, and it's capped at 1 MB without a license key. ProtectedShare's file drop encrypts up to 25 MB per drop in your browser, with 1 to 100 downloads.",
  },
  {
    q: "How long can a Yopass secret last?",
    a: "The standard choices are one hour, one day or one week. An operator can allow custom durations from 1 minute to 90 days. ProtectedShare offers 1 hour, 1 day, 7 days or a custom date up to 30 days.",
  },
  {
    q: "Do I have to self-host Yopass?",
    a: "You can try the public demo, but Yopass's README recommends self-hosting your own instance when sharing sensitive information. ProtectedShare runs a hosted version at protectedshare.me, and you can self-host it too.",
  },
];

export default function YopassComparisonPage() {
  return (
    <ComparisonPage
      slug="yopass"
      competitor="Yopass"
      title="ProtectedShare vs Yopass"
      lead="Yopass and ProtectedShare start from the same idea: your browser encrypts the secret, and the key travels in the link after the #. Yopass is built to be self-hosted. ProtectedShare also runs as a hosted service, and its read counts, 25 MB file drops and secret requests are free."
      rows={rows}
      sources={[
        { label: "Yopass on GitHub", href: "https://github.com/jhaals/yopass" },
        { label: "yopass.se", href: "https://yopass.se/" },
        { label: "server options", href: "https://yopass.se/docs/server-options" },
        { label: "file storage docs", href: "https://yopass.se/docs/file-storage" },
      ]}
      differences={[
        {
          title: "The same core idea",
          body: (
            <>
              <p>
                Yopass generates a random key, encrypts the secret in your browser with OpenPGP, and puts the key in the
                URL fragment, which isn&apos;t sent to the server. The server stores the encrypted message with an expiry,
                and removes a one-time secret after its first retrieval.
              </p>
              <p>
                ProtectedShare does the same with AES-256-GCM through Web Crypto. One addition: HKDF splits your key into
                an encryption key and an auth token, and the server releases the ciphertext only to a browser that
                presents the token. A guessed link id gets nothing.
              </p>
              <p>
                For password-protected secrets, Yopass uses iterated SHA-256 by default and can switch to memory-hard
                Argon2id if the operator turns it on. ProtectedShare uses PBKDF2-SHA256 at 600,000 iterations.
              </p>
            </>
          ),
        },
        {
          title: "What costs extra",
          body: (
            <>
              <p>
                Yopass&apos;s open-source edition is free to self-host. A business license (€149 a year at time of
                writing) adds secret requests, read receipts, file uploads over 1 MB, OpenID Connect sign-in, audit logs,
                webhooks and custom branding.
              </p>
              <p>
                ProtectedShare has no paid tier for individuals. <AppLink href="/files">File drops</AppLink> up to 25 MB,{" "}
                <AppLink href="/request">secret requests</AppLink> and the opened status in My links are free on the
                hosted site, and the MIT-licensed code includes all of it if you run your own copy.
              </p>
            </>
          ),
        },
        {
          title: "Hosted or self-hosted",
          body: (
            <>
              <p>
                Yopass&apos;s README calls its public demo useful for testing and says to self-host your own instance when
                sharing sensitive information. That is a fair stance for any tool where the server delivers the
                encryption code: whoever runs the server could change it.
              </p>
              <p>
                ProtectedShare runs protectedshare.me as the service itself, and you can still self-host. The API is a
                Cloudflare Worker with a D1 database, and the web app ships as a Docker image. The{" "}
                <AppLink href="/self-host">self-host guide</AppLink> walks through it, and the{" "}
                <AppLink href="/security">security page</AppLink> lists what the server stores.
              </p>
            </>
          ),
        },
      ]}
      whenThem={[
        "You want to run it on your own servers with Docker or Kubernetes, backed by Memcached or Redis.",
        "You need OpenID Connect sign-in, audit logs or signed webhooks, which their business license adds.",
        "You prefer OpenPGP, or Argon2id for password-protected secrets.",
        "Your team already runs Yopass and it does what you need.",
      ]}
      faqs={faqs}
    />
  );
}
