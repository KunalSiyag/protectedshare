import type { Metadata } from "next";
import AppLink from "../../../components/app-link";
import ComparisonPage, { PS, TOOLS, type ComparisonRow, type Faq } from "../comparison";
import { comparisonMetadata } from "../meta";

export const metadata: Metadata = comparisonMetadata({
  title: "Firefox Send Alternative, Encrypted",
  description:
    "Firefox Send shut down in 2020. ProtectedShare's file drop encrypts files in your browser with a download limit, as Send did, but only up to 25 MB.",
  path: "/vs/firefox-send",
  keywords: [
    "Firefox Send alternative",
    "firefox send replacement",
    "firefox send",
    "encrypted file sharing",
    "send files securely",
    "self-destructing file link",
  ],
});

const rows: ComparisonRow[] = [
  {
    feature: "Available today",
    them: { status: "no", note: "Shut down by Mozilla in 2020" },
    us: { status: "yes", note: "protectedshare.me, or self-host" },
  },
  {
    feature: "Encrypts files in your browser",
    them: { status: "yes", note: "AES-GCM via Web Crypto" },
    us: { status: "yes", note: "AES-256-GCM, in 1 MiB chunks" },
  },
  { feature: "Key kept in the link after #", them: { status: "yes" }, us: { status: "yes" } },
  {
    feature: "Files of 1 GB and more",
    them: { status: "yes", note: "1 GB, or 2.5 GB with a free Firefox Account" },
    us: { status: "no", note: "25 MB per drop" },
  },
  {
    feature: "Download limit",
    them: { status: "yes", note: "Set by the sender; up to 100 in Mozilla's code" },
    us: { status: "yes", note: "1 to 100 downloads" },
  },
  {
    feature: "Expires after a set time",
    them: { status: "yes", note: "5 minutes to 7 days in Mozilla's code" },
    us: PS.expiry,
  },
  {
    feature: "Optional password",
    them: { status: "yes", note: "Checked before download" },
    us: { status: "no", note: "File links carry the key; notes can use a password" },
  },
  {
    feature: "Works without an account",
    them: { status: "yes", note: "Up to 1 GB; recipients never needed one" },
    us: PS.noAccount,
  },
  { feature: "Open source", them: { status: "yes", note: "MPL 2.0; archived in 2021" }, us: PS.openSource },
  {
    feature: "Self-hostable",
    them: { status: "partial", note: "Mozilla's code is archived; a community fork is maintained" },
    us: PS.selfHost,
  },
];

const faqs: Faq[] = [
  {
    q: "Is Firefox Send still available?",
    a: "No. Mozilla took Firefox Send offline in the summer of 2020 and announced on September 17, 2020 that it would not return, citing people using it to ship malware and run spear phishing attacks. Its source code is archived on GitHub.",
  },
  {
    q: "What was Firefox Send's file size limit?",
    a: "1 GB without an account, and 2.5 GB with a free Firefox Account, according to Mozilla's launch announcement. Mozilla's FAQ added that very large files could strain your computer, since encryption ran in the browser.",
  },
  {
    q: "What can I use instead of Firefox Send?",
    a: "For files up to 25 MB, ProtectedShare's file drop works the way Send did: encrypted in your browser, the key in the link, a download limit and an expiry. For bigger files, a community fork of Send can be self-hosted, Bitwarden Send takes up to 500 MB on paid plans, and WeTransfer handles multi-gigabyte transfers with encryption in transit and at rest.",
  },
  {
    q: "Was Firefox Send end-to-end encrypted?",
    a: "Yes. Mozilla described Send as end-to-end encrypted, and its documentation explains that files were encrypted in the browser with AES-GCM through the Web Crypto API, with the key appended to the link as a fragment. ProtectedShare's file drop encrypts with AES-256-GCM in the browser the same way.",
  },
  {
    q: "Can I self-host Firefox Send?",
    a: "Mozilla's code is available under the Mozilla Public License 2.0, but the repository is archived and Mozilla asks that copies drop its branding. A community fork, timvisee/send, is maintained for self-hosting. ProtectedShare is MIT licensed and can be self-hosted on Cloudflare Workers.",
  },
];

const externalLink = { rel: "nofollow noopener" } as const;

