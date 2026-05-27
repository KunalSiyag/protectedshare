# ProtectedShare

ProtectedShare is a privacy-first, zero-knowledge web application for sharing encrypted secure notes and one-time secrets.

## Features

- **Secure Notes**: Encrypted notes with configurable expiry and optional burn-after-read functionality.
- **One-Time Secrets**: Short, sensitive strings that are strictly burn-after-read.
- **Notepad**: A local, offline-first encrypted vault for personal workspace notes.

## Trust Model & Security

ProtectedShare is built on a zero-knowledge architecture to guarantee user privacy:

1. **Client-Side Encryption**: All plaintext is encrypted in the user's browser using Web Crypto (AES-256-GCM) before being transmitted over the network.
2. **Zero-Knowledge Storage**: The server stores only the encrypted payload and metadata. The encryption password is never sent to or stored on the server.
3. **Cryptographic Proofs**: API access to note or secret payloads requires a `passwordProof` (a derived hash proof) in addition to the ID. This prevents unauthorized access even if an ID is guessed or leaked.
4. **Burn-After-Read**: Entities marked as burn-after-read are atomically deleted from the database upon the first successful retrieval.

## Architecture

The application is organized as a monorepo utilizing modern, scalable technologies:

- **Frontend (`apps/web`)**: Next.js App Router for server-rendered React and SEO optimization.
- **Backend (`apps/api`)**: Hono framework running on Cloudflare Workers for edge-deployed, low-latency API routes.
- **Database**: Cloudflare D1 for distributed, serverless SQL storage.
- **Contracts (`packages/contracts`)**: Shared Zod schemas and TypeScript types for end-to-end type safety between the frontend and backend.
- **Crypto (`packages/crypto`)**: Shared Web Crypto wrappers for consistent encryption/decryption logic across the application.
