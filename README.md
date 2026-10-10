# ProtectedShare

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js: 15](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com)

Encrypt a secret in your browser and hand it to someone else without either of you making an account. The server keeps ciphertext and a few facts it needs to enforce limits. It never receives the plaintext, the key, or the password.

Hosted at [protectedshare.me](https://protectedshare.me). MIT licensed.

## Tools

| Tool | Route | What it does |
|---|---|---|
| Secure note | `/notes` | Encrypted text behind a link. Key in the link (`#k=`), a separate password, or both. Can burn after the first read. |
| EnvShare | `/secrets` | `.env` files and API keys with a read limit of 1–100. Key in the link. |
| File drop | `/files` | Up to 25 MB of files, encrypted in 1 MB chunks, with a download limit. File names live in an encrypted manifest. |
| Secret request | `/request` | Ask someone for a secret. Their reply is encrypted to your public key; the private key lives only in your inbox link. |
| My links | `/links` | Shares you created on this device, with status (opened, expired, revoked), reads left and revoke. Stored in this browser only. |
| Chat | `/chat` | Encrypted rooms with nicknames, replies, reactions, edit/delete, disappearing messages, images and files, safety words, and burn room. Messages are purged when everyone leaves. |
| Notepad | `/notepad` | Markdown notepad. Local mode keeps the encrypted vault in the browser; optional sync uploads ciphertext. Notes export as self-decrypting HTML. |
| Password generator | `/tools/password-generator` | Passwords and passphrases with an entropy estimate. Runs entirely in the browser. |
| Encrypt text | `/tools/encrypt-text` | Password-encrypt text into an armored block you can paste anywhere and open offline. |

Every share expires within 30 days (1 hour, 1 day, 7 days or a custom time).

## Security model

Short version: AES-256-GCM in the browser via Web Crypto, keys in the URL fragment (which browsers don't send to servers), and the server checks a hash before releasing ciphertext. The full model is at [`/security`](https://protectedshare.me/security); what's stored and for how long is at [`/privacy`](https://protectedshare.me/privacy).

### Crypto v2 (`packages/crypto/src/v2.ts`)

- **Keys.** Link mode uses a random 32-byte key, base64url in the fragment: `/notes/{id}#k={key}`. Password mode stretches the password with PBKDF2-SHA256 at 600,000 iterations over a random 16-byte salt. `key+password` concatenates both.
- **Derivation.** HKDF-SHA256 over that input and the item's salt gives two independent values: an AES-256-GCM key (`info = "ps/v2/enc"`) and a 32-byte auth token (`info = "ps/v2/auth"`).
- **What the server gets.** Ciphertext, IV, salt, KDF mode, and `authHash = SHA-256(authToken)`. To read, the client derives the token and sends it in `X-Auth-Token`; the server hashes it and compares in constant time. A guessed id alone returns nothing.
- **Files.** Each chunk is encrypted separately with its index and the chunk count bound as AAD (`ps-chunk:{i}/{n}`), so chunks can't be reordered or dropped silently. The server counts a download when it starts (`POST /api/drops/:id/start` decrements the count atomically and opens a 60-minute download session); chunk reads need that session's `X-Download-Token`.
- **Secret requests.** ECDH P-256 + HKDF-SHA256 + AES-256-GCM with an ephemeral sender key. The inbox token is derived from the private key. Only a holder of the full sender link (`#k=`) can answer: replying needs a respond token derived from that key, and the sender's browser checks the public key against a SHA-256 fingerprint carried inside the encrypted label before sending.
- **Chat.** Room keys come from the invite fragment (`/chat#r={room}&k={key}`) or a room password. Members see five safety words derived from the key to confirm they share the same room.
- **Receipts.** Creating a share can register a random manage token; the server stores only its hash plus status, counts and timestamps (never content). My links keeps the token and sends it only to show "opened" and to revoke.
- **Ids.** New note and EnvShare ids are 10 random characters (v1 links have 5). The id is in the path, so the server sees it; the key never is.

### Legacy v1 links

Links made before v2 keep working. They use PBKDF2 (210,000 iterations) for the encryption key and a separate password proof (PBKDF2 at 100,000 iterations with a fixed salt, then SHA-256) that the server checks. Synced notepad workspaces still authenticate with that proof and store usernames as SHA-256 hashes.

### Honest limits

- The server sees request metadata: share ids, sizes, counts, timestamps. Every API call goes through the web app's host (`/api/*` is relayed to the Worker), so that host and Cloudflare both see IP addresses, request metadata and ciphertext in transit; Workers observability logs are enabled in `wrangler.toml`.
- Password-mode notes can be guessed online against a known id: reads aren't rate limited yet, though each guess costs 600,000 PBKDF2 rounds. Prefer link-key or link+password mode.
- Pages send a Content-Security-Policy (same-origin scripts, connections and images, `frame-ancestors 'none'`). It keeps `'unsafe-inline'` for scripts because the Next.js bootstrap is inline without nonces, so it limits where data can be sent rather than stopping inline script.
- Anyone with a full link can open it until it expires or runs out of reads. Links you created are saved in your browser's localStorage (My links), keys included.
- Google Analytics loads only if `NEXT_PUBLIC_GA_ID` is set at build time; it sets its own cookies when it does. It never loads on pages that open or hold a share (note/secret/file/request links, chat, My links, notepad) and reports the path only, never the query or fragment. The app itself sets no cookies.
- The contact form is not end-to-end encrypted; it stores name, email, company and message.
- No independent security audit has been published.

## Architecture

```
apps/
  web/        Next.js 15 App Router, React 19, Tailwind 3.4. All encryption happens here, in the browser.
              /api/* is proxied to the Worker (API_BACKEND_URL).
  api/        Hono on Cloudflare Workers + D1. Stores ciphertext, verifier hashes, receipts.
              Routes in src/routes (shares, drops, requests, manage, chat), helpers in src/lib.
              A cron (*/30 * * * *) purges expired rows.
packages/
  crypto/     Web Crypto wrappers: v1 (legacy) and v2 (src/v2.ts).
  contracts/  Zod schemas and TypeScript types for every API payload.
  ui/         Shared React primitives (Button, Field, Panel, StatusChip, ...).
  formatting/ Small string helpers.
```

Retention, enforced on read and by the cron: notes and secrets are deleted on their last allowed read or at expiry; file drops after their last download or at expiry (unfinished uploads after 6 hours); secret requests when the inbox collects the reply; chat messages when the room empties, on their disappearing timer, or when the room is burned; receipts 30 days after the share's expiry.

## Local development

Requires Node.js 22+ and npm 10+.

```bash
git clone https://github.com/KunalSiyag/protectedshare.git
cd protectedshare
npm install

# Create the local D1 database with the full v2 schema
cd apps/api
npx wrangler d1 execute protectedshare --local --file=schema.sql
cd ../..

# Point the web app at the local API (otherwise it proxies to the hosted API)
echo "API_BACKEND_URL=http://localhost:8787" > apps/web/.env.local

# In two terminals
npm run dev:api   # http://localhost:8787
npm run dev:web   # http://localhost:3000
```

`npm run typecheck` checks every workspace.

### Schema and migrations

`apps/api/schema.sql` is the complete current schema (it includes everything in migrations 0001–0005). Use it for new databases. For an existing database, apply the migrations in `apps/api/migrations/` that it hasn't seen, in order; `0005_v2.sql` adds receipts, file drops, secret requests, chat rooms and the v2 columns. A "duplicate column" error from one of its `ALTER TABLE` lines means that column already exists. The Worker also creates missing tables and columns at runtime (`src/lib/schema.ts`).

## Deployment

### API (Cloudflare Workers + D1)

```bash
cd apps/api
npx wrangler d1 create protectedshare            # put the database_id into wrangler.toml
npx wrangler d1 execute protectedshare --remote --file=schema.sql
npx wrangler deploy                              # also registers the */30 cleanup cron
```

Optional Worker secret: `RESEND_API_KEY`, to email contact-form messages to the admin address.

The `deploy-api.yml` workflow deploys on pushes to `main` that touch the API when `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are set as repository secrets. It does not run migrations.

### Web app

Deploy `apps/web` to any Next.js host, or use the container image that `publish-web-image.yml` pushes to GitHub Container Registry:

```bash
docker pull ghcr.io/kunalsiyag/protectedshare-web:latest
docker run --rm -p 3000:3000 \
  -e API_BACKEND_URL=https://your-api.example.workers.dev \
  ghcr.io/kunalsiyag/protectedshare-web:latest
```

| Variable | When | Purpose |
|---|---|---|
| `API_BACKEND_URL` | runtime | Your Worker's URL. Without it, the proxy falls back to the hosted API. |
| `NEXT_PUBLIC_GA_ID` | build time, optional | Google Analytics. Leave unset to ship without analytics. |

More detail: [protectedshare.me/self-host](https://protectedshare.me/self-host).

## License

[MIT](LICENSE).