export default function FirefoxSendComparisonPage() {
  return (
    <ComparisonPage
      slug="firefox-send"
      competitor="Firefox Send"
      competitorLabel="Firefox Send (closed 2020)"
      title="ProtectedShare vs Firefox Send"
      lead="Mozilla shut Firefox Send down in 2020. It encrypted files in your browser, put the key in the link, and deleted them after a set number of downloads or time. ProtectedShare's file drop works the same way, but only for files up to 25 MB, far below Send's 1 GB and 2.5 GB limits."
      actions={[
        { href: "/files", label: "Send a file" },
        { href: "/notes", label: "Create a secure note" },
      ]}
      rows={rows}
      sourcesNote={
        <>
          The Firefox Send column describes the service as Mozilla documented it before it closed. Numbers marked
          &ldquo;in Mozilla&apos;s code&rdquo; are the defaults in its archived source. Checked October 2026.
        </>
      }
      sources={[
        {
          label: "Mozilla's launch post (March 2019)",
          href: "https://blog.mozilla.org/blog/2019/03/12/introducing-firefox-send-providing-free-file-transfers-while-keeping-your-personal-information-private/",
        },
        {
          label: "Mozilla's shutdown update (September 2020)",
          href: "https://blog.mozilla.org/blog/2020/09/17/update-on-firefox-send-and-firefox-notes/",
        },
        { label: "mozilla/send on GitHub", href: "https://github.com/mozilla/send" },
        { label: "Send FAQ", href: "https://github.com/mozilla/send/blob/master/docs/faq.md" },
        { label: "Send encryption docs", href: "https://github.com/mozilla/send/blob/master/docs/encryption.md" },
        { label: "Send server defaults", href: "https://github.com/mozilla/send/blob/master/server/config.js" },
        { label: "timvisee/send", href: "https://github.com/timvisee/send" },
      ]}
      differences={[
        {
          title: "What Send was",
          body: (
            <>
              <p>
                Mozilla introduced Firefox Send as a free service in March 2019. You could share files up to 1 GB without
                an account, or up to 2.5 GB after signing up for a free Firefox Account. Files were encrypted in the
                browser, the sender chose when the link expired and how many downloads it allowed, an optional password
                added a check before download, and recipients didn&apos;t need an account. Mozilla also announced an
                Android app in beta.
              </p>
              <p>
                Mozilla&apos;s own FAQ warned that very large files could strain the browser, because encryption ran
                locally, and suggested staying under a few hundred megabytes for the most reliable results.
              </p>
            </>
          ),
        },
        {
          title: "Why it closed",
          body: (
            <p>
              In the summer of 2020, Mozilla took Send offline after some users began using it to ship malware and run
              spear phishing attacks. In September 2020 it announced that Send would not come back. The source code is
              still on GitHub under the Mozilla Public License 2.0, archived since May 2021, and Mozilla asks anyone
              running a copy to remove its branding.
            </p>
          ),
        },
        {
          title: "Where ProtectedShare's file drop fits",
          body: (
            <>
              <p>
                The <AppLink href="/files">file drop</AppLink> follows the same model. Your browser encrypts the files with
                AES-256-GCM, in 1 MiB chunks bound to their position, and the key stays in the link after{" "}
                <code>#k=</code>. File names and types are encrypted too. You choose 1 to 100 downloads and an expiry of
                up to 30 days, and the drop is deleted after the last download or at expiry. Nobody needs an account.
              </p>
              <p>
                The difference is size. A drop holds 25 MB: enough for contracts, scans, keys and config files, not for
                video, disk images or large archives. And unlike Send, a drop has no password option. The link is the
                key, so send it through a channel you trust, or put a password on a{" "}
                <AppLink href="/notes">secure note</AppLink> instead.
              </p>
            </>
          ),
        },
      ]}
      whenThemTitle="For files over 25 MB"
      whenThem={[
        <>
          A community fork of Send,{" "}
          <a href="https://github.com/timvisee/send" {...externalLink}>
            timvisee/send
          </a>
          , keeps Mozilla&apos;s code up to date with the Mozilla branding removed, so you can self-host it. Its README
          links to a list of public instances.
        </>,
        <>
          <AppLink href="/vs/bitwarden-send">Bitwarden Send</AppLink> encrypts files up to 500 MB end to end, on a paid
          Bitwarden plan.
        </>,
        <>
          <AppLink href="/vs/wetransfer">WeTransfer</AppLink> handles multi-gigabyte transfers. Its help center
          describes encryption in transit and at rest, rather than in your browser.
        </>,
      ]}
      tools={[TOOLS.files, TOOLS.notes, TOOLS.secrets, TOOLS.request]}
      faqs={faqs}
    />
  );
}
