# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a person handing a secret to someone else without creating an account. The secret is a password, a private note, or a developer credential such as an API key or `.env` file. They are at a browser, often on a short deadline, and they need a link the other person can open.

The recipient is the other half of that job. They have the link. A Secure Note opens from that link when the key is in the URL fragment (`#k=`), or they type a password that arrived separately, or both. An EnvShare link carries the key in the fragment. A file drop link does the same for files. They decrypt in their own browser.

The direction can also flip: with a Secret request, the person who needs the secret sends a link, and the sender's reply is encrypted to the requester's public key.

More tools sit on the same promise. Someone can keep an encrypted notepad in the browser, and optionally sync the ciphertext. Someone can open an encrypted chat room and talk with people who have the invite link or room password. The sender can check "My links" on the device that created a share to see whether it was opened, and revoke it. Two client-only tools (password generator, offline text encryptor) send nothing to the server. An operator can self-host the web app and the API. An organization can ask, through the contact form, about a dedicated instance. That ask is not a checkout.

## Product Purpose

ProtectedShare lets someone encrypt a secret in the browser and leave only ciphertext on the server, then give another person a way to decrypt it. Success is the recipient reading the secret in their browser while the hosted database does not hold the plaintext.

The public site is [protectedshare.me](https://protectedshare.me). The repository is [github.com/KunalSiyag/protectedshare](https://github.com/KunalSiyag/protectedshare), MIT licensed.

## Positioning

The mechanism is client-side AES-256-GCM (crypto v2, `packages/crypto/src/v2.ts`). The input is a random 32-byte key carried in the URL fragment, or a password stretched with PBKDF2-SHA256 at 600,000 iterations, or both. HKDF-SHA256 derives two values from it: the AES-256-GCM key and an auth token. The server stores the ciphertext, IV, salt, KDF mode and SHA-256 of the auth token, and releases ciphertext only to a client that presents the token. It does not store the key, the password or the plaintext. Legacy v1 links (PBKDF2 210,000 iterations plus a fixed-salt password proof) still open.

A Secure Note can keep the password off the link, for a second channel, or place the key in the fragment so the link opens the note. EnvShare puts the key in the fragment, which the browser does not send to the server, and deletes the row after a chosen number of reads. File drop encrypts files in chunks bound to their position. Secret requests use ECDH P-256 so only the requester's private key opens the reply. The encrypted notepad and the chat room use the same browser encryption for contents that live longer than a single link.

That combination is the position: one open-source web app for an account-free handoff (text, credentials, files, or a request in the other direction), a private notepad, and an encrypted chat room. Comparison pages against EnvShare, Privnote, ProtectedText, and OneTimeSecret are marketing pages in the app. They are not an audit of those products.

## Operating Context

A sender opens Secure Notes, EnvShare or File drop, adds the secret, sets an expiry, and encrypts it locally. Expiry is 1 hour, 1 day, 7 days, or a custom date at most 30 days out. Notes can burn after the first open. EnvShare allows 1 to 100 reads. File drops take up to 25 MB and 1 to 100 downloads. The sender copies a link (or shows a QR code). A note link can include the key, or a password can be sent separately. The share is saved to "My links" in that browser with a manage token.

The recipient opens the link. The page reads the key from the fragment when present, otherwise they type the password. Decryption runs locally. Burn-after-read, a spent read or download count, revoke, and expiry delete the database row. A cron every 30 minutes deletes expired rows; reads past expiry are refused before that.

The notepad is a markdown scratchpad. Local mode keeps the vault in the browser. Cloud mode uploads ciphertext and merges conflicting saves with the server's `updated_at` version (HTTP 409, then a client-side merge). A note can also be downloaded as a self-decrypting HTML file that opens offline.

Chat creates a room with a random key in the invite link (`#r=…&k=…`), or a password. The room is claimed with an auth hash so only members can read or post. Messages are ciphertext and can carry a disappearing timer; images and files travel inside the ciphertext. Members compare safety words derived from the key. Presence (a random client id and a typing flag) is separate from message contents. Messages are purged when everyone leaves; anyone in the room can burn it.

Self-hosting is a Cloudflare Worker with D1 for the API (with a `*/30 * * * *` cleanup cron in `wrangler.toml`), and the Next.js app pointed at it with `API_BACKEND_URL`. The README and `/self-host` describe Wrangler, the schema and migrations 0001–0005, a container image at `ghcr.io/kunalsiyag/protectedshare-web`, and optional GitHub Actions deploy. Local development is `npm run dev:api` and `npm run dev:web` from the repo root: web on port 3000, API on port 8787. Without `API_BACKEND_URL` the web proxy falls back to the hosted API.

## Capabilities and Constraints

Confirmed behavior:

- Secure Notes, EnvShare secrets, file drops, secret requests, notepad vaults, chat messages, the offline HTML export and the encrypt-text tool encrypt with AES-256-GCM in the browser (`packages/crypto`).
- v2 retrieval (notes, secrets, drops) sends an auth token derived by HKDF from the key or password in header `X-Auth-Token`; the server stores and compares SHA-256 of it in constant time. The token is a verifier, not the decryption key, and it does leave the browser.
- Legacy v1 notes and secrets, and notepad workspaces, send a password proof: PBKDF2 at 100,000 iterations with the fixed salt `protectedshare-proof-salt-v1`, then SHA-256. Older workspaces can still authenticate with a legacy SHA-256 of the password and are migrated forward.
- Secret requests: ECDH P-256 + HKDF-SHA256 + AES-256-GCM. The server stores the requester's public key, an encrypted label (always sent; it carries a SHA-256 fingerprint of the public key that the sender's browser checks before sending), a hash of the respond token (HKDF of the sender link's `#k=`, required in `X-Auth-Token` to reply), a hash of the inbox token, and the encrypted reply until the inbox collects it (then deletes the row).
- File drops: chunks up to ~1 MB, each AES-256-GCM with its index and count as AAD; the manifest (names, types, sizes) is encrypted. The server sees total encrypted size, chunk count, downloads remaining and expiry. A download is counted by the server when it starts (atomic decrement plus a 60-minute download session whose token every chunk request needs); cancelling doesn't refund it, and the receipt marks the drop opened at that point. Unfinished uploads are purged after 6 hours.
- Receipts: when a share is created with a manage token, the server stores SHA-256 of the token and a receipt row (kind, id, status, reads, max reads, created/expiry/first-read/last-read times), never content, kept until 30 days after expiry. "My links" (`localStorage` key `ps.links.v1`, this browser only) reads receipts in batch and can revoke; the manage token leaves the browser only for those calls.
- Chat v2: claimed rooms store an auth hash and a default disappearing timer; messages may carry an expiry and a delete-token hash. Messages are purged when no one is present (on the room's next request or by the 30-minute cron, not instantly), at their expiry, or on burn; idle room claims are forgotten after 7 days.
- Cloud notepad usernames are stored as the SHA-256 of the normalized username. Local notepad usernames are stored in the browser in normalized form; the local vault's key is stored in the same browser.
- The API is a Hono app on Cloudflare Workers with D1 tables for notes, secrets, workspaces, chat messages, chat presence, chat rooms, chat deletions, drops, drop chunks, requests, share receipts, and inquiries (`apps/api`). A cron runs every 30 minutes to purge expired rows. Workers observability logs are enabled.
- The web app is Next.js 15 App Router, React 19, and Tailwind 3.4 (`apps/web`). Shared UI primitives live in `packages/ui`. Payload shapes live in `packages/contracts`.
- There is no payment flow and no public price. The homepage JSON-LD says the offer price is 0. The contact page invites organizations to ask about a dedicated instance. No price or contract for that instance is in the repo.
- The contact form stores a name, an email, an optional company, and a message in the `inquiries` table, and emails it to the admin through Resend when `RESEND_API_KEY` is set.
- The app sets no cookies of its own (no `document.cookie` or `Set-Cookie` in the code). Google Analytics sets its own cookies when enabled. The privacy page states, at build time, whether GA is on.
- Google Analytics loads only when `NEXT_PUBLIC_GA_ID` is set (`apps/web/components/analytics.tsx`). It never loads on share-holding paths (`/notes/[id]`, `/secrets/[id]`, `/files/[id]`, `/request/[id]` and inbox, `/chat`, `/links`, `/notepad`), is disabled if one is visited later in the session, and sends page views manually with origin and path only. The repo does not record whether the hosted site sets it.
- New note and EnvShare ids are 10 characters (v1 ids are 5). Password-mode notes are not rate limited against online guessing yet; each guess costs 600,000 PBKDF2 rounds.
- `/api/*` is relayed by the web app's host to the Worker (`apps/web/app/api/[[...path]]/route.ts`, or the rewrite in `apps/web/vercel.json`), so that host sees request metadata and ciphertext as well as Cloudflare. The Next proxy route drops cookies and client forwarding headers and refuses bodies over 2,000,000 bytes.
- Every route sends a Content-Security-Policy and security headers from `apps/web/next.config.ts`: same-origin scripts (plus Google Tag Manager when GA is on), connect/img limited to self (plus GA hosts), `object-src 'none'`, `base-uri 'none'`, `form-action 'self'`, `frame-ancestors 'none'`, `X-Frame-Options: DENY`, nosniff, a Permissions-Policy. `'unsafe-inline'` remains in `script-src` because the App Router's inline bootstrap has no nonces.
- `apps/web/public/ads.txt` is a commented AdSense placeholder. No ad unit is rendered.
- Theme follows `localStorage` or the system color scheme. That is a preference, not an account.

Undecided, and not to be filled in by assumption:

- No accessibility conformance target is chosen.
- Whether production has `NEXT_PUBLIC_GA_ID` set is unknown from the repo.
- Dedicated-instance terms, price, and logging claims on the contact page are not specified in code.
- How long Cloudflare keeps Workers observability logs for the hosted site is set in the Cloudflare account, not in the repo.
- No independent security audit has been published.

Public sentences that the code does not honor are not requirements. Do not treat "no accounts," "no email collected," "no tracking," or "the key never leaves the device" as product rules while auth tokens, password proofs, hashed notepad usernames, receipts, the inquiry rows, and the optional analytics tag exist.

## Brand Commitments

The product name is ProtectedShare. The public host is protectedshare.me. The mark in the repo is `apps/web/public/logo.svg`. The social preview image is `apps/web/public/og-image.jpg`. The privacy page gives `admin@protectedshare.me` as the contact address. The license is MIT (`LICENSE`). Twitter metadata names `@ProtectedShare`; the repo does not prove that account.

No visual identity, palette, or type system is committed here.

## Evidence on Hand

Shipped copy and product surfaces: `README.md`, `apps/web/app/page.tsx`, `apps/web/app/security`, `apps/web/app/about/page.tsx`, `apps/web/app/privacy/page.tsx` (rewritten October 2026 to list what each tool stores, retention, hosting logs, analytics and browser storage), `apps/web/app/terms/page.tsx`, `apps/web/app/self-host/page.tsx`, the blog under `apps/web/app/blog`, and the comparison pages under `apps/web/app/vs`. Comparison tables state competitor facts only as found in their public docs at time of writing, and mark the rest "Not stated". When code changes what is stored, these pages change with it.

No Lighthouse report is stored in the repo, so the README no longer carries a Lighthouse badge.

There are no customer names, testimonials, case studies, or press clippings in the repo. Do not invent them.

## Product Principles

1. The job is getting a secret from one person to another without making either of them create an account.
2. Plaintext stays in the browser. The server may store ciphertext, a verifier hash (v2 auth hash or v1 password proof) and the metadata needed to enforce limits, and future work has to say so.
3. Notes, EnvShare, file drops, secret requests, the notepad, and chat stay on that rule. A feature that needs the server to read the contents does not belong.
4. Expiry, burn-after-read, and read limits count only when the database row is actually deleted.
5. Published claims have to match what the code stores and sends.
