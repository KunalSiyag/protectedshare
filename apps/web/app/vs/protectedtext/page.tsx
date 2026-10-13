import type { Metadata } from "next";
import ComparisonPage, { PS, type ComparisonRow, type Faq } from "../comparison";

const DESCRIPTION =
  "ProtectedText vs ProtectedShare: both encrypt in the browser. We add self-destructing links, read limits, file drops and a local-first notepad.";

export const metadata: Metadata = {
  title: "ProtectedText Alternative (AES-256-GCM)",
  description: DESCRIPTION,
  keywords: [
    "ProtectedText alternative",
    "protected text alternative",
    "protectedtext alternative",
    "secret share",
    "secure text sharing link",
    "self destruct link",
    "self-destructing link",
    "ProtectedText replacement",
    "free protectedtext alternative",
    "burn after read link",
    "zero knowledge note sharing",
    "encrypted notepad alternative",
  ],
  alternates: {
    canonical: "https://protectedshare.me/vs/protectedtext",
  },
  openGraph: {
    title: "ProtectedText Alternative (AES-256-GCM) — ProtectedShare",
    description: DESCRIPTION,
    url: "https://protectedshare.me/vs/protectedtext",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProtectedText Alternative (AES-256-GCM) — ProtectedShare",
    description: DESCRIPTION,
  },
};

const rows: ComparisonRow[] = [
  {
    feature: "Encrypts in your browser",
    them: { status: "yes", note: "AES, per their site" },
    us: { status: "yes", note: "AES-256-GCM via Web Crypto" },
  },
  {
    feature: "Persistent encrypted notepad",
    them: { status: "yes", note: "Its core feature" },
    us: { status: "yes", note: "Local in the browser, or synced ciphertext" },
  },
  {
    feature: "Notes expire or self-destruct",
    them: { status: "no", note: "Kept until you delete them" },
    us: PS.burn,
  },
  {
    feature: "One-time links to send a secret",
    them: { status: "no", note: "You share the address and password" },
    us: { status: "yes", note: "Link with the key, or a separate password" },
  },
  { feature: "Read limits", them: { status: "no" }, us: PS.readCount },
  {
    feature: "Copy that opens offline",
    them: { status: "partial", note: "Save the page as HTML" },
    us: { status: "partial", note: "Notepad exports a self-decrypting HTML file" },
  },
  { feature: "Encrypted files, requests and chat", them: { status: "no" }, us: { status: "yes" } },
  {
    feature: "Open source",
    them: { status: "partial", note: "Client code is visible; server code isn't published" },
    us: PS.openSource,
  },
  { feature: "Self-hostable", them: { status: "no" }, us: PS.selfHost },
  { feature: "Works without an account", them: { status: "yes" }, us: PS.noAccount },
];

const faqs: Faq[] = [
  {
    q: "What makes ProtectedShare a good ProtectedText alternative?",
    a: "ProtectedText is a persistent encrypted notepad. ProtectedShare has one too, with a local-only mode and optional synced ciphertext, and adds what a notepad doesn't do: one-time links that self-destruct, read limits for credentials, encrypted file drops and secret requests. Encryption is AES-256-GCM in your browser.",
  },
  {
    q: "Does ProtectedShare require a sign-up or account?",
    a: "No. Notes, secrets, files and requests need no account. The notepad works locally with nothing sent to the server; if you turn on sync, you pick a username and password, and the server stores a hash of the username and your encrypted vault.",
  },
  {
    q: "How does ProtectedShare's encryption compare to ProtectedText?",
    a: "Both encrypt in the browser, according to ProtectedText's own site. ProtectedShare uses AES-256-GCM, an authenticated mode that detects tampering, and derives keys with HKDF (and PBKDF2-SHA256 at 600,000 iterations when you use a password). For ProtectedText's exact scheme, read their site and client code.",
  },
];

export default function ProtectedTextComparisonPage() {
  return (
    <ComparisonPage
      slug="protectedtext"
      competitor="ProtectedText"
      title="ProtectedShare vs ProtectedText"
      lead="ProtectedText is an encrypted notepad you come back to. ProtectedShare has a notepad too, but it's built mainly for handing a secret to someone else and having it disappear afterwards."
      rows={rows}
      sources={[{ label: "protectedtext.com", href: "https://www.protectedtext.com" }]}
      differences={[
        {
          title: "Notes that leave no trail",
          body: (
            <>
              <p>
                ProtectedText keeps a site until you delete it, which is right for a notepad. When you&apos;re sending a
                password to someone, you want the opposite: a link that works once, or a few times, then is deleted from
                the server.
              </p>
              <p>
                ProtectedShare notes can burn after reading. EnvShare secrets allow 1 to 100 reads. Everything expires
                within 30 days, and a cron deletes expired rows every 30 minutes.
              </p>
            </>
          ),
        },
        {
          title: "A notepad that can stay on your device",
          body: (
            <p>
              ProtectedShare&apos;s notepad starts in local mode: the encrypted vault lives in your browser and nothing is
              uploaded. Turn on sync and the server stores only ciphertext, with conflicting edits merged in your browser.
              Any note can be exported as a self-decrypting HTML file.
            </p>
          ),
        },
      ]}
      whenThem={[
        "You want a long-lived notepad at a memorable address you can open anywhere with a password.",
        "You never need to send a secret to someone else.",
      ]}
      faqs={faqs}
    />
  );
}
