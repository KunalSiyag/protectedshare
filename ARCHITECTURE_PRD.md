# ProtectedShare.me — Product & Architecture PRD

> Canonical planning source: `ai-docs/GLOBAL_CONTEXT.md`. If conflicts exist, follow `GLOBAL_CONTEXT.md`.

## 1. Vision
ProtectedShare is a privacy-first, zero-knowledge web app for:
1. Encrypted secure notes
2. One-time secret sharing
3. Personal workspace notes (offline-first, with optional online sharing)
4. AI text formatting utility

Core principles: no account requirement for shared notes/secrets, local encryption, minimal UX, and trust-first design.

## 2. Stack
- **Frontend:** Next.js App Router (`apps/web`)
- **Backend:** Hono on Cloudflare Workers (`apps/api`)
- **Database:** Cloudflare D1
- **Shared contracts:** Zod + TypeScript (`packages/contracts`)
- **Crypto:** Web Crypto wrappers (`packages/crypto`)

## 3. Security Model
1. Plaintext is encrypted in browser before network transmission.
2. Server stores only encrypted payload + metadata.
3. Password itself is never stored.
4. API access to note/secret payload is protected by `passwordProof` (derived hash proof), preventing ID-only access.
5. Burn-after-read entities are atomically deleted via `DELETE ... RETURNING`.

## 4. Current Route Model

### Public SEO routes (primary)
- `/notes` — create encrypted note
- `/notes/[id]` — unlock/decrypt note
- `/secrets` — create one-time secret
- `/secrets/[id]` — unlock/decrypt one-time secret
- `/notepad` — personal workspace
- `/x-formatter` — AI → X formatter

### Legacy compatibility routes (redirect only)
- `/n` -> `/notes`
- `/n/[id]` -> `/notes/[id]`
- `/s` -> `/secrets`
- `/s/[id]` -> `/secrets/[id]`
- `/workspace` -> `/notepad`

## 5. Notes vs Secrets vs Workspace

### Secure Notes
- Markdown content support
- Configurable expiry
- Optional burn-after-read
- Share URL + password are generated and intended to be shared separately

### One-Time Secrets
- Short sensitive string flow
- Always burn-after-read
- One-time retrieval semantics

### Workspace
- Username/password protected local encrypted vault in browser storage
- Save, edit, delete private notes
- Share workspace access by sharing `/workspace` link + username + password (editable access)
- **Save Offline**: export note as `.md`
- **Share Online**: publish selected workspace note as encrypted online note (separate link/password output)

## 6. Contracts & Data

`CreateNoteRequestSchema` and `CreateSecretRequestSchema` include:
- `payload` (encryptedBlob, iv, salt)
- `passwordProof`
- expiry and burn settings (secret is always burn-after-read)

D1 `notes` and `secrets` tables include:
- `id`, `encrypted_blob`, `iv`, `salt`, `password_proof`, `expires_at`, `created_at`
- `is_burn_after_read` (notes configurable, secrets fixed true)

## 7. Monetization Strategy
Monetization is trust-sensitive:
1. Support-first (Patreon / GitHub Sponsors)
2. Ads only later, and only on marketing pages (never on notes/secrets/workspace flows)

See `MONETIZATION_PLAN.md` for rollout and guardrails.
