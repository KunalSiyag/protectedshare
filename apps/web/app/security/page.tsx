import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Check, Eye, EyeOff, Minus } from "lucide-react";
import { cn } from "@protectedshare/ui";
import AppLink from "../../components/app-link";
import JsonLd from "../../components/json-ld";
import { breadcrumbJsonLd, pageMetadata } from "../../lib/seo";
import Toc, { type TocItem } from "./toc";

export const metadata: Metadata = pageMetadata({
  title: "Security model",
  description:
    "What ProtectedShare encrypts, what our server sees, and what it can't protect you from: AES-256-GCM, HKDF, PBKDF2 600k, ECDH P-256 and the threat model.",
  path: "/security",
  keywords: ["protectedshare security", "zero-knowledge encryption", "AES-256-GCM", "URL fragment key", "threat model"],
});

const GITHUB_URL = "https://github.com/KunalSiyag/protectedshare";
const CRYPTO_SOURCE = `${GITHUB_URL}/blob/main/packages/crypto/src/v2.ts`;
const LINK = "font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink";

const TOC: TocItem[] = [
  { id: "summary", label: "The short version" },
  { id: "keys", label: "Keys and passwords" },
  { id: "encryption", label: "Encryption" },
  { id: "auth", label: "Proving you hold the key" },
  { id: "fragment", label: "The link fragment" },
  { id: "files", label: "File drops" },
  { id: "requests", label: "Secret requests" },
  { id: "chat", label: "Chat rooms" },
  { id: "notepad", label: "Notepad and free tools" },
  { id: "legacy", label: "Older links (v1)" },
  { id: "rate-limits", label: "Rate limits and locks" },
  { id: "notifications", label: "Read notifications" },
  { id: "share-target", label: "Sharing into the app" },
  { id: "reports", label: "Abuse reports" },
  { id: "mcp", label: "Claude connector" },
  { id: "threat-model", label: "Threat model" },
  { id: "retention", label: "Retention" },
  { id: "infrastructure", label: "Hosting and logs" },
  { id: "headers", label: "Browser protections" },
  { id: "disclosure", label: "Report a vulnerability" },
];

/* ───────── small document primitives ───────── */

function C({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-[5px] border border-line bg-surface-2/70 px-1 py-px font-mono text-[0.86em] text-ink [overflow-wrap:anywhere] [td:first-child_&]:whitespace-nowrap">
      {children}
    </code>
  );
}

function Section({ id, title, kicker, children }: { id: string; title: string; kicker?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-line pt-10 first:border-t-0 first:pt-0">
      {kicker ? <p className="eyebrow mb-2">{kicker}</p> : null}
      <h2 id={`${id}-h`} className="text-h2 text-ink">
        {title}
      </h2>
      <div className="mt-4 flex flex-col gap-4 text-prose text-ink-2">{children}</div>
    </section>
  );
}

