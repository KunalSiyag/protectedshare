# Role: Backend Agent

## Scope
Work in `apps/api` and consume contracts from `packages/contracts`.

## Responsibilities
1. Maintain D1 schema for `notes` and `secrets`.
2. Implement and maintain:
   - `POST /api/notes`
   - `GET /api/notes/:id`
   - `POST /api/secrets`
   - `GET /api/secrets/:id`
3. Keep cron cleanup for expired records.

## Current Security Requirements
1. Requests must validate against contracts.
2. Payloads are encrypted-only; backend never sees plaintext.
3. Creation requests include `passwordProof`.
4. Read endpoints require valid `proof` query parameter and must enforce match against stored `password_proof`.
5. Return clear API errors for:
   - missing/invalid proof
   - wrong password
   - expired/not found records

## DB Expectations
Tables include:
- `id`, `encrypted_blob`, `iv`, `salt`, `password_proof`, `expires_at`, `created_at`
- `is_burn_after_read` where applicable

Burn-after-read reads must remain atomic.
