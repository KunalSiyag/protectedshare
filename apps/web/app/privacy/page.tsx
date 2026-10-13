import type { ReactNode } from "react";
import { pageMetadata } from "../../lib/seo";
import { MetaDot, PageHeader, proseClassName } from "../../components/marketing";
import { cn } from "@protectedshare/ui";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "What ProtectedShare stores for each tool, how long it's kept, and what our hosts, analytics and push services can see. Never your plaintext.",
  path: "/privacy",
});

const EMAIL = "admin@protectedshare.me";

/** Read at build time, so the page states what this deployment actually does. */
const GA_ENABLED = Boolean(process.env.NEXT_PUBLIC_GA_ID);
const CF_ANALYTICS_ENABLED = Boolean(process.env.NEXT_PUBLIC_CF_BEACON_TOKEN);

const SECTIONS = [
  { id: "short", label: "The short version" },
  { id: "server", label: "What the server stores" },
  { id: "receipts", label: "Receipts and manage tokens" },
  { id: "notifications", label: "Read notifications" },
  { id: "reports", label: "Abuse reports" },
  { id: "rate-limits", label: "Rate limits and counts" },
  { id: "mcp", label: "Claude and MCP clients" },
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
            <span>Last updated October 13, 2026</span>
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
              <li>
                A few extras keep a little more, and only when they&apos;re used: a push address if you ask to be told
                when a link is opened, what you write in an abuse report, a 10-minute lock on a link after too many wrong
                passwords, and a daily count of links created.
              </li>
              <li>No accounts, no email sign-up, no ads. The app itself sets no cookies.</li>
              <li>
                Our hosts see IP addresses and request details, like any website: the web app&apos;s host, which also
                relays the website&apos;s API calls, and Cloudflare, which runs the API. The contact form stores what you
                type into it.
              </li>
              <li>
                One exception to encrypting on your device: the remote Claude connector encrypts what you give it on our
                server, in memory, and stores and logs none of it. The website and the local MCP server encrypt on your
                device.
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
                  "Encrypted file chunks (in Cloudflare R2 storage) and an encrypted manifest",
                  "Total encrypted size, each chunk's size, chunk count, downloads remaining, expiry",
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
                  "While it's open: a random per-tab id and when it last checked in, to show how many other tabs or devices have it open",
                ]}
                never={["Your notes", "Your password", "Your username in readable form"]}
              />
            </div>
            <p>
              The notepad in local mode and the <a href="/tools">free tools</a> send nothing to our server. One tool
              sends something to someone else: the breached-password checker hashes the password with SHA-1 in your
              browser and sends only the first 5 of the hash&apos;s 40 characters to Have I Been Pwned
              (<code>api.pwnedpasswords.com</code>), with no cookies or referrer, and asks for a padded reply so its size
              doesn&apos;t give away which 5 were sent. The password and the rest of the hash stay in the tab. That
              page&apos;s security policy allows connections to that one extra host; every other tool makes no request
              at all.
            </p>
            <p>
              Older (v1) links use a password proof (PBKDF2 with a fixed salt, then SHA-256) instead of the auth hash;
              they still open, and the server still never sees their password.
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
              manage token only when you check a receipt, revoke a share, or switch read notifications on or off for it,
              and anyone holding it can do all of those. Revoking deletes the ciphertext straight away.
            </p>
          </Section>

          <Section id="notifications" title="Read notifications">
            <p>
              In <a href="/links">My links</a> you can ask to be told when a link is opened. Your browser sends us the
              link&apos;s manage token, to show the link is yours, and a push subscription. We then notify you when the
              link is first opened (for a secret request, when it&apos;s answered) and when a read or download uses it
              up. For each browser that asks, up to 5 per link, the server keeps:
            </p>
            <ul>
              <li>
                the push address your browser&apos;s push service (Google, Mozilla, Apple or Microsoft, depending on the
                browser) gave it
              </li>
              <li>the subscription&apos;s public key and auth secret, which encrypt each message for that browser alone</li>
              <li>the link&apos;s kind and id, and when you turned notifications on</li>
            </ul>
            <p>
              No content, no key, no IP address and no account. Each notification goes from our server to that push
              service, which delivers it to your browser. The message is encrypted so only your browser can read it: the
              link&apos;s kind and id, what happened and when, padded to a fixed size. The push service also gets how long
              to hold it if your device is offline (up to one day) and a signed token that identifies our server. So it
              learns that a message was sent to your browser, and when, but not what it says. The label you see in the
              notification comes from this browser, not from us.
            </p>
            <p>
              A subscription is deleted right after the notification for the last read or download, when the link is
              revoked or taken down, when the push service tells us the subscription no longer exists, or by the cleanup
              job once the link expires. Switching notifications off in My links deletes it for every browser watching
              that link.
            </p>
          </Section>

          <Section id="reports" title="Abuse reports">
            <p>
              Pages that open a note, EnvShare secret, file drop or request have a Report abuse link. A report stores:
            </p>
            <ul>
              <li>the kind and id of the link, which the form takes from the page, never from the address bar</li>
              <li>the reason you choose (phishing, malware, illegal content, spam or something else)</li>
              <li>details, if you write any (up to 500 characters), and an email address, if you give one</li>
              <li>when it was sent</li>
            </ul>
            <p>
              A report can&apos;t carry a link&apos;s key: the form won&apos;t send text that contains one (
              <code>#k=…</code> or <code>#p=…</code>), and the server refuses it too. Your IP address isn&apos;t stored
              with it. Reports are deleted after 180 days. If email forwarding is set up, each report is also emailed to
              our inbox through Resend, an email delivery service, so Resend handles that email: the link&apos;s kind and
              id, the reason, your details and your email address.
            </p>
            <p>
              We can&apos;t read the reported content either, so we go on what the report says. When we take a link
              down, its ciphertext and any file chunks are deleted, its receipt is marked revoked so the sender&apos;s My
              links shows it, and any notifications for it end.
            </p>
          </Section>

          <Section id="rate-limits" title="Rate limits, locks and usage counts">
            <p>
              To slow floods and password guessing, the API counts requests with Cloudflare&apos;s rate limiter. Most
              counts are per link, room or request: wrong keys or passwords, people joining and posting in a chat room,
              answers sent to a request, reports about a link. Creating a note, secret, file drop, request or notepad,
              sending a report and sending a contact message are also counted per IP address (an IPv6 address counts by
              its /64 block). For requests the website relays, that is usually our web host&apos;s address, shared by
              many visitors, rather than yours. That address is used only for this one-minute count inside Cloudflare.
              We don&apos;t write it to our database.
            </p>
            <p>
              After more than 10 wrong keys or passwords in a minute, a note or EnvShare secret that has a password
              (older v1 links included), a chat room or a synced notepad is locked for 10 minutes. While it&apos;s locked,
              even the right password is refused. The lock is stored as the item&apos;s kind and id (for a
              notepad, the hash of its username) and the time it ends, and nothing about who tried. The cleanup job
              deletes it once it has run out.
            </p>
            <p>
              Each time a link is created, the server adds one to a counter for that day and kind (notes, EnvShare
              secrets, file drops, requests, chat rooms). The counters hold no ids, no content and nothing about who
              created what, and they&apos;re deleted after 400 days. The last 30 days&apos; totals are public through
              the API, and the homepage shows the overall number once it reaches 250.
            </p>
          </Section>

          <Section id="mcp" title="Claude and other MCP clients">
            <p>
              ProtectedShare&apos;s tools also work from Claude and other MCP clients, through a remote connector or a
              local server (<a href="/integrations/claude">setup</a>). Both create the same links as the website, and our
              storage keeps exactly what it keeps for the website, as listed above. There&apos;s no account, sign-in or
              cookie.
            </p>
            <ul>
              <li>
                <strong>Remote connector</strong> (<code>mcp.protectedshare.me/mcp</code>). The text you hand a tool
                travels over TLS to our MCP server, a Cloudflare Worker, and sits in its memory only while it&apos;s
                encrypted. Remote links use a key only, never a password. To create a link, the Worker passes our storage
                only ciphertext and hashes, Worker to Worker. To check or revoke one, it sends the link&apos;s kind and id
                with the manage token itself, not a hash of it, just as My links does. It stores nothing and never logs
                tool arguments, results or request bodies; Cloudflare&apos;s logs hold each request&apos;s method, path,
                status and timing. Cloudflare&apos;s rate limiter counts requests per connecting IP address (an IPv6
                address by its /64 block): 600 a minute in all, and 120 calls a minute to the tools that create links. The
                address isn&apos;t stored. Each request carries one message; batches are refused. Our web host isn&apos;t
                in this path.
              </li>
              <li>
                <strong>Local server</strong> (<code>npx protectedshare-mcp</code>). It encrypts and decrypts on your
                computer and sends our API what the website sends: ciphertext and hashes to create a link, the link&apos;s
                id and a derived token to open one, and the link&apos;s kind, id and manage token to check or revoke it.
                Never the text, a link key, a password or a private key. Like any API call, it reaches our web host and
                Cloudflare with your IP address and a <code>protectedshare-mcp/&lt;version&gt;</code> user agent. It writes
                nothing to disk. Its breach check sends only the first 5 characters of a SHA-1 hash to Have I Been Pwned,
                from your computer.
              </li>
            </ul>
            <p>
              Link keys, request key pairs and manage tokens are made where the tool runs and returned in the tool&apos;s
              result. Nothing else keeps them, so these links don&apos;t appear in My links. That result is part of your
              conversation, so your MCP client and its AI provider (Anthropic, for Claude) see the links with their keys,
              along with whatever you asked it to share and any text the local server opens. Their own terms cover that
              conversation.
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
                  how: "Deleted, chunks in R2 included, once the last allowed download finishes (or its 60-minute download session expires), when revoked or taken down, or at expiry. Uploads that never finish are deleted after 6 hours. The cleanup job also removes any stored chunk whose drop is gone.",
                },
                {
                  what: "Download sessions",
                  how: "Deleted when the download finishes, or 60 minutes after it started (sooner if the drop expires first).",
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
                  what: "Read notifications",
                  how: "Deleted after the notification for the last read or download, on revoke or takedown, when the push service says the subscription is gone, or once the link expires.",
                },
                {
                  what: "Locks",
                  how: "Deleted once the 10-minute lock has run out.",
                },
                {
                  what: "Abuse reports",
                  how: "Deleted 180 days after they're sent.",
                },
                {
                  what: "Usage counts",
                  how: "Deleted after 400 days.",
                },
                {
                  what: "Synced notepads",
                  how: "Kept until you delete the vault. They don't expire on their own. An open tab's check-in is deleted on the next check-in by anyone once it's 30 seconds old.",
                },
                {
                  what: "Contact messages",
                  how: "Kept until we delete them. Ask and we will.",
                },
              ]}
            />
            <p>
              Deleted means removed from our database and file storage. We don&apos;t control copies the recipient makes,
              and links you sent stay in whatever chat or inbox you sent them through.
            </p>
          </Section>

          <Section id="hosting" title="Hosting and logs">
            <p>
              The API runs on Cloudflare Workers with a Cloudflare D1 database, and encrypted file-drop chunks are kept
              in Cloudflare R2 storage. The remote MCP connector is a separate Cloudflare Worker at{" "}
              <code>mcp.protectedshare.me</code>, reached directly rather than through our web host. Like any host,
              Cloudflare sees IP addresses and request details such as the path, time, user agent and response status.
              Workers observability logs are enabled, so requests and errors are recorded in Cloudflare&apos;s logs for a
              limited period.
            </p>
            <p>
              Your browser doesn&apos;t call the API directly. Every API request goes to the host that serves the web
              app, which relays it to Cloudflare. So that host sees the same kind of request information, for page loads
              and API calls, along with the ciphertext passing through. We don&apos;t write IP addresses into our
              database. Request paths include share ids, never the key after the <code>#</code>.
            </p>
            <p>
              A few features involve one more service: Resend delivers contact-form messages and abuse reports to our
              inbox, your browser&apos;s push service delivers read notifications, and the breached-password checker asks
              Have I Been Pwned directly from your browser. Analytics, if it&apos;s on, is covered next.
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
              hold a share (note, EnvShare and file links, requests and their inboxes, chat, My links, the notepad, and
              anything shared to the installed app), and if it loaded earlier in your visit it&apos;s switched off while
              one of them is open. The page views it gets carry the page path only, never the query string or the part
              after <code>#</code>. It never receives share content or keys.
            </p>
            <p>
              Cloudflare Web Analytics loads only when the site is built with a Cloudflare beacon token.{" "}
              {CF_ANALYTICS_ENABLED ? (
                <strong>It is on for this site.</strong>
              ) : (
                <strong>It is off for this build of the site.</strong>
              )}{" "}
              When it&apos;s on, your browser loads Cloudflare&apos;s beacon script, which sets no cookies and uses no
              browser storage. On each full page load it sends Cloudflare the page&apos;s address and the page you came
              from, both without the query string or the part after <code>#</code>, along with page-load timings and your
              browser&apos;s name and version. Like any request, it reaches Cloudflare with your IP address. It
              doesn&apos;t count moves between pages inside the app, and it follows the same rule as Google Analytics on
              the pages listed above, so it never receives share content or keys either.
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
                and expiry. A manage token is sent to us only when you check that link&apos;s status, revoke it, or switch
                its notifications on or off; the links and keys are never sent. Anyone using this browser profile can open
                them. Clear them on the My links page.
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
              <li>
                <strong>Read notifications.</strong> If you turn them on: a service worker (a small script your browser
                runs in the background, limited to addresses under <code>/share-target/</code>, which never stores a copy
                of the app&apos;s code), and, in IndexedDB (<code>ps-notify</code>), each watched link&apos;s kind, id,
                label and expiry, so a notification can show your label. Never the link, its key or its manage token. The
                site registers the service worker only when you turn notifications on, or when you use the installed
                app.
              </li>
              <li>
                <strong>Sharing to the installed app.</strong> If you share text or files to ProtectedShare from another
                app, the service worker keeps them in IndexedDB (<code>ps-share-inbox</code>) on this device. The page
                shows you what arrived and does nothing with it until you choose to continue: text is cleared as soon as
                the page reads it, files once File drop takes them or you discard them. If they sit there for more than 15
                minutes, the page discards them unread the next time it looks. The installed app sets the worker up when you first open it; if you share
                before that, the share goes to our web host, which answers without reading or logging it, and the page
                tells you so.
              </li>
            </ul>
          </Section>

          <Section id="contact" title="The contact form">
            <p>
              The form stores your name, email, optional company and message so we can reply. If email forwarding is set
              up, a copy is sent to our inbox through Resend, an email delivery service. The form is not end-to-end
              encrypted, so
              don&apos;t paste secrets into it. To have a message deleted, email{" "}
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
            </p>
          </Section>

          <Section id="limits" title="What we can and can't do">
            <ul>
              <li>We can&apos;t read your shares, recover a lost key, or tell you what a link contains.</li>
              <li>Receipts and notifications record that a link was opened, and when, not who opened it.</li>
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
