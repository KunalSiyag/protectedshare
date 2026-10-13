import type { Metadata } from "next";
import ToolGuide, { GuideLink } from "../../components/tool-guide";
import { pageMetadata } from "../../lib/seo";
import type { FaqItem } from "../tools/_components/tool-content";
import RequestClient from "./request-client";

const DESCRIPTION =
  "Send a link and get a password back, encrypted in their browser to a key only your inbox link holds. One answer, read once. No accounts.";

export const metadata: Metadata = pageMetadata({
  title: "Ask Someone to Send You a Password Securely",
  description: DESCRIPTION,
  path: "/request",
  keywords: [
    "request a password securely",
    "ask someone for a password",
    "receive password securely",
    "collect credentials from a client",
    "secure secret request link",
  ],
});

const FAQ: FaqItem[] = [
  {
    question: "How do I ask someone for a password securely?",
    answer:
      "Create a request here, send them the request link, and keep the inbox link to yourself. They paste the password into the page and it's encrypted in their browser before it's sent. You read it from your inbox, and the server copy is deleted.",
  },
  {
    question: "Can ProtectedShare read the answer?",
    answer:
      "No. It's encrypted to a public key whose private half exists only in your inbox link, after the #. Browsers don't send that part to servers, so the server holds ciphertext it can't open.",
  },
  {
    question: "What if I lose the inbox link?",
    answer:
      "Then nobody can read the answer, including us, because the private key isn't stored anywhere else. Both links are saved in My links in the browser you used, so look there first. Otherwise, make a new request.",
  },
  {
    question: "Could someone swap in their own key?",
    answer:
      "The request link's key encrypts your title together with a fingerprint of your public key. The sender's browser checks that fingerprint before it encrypts anything, so a swapped key is caught before the secret is sent.",
  },
  {
    question: "Does the person answering need an account?",
    answer: "No. They need the request link and a browser. There's no account, email or app on either side.",
  },
  {
    question: "Can they send more than one answer?",
    answer:
      "No. Each request takes one answer, then the request link stops accepting more. Create another request if you need a second secret.",
  },
  {
    question: "Can I read the answer again later?",
    answer:
      "Opening it deletes the copy on the server, so the open tab holds the only one. Save it somewhere safe, such as your password manager, before you close the tab.",
  },
];

export default function RequestPage() {
  return (
    <>
      <RequestClient />
      <ToolGuide
        appName="ProtectedShare Secret Request"
        path="/request"
        description="Ask someone to send you a password or API key. Their browser encrypts it to your public key, and only your private inbox link can open it."
        features={[
          "ECDH P-256 key pair made in your browser",
          "Answer encrypted to your public key with AES-256-GCM",
          "Key fingerprint check before the sender encrypts",
          "One answer per request, deleted from the server once opened",
          "Expiry from 1 hour to 30 days",
          "No account for requester or sender",
        ]}
        breadcrumb="Secret request"
        how={{
          title: "How a secret request works",
          steps: [
            {
              title: "You make two links",
              body: "Your browser creates a key pair. The request link shows your title and note; your private inbox link holds the private key after the #.",
            },
            {
              title: "They answer in their browser",
              body: "Their browser checks your key's fingerprint, encrypts what they paste to your public key and sends only ciphertext. The request then closes.",
            },
            {
              title: "You open it once",
              body: "Your inbox link decrypts the answer in your browser. Opening it deletes the copy on the server.",
            },
          ],
        }}
        uses={{
          title: "When you're the one who needs the secret",
          items: [
            {
              title: "Logins from a client",
              body: "Get hosting, domain or database credentials from a client who would otherwise email them.",
            },
            {
              title: "Help desk and IT",
              body: "Ask a colleague for a password or recovery code without asking them to type it into a ticket.",
            },
            {
              title: "From someone non-technical",
              body: "They open a link, paste and press send. No account, no app, no key to manage.",
            },
            {
              title: "Keys from a vendor",
              body: "Receive an API key encrypted to you, so it never sits in a shared inbox or a support thread.",
            },
          ],
        }}
        limits={{
          title: "What the server holds while you wait",
          items: [
            {
              label: "Encryption",
              value: "The sender's browser encrypts to your public key with ECDH P-256, HKDF-SHA256 and AES-256-GCM. Only the private key in your inbox link can decrypt it.",
            },
            {
              label: "Server keeps",
              value: "Your public key, your title and note encrypted with the request link's key, hashes of the answer and inbox tokens, the expiry, and the encrypted answer until you open it.",
            },
            { label: "Never sent", value: "Your private key, the request link's key, and the secret in readable form." },
            { label: "Size", value: "A title up to 120 characters and a note up to 600. The answer can be up to 100 KB of text." },
            { label: "Answers", value: "One per request. An open inbox checks for it every few seconds." },
            {
              label: "Expiry",
              value: "1 hour, 1 day, 7 days, or a date up to 30 days out. Then the request and any unopened answer are deleted.",
            },
          ],
          footnote: (
            <>
              The key exchange is described in the <GuideLink href="/security">security model</GuideLink>, and every stored
              field is on the <GuideLink href="/privacy">privacy page</GuideLink>.
            </>
          ),
        }}
        faq={{ title: "Requesting a secret", items: FAQ }}
        related={[
          { href: "/notes", title: "Secure note", body: "Send a password the other way, as a one-time link." },
          { href: "/secrets", title: "EnvShare", body: "Share .env files and API keys with a read limit." },
          { href: "/files", title: "File drop", body: "Send encrypted files up to 25 MB." },
          { href: "/tools/password-generator", title: "Password generator", body: "Make a strong password in your browser." },
          { href: "/vs/password-pusher", title: "ProtectedShare vs Password Pusher", body: "How the two handle password links." },
          { href: "/vs/bitwarden-send", title: "ProtectedShare vs Bitwarden Send", body: "Sharing without an account, compared." },
        ]}
      />
    </>
  );
}
