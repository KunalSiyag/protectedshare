import type { Metadata } from "next";
import AppLink from "../../../components/app-link";
import ComparisonPage, { PS, TOOLS, type ComparisonRow, type Faq } from "../comparison";
import { comparisonMetadata } from "../meta";

export const metadata: Metadata = comparisonMetadata({
  title: "WeTransfer Alternative for Sensitive Files",
  description:
    "WeTransfer vs ProtectedShare: WeTransfer moves gigabytes. ProtectedShare encrypts files up to 25 MB in your browser, with a download limit and no account.",
  path: "/vs/wetransfer",
  keywords: [
    "WeTransfer alternative",
    "secure wetransfer alternative",
    "encrypted file transfer",
    "send sensitive files",
    "end-to-end encrypted file sharing",
    "file link with download limit",
  ],
});

const rows: ComparisonRow[] = [
  {
    feature: "Encrypts in your browser before upload",
    them: { status: "unknown", note: "Docs cite TLS in transit and AES-256 at rest; end-to-end is listed for Enterprise" },
    us: PS.browserCrypto,
  },
  {
    feature: "Files of 1 GB and more",
    them: { status: "yes", note: "3 GB a month on Free; up to 1 TB per transfer on Ultimate" },
    us: { status: "no", note: "25 MB per drop" },
  },
  {
    feature: "Expires after a set time",
    them: { status: "yes", note: "Up to 3 days on Free; no limit on Ultimate" },
    us: PS.expiry,
  },
  {
    feature: "Limit the number of downloads",
    them: { status: "unknown", note: "Not covered in the sources we checked" },
    us: { status: "yes", note: "1 to 100 downloads" },
  },
  {
    feature: "Password protection",
    them: { status: "yes", note: "On every plan, per their pricing page" },
    us: { status: "no", note: "File links carry the key; notes can use a password" },
  },
  {
    feature: "Know when it was downloaded",
    them: { status: "yes", note: "Download confirmation email" },
    us: PS.receipts,
  },
  {
    feature: "Delete or revoke early",
    them: { status: "yes", note: "From your Sent panel" },
    us: { status: "yes", note: "Revoke in My links, on the device that made it" },
  },
  {
    feature: "Works without an account",
    them: { status: "partial", note: "Recipients don't need one; senders sign up or verify an email" },
    us: PS.noAccount,
  },
  { feature: "Custom branding", them: { status: "yes", note: "On paid plans" }, us: { status: "no" } },
  {
    feature: "Open source and self-hostable",
    them: { status: "no", note: "No public source we could find" },
    us: PS.openSource,
  },
];

const faqs: Faq[] = [
  {
    q: "Is WeTransfer end-to-end encrypted?",
    a: "WeTransfer's help center says files are encrypted in transit with TLS 1.2 or 1.3 and at rest with AES-256. Its pricing page lists end-to-end encryption as an Enterprise plan feature. ProtectedShare encrypts files in your browser before upload, on every share, and the key stays in the link.",
  },
  {
    q: "Does WeTransfer's free plan include password protection?",
    a: "Yes. At the time of writing, WeTransfer's pricing page shows password-protected transfers on the Free, Starter and Ultimate plans. ProtectedShare's file drop has no password: the key is in the link, so send it privately, or use a secure note when you want a separate password.",
  },
  {
    q: "How much can I send with WeTransfer for free?",
    a: "The free plan allows up to 3 GB and 10 transfers in any rolling 30-day window, for individual, non-commercial use, and free transfers stay available for up to 3 days. ProtectedShare's file drop takes up to 25 MB per drop and keeps it for up to 30 days.",
  },
  {
    q: "Do recipients need a WeTransfer account?",
    a: "No. WeTransfer says anyone can download your files without logging in or signing up. Its help center says senders without an account verify their email before sending. Neither side needs an account on ProtectedShare.",
  },
  {
    q: "Can I limit how many times a file is downloaded?",
    a: "WeTransfer shows download counts and sends a download confirmation, but we didn't find a download limit in its docs. ProtectedShare's file drop lets you allow 1 to 100 downloads, then deletes the files.",
  },
];

