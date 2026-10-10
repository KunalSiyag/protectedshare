import type { Metadata } from "next";
import ComparisonPage, { PS, type ComparisonRow, type Faq } from "../comparison";

export const metadata: Metadata = {
  title: "Best Free OneTimeSecret Alternative",
  description:
    "OneTimeSecret vs ProtectedShare: browser-side AES-256-GCM encryption, expiring links, 1 to 100 reads, .env sharing, encrypted file drops, secret requests and chat. Free, open source, no signup.",
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
      "Browser-side AES-256-GCM encryption, expiring links, configurable read limits, and encrypted file drops. Free, no signup.",
    url: "https://protectedshare.me/vs/onetimesecret",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Free OneTimeSecret Alternative (Zero-Knowledge) — ProtectedShare",
    description:
      "Browser-side AES-256-GCM encryption, expiring links, configurable read limits, and encrypted file drops. Free, no signup.",
  },
};

const rows: ComparisonRow[] = [
  {
    feature: "Encrypts in your browser before upload",
    them: { status: "no", note: "Encrypted on their servers, per their docs" },
    us: PS.browserCrypto,
  },
  { feature: "Deletes after the first view", them: { status: "yes" }, us: PS.burn },
  { feature: "Expires after a set time", them: { status: "yes", note: "Minutes to days" }, us: PS.expiry },
  { feature: "Allow a set number of reads", them: { status: "no", note: "Viewed once" }, us: PS.readCount },
  { feature: "Passphrase", them: { status: "yes", note: "Optional" }, us: PS.separatePassword },
  { feature: "Encrypted file sharing", them: { status: "no", note: "Text secrets" }, us: PS.files },
  {
    feature: "Ask someone to send you a secret",
    them: { status: "unknown", note: "Not covered in the sources we checked" },
    us: PS.request,
  },
  { feature: "Open source", them: { status: "yes", note: "Code is public on GitHub" }, us: PS.openSource },
  { feature: "Self-hostable", them: { status: "yes", note: "Has self-hosting docs" }, us: PS.selfHost },
  { feature: "Works without an account", them: { status: "yes" }, us: PS.noAccount },
];

const faqs: Faq[] = [
  {
    q: "What makes ProtectedShare a good OneTimeSecret alternative?",
    a: "Both send links that expire. ProtectedShare encrypts in your browser before upload, so the server stores ciphertext rather than encrypting what it receives. It also offers 1 to 100 reads, expiry up to 30 days, encrypted file drops, secret requests, an encrypted notepad and chat, with no account.",
  },
  {
    q: "Is ProtectedShare really free?",
    a: "Yes. The hosted tools are free with no signup, and the whole project is MIT licensed, so you can self-host it on Cloudflare Workers with the Docker web image. Limits apply: shares expire within 30 days and file drops are capped at 25 MB.",
  },
  {
    q: "Can the server read my one-time secret?",
    a: "No. Your browser encrypts it with AES-256-GCM before upload. The key stays in the link after # (which browsers don't send to servers) or in a password you send separately. The server receives ciphertext and a hash it uses to check access, never the key or the plaintext.",
  },
];

export default function OneTimeSecretComparisonPage() {
  return (
    <ComparisonPage
      slug="onetimesecret"
      competitor="OneTimeSecret"
      title="ProtectedShare vs OneTimeSecret"
      lead="OneTimeSecret made one-time links mainstream, and both projects are open source. The main difference is where encryption happens: ProtectedShare does it in your browser, before anything is uploaded."
      rows={rows}
      sources={[
        { label: "docs.onetimesecret.com", href: "https://docs.onetimesecret.com/" },
        { label: "onetimesecret.com", href: "https://onetimesecret.com" },
      ]}
      differences={[
        {
          title: "Encryption before upload, not after",
          body: (
            <>
              <p>
                OneTimeSecret&apos;s docs describe secrets being encrypted on their servers. That protects data at rest, but
                the server handles the readable secret on the way in.
              </p>
              <p>
                ProtectedShare encrypts in the browser with AES-256-GCM. The key travels in the link after{" "}
                <code>#k=</code> or as a password you send separately, so the server only ever has ciphertext and a hash it
                can check. A database leak gives away no secrets.
              </p>
            </>
          ),
        },
        {
          title: "More than one-time links",
          body: (
            <p>
              Secret delivery is rarely the whole job. EnvShare allows 1 to 100 reads for credentials someone needs during
              setup. File drop handles encrypted files up to 25 MB. Secret request lets someone send you a password
              encrypted to a key only you hold. Chat and an encrypted notepad sit alongside.
            </p>
          ),
        },
      ]}
      whenThem={[
        "You want accounts and team features around your secrets.",
        "Your organization already self-hosts OneTimeSecret and is happy with server-side encryption.",
      ]}
      faqs={faqs}
    />
  );
}
