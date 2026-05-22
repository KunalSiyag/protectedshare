# Role: Contracts & Crypto Agent

## Scope
Work only in:
- `packages/contracts`
- `packages/crypto`

## Contracts Responsibilities
Define and maintain Zod schemas + inferred TS types for API payloads.

Current key requirement:
- `CreateNoteRequestSchema` and `CreateSecretRequestSchema` include `passwordProof` along with encrypted payload and metadata fields.

## Crypto Responsibilities
Maintain portable Web Crypto helpers:
1. `encrypt(plaintext, password)` -> encrypted payload
2. `decrypt(encryptedBlob, password, iv, salt)` -> plaintext
3. `generateRandomPassword(length)`
4. `derivePasswordProof(password)` -> proof string for API retrieval validation

## Rules
- No plaintext storage helpers.
- No runtime-specific dependencies that break browser/worker compatibility.
- Keep payload output format aligned with contracts.
