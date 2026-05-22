# Product Spec (Current Implementation)

## Primary User Flows

### 1. Secure Notes
- Create at `/notes`
- Read/unlock at `/notes/[id]`
- Client encrypts note content before POST `/api/notes`
- Retrieval requires `id + passwordProof`
- Supports expiry and optional burn-after-read

### 2. One-Time Secrets
- Create at `/secrets`
- Read/unlock at `/secrets/[id]`
- Always burn-after-read
- Client encrypts before POST `/api/secrets`
- Retrieval requires `id + passwordProof`

### 3. Notepad
- Access at `/notepad`
- Username/password encrypted local vault
- Supports note CRUD
- Supports workspace access sharing (copy `/workspace` link + username + password for collaborative editing)
- **Save Offline:** export current note as markdown file
- **Share Online:** publish current note as encrypted note (returns share link + password)

## URL Strategy
- SEO-first URLs are primary: `/notes*`, `/secrets*`
- Legacy URLs remain backward compatible via redirects:
  - `/n*` -> `/notes*`
  - `/s*` -> `/secrets*`
  - `/workspace` -> `/notepad`

## Security Summary
1. Zero-knowledge storage model.
2. Password is not persisted server-side.
3. Password proof check prevents ID-only fetch.
4. Encryption/decryption is performed in user browser.

## Monetization Constraint
If ads are added in future, restrict them to marketing pages only and keep core app flows ad-free.
