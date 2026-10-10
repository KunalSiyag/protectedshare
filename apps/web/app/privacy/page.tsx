import type { ReactNode } from "react";
import { pageMetadata } from "../../lib/seo";
import { MetaDot, PageHeader, proseClassName } from "../../components/marketing";
import { cn } from "@protectedshare/ui";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "Exactly what ProtectedShare stores for each tool: ciphertext, verifiers, receipts and expiry times. Retention, hosting logs, analytics, browser storage and the contact form.",
  path: "/privacy",
});

const EMAIL = "admin@protectedshare.me";

/** Read at build time, so the page states what this deployment actually does. */
const GA_ENABLED = Boolean(process.env.NEXT_PUBLIC_GA_ID);

const SECTIONS = [
  { id: "short", label: "The short version" },
  { id: "server", label: "What the server stores" },
  { id: "receipts", label: "Receipts and manage tokens" },
  { id: "retention", label: "How long things last" },
  { id: "hosting", label: "Hosting and logs" },
  { id: "analytics", label: "Analytics and cookies" },
  { id: "browser", label: "What your browser keeps" },
  { id: "contact", label: "The contact form" },
  { id: "limits", label: "What we can and can't do" },
  { id: "changes", label: "Changes and questions" },
] as const;

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="border-t border-line pt-8 first:border-t-0 first:pt-0">
      <h2 className="!mt-0">{title}</h2>
      {children}
    </section>
  );
}

