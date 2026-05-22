# ProtectedShare.me — Global Context

## 1. Product Scope
ProtectedShare is a zero-knowledge sharing and private note utility with:
1. Secure Notes
2. One-Time Secrets
3. Notepad (local encrypted vault + optional online share/export)
4. AI formatter utility

## 2. Architecture
- **Frontend:** Next.js (`apps/web`)
- **Backend:** Hono Worker (`apps/api`)
- **DB:** Cloudflare D1
- **Contracts:** `packages/contracts`
- **Crypto:** `packages/crypto`

## 3. Trust Model
- Plaintext encryption/decryption is client-side.
- Server stores only encrypted payload and metadata.
- Password is never persisted.
- Retrieval APIs require `passwordProof` in addition to `id`.

## 4. Route Strategy

### Primary routes
- `/notes`, `/notes/[id]`
- `/secrets`, `/secrets/[id]`
- `/notepad`
- `/x-formatter`

### Legacy redirects
- `/n`, `/n/[id]`, `/s`, `/s/[id]` redirect to SEO routes.
- `/workspace` redirects to `/notepad`.

## 5. Notepad Behavior
- Local browser storage, encrypted using username/password.
- Supports create/edit/delete.
- Supports editable workspace sharing by sharing `/workspace` link + username + password.
- Supports **Save Offline** (`.md` export).
- Supports **Share Online** (publish as encrypted note with share URL + password).

## 6. Agent Coordination Rules
1. Contracts are source of truth for request/response payloads.
2. Backend and frontend coordinate through contracts only.
3. Formatter route/package ownership remains isolated (`/x-formatter`, `packages/formatting`).
4. Do not reintroduce direct page-to-page imports across route folders for aliases; use redirects for legacy paths.
