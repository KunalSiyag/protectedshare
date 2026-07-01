# ProtectedShare: Zero-Knowledge Secure Notes, Online Notepad & EnvShare

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Lighthouse: 100/100](https://img.shields.io/badge/Lighthouse-100%2F100-success)](https://protectedshare.me)
[![Next.js: 15](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare)](https://workers.cloudflare.com)

ProtectedShare is a modern, open-source, privacy-first zero-knowledge web application designed for secure communication, credential sharing, and private drafting. It serves as a high-performance alternative to legacy platforms like **ProtectedText**, **Privnote**, and **EnvShare**.

All encryption and decryption routines execute entirely client-side in the user's browser using standard W3C Web Crypto APIs. Secret keys never cross the network, providing mathematical guarantees of absolute privacy.

---

## 🚀 Key Features

*   **🔒 Secure Notes & Letters:** Create password-locked messages with custom TTL expirations and optional burn-after-reading. Perfect for safe two-channel password delivery.
*   **💻 EnvShare (Developer Credentials):** Share `.env` files, API keys, database strings, and configurations. Decryption keys are kept in the URL hash fragment (`#key`) which browsers never send to server networks. Supports configurable read limits (1 to 10 views).
*   **📝 Offline-First Encrypted Notepad:** A fully functional online scratchpad with rich markdown rendering, local browser storage persistence, and cloud synchronization.
*   **⚡ Edge-Optimized Architecture:** Backend powered by Cloudflare Workers and Cloudflare D1 SQL databases for globally distributed, low-latency, and isolated serverless performance.
*   **🍪 Zero-Tracking Privacy:** 100% cookie-free, tracker-free, and account-free. No email addresses or personal information are collected.

---

## 🛡️ Technical Security & Cryptographic Model

ProtectedShare operates on a strict zero-knowledge model. The server acts strictly as an ephemeral storage courier for ciphertext.

```
[Plaintext Data] 
       │
       ▼ (Browser Runtime)
[PBKDF2 Key Derivation] ──► Derived Key (256-bit AES)
       │
       ▼ (Web Crypto API)
[AES-256-GCM Encryption] ──► Ciphertext + IV + Salt ──► Uploaded to Server
```

### 1. Key Derivation & Encryption Standard
*   **PBKDF2 Key Stretching:** Passwords are stretched using **PBKDF2** with **210,000 iterations**, salt, and a SHA-256 digest wrapper to protect against offline dictionary attacks.
*   **AES-256-GCM Authenticated Encryption:** The stretched key encrypts plaintext locally using Galois/Counter Mode (GCM). This mode provides message integrity authentication, preventing ciphertext tampering attacks.

### 2. URL Hash Key Delivery
For one-click sharing links, the derived key is appended as a URL hash fragment (`https://protectedshare.me/secrets/[id]#key`). According to HTTP specifications, everything after the `#` character remains local to the browser and is **never** sent to the hosting network, proxies, or databases.

### 3. Ephemeral Auto-Destruction
*   **Burn-After-Read:** Immediately upon database retrieval, the worker executes a transactional delete query, wiping the ciphertext, IV, and salt from SQLite tables.
*   **TTL Expirations:** Inactive secrets are automatically deleted by a cleanup process once their expiration timestamp is reached.

---

## 🔄 Multi-Device Sync & Conflict Resolution (OCC)

The synchronized Notepad supports multi-device updates using **Optimistic Concurrency Control (OCC)** coupled with a **Last-Write-Wins (LWW) Element Set CRDT** merge mechanism.

### How Conflict Detection Works:
1.  **Versioning:** Every workspace record stores an `updated_at` unix epoch timestamp representing its version.
2.  **State Tracking:** When the client pulls notes, it caches the `updatedAt` version.
3.  **Conflict Prevention:** When saving, the client sends the `lastKnownUpdatedAt` timestamp. The server verifies this against the current record:
    ```sql
    -- Fails to update if database version > client version
    UPDATE workspaces
    SET vault_blob = ?, vault_iv = ?, vault_salt = ?, updated_at = ?
    WHERE username = ? AND updated_at = ?;
    ```
4.  **Auto-Merging:** If a conflict occurs (HTTP 409 `SYNC_CONFLICT`), the client receives the newer server vault, decrypts it locally, and merges the lists automatically by comparing timestamps for matching note IDs. It then writes the merged list back to the server, preserving all changes without data loss.

---

## 📂 Monorepo Structure

ProtectedShare is organized as a Turborepo monorepo:

```
├── apps
│   ├── web/        # Next.js 15 App Router frontend (TailwindCSS, SEO optimized)
│   └── api/        # Hono API backend deployed to Cloudflare Workers (SQLite/D1)
└── packages
    ├── crypto/     # Shared Web Crypto wrapper for AES-GCM and PBKDF2
    ├── contracts/  # Zod schema definitions for API payloads
    ├── ui/         # Reusable React components built on Tailwind
    └── formatting/ # Utility modules for string parsing
```

---

## 💻 Local Development & Installation

### Prerequisites
*   Node.js v22+
*   npm v10+

### Setup Instructions

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/KunalSiyag/protectedshare.git
    cd protectedshare
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Initialize Local D1 SQLite Database:**
    Generate local D1 schema migrations:
    ```bash
    cd apps/api
    npx wrangler d1 execute protectedshare --local --file=schema.sql
    ```

4.  **Start Dev Servers:**
    Return to the root directory and boot up the Monorepo dev stack:
    ```bash
    cd ../..
    npm run dev
    ```
    *   **Next.js Frontend:** `http://localhost:3000`
    *   **Cloudflare Worker API:** `http://localhost:8787`

---

## 🌐 Production Deployment

### 1. Deploy the API Backend (Cloudflare Workers)
Create a D1 database, apply migrations, and deploy the worker API:
```bash
cd apps/api
npx wrangler d1 create protectedshare
# Copy the database_id from output and paste it into wrangler.toml
npx wrangler d1 execute protectedshare --remote --file=schema.sql
npx wrangler deploy
```

Set up these secrets in GitHub if deploying via CI workflows (`deploy-api.yml`):
*   `CLOUDFLARE_API_TOKEN`
*   `CLOUDFLARE_ACCOUNT_ID`

### 2. Deploy the Next.js Frontend
Deploy `apps/web` to Vercel, Netlify, or Cloudflare Pages. 

**Configure Environment Variables:**
*   `API_BACKEND_URL`: The absolute HTTPS endpoint URL of your deployed Worker backend.
*   `NEXT_PUBLIC_GA_ID` *(Optional)*: Google Analytics Measurement ID.

### 3. Deploy via Docker Container
We publish frontend container builds to GitHub Container Registry. Pull the image and bind it to your deployed worker API at runtime:
```bash
docker pull ghcr.io/kunalsiyag/protectedshare-web:latest
docker run --rm -p 3000:3000 \
  -e API_BACKEND_URL=https://your-api.example.com \
  ghcr.io/kunalsiyag/protectedshare-web:latest
```

---

## 📄 License

Licensed under the [MIT License](LICENSE). Transparency and user security come first.
