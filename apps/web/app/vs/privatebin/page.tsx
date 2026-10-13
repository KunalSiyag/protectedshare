import type { Metadata } from "next";
import AppLink from "../../../components/app-link";
import ComparisonPage, { PS, type ComparisonRow, type Faq } from "../comparison";
import { comparisonMetadata } from "../meta";

export const metadata: Metadata = comparisonMetadata({
  title: "PrivateBin Alternative for Sharing Secrets",
  description:
    "PrivateBin vs ProtectedShare: both encrypt in your browser with AES-256-GCM. ProtectedShare adds read counts, 25 MB file drops and secret requests.",
  path: "/vs/privatebin",
  keywords: [
    "PrivateBin alternative",
    "privatebin",
    "encrypted pastebin",
    "zero knowledge pastebin",
    "burn after reading",
    "secure paste link",
  ],
});

const rows: ComparisonRow[] = [
  {
    feature: "Encrypts in your browser before upload",
    them: { status: "yes", note: "AES-256-GCM; the key is in the link after #" },
    us: PS.browserCrypto,
  },
  { feature: "Burn after reading", them: { status: "yes", note: "Optional" }, us: PS.burn },
  {
    feature: "Expires after a set time",
    them: { status: "yes", note: "5 minutes to 1 year, or never, by default" },
    us: PS.expiry,
  },
  {
    feature: "Allow a set number of reads",
    them: { status: "no", note: "Burn after reading, or open until it expires" },
    us: PS.readCount,
  },
  { feature: "Password", them: { status: "yes", note: "Optional" }, us: PS.separatePassword },
  {
    feature: "Encrypted file attachments",
    them: { status: "partial", note: "Off by default; depends on the instance" },
    us: PS.files,
  },
  {
    feature: "Discussion on a paste",
    them: { status: "yes", note: "Optional, encrypted comments" },
    us: { status: "partial", note: "Separate encrypted chat rooms" },
  },
  {
    feature: "Markdown and syntax highlighting",
    them: { status: "yes" },
    us: { status: "partial", note: "Notes render Markdown; no syntax highlighting" },
  },
  {
    feature: "Ask someone to send you a secret",
    them: { status: "unknown", note: "Not covered in the sources we checked" },
    us: PS.request,
  },
  { feature: "Open source", them: { status: "yes", note: "zlib/libpng license" }, us: PS.openSource },
  { feature: "Self-hostable", them: { status: "yes", note: "PHP; many public instances" }, us: PS.selfHost },
  { feature: "Works without an account", them: { status: "yes" }, us: PS.noAccount },
];

const faqs: Faq[] = [
  {
    q: "Is PrivateBin end-to-end encrypted?",
    a: "PrivateBin's README says pastes are encrypted and decrypted in the browser with 256-bit AES in Galois Counter Mode, and the key sits in the URL fragment, so the server has zero knowledge of what's stored. ProtectedShare uses the same cipher, AES-256-GCM, through Web Crypto.",
  },
  {
    q: "Does PrivateBin support file uploads?",
    a: "The software does, but file upload is disabled by default, so it depends on the instance you use. The default size limit is 10 MB per paste. ProtectedShare's file drop is always on at protectedshare.me: up to 25 MB per drop, with 1 to 100 downloads.",
  },
  {
    q: "Which PrivateBin instance should I use?",
    a: "PrivateBin is software anyone can run. Its website has a 'Try it out' link and lists public instances in a directory, and each operator chooses settings like file uploads and expiry options. Its README notes that you have to trust the server administrator, which is true of any in-browser encryption app, ProtectedShare included.",
  },
  {
    q: "How long do PrivateBin pastes last?",
    a: "The default options run from 5 minutes to 1 year, plus never and burn after reading, and each instance can change them. ProtectedShare shares last at most 30 days, and notes can burn after the first read.",
  },
  {
    q: "Can I limit how many times a paste is read?",
    a: "PrivateBin offers burn after reading; otherwise a paste stays readable until it expires. ProtectedShare's EnvShare lets you choose 1 to 100 reads, and file drops 1 to 100 downloads.",
  },
];

export default function PrivateBinComparisonPage() {
  return (
    <ComparisonPage
      slug="privatebin"
      competitor="PrivateBin"
      title="ProtectedShare vs PrivateBin"
      lead="PrivateBin is a zero-knowledge pastebin: your browser encrypts each paste with AES-256-GCM before the server stores it. ProtectedShare uses the same cipher, but it's built for handing a secret to one person, with read counts, file drops and requests that don't depend on which server you pick."
      rows={rows}
      sources={[
        { label: "privatebin.info", href: "https://privatebin.info/" },
        { label: "PrivateBin on GitHub", href: "https://github.com/PrivateBin/PrivateBin" },
        {
          label: "default configuration",
          href: "https://github.com/PrivateBin/PrivateBin/blob/master/cfg/conf.sample.php",
        },
        { label: "license", href: "https://github.com/PrivateBin/PrivateBin/blob/master/LICENSE.md" },
        { label: "instance directory", href: "https://privatebin.info/directory/" },
      ]}
      differences={[
        {
          title: "A pastebin, or a handoff",
          body: (
            <>
              <p>
                PrivateBin is a pastebin. With the default settings a paste can stay up for a year or never expire, carry
                a discussion thread, and be shown as Markdown or highlighted source code. That suits code snippets and
                logs you want to keep around and link to.
              </p>
              <p>
                ProtectedShare is built for the opposite: getting a secret to one person, then deleting it. Every share
                expires within 30 days. <AppLink href="/notes">Notes</AppLink> can burn after the first read,{" "}
                <AppLink href="/secrets">EnvShare</AppLink> secrets allow 1 to 100 reads, and a job removes expired rows
                every 30 minutes.
              </p>
            </>
          ),
        },
        {
          title: "One project, many servers",
          body: (
            <>
              <p>
                PrivateBin is software that anyone can run. Its website has a &ldquo;Try it out&rdquo; link and keeps a directory of
                public instances, with checks such as HTTPS and an Observatory rating. Each operator picks the settings: file
                uploads are off by default, the default size limit is 10 MB, and the expiry options can change.
              </p>
              <p>
                Its README is candid that you have to trust the server administrator not to inject malicious code. That
                holds for every tool that encrypts in the browser, ProtectedShare included, because the server delivers
                the code. The mitigations are the same as well: source code you can read, and running your own copy. The{" "}
                <AppLink href="/self-host">self-host guide</AppLink> shows how.
              </p>
            </>
          ),
        },
        {
          title: "Similar cryptography",
          body: (
            <>
              <p>
                Both encrypt with AES-256-GCM in the browser and keep the key in the URL fragment, so the server stores
                only ciphertext. As PrivateBin&apos;s README points out, anyone holding a full link to a paste without a
                password can read it. The same goes for a ProtectedShare link that carries its key.
              </p>
              <p>
                ProtectedShare also puts a gate in front of the ciphertext. HKDF derives an auth token from your key or
                password, the server stores only its hash, and it hands over the ciphertext only to a browser that
                presents the token. Link previews in chat apps fetch without the fragment, so they can&apos;t open, or
                burn, a note. The <AppLink href="/security">security page</AppLink> has the details.
              </p>
            </>
          ),
        },
      ]}
      whenThem={[
        "You're sharing code or logs and want syntax highlighting, Markdown and a discussion thread.",
        "You need a paste to stay up for longer than 30 days, or indefinitely.",
        "You want a small PHP app to run on your own server.",
        "You'd rather pick from many independent instances, in different countries.",
      ]}
      faqs={faqs}
    />
  );
}