export default function WeTransferComparisonPage() {
  return (
    <ComparisonPage
      slug="wetransfer"
      competitor="WeTransfer"
      title="ProtectedShare vs WeTransfer"
      lead="WeTransfer is built for big files: 3 GB a month on the free plan, and far more on paid ones. ProtectedShare's file drop is built for small, sensitive ones: up to 25 MB, encrypted in your browser before upload, with a download limit and no account."
      actions={[
        { href: "/files", label: "Send a file" },
        { href: "/notes", label: "Create a secure note" },
      ]}
      rows={rows}
      sources={[
        { label: "pricing", href: "https://wetransfer.com/pricing" },
        { label: "plan limits", href: "https://wetransfer.com/help-center/subscriptions/plan-limits" },
        {
          label: "how files are protected",
          href: "https://wetransfer.com/help-center/security-privacy/how-do-we-protect-your-files",
        },
        { label: "transfer availability", href: "https://wetransfer.com/help-center/how-to/transfer-availability" },
        { label: "sending a transfer", href: "https://wetransfer.com/help-center/how-to/send-a-transfer" },
        { label: "download counts", href: "https://wetransfer.com/help-center/how-to/download-counts-and-status" },
        { label: "notifications", href: "https://wetransfer.com/help-center/how-to/confirmation-emails" },
        { label: "deleting a transfer", href: "https://wetransfer.com/help-center/how-to/delete-transfer" },
      ]}
      differences={[
        {
          title: "Where encryption happens",
          body: (
            <>
              <p>
                WeTransfer&apos;s help center says files are encrypted in transit with TLS 1.2 or 1.3 and at rest with
                AES-256. It doesn&apos;t describe encryption in your browser for the standard plans; its pricing page lists
                end-to-end encryption as a feature of the Enterprise plan. The same help article says WeTransfer
                doesn&apos;t review the contents of transfers except in listed cases, such as when you&apos;ve given
                permission, to investigate a suspected terms violation, or to meet legal obligations.
              </p>
              <p>
                ProtectedShare&apos;s <AppLink href="/files">file drop</AppLink> encrypts every file in your browser with
                AES-256-GCM before upload, on every share. The key stays in the link after <code>#k=</code>, which
                browsers don&apos;t send to servers, and file names are encrypted too. The server stores ciphertext it has
                no key for. The <AppLink href="/security">security page</AppLink> lists every field it keeps.
              </p>
            </>
          ),
        },
        {
          title: "Big files or sensitive files",
          body: (
            <>
              <p>
                For a 2 GB video or a folder of raw photos, WeTransfer is the better tool, and ProtectedShare isn&apos;t
                one: a drop stops at 25 MB. WeTransfer&apos;s free plan covers up to 3 GB and 10 transfers a month, for
                individual, non-commercial use, and its paid plans go much further.
              </p>
              <p>
                For a signed contract, a scanned passport, a private key or a small database export, size matters less
                than who can open it. That&apos;s the case ProtectedShare is built for: encrypted before it leaves your
                device, deleted after 1 to 100 downloads or at expiry, and no account on either side. For a password that
                goes with the file, use a <AppLink href="/notes">secure note</AppLink> or{" "}
                <AppLink href="/secrets">EnvShare</AppLink>.
              </p>
            </>
          ),
        },
        {
          title: "How long files stay",
          body: (
            <>
              <p>
                WeTransfer keeps transfers on the Free and Starter plans for up to 3 days; on Ultimate you can keep them as
                long as you like. Its help center says files are deleted within 48 hours after the expiry date, or within
                a year if you turned on recovery.
              </p>
              <p>
                A ProtectedShare drop lasts from 1 hour to 30 days. It&apos;s deleted after the last allowed download, at
                expiry, or when you revoke it from My links. A cleanup job runs every 30 minutes, and expired drops are
                refused before that.
              </p>
            </>
          ),
        },
      ]}
      whenThem={[
        "You're sending files larger than 25 MB: video, design files, photo sets.",
        "You want branded transfer pages, a custom WeTransfer page, or a team workspace.",
        "Your recipient expects a WeTransfer email and download page.",
        "You need transfers to stay available for longer than 30 days, on Ultimate.",
      ]}
      tools={[TOOLS.files, TOOLS.notes, TOOLS.request, TOOLS.secrets]}
      faqs={faqs}
    />
  );
}
