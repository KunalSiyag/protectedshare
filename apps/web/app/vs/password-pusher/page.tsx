import type { Metadata } from "next";
import AppLink from "../../../components/app-link";
import ComparisonPage, { PS, TOOLS, type ComparisonRow, type Faq } from "../comparison";
import { comparisonMetadata } from "../meta";

export const metadata: Metadata = comparisonMetadata({
  title: "Password Pusher Alternative (E2E Encrypted)",
  description:
    "Password Pusher vs ProtectedShare: both expire links by views and days. Password Pusher encrypts on its server; ProtectedShare encrypts in your browser.",
  path: "/vs/password-pusher",
  keywords: [
    "Password Pusher alternative",
    "pwpush alternative",
    "share password securely",
    "expiring password link",
    "one-time password link",
    "send password securely",
  ],
});

const rows: ComparisonRow[] = [
  {
    feature: "Encrypts in your browser before upload",
    them: { status: "no", note: "Encrypted on their server with AES-GCM, per their docs" },
    us: PS.browserCrypto,
  },
  {
    feature: "Expires after a number of views",
    them: { status: "yes", note: "Views, days, or both" },
    us: { status: "yes", note: "EnvShare: 1 to 100 reads; files: 1 to 100 downloads" },
  },
  {
    feature: "Expires after a set time",
    them: { status: "yes", note: "In days; self-hosted defaults allow 1 to 90" },
    us: PS.expiry,
  },
  { feature: "Passphrase", them: { status: "yes", note: "Optional" }, us: PS.separatePassword },
  {
    feature: "Encrypted file sharing",
    them: { status: "partial", note: "Paid plans on pwpush.com; their docs say the app doesn't encrypt files" },
    us: PS.files,
  },
  {
    feature: "Ask someone to send you a secret",
    them: { status: "yes", note: "Requests; text-only on the free plan" },
    us: PS.request,
  },
  {
    feature: "See when it was viewed",
    them: { status: "yes", note: "Audit log of views, when you're signed in" },
    us: PS.receipts,
  },
  { feature: "Team accounts and branding", them: { status: "yes", note: "On paid plans" }, us: { status: "no" } },
  { feature: "Choose a data region", them: { status: "yes", note: "EU or US, on the hosted service" }, us: { status: "no" } },
  { feature: "Open source", them: { status: "yes", note: "Apache 2.0" }, us: PS.openSource },
  { feature: "Self-hostable", them: { status: "yes", note: "Docker" }, us: PS.selfHost },
  { feature: "Works without an account", them: { status: "yes", note: "For text pushes" }, us: PS.noAccount },
];

const faqs: Faq[] = [
  {
    q: "Is Password Pusher end-to-end encrypted?",
    a: "Not by its own description. Password Pusher's security docs say it doesn't provide client-side encryption: data is encrypted on the server with AES-GCM before it's stored. ProtectedShare encrypts in your browser with AES-256-GCM, so the server only ever receives ciphertext.",
  },
  {
    q: "Do I need an account to use Password Pusher?",
    a: "Not for basic text pushes on pwpush.com. File pushes need a paid plan on the hosted service, and a signed-in user on a self-hosted install. ProtectedShare doesn't use accounts for notes, EnvShare secrets, file drops or requests.",
  },
  {
    q: "How long do Password Pusher links last?",
    a: "A push expires after a set number of views or days, whichever comes first. On a self-hosted install the defaults are 7 days and 5 views, and the maximums 90 days and 100 views. ProtectedShare's EnvShare secrets allow 1 to 100 reads and expire within 30 days.",
  },
  {
    q: "Does Password Pusher encrypt uploaded files?",
    a: "Its security docs say file uploads aren't encrypted by Password Pusher before storage, and recommend a storage backend that encrypts at rest. ProtectedShare's file drop encrypts each file in your browser before upload, including its name.",
  },
  {
    q: "Is Password Pusher open source?",
    a: "Yes. The open-source edition is released under the Apache 2.0 license and can be self-hosted with Docker. ProtectedShare is MIT licensed: its API runs on Cloudflare Workers with D1, and the web app is published as a Docker image.",
  },
];