function Spec({ rows }: { rows: [ReactNode, ReactNode][] }) {
  return (
    <dl className="overflow-hidden rounded-panel border border-line bg-surface">
      {rows.map(([term, value], index) => (
        <div
          key={index}
          className="grid gap-1 border-b border-line px-4 py-3 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-5"
        >
          <dt className="text-small font-medium text-ink">{term}</dt>
          <dd className="min-w-0 text-small leading-[20px] text-ink-2">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Table({ head, rows, className }: { head: string[]; rows: ReactNode[][]; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-panel border border-line bg-surface", className)}>
      <table className="w-full min-w-[560px] border-collapse text-left text-small">
        <thead>
          <tr className="border-b border-line bg-surface-2/50">
            {head.map((cell) => (
              <th key={cell} scope="col" className="whitespace-nowrap px-4 py-2.5 text-meta font-medium text-ink-3">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-line align-top last:border-b-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={cn("px-4 py-3 leading-[20px]", cellIndex === 0 ? "font-medium text-ink" : "text-ink-2")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Formula({ children }: { children: ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-panel border border-line bg-surface-2/50 px-4 py-3.5 font-mono text-[12.5px] leading-[21px] text-ink">
      {children}
    </pre>
  );
}

function CheckList({ tone, items }: { tone: "yes" | "no"; items: ReactNode[] }) {
  return (
    <ul className="flex flex-col divide-y divide-line">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3 py-3 text-ui text-ink-2">
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
              tone === "yes" ? "bg-ok-soft text-ok" : "bg-surface-2 text-ink-3"
            )}
          >
            {tone === "yes" ? <Check className="size-3" strokeWidth={2.5} /> : <Minus className="size-3" strokeWidth={2.5} />}
          </span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ───────── page ───────── */

export default function SecurityPage() {
  return (
    <main className="w-full">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Security model", path: "/security" }])} />

      <header className="max-w-[760px]">
        <p className="eyebrow">Security model</p>
        <h1 className="mt-3 text-[34px] font-semibold leading-[40px] tracking-[-0.035em] text-ink sm:text-h1">
          What we can see, what we can&apos;t, and why.
        </h1>
        <p className="mt-4 text-lead text-ink-2">
          Plain language first, then the exact construction, matching{" "}
          <a href={CRYPTO_SOURCE} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            packages/crypto/src/v2.ts
          </a>
          . If this page and the code ever disagree, the code is right and this page is a bug.
        </p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
        <aside className="hidden lg:block">
          <div className="sticky top-[96px]">
            <Toc items={TOC} />
          </div>
        </aside>

        <div className="flex min-w-0 max-w-[760px] flex-col gap-14">
          <Section id="summary" title="The short version">
            <div className="grid gap-px overflow-hidden rounded-panel border border-line bg-line md:grid-cols-2">
              <div className="bg-surface p-5">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                  <Eye aria-hidden="true" className="size-4 text-ink-3" strokeWidth={1.75} />
                  What our server can see
                </h3>
                <ul className="mt-3 flex flex-col gap-2 text-small leading-[20px] text-ink-2">
                  <li>Ciphertext, and how big it is.</li>
                  <li>A hash it uses to check that a reader holds the key.</li>
                  <li>Expiry, read limits, and when a link was read.</li>
                  <li>IP addresses and request times, through Cloudflare and the web app&apos;s host.</li>
                  <li>For chat: when messages arrive, and how many people are in a room.</li>
                  <li>If you ask to be notified when a link opens: your browser&apos;s push address.</li>
                  <li>If you use the remote Claude connector: the text you share, in memory while it&apos;s encrypted.</li>
                </ul>
              </div>
              <div className="bg-surface p-5">
                <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                  <EyeOff aria-hidden="true" className="size-4 text-ink-3" strokeWidth={1.75} />
                  What it can&apos;t see
                </h3>
                <ul className="mt-3 flex flex-col gap-2 text-small leading-[20px] text-ink-2">
                  <li>Your text, files, file names, chat messages or replies to requests.</li>
                  <li>The key. It lives after the # in the link, which browsers don&apos;t send.</li>
                  <li>Your password, if you use one. It&apos;s stretched in your browser.</li>
                  <li>Request labels and nicknames, which are encrypted too.</li>
                  <li>Which device a link was opened on, beyond what an IP address says.</li>
                </ul>
              </div>
            </div>
            <p>
              The catch, stated up front: this is a web app, so you trust the JavaScript we serve each time you load it.
              If our server were compromised and sent you modified code, that code could read what you type. The code is
              open source, and you can{" "}
              <AppLink href="/self-host" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                run your own copy
              </AppLink>{" "}
              if that trust is the problem.
            </p>
          </Section>

          <Section id="keys" title="Keys and passwords" kicker="Specification">
            <p>
              Every share is sealed with a key derived from <em>input keying material</em> (ikm) and a fresh 16-byte random
              salt. Where the ikm comes from depends on the mode:
            </p>
            <Table
              head={["Mode", "ikm", "Used by"]}
              rows={[
                [<C key="k">key</C>, "32 random bytes from crypto.getRandomValues, carried in the link as #k= (43 base64url characters)", "Notes (default), EnvShare, file drops"],
                [<C key="p">password</C>, "PBKDF2-SHA256(password, salt, 600,000 iterations), 32 bytes", "Notes with a separate password, Encrypt text"],
                [<C key="kp">key+password</C>, "key bytes ‖ PBKDF2 bytes (64 bytes)", "Notes that need the link and a password"],
              ]}
            />
            <p>
              A key-mode link is the whole secret: 256 bits of randomness, nothing to guess. Password mode is only as
              strong as the password. Someone with a copy of the database could test guesses against the stored hash at
              their own pace. Against the server itself, guessing is slowed: past 10 wrong attempts in a minute, a
              password or key+password note is locked for 10 minutes, and while it&apos;s locked even the right password
              is refused (see{" "}
              <a href="#rate-limits" className={LINK}>
                rate limits
              </a>
              ).
              Each guess also costs 600,000 PBKDF2 rounds. Prefer the link key, or the link key plus a password, and use
              a generated password if you use one at all.
            </p>
          </Section>

          <Section id="encryption" title="Encryption">
            <Formula>
              {`encKey    = HKDF-SHA256(ikm, salt, info = "ps/v2/enc")   → AES-256-GCM key
iv        = 12 random bytes, new for every encryption
aad       = "ps/v2/{kdf}"          (notes and EnvShare)
blob      = AES-256-GCM(encKey, iv, plaintext, aad)`}
            </Formula>
            <p>
              The mode is bound in as additional authenticated data, so a ciphertext sealed as{" "}
              <C>key+password</C> can&apos;t be relabelled as <C>key</C> to skip the password. GCM&apos;s tag means any
              changed byte fails decryption instead of producing garbage. Keys are derived as non-extractable
              CryptoKeys. Binary values travel as base64url without padding.
            </p>
            <p>
              GCM doesn&apos;t pad, so the ciphertext is 16 bytes longer than your text. The server can tell a 12-character
              password from a 4 KB .env file.
            </p>
          </Section>

          <Section id="auth" title="Proving you hold the key">
            <Formula>
              {`authToken = HKDF-SHA256(ikm, salt, info = "ps/v2/auth")   32 bytes
authHash  = SHA-256(authToken)                            stored by the server`}
            </Formula>
            <p>
              Reading a share is two requests. First <C>GET /api/notes/:id/meta</C> returns the salt and mode, and no
              ciphertext. Your browser derives the token and sends it in an <C>X-Auth-Token</C> header with the real
              request. The server hashes it, compares in constant time, and only then returns the ciphertext. A
              burn-after-reading note is deleted in that same step.
            </p>
            <p>
              The token and the encryption key come out of HKDF with different labels, so the token, or its hash, gives
              no help decrypting anything. What it does do: keep people who only know a share id from downloading the
              ciphertext or burning the note.
            </p>
            <p>
              Links made here also get a 32-byte <em>manage token</em>, kept in My links in the creating browser. The
              server stores its SHA-256. The token itself is sent, in <C>X-Manage-Token</C>, only when you check a
              receipt (status, read count, first and last read times) or revoke the link. Receipts never contain content.
            </p>
          </Section>

          <Section id="fragment" title="The link fragment">
            <Formula>
              <span className="text-ink-3">https://protectedshare.me/notes/x7Kp2Qa9Lm</span>
              <span className="underline decoration-dashed underline-offset-4">#k=Rk3n9Vx2Lq7Tz4Yb8Wm1Pc6Hd0Js5Ga2Fe9Ku3No7</span>
            </Formula>
            <p>
              Everything after <C>#</C> is the fragment. Browsers don&apos;t put it in the HTTP request or in the{" "}
              <C>Referer</C> header, so neither our server nor Cloudflare receives it. The page reads it with JavaScript.
              Reader pages then clear it from the address bar with <C>history.replaceState</C>, so it isn&apos;t left on
              screen or in a URL you copy afterwards.
            </p>
            <p>The fragment can still turn up in places that are yours, not ours:</p>
            <ul className="ml-5 list-disc space-y-1.5 marker:text-ink-3">
              <li>the browser history of the device that opened the link,</li>
              <li>the chat or email you used to send it,</li>
              <li>any browser extension that can read the page.</li>
            </ul>
            <p>
              Fragment fields by tool: <C>#k=</C> for notes, EnvShare, file drops and request labels; <C>#p=</C> for a
              request&apos;s private inbox key; <C>#r=…&amp;k=…</C> for chat invites. The part before the fragment is
              the share id, which the server does see. Note and EnvShare ids are 10 random characters; links made before
              v2 have 5.
            </p>
          </Section>

          <Section id="files" title="File drops">
            <Spec
              rows={[
                ["Keys", <>A new 32-byte key in <C>#k=</C> and a 16-byte salt per drop, then the same HKDF split into an encryption key and an auth token.</>],
                ["Chunks", "Files are read in 1 MiB chunks. Each chunk is encrypted on its own with a fresh IV and uploaded as iv ‖ ciphertext."],
                ["Storage", <>Encrypted chunks are stored in Cloudflare R2 as <C>drops/{"{id}"}/{"{index}"}</C>. D1 keeps each chunk&apos;s size, and an upload can never store more than the total declared when the drop was created. A self-hosted API without an R2 bucket keeps the chunks in D1.</>],
                ["Chunk binding", <>Each chunk&apos;s AAD is <C>ps-chunk:{"{index}"}/{"{total}"}</C>, so chunks can&apos;t be reordered, swapped, dropped or added without failing to decrypt.</>],
                ["Manifest", "File names, types and sizes go in a JSON manifest encrypted with the same key. The server never sees a file name."],
                ["Uploads", "Chunks are accepted only with an upload token whose hash the server stores. Unfinished drops are deleted after 6 hours."],
                ["Limits", "25 MiB of files per drop, at most 40 chunks, 1–100 downloads, expiry up to 30 days."],
                ["Downloads", "Fetching the manifest needs the auth token, and doesn't use a download. Starting a download asks the server to take one download off the count, in a single atomic update, and to open a download session valid for 60 minutes. The download counts from that moment, and cancelling doesn't give it back."],
                ["Chunks out", <>Every chunk request needs the auth token and that session&apos;s token in <C>X-Download-Token</C>. A retry or resume reuses the same session. With no downloads left, no new session can start.</>],
                ["Deletion", "When the count reaches zero, the drop and its chunks, in D1 and R2, are deleted as soon as the last open session finishes, or by the cleanup job once every session has expired. Revoking, a takedown and expiry delete them too, and the cleanup job also removes any R2 chunk whose drop is gone."],
              ]}
            />
          </Section>

          <Section id="requests" title="Secret requests">
            <p>
              A request lets someone send you a secret without either of you sharing a password first. It uses public-key
              encryption, so only your browser can open the reply.
            </p>
            <Formula>
              {`requester   (pub, priv) = ECDH P-256 key pair
            server gets pub (65-byte raw); priv (PKCS#8) lives only in the inbox link #p=

sender      (epk, esk)  = fresh ECDH P-256 key pair
            shared      = ECDH(esk, pub)
            binding     = epk ‖ pub
            key         = HKDF-SHA256(shared, salt16, info = "ps/v2/request" ‖ binding)
            reply       = AES-256-GCM(key, iv, secret, aad = binding)

requester   k           = 32 random bytes, only in the sender link #k=
            label       = AES-256-GCM(HKDF(k, "ps/v2/label"), { title?, note?, pk: SHA-256(pub) })
            respondTok  = HKDF-SHA256(k, zero salt, info = "ps/v2/respond")   server stores SHA-256

inboxToken  = HKDF-SHA256(SHA-256(priv), zero salt, info = "ps/v2/inbox")`}
            </Formula>
            <p>
              Both public keys are bound into the key derivation and the ciphertext, so a reply can&apos;t be moved to
              another request. Every request carries an encrypted label, under a separate key in the sender link&apos;s{" "}
              <C>#k=</C>. It holds the optional title and note (&ldquo;AWS root password&rdquo;) and always a SHA-256
              fingerprint of the requester&apos;s public key.
            </p>
            <p>
              Only someone holding the full sender link can answer: posting a reply needs the respond token, which is
              derived from that <C>#k=</C>. Before sending, the sender&apos;s browser decrypts the label and checks the
              fingerprint against the public key the server returned. If a server swapped in its own key, the check fails
              and the page refuses to send. One reply is accepted; collecting it with the inbox token deletes the request.
            </p>
            <p>
              The limit that remains is the one described above: a server that serves modified JavaScript could skip the
              check. Self-hosting removes that trust.
            </p>
          </Section>

          <Section id="chat" title="Chat rooms">
            <Spec
              rows={[
                ["Room keys", <>New rooms use a 32-byte room key in the invite link <C>#r=…&amp;k=…</C>. Password rooms stretch the password with PBKDF2-SHA256 at 600,000 iterations, salted with the first 16 bytes of <C>SHA-256(&quot;ps/v2/room:{"{roomId}"}&quot;)</C>, so every member derives the same keys with no server round trip.</>],
                ["Messages", "Encrypted with AES-256-GCM under the room's HKDF encryption key, a fresh IV per message. Nicknames, replies, reactions and images travel inside the ciphertext."],
                ["Room auth", "The first member claims the room with the hash of an HKDF auth token. After that, every room endpoint needs the token, including the live stream."],
                ["Safety words", <>Five words derived from <C>HKDF(ikm, roomSalt, &quot;ps/v2/safety&quot;)</C>. Compare them on another channel: if they match, you derived the same key.</>],
                ["Deleting", "Each message can carry the hash of a random delete token held by its sender. The server deletes a message only when shown that token."],
                ["Disappearing", "Per-message expiry from 5 seconds to 7 days, enforced by the server when reading and by the purge job."],
                ["Burn room", "Deletes every message, the presence rows and the room record at once."],
                ["Limits", "30 joins and 120 messages a minute per room. More than 10 wrong keys or passwords in a minute lock the room for 10 minutes. The server can't tell a password room from a key room, so both kinds lock."],
                ["Purge on empty", "A member stops counting as present when they leave, or 15 seconds after their last heartbeat. Stale presence rows, and the messages of a room nobody is present in, are deleted on the room's next request or by the 30-minute cleanup job, whichever comes first. Claimed rooms are forgotten after 7 idle days."],
              ]}
            />
            <p>
              The server sees message sizes and timing, and a count of who is online and typing. Presence is a random
              client id, a typing flag and a last-seen time.
            </p>
          </Section>

          <Section id="notepad" title="Notepad and free tools">
            <p>
              The notepad uses the original v1 scheme: AES-256-GCM with a key from PBKDF2-SHA256 at 210,000 iterations.
              Local mode keeps the vault in your browser. Synced mode uploads ciphertext, stores your username as a
              SHA-256 hash, and authorizes saves with a password proof (described under v1 below). A note can be exported
              as a self-decrypting HTML file that opens offline.
            </p>
            <p>
              <AppLink href="/tools/encrypt-text" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                Encrypt text
              </AppLink>{" "}
              seals text in password mode (600,000 PBKDF2 iterations) into a block between{" "}
              <C>-----BEGIN PROTECTEDSHARE MESSAGE-----</C> lines, carrying salt, IV and ciphertext. It makes no network
              request. The{" "}
              <AppLink href="/tools/password-generator" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                password generator
              </AppLink>{" "}
              draws from <C>crypto.getRandomValues</C> with rejection sampling, so no character is more likely than
              another.
            </p>
            <p>
              The{" "}
              <AppLink href="/tools/breached-password-checker" className={LINK}>
                breached-password checker
              </AppLink>{" "}
              is the one free tool that makes a request. It hashes the password with SHA-1 in the tab and sends only the
              first 5 hex characters to Have I Been Pwned&apos;s range API (<C>api.pwnedpasswords.com/range/</C>), with{" "}
              <C>Add-Padding: true</C>, no cookies and no referrer. The service answers with every hash suffix sharing
              that prefix, padded so the reply&apos;s size doesn&apos;t hint at the prefix, and the match is made in the
              browser. That page alone adds the host to its Content-Security-Policy. The other tools make no network
              request.
            </p>
          </Section>

          <Section id="legacy" title="Older links (v1)">
            <p>
              Links created before this version carry a password after <C>#</C> with no <C>k=</C>. They still open:
            </p>
            <Spec
              rows={[
                ["Encryption", "AES-256-GCM, key from PBKDF2-SHA256 at 210,000 iterations with a random salt."],
                ["Read check", <>A <em>password proof</em>: SHA-256 of PBKDF2-SHA256(password, fixed salt <C>protectedshare-proof-salt-v1</C>, 100,000 iterations), sent as <C>?proof=</C>.</>],
              ]}
            />
            <p>
              The fixed salt makes the proof the same for the same password everywhere, and a query string is more likely
              to be logged than a header. That&apos;s why v2 replaced it. New links never use it. Since shares last at most
              30 days, the remaining v1 notes and secrets expire on their own; the check stays only for them and for
              notepad workspaces.
            </p>
          </Section>

          <Section id="rate-limits" title="Rate limits and locks">
            <p>
              The API counts requests with Cloudflare&apos;s Workers rate limiting. Counts are kept per Cloudflare location
              and are eventually consistent, so they&apos;re approximate: they stop floods and online guessing, not the
              odd extra request. Over a limit the API answers <C>429</C> with a <C>Retry-After</C> header.
            </p>
            <Table
              head={["Limit", "Counted per", "Per minute"]}
              rows={[
                ["Wrong keys or passwords", "Note, secret, file drop, request, chat room or notepad", "10"],
                ["Joining a chat room", "Room", "30"],
                ["Answers to a secret request", "Request (only the first is accepted)", "10"],
                ["Chat messages", "Room", "120"],
                ["Abuse reports", "Reported link. Report emails to us are capped at 5 a minute per Cloudflare location.", "5"],
                ["Creating notes, secrets, drops, requests and notepads; reports; contact messages", "Client IP address, IPv6 grouped by /64", "600"],
              ]}
            />
            <p>
              Past the wrong-attempt limit, anything a password protects locks for 10 minutes: password and key+password
              notes and secrets, v1 links, chat rooms (the server can&apos;t tell a password room from a key room, so both
              lock) and synced notepads. While locked, every attempt is refused, right or wrong, so someone who knows the
              id can keep it shut for 10 minutes at a time. That is the price of stopping guessing. Key-only links, file
              drops and requests never lock: their keys are random 256-bit values, so only the wrong attempts get a{" "}
              <C>429</C> and the real recipient is never locked out.
            </p>
            <p>
              A lock is one row in <C>auth_lockouts</C>: <C>auth:{"{kind}"}:{"{id}"}</C> and the time it ends (a
              notepad&apos;s id is the SHA-256 of its username). No IP address, nothing about who tried. The cleanup job
              deletes it once it has passed.
            </p>
            <p>
              The create limit keys on the <C>CF-Connecting-IP</C> address that Cloudflare sets. It goes to the rate
              limiter and nowhere else; the code doesn&apos;t write it to D1. On protectedshare.me, API calls reach
              Cloudflare through the web app&apos;s host, so that address is usually the host&apos;s, shared by many
              visitors. That is why the limit is high, and also its weakness: someone who sends that many creates in a
              minute holds up creates for everyone else behind the same host address until the minute is up. Every
              limiter is optional: a self-hosted API without one skips that check.
            </p>
          </Section>

          <Section id="notifications" title="Read notifications">
            <p>
              Optional, per link, from My links. The server sends a standard Web Push message and learns nothing beyond
              which browser to reach.
            </p>
            <Spec
              rows={[
                ["Turning it on", <>The browser subscribes with the server&apos;s VAPID public key and sends the subscription to <C>POST /api/manage/:kind/:id/watch</C> with the link&apos;s <C>X-Manage-Token</C>. Only an active link can be watched, by at most 5 browsers.</>],
                ["Stored", <>Per browser: the push endpoint, the subscription&apos;s P-256 public key (<C>p256dh</C>) and 16-byte auth secret, the link&apos;s kind and id, and a timestamp. No content, no key, no IP address, no account.</>],
                ["Push services", "Endpoints must be https on a browser push service: Google (fcm.googleapis.com), Mozilla, Apple or Microsoft. Anything else is refused, at sign-up and again at send time, and redirects aren't followed."],
                ["When", "On the first counted open (for a request, when the answer arrives) and on the read or download that uses the link up. Sent after the response, so a read never waits on a push service."],
                ["Message", <>Encrypted for that browser alone (RFC 8291, <C>aes128gcm</C>): <C>{"{ kind, id, event, at }"}</C>, padded to 128 bytes so its length says nothing about the link. The push service may hold it for up to a day (<C>TTL: 86400</C>).</>],
                ["Server identity", "VAPID (RFC 8292): an ES256-signed token for that push service's origin, valid for 12 hours, plus our public key."],
                ["What the push service learns", "That our server, identified by its VAPID key, sent this browser a message, when, and its padded size. Not what it says. The service worker adds your label from this browser's storage."],
                ["Deleted", "Right after the used-up notification; when the link is revoked or taken down; when its receipt is deleted (both by database trigger); when the push service answers 404 or 410; and by the cleanup job once the link has expired. Turning it off in My links removes it for every browser."],
                ["In the browser", <>One service worker, <C>/sw.js</C>, scoped to <C>/share-target/</C>, so it controls no app page and caches nothing. It is registered only when you turn notifications on, or by the installed app. IndexedDB <C>ps-notify</C> holds each watched link&apos;s kind, id, label and expiry. Never the URL, key or manage token.</>],
              ]}
            />
          </Section>

          <Section id="share-target" title="Sharing into the app">
            <p>
              Installed as an app, ProtectedShare can take text and files from your device&apos;s share sheet. The share
              arrives as a <C>POST</C> to <C>/share-target/receive</C>, which the service worker answers on the device:
              it keeps the item in IndexedDB (<C>ps-share-inbox</C>) and opens <C>/share-target</C>, where nothing is sent
              until you seal it, encrypted in the browser like anything else. Any website can post a form to that address
              too, so the page first shows what arrived, as plain text and a file list, and passes nothing to the note
              composer or to File drop until you click to continue. Text is cleared as soon as the page reads it; files
              when File drop takes them, which it does only after that click, or when you discard them. An item older
              than 15 minutes is discarded unread.
            </p>
            <p>
              The installed app registers the worker on its first launch. If a share arrives before that, the{" "}
              <C>POST</C> reaches our web host instead. Its handler answers with a redirect without reading or logging the
              body, and in the installed app the page then sets the worker up and says that this one share went to the
              server. A browser tab doesn&apos;t get a worker this way. Analytics never loads on <C>/share-target</C>.
            </p>
          </Section>

          <Section id="reports" title="Abuse reports">
            <Spec
              rows={[
                ["Reporting", <>Pages that open a note, secret, file drop or request send <C>POST /api/reports</C> with the link&apos;s kind and id, taken from the page route and never from the address bar, a reason, optional details (up to 500 characters) and an optional email.</>],
                ["No keys", <>Text containing a link key (<C>#k=</C>, <C>#p=</C>) is refused before anything is stored, by the form and again by the server.</>],
                ["Stored", <><C>abuse_reports</C>: kind, id, reason, details, contact email and time. No IP address. Deleted after 180 days.</>],
                ["Email", <>When the operator sets <C>RESEND_API_KEY</C>, each report is emailed through Resend to the address in <C>NOTIFY_EMAIL_TO</C> (admin@protectedshare.me unless the operator sets another), with every field HTML-escaped. Every report is stored either way.</>],
                ["Takedown", <><C>DELETE /api/admin/:kind/:id</C> with an <C>X-Admin-Token</C> header, compared in constant time with a Worker secret of at least 32 characters. Without that secret the route answers 404. It deletes the content and any R2 chunks, and marks an active receipt revoked, which also ends its notifications.</>],
              ]}
            />
            <p>
              We still can&apos;t read the content, so a takedown goes on the report and the id.
            </p>
          </Section>

          <Section id="mcp" title="Claude connector (MCP)">
            <p>
              The same links can be made from Claude or any MCP client, two ways. Both use the v2 code above and store
              exactly what the website stores. Setup is on the{" "}
              <AppLink href="/integrations/claude" className={LINK}>
                Claude integration page
              </AppLink>
              .
            </p>
            <Table
              head={["", "Remote connector", "Local server"]}
              rows={[
                ["Runs", <><C>https://mcp.protectedshare.me/mcp</C>, the Worker <C>protectedshare-mcp</C> on Cloudflare, reached directly (not through the web host). No sign-in.</>, <><C>npx protectedshare-mcp</C> on your computer, over stdio.</>],
                ["Encrypts", "In the Worker's memory. The text arrives over TLS, is sealed with AES-256-GCM under a fresh link key, and is never stored or logged.", "On your computer, before anything is sent."],
                ["Passwords", "No. Links carry their key only.", "Optional: PBKDF2-SHA256, 600,000 iterations."],
                ["To the storage API", "Ciphertext and hashes to create; kind, id and manage token to check or revoke. Over a Service Binding (Worker to Worker, no public hop).", <>Ciphertext and hashes to create; the id and a derived token to open; kind, id and manage token to check or revoke. Over HTTPS, with the user agent <C>protectedshare-mcp/{"<version>"}</C>.</>],
                ["Tools", "create_secret_link, share_env_file, request_secret, check_link_status, revoke_link, generate_password.", "The same, plus open_secret_link and check_password_breach."],
                ["Logs", "Request metadata only: method, path, status, timing. A rejected request logs its error class name. Never arguments, results or bodies.", "Nothing on disk. stderr names an error's type, nothing more."],
              ]}
            />
            <p>
              Link keys, request key pairs and manage tokens are generated where the tool runs and returned in the
              tool&apos;s result; nothing keeps a copy, so these links don&apos;t appear in My links. That result, like
              everything else in the conversation, is visible to the MCP client and its AI provider. The local{" "}
              <C>open_secret_link</C> spends a read exactly as a browser would, and labels the text it returns as written
              by the link&apos;s creator, not as instructions. <C>check_password_breach</C> sends only a 5-character SHA-1
              prefix to Have I Been Pwned, from your computer. <C>generate_password</C> makes the password where the server
              runs (in the Worker, for the remote connector) and stores nothing.
            </p>
            <p>
              Both servers use the official MCP TypeScript SDK (<C>@modelcontextprotocol/server</C> 2.3.1, pinned) and
              speak MCP 2026-07-28 plus 2025-11-25, 2025-06-18 and 2025-03-26. The Worker accepts POST only, answers in
              JSON, keeps no sessions, reads at most 512 KB of a request, checks the protocol headers against the body,
              refuses an <C>Origin</C> other than claude.ai, claude.com or localhost with a 403, takes one JSON-RPC
              message per request (batches get a 400), and allows 600 requests a minute per connecting IP (an IPv6 address
              counts by its /64), of which 120 may call the tools that create links. Inputs are strictly validated: notes and EnvShare files up to 50,000 characters
              remotely, which keeps encryption inside a Worker&apos;s CPU budget. API calls time out after 25 seconds, and
              error messages never repeat what you sent.
            </p>
          </Section>

          <Section id="threat-model" title="Threat model">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-[15px] font-semibold text-ink">Protects you against</h3>
                <CheckList
                  tone="yes"
                  items={[
                    "Someone with a copy of our database or server reading your content. They get ciphertext and hashes.",
                    "Network observers. Traffic is TLS, the content is already encrypted, and the key isn't in any request.",
                    "Link previews burning a note. Unfurlers fetch without the fragment, so they can't produce the read token, and the note page waits for a click.",
                    "Fast online guessing. Wrong keys and passwords are limited per link, and anything a password protects locks for 10 minutes after more than 10 misses in a minute.",
                    "Us reading what you send from the website or the local MCP server, in normal operation.",
                  ]}
                />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-ink">Does not protect against</h3>
                <CheckList
                  tone="no"
                  items={[
                    "A compromised device or browser, or a malicious extension on either end.",
                    "Anyone who gets the full link. It is the key. Use a separate password if the channel worries you.",
                    "A malicious server serving modified JavaScript. Every in-browser encryption app has to trust the code it loads. Mitigation: open source, and self-hosting.",
                    "Metadata: Cloudflare, the web app's host and we can see IP addresses, timing, sizes, and which ids are read. A push service sees when a read notification is sent.",
                    "A weak password in password mode. Online guessing is slowed, not stopped, and a copy of the database can be guessed against offline.",
                    "The remote MCP connector seeing your plaintext. It has to: it encrypts on our server. For end-to-end encryption, use the website or the local MCP server.",
                    "Your MCP client and its AI provider seeing the conversation, including the text you ask it to share and the links and keys the tools return.",
                    "Someone who knows a password-protected link's id keeping it locked, and its recipient out, 10 minutes at a time.",
                    "The recipient keeping a copy once it's decrypted.",
                  ]}
                />
              </div>
            </div>
          </Section>

          <Section id="retention" title="Retention">
            <Table
              head={["Data", "Deleted"]}
              rows={[
                ["Secure notes", "On the burning read, or at expiry (30 days at most)."],
                ["EnvShare secrets", "On the last allowed read (1–100), or at expiry."],
                ["File drops and chunks", "Once the last allowed download finishes or its session expires, on revoke or takedown, or at expiry, R2 objects included. Unfinished uploads after 6 hours. The cleanup job also sweeps R2 for chunks whose drop is gone."],
                ["Download sessions", "60 minutes after the download starts (sooner if the drop expires), or when it finishes."],
                ["Secret requests", "When the reply is collected, or at expiry."],
                ["Read receipts", "30 days after the share's expiry. No content, ever."],
                ["Notification subscriptions", "After the used-up notification, on revoke or takedown, when the receipt is deleted, on a 404 or 410 from the push service, or once the link has expired."],
                ["Lockouts", "Once the 10-minute lock has passed."],
                ["Abuse reports", "180 days after they're sent."],
                ["Usage counts", "After 400 days. One row per day and kind, no ids."],
                ["Chat messages", "Once the room is empty (on its next request, or within 30 minutes), at the message's own expiry, on delete, or when the room is burned."],
                ["Chat rooms (claimed)", "After 7 idle days. Deletion markers after 10 minutes."],
                ["Chat presence", "When the member leaves. Otherwise it stops counting 15 seconds after the last heartbeat, and the row is deleted on the room's next request or within 30 minutes."],
                ["Notepad workspaces", "When you delete the workspace. Open-tab check-ins are deleted on the next check-in once they're 30 seconds old."],
                ["Contact form messages", "Not deleted automatically. Ask and we'll remove yours."],
              ]}
            />
            <p>
              A job runs every 30 minutes to delete expired rows. Between runs, expired shares are already refused: every
              read checks the expiry.
            </p>
          </Section>

          <Section id="infrastructure" title="Hosting and logs">
            <p>
              The hosted API is a Cloudflare Worker with a D1 database, and encrypted file-drop chunks live in a Cloudflare
              R2 bucket. On protectedshare.me your browser calls it directly, at <C>api.protectedshare.me</C>, so
              Cloudflare sees IP addresses, request metadata and the ciphertext passing through, and the web app&apos;s
              host sees page loads. A self-hosted web app can instead relay <C>/api</C> requests to the Worker, and then
              its host sees them too. Nobody sees a key, which never leaves the fragment. Workers observability logging is on for
              the API: it records request metadata and the errors the code logs, and the code doesn&apos;t log request
              bodies.
            </p>
            <p>
              The remote MCP connector is a separate Worker, <C>protectedshare-mcp</C>, at <C>mcp.protectedshare.me</C>.
              Clients reach it directly, so the web app&apos;s host isn&apos;t in that path, and it calls the API over a
              Service Binding. Its observability logs hold request metadata only.
            </p>
            <p>
              Google Analytics and Cloudflare Web Analytics each load only when the operator sets their id or token at
              build time; a self-hosted copy loads neither unless you set one. Even then, neither loads on pages that
              open or hold a share (note, EnvShare and file links, requests and their inboxes, chat, My links, the
              notepad, the share target), and either one that loaded earlier is switched off while such a page is open.
              Google Analytics page views report the path only, never the query string or the fragment. The Cloudflare
              beacon is cookieless, strips the query string and fragment itself, and counts full page loads only.
            </p>
            <p>
              The contact form stores the name, email, company and message you send, so we can reply. Contact messages
              and abuse reports are emailed through Resend when the operator sets <C>RESEND_API_KEY</C>, and read
              notifications travel through the browser&apos;s push service.
            </p>
          </Section>

          <Section id="headers" title="Browser protections">
            <p>
              Every page is served with a Content-Security-Policy. Scripts, styles, fonts, workers and connections are
              limited to this site (plus the hosts of Google&apos;s or Cloudflare&apos;s analytics, only when that
              analytics is on and never on pages that open or hold a share; the breached-password checker&apos;s page also
              allows <C>api.pwnedpasswords.com</C>).
              Images may also come from <C>data:</C> and <C>blob:</C> URLs, which is how decrypted previews are shown.{" "}
              <C>object-src</C> and <C>base-uri</C> are <C>&apos;none&apos;</C>, forms can only post here, and{" "}
              <C>frame-ancestors &apos;none&apos;</C> with <C>X-Frame-Options: DENY</C> stops other sites from framing
              the app.
            </p>
            <p>
              Stated honestly: the policy still allows inline scripts (<C>&apos;unsafe-inline&apos;</C>), because the
              framework&apos;s page bootstrap is inline and we don&apos;t use per-request nonces. So the policy doesn&apos;t
              stop injected inline script from running. What it does is keep script from loading off other hosts and
              block fetches, images and form posts to other hosts, which are the usual ways to send a key or plaintext
              out of the page. Pages also send <C>X-Content-Type-Options: nosniff</C>,{" "}
              <C>Referrer-Policy: strict-origin-when-cross-origin</C>, HSTS, and a <C>Permissions-Policy</C> that turns
              off camera, microphone, geolocation and topics.
            </p>
          </Section>

          <Section id="disclosure" title="Report a vulnerability">
            <p>
              Email{" "}
              <a href="mailto:admin@protectedshare.me" className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                admin@protectedshare.me
              </a>{" "}
              with what you found and how to reproduce it. Please give us a chance to fix it before you publish. For
              anything that isn&apos;t exploitable, a{" "}
              <a href={`${GITHUB_URL}/issues`} className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                GitHub issue
              </a>{" "}
              is fine.
            </p>
          </Section>
        </div>
      </div>
    </main>
  );
}
