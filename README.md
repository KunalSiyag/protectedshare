# ProtectedShare: Free Secure Notes, Online Notepad & EnvShare

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Lighthouse: 100/100](https://img.shields.io/badge/Lighthouse-100%2F100-success)](https://protectedshare.me)

ProtectedShare is a privacy-first, zero-knowledge open-source web application designed for sharing encrypted secure notes, code snippets, `.env` developer files (EnvShare alternative), and managing a synchronized private notepad. 

All encryption happens directly in the user's browser using the native Web Crypto API (AES-256-GCM) before transmission. Decryption keys and raw master passwords never touch the server, creating a mathematical guarantee of privacy.

---

## Key Features

- **Encrypted Secure Notes & Letters**: Create notes with custom durations and password protection. Perfect for sharing sensitive client data.
- **One-Time Secrets & EnvShare**: Easily share `.env` files, API keys, and configurations. Supports self-destruction after a set number of reads (1 to 10 views).
- **Synchronized Private Notepad**: An encrypted personal scratchpad that syncs across devices (laptop, mobile) using client-side SHA-256 username/password hashing to keep account metadata completely anonymous.
- **True Zero-Tracking**: No analytics cookies, no user registration, and zero trackers. Fully anonymous operations.
- **Lightning-Fast Edge Performance**: Built on Cloudflare Workers and D1 database for global sub-millisecond edge resolution.

---

## Security & Trust Model

ProtectedShare enforces a zero-knowledge trust standard:

1. **Client-Side Cryptography**: Plaintext is encrypted in the browser using **AES-256-GCM** authenticated encryption. Key derivation is handled via **PBKDF2** with **210,000 iterations** and SHA-256.
2. **Zero-Knowledge Syncing**: 
   - Notepad usernames are hashed client-side using a SHA-256 fingerprint. The database only sees a random hash.
   - User passwords are never sent to the server. Instead, a SHA-256 hash digest is generated as a `passwordProof` to authenticate database operations.
3. **Url Hash Protection**: For EnvShare links, the decryption key is stored in the URL hash fragment (`#key`). Browsers never transmit hash fragments to the server, keeping keys entirely local.
4. **Atomic Auto-Destruction**: Items marked as burn-after-read are permanently purged from the database immediately after retrieval.

---

## Monorepo Architecture

The project is structured as a Turborepo monorepo:

- **`apps/web`**: Next.js (App Router) web app optimized for SEO, Core Web Vitals, and accessibility.
- **`apps/api`**: Hono API backend running on Cloudflare Workers.
- **`packages/crypto`**: Shared Web Crypto wrappers for client-side encryption and key derivation.
- **`packages/contracts`**: End-to-end type safety schemas using Zod.
- **`packages/ui`**: Shared UI component library.

---

## Local Development & Installation

### Prerequisites
- Node.js v22+
- npm v10+

### Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/KunalSiyag/protectedshare.git
   cd protectedshare
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Database Migration (Local D1)**:
   Ensure the local Cloudflare D1 SQL schemas are initialized:
   ```bash
   cd apps/api
   npx wrangler d1 execute protectedshare --local --file=schema.sql
   ```

4. **Start the Development Servers**:
   Run the monorepo dev server from the root directory:
   ```bash
   npm run dev
   ```
   - Frontend runs on: `http://localhost:3000`
   - API Worker runs on: `http://localhost:8787`

---

## Production Deployment

### 1. Deploy the API (Cloudflare Workers)
Run migrations on your remote D1 instance and deploy the worker:
```bash
cd apps/api
npx wrangler d1 execute protectedshare --remote --file=schema.sql
npx wrangler deploy
```

### 2. Deploy the Frontend (Vercel / Cloudflare Pages)
Add the following Environment Variables to your deployment dashboard:
- `API_BACKEND_URL`: The URL of your deployed Cloudflare Worker API, used by the Next.js rewrite in `apps/web/next.config.ts`.
- `NEXT_PUBLIC_GA_ID` *(Optional)*: Google Analytics Measurement ID.

### 3. Self-host with Docker
You can also run the web app in a container if you want a reproducible runtime or an internal deployment:

```bash
docker build \
  --build-arg API_BACKEND_URL=https://your-api.example.com \
  -f apps/web/Dockerfile \
  -t protectedshare-web .
docker run --rm -p 3000:3000 protectedshare-web
```

If you do not pass `API_BACKEND_URL`, the build will use the default Cloudflare Worker backend configured in `apps/web/next.config.ts`.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
