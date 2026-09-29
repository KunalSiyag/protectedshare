# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a person handing a secret to someone else without creating an account. The secret is a password, a private note, or a developer credential such as an API key or `.env` file. They are at a browser, often on a short deadline, and they need a link the other person can open.

The recipient is the other half of that job. They have the link. A Secure Note opens from that link when the password is in the URL hash, or they type a password that arrived separately. An EnvShare link always carries the password in the hash. They decrypt in their own browser.

Two more tools sit on the same promise. Someone can keep an encrypted notepad in the browser, and optionally sync the ciphertext. Someone can open an anonymous chat room and exchange encrypted messages with people who have the room password. An operator can self-host the web app and the API. An organization can ask, through the contact form, about a dedicated instance. That ask is not a checkout.

## Product Purpose

ProtectedShare lets someone encrypt a secret in the browser and leave only ciphertext on the server, then give another person a way to decrypt it. Success is the recipient reading the secret in their browser while the hosted database does not hold the plaintext.

The public site is [protectedshare.me](https://protectedshare.me). The repository is [github.com/KunalSiyag/protectedshare](https://github.com/KunalSiyag/protectedshare), MIT licensed.

## Positioning

The mechanism is client-side AES-256-GCM. The passphrase is stretched with PBKDF2 (210,000 iterations, SHA-256) in the browser. The server stores the ciphertext, IV, and salt, plus a password proof it can check. It does not store the passphrase or the plaintext.

A Secure Note can keep the passphrase off the link, for a second channel, or place it in the URL hash so the link opens the note. EnvShare always puts the passphrase in the URL hash, which the browser does not send to the server, and deletes the row after a chosen number of reads. The encrypted notepad and the chat room use the same browser encryption for contents that should outlive a single link.

That combination is the position: one open-source web app for an account-free handoff, a burnable credential link, a private notepad, and a password-gated chat room. Comparison pages against EnvShare, Privnote, ProtectedText, and OneTimeSecret are marketing pages in the app. They are not an audit of those products.

## Operating Context

A sender opens Secure Notes or EnvShare, types the secret, sets an expiry, and encrypts it locally. Expiry is 1 hour, 1 day, 7 days, or a custom date at most 30 days out. Notes can burn after the first open. EnvShare allows 1 to 100 reads. The sender copies a link. A note link can include the password, or the password can be copied separately. EnvShare always puts the password in the hash.

The recipient opens the link. The decrypt page uses a hash passphrase when one is present, otherwise they type it. Decryption runs locally. Burn-after-read and a spent read count delete the database row.

The notepad is a markdown scratchpad. Local mode keeps the vault in the browser. Cloud mode uploads ciphertext and merges conflicting saves with the server's `updated_at` version (HTTP 409, then a client-side merge). A note can also be downloaded as a self-decrypting HTML file that opens offline.

Chat creates a room with a password. Messages are ciphertext. Presence (a client id and a typing flag) is separate from message contents. The invite link is how the other person joins.

Self-hosting is a Cloudflare Worker with D1 for the API, and the Next.js app pointed at it with `API_BACKEND_URL`. The README and `/self-host` describe Wrangler, a container image at `ghcr.io/kunalsiyag/protectedshare-web`, and optional GitHub Actions deploy. Local development is `npm run dev` from the repo root: web on port 3000, API on port 8787.

## Capabilities and Constraints

Confirmed behavior:

- Secure Notes, EnvShare secrets, notepad vaults, chat messages, and the offline HTML export encrypt with AES-256-GCM in the browser (`packages/crypto`).
- Retrieval of a note, secret, or workspace sends a password proof: PBKDF2 at 100,000 iterations with the fixed salt `protectedshare-proof-salt-v1`, then SHA-256. Older workspaces can still authenticate with a legacy SHA-256 of the password and are migrated forward. The proof is a verifier. It is not the decryption key, and it does leave the browser.
- Cloud notepad usernames are stored as the SHA-256 of the normalized username. Local notepad usernames are stored in the browser in normalized form.
- The API is a Hono app on Cloudflare Workers with D1 tables for notes, secrets, workspaces, chat messages, chat presence, and inquiries (`apps/api`).
- The web app is Next.js 15 App Router, React 19, and Tailwind 3.4 (`apps/web`). Shared UI primitives live in `packages/ui`. Payload shapes live in `packages/contracts`.
- There is no payment flow and no public price. The homepage JSON-LD says the offer price is 0. The contact page invites organizations to ask about a dedicated instance. No price or contract for that instance is in the repo.
- The contact form stores a name, an email, an optional company, and a message in the `inquiries` table.
- Google Analytics loads only when `NEXT_PUBLIC_GA_ID` is set. The repo does not record whether the hosted site sets it.
- `apps/web/public/ads.txt` is a commented AdSense placeholder. No ad unit is rendered.
- Theme follows `localStorage` or the system color scheme. That is a preference, not an account.

Undecided, and not to be filled in by assumption:

- No accessibility conformance target is chosen.
- Whether production has `NEXT_PUBLIC_GA_ID` set is unknown from the repo.
- Dedicated-instance terms, price, and logging claims on the contact page are not specified in code.

Public sentences that the code does not honor are not requirements. Do not treat "no accounts," "no email collected," "no tracking," or "the key never leaves the device" as product rules while password proofs, hashed notepad usernames, the inquiry rows, and the optional analytics tag exist.

## Brand Commitments

The product name is ProtectedShare. The public host is protectedshare.me. The mark in the repo is `apps/web/public/logo.svg`. The social preview image is `apps/web/public/og-image.jpg`. The privacy page gives `admin@protectedshare.me` as the contact address. The license is MIT (`LICENSE`). Twitter metadata names `@ProtectedShare`; the repo does not prove that account.

No visual identity, palette, or type system is committed here.

## Evidence on Hand

Shipped copy and product surfaces: `README.md`, `apps/web/app/page.tsx`, `apps/web/app/about/page.tsx`, `apps/web/app/privacy/page.tsx` (dated June 2026), `apps/web/app/terms/page.tsx`, `apps/web/app/self-host/page.tsx`, the blog under `apps/web/app/blog`, and the comparison pages under `apps/web/app/vs`. The privacy page and the homepage still say things the code does not do. Use them as copy to reconcile, not as the source of truth.

The README's Lighthouse 100/100 badge links to the site. No Lighthouse report is stored in the repo.

There are no customer names, testimonials, case studies, or press clippings in the repo. Do not invent them.

## Product Principles

1. The job is getting a secret from one person to another without making either of them create an account.
2. Plaintext stays in the browser. The server may store ciphertext and a password proof, and future work has to say so.
3. Notes, EnvShare, the notepad, and chat stay on that rule. A feature that needs the server to read the contents does not belong.
4. Expiry, burn-after-read, and read limits count only when the database row is actually deleted.
5. Published claims have to match what the code stores and sends.
