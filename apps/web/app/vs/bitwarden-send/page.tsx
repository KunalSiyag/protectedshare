import type { Metadata } from "next";
import AppLink from "../../../components/app-link";
import ComparisonPage, { PS, TOOLS, type ComparisonRow, type Faq } from "../comparison";
import { comparisonMetadata } from "../meta";

export const metadata: Metadata = comparisonMetadata({
  title: "Bitwarden Send Alternative (No Account)",
  description:
    "Bitwarden Send vs ProtectedShare: both encrypt in your browser. Send needs a Bitwarden account, and Premium for files. ProtectedShare needs no account.",
  path: "/vs/bitwarden-send",
  keywords: [
    "Bitwarden Send alternative",
    "bitwarden send",
    "bitwarden send without account",
    "send password securely",
    "encrypted file sharing link",
    "self-destructing link",
  ],
});

const rows: ComparisonRow[] = [
  {
    feature: "Encrypts in your browser before upload",
    them: { status: "yes", note: "AES-256; the key is in the link after #" },
    us: PS.browserCrypto,
  },
  {
    feature: "Works without an account",
    them: { status: "partial", note: "For recipients only; senders need a Bitwarden account" },
    us: PS.noAccount,
  },
  {
    feature: "Text secrets",
    them: { status: "yes", note: "Up to 1,000 encrypted characters, on every plan" },
    us: { status: "yes", note: "Secure Notes and EnvShare" },
  },
  {
    feature: "Encrypted file sharing",
    them: { status: "partial", note: "Premium or a paid organization; up to 500 MB (100 MB on mobile)" },
    us: PS.files,
  },
  {
    feature: "Expires after a set time",
    them: { status: "yes", note: "Deleted after 7 days by default, about a month at most" },
    us: PS.expiry,
  },
  {
    feature: "Limit how many times it opens",
    them: { status: "yes", note: "Optional view limit" },
    us: { status: "yes", note: "Burn after one read, or 1 to 100 reads" },
  },
  {
    feature: "Password",
    them: { status: "yes", note: "Checked by their server; not part of the encryption" },
    us: { status: "yes", note: "Can replace the key in the link" },
  },
  {
    feature: "Only specific email addresses can open it",
    them: { status: "partial", note: "Email verification, on paid plans" },
    us: { status: "no" },
  },
  {
    feature: "See whether it was opened",
    them: { status: "yes", note: "Access count shown to the sender" },
    us: PS.receipts,
  },
  {
    feature: "Ask someone to send you a secret",
    them: { status: "unknown", note: "Not covered in the sources we checked" },
    us: PS.request,
  },
  { feature: "Open source", them: { status: "yes", note: "Server source on GitHub" }, us: PS.openSource },
  { feature: "Self-hostable", them: { status: "yes", note: "Docker, per their docs" }, us: PS.selfHost },
];

const faqs: Faq[] = [
  {
    q: "Do you need a Bitwarden account to use Bitwarden Send?",
    a: "To create a Send, yes. Sends are made and managed from the Send view in a Bitwarden app, and file Sends need Premium or a paid organization plan. Recipients don't need an account to open one. ProtectedShare needs no account to create or open a share.",
  },
  {
    q: "Is Bitwarden Send end-to-end encrypted?",
    a: "Yes, according to Bitwarden's help center. Each Send gets a new key, its contents are encrypted with AES-256 on your device, and the key travels in the link after the #, which isn't sent to the server. ProtectedShare works the same way at that level: AES-256-GCM in your browser, with the key after # or derived from a password.",
  },
  {
    q: "Is Bitwarden Send free?",
    a: "Text Sends are available to every Bitwarden user, up to 1,000 encrypted characters. File Sends, and Sends that only open after an email verification, need a paid plan. ProtectedShare's notes, EnvShare secrets, file drops up to 25 MB and secret requests are free, with no sign-up.",
  },
  {
    q: "How long does a Bitwarden Send last?",
    a: "Every Send has a deletion date: 7 days by default, and at most 31 days according to Bitwarden's Send lifespan page (another of their pages says 30). You can also set an earlier expiration date and a view limit. ProtectedShare links last from 1 hour to 30 days, and can burn after one read or allow 1 to 100 reads.",
  },
  {
    q: "Does a Bitwarden Send password encrypt the Send?",
    a: "No. Bitwarden describes Send passwords as purely an authentication method: their server checks the password before returning the Send, and the encryption key is in the link. In ProtectedShare's Secure Notes the password can be the key instead, so the link on its own can't open the note.",
  },
];