export default function PasswordPusherComparisonPage() {
  return (
    <ComparisonPage
      slug="password-pusher"
      competitor="Password Pusher"
      title="ProtectedShare vs Password Pusher"
      lead="Password Pusher deletes a link after a number of views or days, and it's open source, like ProtectedShare. The main difference is where encryption happens: Password Pusher encrypts what you push on its server, while ProtectedShare encrypts in your browser before anything is uploaded."
      actions={[
        { href: "/secrets", label: "Share a secret" },
        { href: "/notes", label: "Create a secure note" },
      ]}
      rows={rows}
      sources={[
        { label: "pwpush.com", href: "https://pwpush.com/" },
        { label: "pricing", href: "https://pwpush.com/pricing" },
        { label: "security docs", href: "https://docs.pwpush.com/docs/security/" },
        { label: "editions", href: "https://docs.pwpush.com/docs/editions/" },
        { label: "free tier", href: "https://docs.pwpush.com/docs/hosted-free/" },
        { label: "self-hosted configuration", href: "https://docs.pwpush.com/docs/self-hosted-configuration/" },
        { label: "FAQ", href: "https://docs.pwpush.com/docs/faq/" },
      ]}
      differences={[
        {
          title: "Where encryption happens",
          body: (
            <>
              <p>
                Password Pusher&apos;s security docs say it doesn&apos;t provide client-side encryption. Your browser sends
                the push over HTTPS, and the server encrypts it with AES-GCM, using a key derived from a master key, before
                storing it. At expiry the encrypted data is deleted. That protects the database at rest, but the readable
                secret passes through the server on the way in.
              </p>
              <p>
                Their docs are upfront about it: if you need encryption where only the sender and receiver can decrypt,
                Password Pusher might not meet that requirement. ProtectedShare is built for that case. Your browser
                encrypts with AES-256-GCM before upload, the key stays in the link after <code>#</code> or in a password
                you send separately, and the server stores ciphertext plus the hash of a token it checks before releasing
                it. The <AppLink href="/security">security page</AppLink> spells out every field.
              </p>
            </>
          ),
        },
        {
          title: "Files",
          body: (
            <>
              <p>
                On pwpush.com, file pushes come with the paid plans, and on a self-hosted install they need a signed-in
                user. Their security docs note that uploaded files aren&apos;t encrypted by Password Pusher itself, and
                recommend an encrypted storage backend such as S3. In return there&apos;s no hard limit on file size; their
                FAQ mentions files up to 4 GB in testing.
              </p>
              <p>
                ProtectedShare&apos;s <AppLink href="/files">file drop</AppLink> needs no account and encrypts every file
                in your browser, in 1 MiB chunks, before upload. File names are encrypted too. The cap is 25 MB per drop.
              </p>
            </>
          ),
        },
        {
          title: "Accounts and audit trails",
          body: (
            <>
              <p>
                Password Pusher has accounts. Signed in, you get an audit log for each push showing when it was viewed,
                with IP addresses and user agents, and paid plans add teams, custom domains and branding. If your helpdesk
                needs a shared record of who saw which credential, that&apos;s a real reason to choose it.
              </p>
              <p>
                ProtectedShare has no accounts. The browser that made a link keeps it in My links, where you can see
                whether it was opened and revoke it. The server keeps a receipt with counts and times, never content.
              </p>
            </>
          ),
        },
      ]}
      whenThem={[
        "Your team needs an audit log of who viewed each credential, and from where.",
        "You want custom domains, branding or SSO for a company-wide sharing portal.",
        "You want to pick an EU or US data region for the hosted service.",
        "You need to push files larger than 25 MB alongside passwords, on their paid plans.",
      ]}
      tools={[TOOLS.secrets, TOOLS.notes, TOOLS.files, TOOLS.request]}
      faqs={faqs}
    />
  );
}
