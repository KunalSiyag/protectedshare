# Role: Frontend Agent

## Scope
Work only in `apps/web` and `packages/ui` (except formatter-owned route/files).

## Route Ownership
- Primary routes: `/notes`, `/notes/[id]`, `/secrets`, `/secrets/[id]`, `/notepad`
- Legacy routes `/n*` and `/s*` are redirect-only compatibility routes.
- `/workspace` is a redirect compatibility alias to `/notepad`.
- Do not modify `apps/web/app/x-formatter/**`.

## Responsibilities
1. Build secure UX for note/secret create + unlock flows.
2. Keep share links on SEO routes (`/notes/...`, `/secrets/...`).
3. Workspace UX must support:
   - local encrypted storage with username/password
   - note CRUD
   - editable workspace sharing via `/workspace` link + username/password
   - offline `.md` export
   - online share generation via notes API
4. Keep accessibility and responsive behavior intact.

## Security Rules
- Never send plaintext in API requests.
- Always encrypt content in browser before POST.
- For retrieval flows, send `passwordProof` query param to API and decrypt only client-side.

## Implementation Rules
- Prefer route redirects for aliases; avoid importing one route page directly from another route for compatibility paths.
- Use shared contracts and crypto package types/functions.