function StoreRow({ tool, keeps, never }: { tool: string; keeps: ReactNode[]; never: ReactNode[] }) {
  return (
    <div className="grid gap-3 py-5 sm:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] sm:gap-6">
      <h3 className="!mt-0 text-[15px] font-semibold leading-[22px] text-ink">{tool}</h3>
      <div>
        <p className="!mt-0 text-meta font-medium uppercase tracking-[0.06em] text-ink-3">Server keeps</p>
        <ul className="!mt-2 !list-none !pl-0 text-small">
          {keeps.map((item, index) => (
            <li key={index} className="!mt-1.5 !pl-0">
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="!mt-0 text-meta font-medium uppercase tracking-[0.06em] text-ink-3">Never sent</p>
        <ul className="!mt-2 !list-none !pl-0 text-small">
          {never.map((item, index) => (
            <li key={index} className="!mt-1.5 !pl-0">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Retention({ rows }: { rows: { what: string; how: ReactNode }[] }) {
  return (
    <dl className="mt-4 divide-y divide-line border-y border-line">
      {rows.map((row) => (
        <div key={row.what} className="grid gap-1 py-3 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6">
          <dt className="text-small font-medium text-ink">{row.what}</dt>
          <dd className="text-small text-ink-2">{row.how}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function PrivacyPage() {
  return (
    <main className="w-full">
      <PageHeader
        eyebrow="Legal"
        title="Privacy"
        lead="Your browser encrypts what you share. Our server keeps ciphertext and the few facts it needs to enforce limits. This page lists every one of them."
        meta={
          <>
            <span>Last updated October 10, 2026</span>
            <MetaDot />
            <span>Applies to protectedshare.me</span>
          </>
        }
      />

      <div className="mt-12 grid gap-10 lg:grid-cols-[200px_minmax(0,680px)] lg:gap-16">
        <nav aria-label="On this page" className="hidden lg:block">
          <div className="sticky top-[84px]">
            <p className="eyebrow !text-[11px]">On this page</p>
            <ul className="mt-3 flex flex-col gap-2 border-l border-line">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px block border-l border-transparent pl-3 text-small text-ink-3 transition-colors duration-150 hover:border-ink-3 hover:text-ink"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <article className={cn(proseClassName, "flex flex-col gap-10")}>
          <Section id="short" title="The short version">
            <ul>
              <li>
                Notes, secrets, files, requests, chat messages and synced notepads are encrypted in your browser before
                upload. The server stores ciphertext. It never receives your plaintext, your key, or your password.
              </li>
              <li>
                Alongside the ciphertext it keeps what it needs to do its job: a hash it can check before handing the
                ciphertext out, the expiry time, read or download counts, and file sizes.
              </li>
              <li>No accounts, no email sign-up, no ads. The app itself sets no cookies.</li>
              <li>
                Our hosts see IP addresses and request details, like any website: the web app&apos;s host, which also
                relays every API call, and Cloudflare, which runs the API. The contact form stores what you type into it.
              </li>
            </ul>
          </Section>

          <Section id="server" title="What the server stores">
            <p>
              Keys travel in the part of the link after <code>#</code>, which browsers do not send to servers. When you
              choose a password instead, you send it to the other person yourself. Either way, the server only ever gets a
              hash derived from it.
            </p>
            <div className="mt-4 divide-y divide-line border-y border-line">
              <StoreRow
                tool="Secure notes and EnvShare"
                keeps={[
                  "Ciphertext, IV, salt and format version",
                  "Auth hash: SHA-256 of a token derived from your key or password",
                  "Expiry time, burn-after-read flag or reads remaining",
                ]}
                never={["The text", "The key in the link", "The password"]}
              />
              <StoreRow
                tool="File drop"
                keeps={[
                  "Encrypted file chunks and an encrypted manifest",
                  "Total encrypted size, chunk count, downloads remaining, expiry",
                  "Auth hash and a hash of the one-time upload token",
                  "For each download in progress: a hash of its session token and when it expires (60 minutes)",
                ]}
                never={["File names, types and sizes (they're inside the encrypted manifest)", "File contents", "The key"]}
              />
              <StoreRow
                tool="Secret request"
                keeps={[
                  "Your public key",
                  "The request label, encrypted with a key that lives in the sender's link. It always carries a fingerprint of your public key, so the sender can check the key wasn't swapped",
                  "The sender's encrypted reply, until you collect it",
                  "A hash of the respond token (derived from the sender link's key), a hash of your inbox token, and expiry",
                ]}
                never={["Your private key (it lives only in your inbox link)", "The label key in the sender's link", "The secret you receive"]}
              />
              <StoreRow
                tool="Chat"
                keeps={[
                  "Encrypted messages with timestamps and optional disappearing timers",
                  "A room auth hash and the room's default timer",
                  "A hash of each message's delete token, so only its sender can delete it",
                  "Presence: a random per-tab id, a typing flag and when it was last seen",
                ]}
                never={["Message text, images or files", "The room key or password", "Your display name (it travels inside the encrypted message)"]}
              />
              <StoreRow
                tool="Notepad (synced)"
                keeps={[
                  "Your encrypted vault and an encrypted verifier",
                  "SHA-256 of your username",
                  "A password proof (PBKDF2 then SHA-256) and the last-saved time",
                ]}
                never={["Your notes", "Your password", "Your username in readable form"]}
              />
            </div>
            <p>
              The notepad in local mode, the password generator and the encrypt-text tool send nothing to the server.
              Older (v1) links use a password proof (PBKDF2 with a fixed salt, then SHA-256) instead
              of the auth hash; they still open, and the server still never sees their password.
            </p>
          </Section>

          <Section id="receipts" title="Receipts and manage tokens">
            <p>
              When you create a note, secret, file drop or request, your browser makes a random manage token and saves it
              in <a href="/links">My links</a> on this device. The server keeps only a hash of that token, plus a receipt:
            </p>
            <ul>
              <li>the kind and id of the share, and its status (active, opened, expired or revoked)</li>
              <li>how many times it was read or downloaded, and the limit (a file download counts when it starts)</li>
              <li>when it was created, when it expires, and when it was first and last opened</li>
            </ul>
            <p>
              Receipts never contain content, IP addresses or anything about who opened the link. Your browser sends the
              manage token only when you check a receipt or revoke a share, and anyone holding it can do both. Revoking
              deletes the ciphertext straight away.
            </p>
          </Section>

          <Section id="retention" title="How long things last">
            <p>
              Every read checks the expiry first, so an expired share can&apos;t be opened even before it&apos;s cleaned up.
              A scheduled job runs every 30 minutes and deletes expired rows.
            </p>
            <Retention
              rows={[
                {
                  what: "Notes and secrets",
                  how: "Deleted on the read that uses up the limit (burn after reading, or the last of 1–100 reads), or at expiry. Expiry is at most 30 days.",
                },
                {
                  what: "File drops",
                  how: "Deleted once the last allowed download finishes (or its 60-minute download session expires), or at expiry. Uploads that never finish are deleted after 6 hours.",
                },
                {
                  what: "Secret requests",
                  how: "Deleted when you collect the reply in your inbox, or at expiry.",
                },
                {
                  what: "Chat",
                  how: "Messages are deleted once nobody is left in the room (on the room's next request, or by the 30-minute job), when their disappearing timer runs out, or when someone burns the room. A presence entry is removed when you leave; otherwise it stops counting about 15 seconds after its last heartbeat and is deleted the same way. A room's auth record is forgotten after 7 idle days.",
                },
                {
                  what: "Receipts",
                  how: "Kept until 30 days after the share's expiry, so My links can still show what happened.",
                },
                {
                  what: "Synced notepads",
                  how: "Kept until you delete the vault. They don't expire on their own.",
                },
                {
                  what: "Contact messages",
                  how: "Kept until we delete them. Ask and we will.",
                },
              ]}
            />
            <p>
              Deleted means removed from our database. We don&apos;t control copies the recipient makes, and links you sent
              stay in whatever chat or inbox you sent them through.
            </p>
          </Section>

          <Section id="hosting" title="Hosting and logs">
            <p>
              The API runs on Cloudflare Workers with a Cloudflare D1 database. Like any host, Cloudflare sees IP
              addresses and request details such as the path, time, user agent and response status. Workers observability
              logs are enabled, so requests and errors are recorded in Cloudflare&apos;s logs for a limited period.
            </p>
            <p>
              Your browser doesn&apos;t call the API directly. Every API request goes to the host that serves the web
              app, which relays it to Cloudflare. So that host sees the same kind of request information, for page loads
              and API calls, along with the ciphertext passing through. We don&apos;t write IP addresses into our
              database. Request paths include share ids, never the key after the <code>#</code>.
            </p>
          </Section>

          <Section id="analytics" title="Analytics and cookies">
            <p>
              ProtectedShare&apos;s code sets no cookies. There are no ads and no ad scripts.
            </p>
            <p>
              Google Analytics loads only when the site is built with a measurement id.{" "}
              {GA_ENABLED ? (
                <strong>It is on for this site.</strong>
              ) : (
                <strong>It is off for this build of the site.</strong>
              )}{" "}
              When it&apos;s on, your browser loads a script from Google, Google sets its own analytics cookies, and Google
              receives page views along with your IP address and device details. It never loads on pages that open or
              hold a share (note, EnvShare and file links, requests and their inboxes, chat, My links and the notepad),
              and the page views it gets carry the page path only, never the query string or the part after{" "}
              <code>#</code>. It never receives share content or keys.
            </p>
          </Section>

          <Section id="browser" title="What your browser keeps">
            <p>
              Some things are saved in your browser&apos;s storage on this device. Most never reach us. The exceptions are
              tokens, which your browser sends only when you use them, as noted below.
            </p>
            <ul>
              <li>
                <strong>Theme.</strong> Light or dark, if you picked one.
              </li>
              <li>
                <strong>My links.</strong> The full links you created (including their keys), manage tokens, a short label
                and expiry. A manage token is sent to us only when you check that link&apos;s status or revoke it; the
                links and keys are never sent. Anyone using this browser profile can open them. Clear them on the My links
                page.
              </li>
              <li>
                <strong>Notepad, local mode.</strong> Your encrypted vault, with its key stored next to it. That protects it
                from the server, not from someone using your browser.
              </li>
              <li>
                <strong>Chat.</strong> Your display name and notification preferences. The current room key, a per-tab
                sender id and the tokens that let you delete your own messages are kept in session storage, which clears
                when the tab closes. A delete token is sent to us only when you delete that message.
              </li>
            </ul>
          </Section>

          <Section id="contact" title="The contact form">
            <p>
              The form stores your name, email, optional company and message so we can reply. If email forwarding is set
              up, a copy is sent to our inbox through an email provider. The form is not end-to-end encrypted, so
              don&apos;t paste secrets into it. To have a message deleted, email{" "}
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
            </p>
          </Section>

          <Section id="limits" title="What we can and can't do">
            <ul>
              <li>We can&apos;t read your shares, recover a lost key, or tell you what a link contains.</li>
              <li>
                We can see the metadata listed above (counts, sizes, timestamps) and delete a share by its id, for example
                after a valid abuse report.
              </li>
              <li>
                If we receive a valid legal demand, the most we hold is what this page lists: ciphertext and that
                metadata.
              </li>
              <li>
                Self-hosted copies are run by whoever hosts them. This page covers protectedshare.me only.
              </li>
            </ul>
          </Section>

          <Section id="changes" title="Changes and questions">
            <p>
              When the code changes what we store, this page changes with it and the date at the top moves. The source is
              public on <a href="https://github.com/KunalSiyag/protectedshare">GitHub</a> if you want to check any of
              this. Questions: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
            </p>
          </Section>
        </article>
      </div>
    </main>
  );
}
