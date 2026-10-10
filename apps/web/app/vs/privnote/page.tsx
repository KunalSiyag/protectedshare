import type { Metadata } from "next";
import ComparisonPage, { PS, type ComparisonRow, type Faq } from "../comparison";

const DESCRIPTION =
  "Privnote vs ProtectedShare, compared honestly: browser-side AES-256-GCM encryption, self-destructing links, read limits, .env sharing, encrypted file drops, open source, no signup and no ads.";

export const metadata: Metadata = {
  title: "Best Free Privnote Alternative (Zero-Knowledge)",
  description: DESCRIPTION,
  keywords: [
    "Privnote alternative",
    "privnote alternatives",
    "secret share",
    "secure text sharing link",
    "self destruct link",
    "self-destructing link",
    "free privnote alternative",
    "burn after read note",
    "anonymous encrypted note sharing",
    "zero knowledge secret link",
  ],
  alternates: {
    canonical: "https://protectedshare.me/vs/privnote",
  },
  openGraph: {
    title: "Best Free Privnote Alternative (Zero-Knowledge) — ProtectedShare",
    description: DESCRIPTION,
    url: "https://protectedshare.me/vs/privnote",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Free Privnote Alternative (Zero-Knowledge) — ProtectedShare",
    description: DESCRIPTION,
  },
};

const rows: ComparisonRow[] = [
  {
    feature: "Encrypts in your browser before upload",
    them: { status: "unknown", note: "Not covered in the sources we checked" },
    us: PS.browserCrypto,
  },
  { feature: "Self-destructs after reading", them: { status: "yes" }, us: PS.burn },
  { feature: "Expires after a set time", them: { status: "yes", note: "Optional, instead of on reading" }, us: PS.expiry },
  { feature: "Allow a set number of reads", them: { status: "no", note: "One read, or a timer" }, us: PS.readCount },
  { feature: "Separate password", them: { status: "yes", note: "Optional manual password" }, us: PS.separatePassword },
  {
    feature: "Know when it was read",
    them: { status: "yes", note: "Email notice when the note is destroyed" },
    us: PS.receipts,
  },
  { feature: "Encrypted file sharing", them: { status: "no" }, us: PS.files },
  { feature: "Ask someone to send you a secret", them: { status: "no" }, us: PS.request },
  { feature: "Open source and self-hostable", them: { status: "no", note: "No public source we could find" }, us: PS.openSource },
  { feature: "Works without an account", them: { status: "yes" }, us: PS.noAccount },
];

const faqs: Faq[] = [
  {
    q: "What makes ProtectedShare a good Privnote alternative?",
    a: "It covers the same one-time note, and adds what Privnote doesn't: a read count from 1 to 100 for credentials, encrypted file drops up to 25 MB, secret requests, and an open-source codebase you can self-host. Encryption runs in your browser with AES-256-GCM, and there are no ads.",
  },
  {
    q: "Is Privnote end-to-end encrypted?",
    a: "We don't make claims about how Privnote encrypts; check their own documentation. For ProtectedShare, your browser encrypts the note before upload and the key travels in the part of the link after #, which browsers don't send to servers. The server stores ciphertext and a hash it can check, never the key.",
  },
  {
    q: "Does ProtectedShare log my IP address?",
    a: "We don't write IP addresses into our database. Cloudflare, which hosts the API, sees IP addresses and keeps request logs like any web host. Shares are deleted when they're read out, revoked or expire. The privacy page lists everything that's stored.",
  },
];

export default function PrivnoteComparisonPage() {
  return (
    <ComparisonPage
      slug="privnote"
      competitor="Privnote"
      title="ProtectedShare vs Privnote"
      lead="Both send a note that disappears after it's read. ProtectedShare encrypts in your browser, lets you choose how many reads a secret gets, handles files, and is open source."
      rows={rows}
      sources={[
        { label: "privnote.com", href: "https://privnote.com" },
        {
          label: "a public how-to guide",
          href: "https://help.stalbansdiocese.org/how-can-i-securely-share-information-like-a-password-with-somebody-else",
        },
      ]}
      differences={[
        {
          title: "You can check where encryption happens",
          body: (
            <>
              <p>
                ProtectedShare encrypts the note in your browser with AES-256-GCM. The key rides in the link after{" "}
                <code>#k=</code>, which browsers don&apos;t send to the server, or you choose a password and send it
                separately. The server keeps ciphertext and a hash it can check before releasing it.
              </p>
              <p>
                Because the code is public, you don&apos;t have to take that on trust. The{" "}
                <a href="/security" className="font-medium text-ink underline decoration-line-strong underline-offset-[3px]">
                  security page
                </a>{" "}
                describes exactly what is sent.
              </p>
            </>
          ),
        },
        {
          title: "More than a one-time note",
          body: (
            <p>
              Credentials often need a second look during setup, so EnvShare lets a secret survive 1 to 100 reads. File
              drop encrypts files up to 25 MB with a download limit. Secret request flips the direction: you send someone
              a link, and what they type comes back encrypted to a key only you hold.
            </p>
          ),
        },
        {
          title: "No ads",
          body: (
            <p>
              The hosted site shows no ads and the app sets no cookies. If Google Analytics is turned on for the site, the
              privacy page says so.
            </p>
          ),
        },
      ]}
      whenThem={[
        "You want an email when the note is destroyed, without keeping anything on your own device.",
        "The person you're sending to already knows Privnote and trusts it.",
      ]}
      faqs={faqs}
    />
  );
}