export default function BitwardenSendComparisonPage() {
  return (
    <ComparisonPage
      slug="bitwarden-send"
      competitor="Bitwarden Send"
      title="ProtectedShare vs Bitwarden Send"
      lead="Bitwarden Send is end-to-end encrypted and lives inside the Bitwarden password manager, so you need a Bitwarden account to create one. ProtectedShare also encrypts in your browser, and neither you nor the person you're sending to needs an account."
      actions={[
        { href: "/notes", label: "Create a secure note" },
        { href: "/files", label: "Send a file" },
      ]}
      rows={rows}
      sources={[
        { label: "About Send", href: "https://bitwarden.com/help/about-send/" },
        { label: "Create a Send", href: "https://bitwarden.com/help/create-send/" },
        { label: "Send lifespan", href: "https://bitwarden.com/help/send-lifespan/" },
        { label: "Send encryption", href: "https://bitwarden.com/help/send-encryption/" },
        { label: "Send privacy", href: "https://bitwarden.com/help/send-privacy/" },
        { label: "Receive a Send", href: "https://bitwarden.com/help/receive-send/" },
        { label: "bitwarden/server on GitHub", href: "https://github.com/bitwarden/server" },
      ]}
      differences={[
        {
          title: "No account on either side",
          body: (
            <>
              <p>
                Send is part of Bitwarden. You create and manage Sends from the Send view of a Bitwarden app, so you need
                a Bitwarden account; the person you send it to doesn&apos;t. Text Sends are open to every Bitwarden user.
                File Sends need Premium or a paid organization plan, and a verified email address.
              </p>
              <p>
                ProtectedShare has no accounts. Open <AppLink href="/notes">Secure Notes</AppLink> or the{" "}
                <AppLink href="/files">file drop</AppLink>, add what you&apos;re sending, and copy the link. The trade-off
                is where your list of shares lives: Bitwarden lets you manage Sends from any Bitwarden app you sign in to,
                while ProtectedShare&apos;s My links stays in the browser that made the link.
              </p>
            </>
          ),
        },
        {
          title: "What the password does",
          body: (
            <>
              <p>
                Bitwarden&apos;s help center describes the Send password as purely an authentication method. The link
                always carries the encryption key, and their server checks the password before it returns the Send.
              </p>
              <p>
                A ProtectedShare note can carry the key in the link too, or the password can be the key. Leave the key
                out and the note is encrypted with a key derived from your password (PBKDF2-SHA256, 600,000 iterations),
                so the link alone opens nothing. Send the password another way, by phone or a different app, and pick a
                strong one: a weak password can be guessed. The <AppLink href="/security">security page</AppLink> covers
                both modes.
              </p>
            </>
          ),
        },
        {
          title: "Files: 500 MB or 25 MB",
          body: (
            <p>
              With a paid plan, Send takes files up to 500 MB (100 MB from mobile). ProtectedShare&apos;s file drop stops
              at 25 MB, enough for documents, keys, configs and screenshots, but not video. Files are encrypted in your
              browser in 1 MiB chunks, each bound to its position, and file names are encrypted too. You choose 1 to 100
              downloads and an expiry of up to 30 days.
            </p>
          ),
        },
      ]}
      whenThem={[
        "You already use Bitwarden and want Sends next to your passwords, managed from any Bitwarden app.",
        "You need to send files over 25 MB. Send takes up to 500 MB on a paid plan.",
        "You want a Send to open only for specific email addresses, after a verification code.",
        "Your organization wants admin policies over who can create Sends.",
      ]}
      tools={[TOOLS.notes, TOOLS.files, TOOLS.secrets, TOOLS.request]}
      faqs={faqs}
    />
  );
}
