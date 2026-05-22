# Role: Infrastructure Agent

## TASK OVERVIEW
Your task is to scaffold the foundational monorepo structure for ProtectedShare.me.

## CONTEXT
Please refer to `GLOBAL_CONTEXT.md` for the overarching architecture.

## RESPONSIBILITIES
1. Initialize the monorepo (e.g., using `npm workspaces` or Turborepo) at the root.
2. Create the `apps/web` Next.js (App Router) project with Tailwind CSS.
3. Create the `apps/api` Cloudflare Workers (Hono) project.
4. Scaffold the `packages/contracts`, `packages/crypto`, `packages/ui`, and `packages/formatting` directories with basic `package.json` and `tsconfig.json` files.
5. Ensure that `apps/web` and `apps/api` can properly import from `packages/contracts` and `packages/crypto`.

## RULES
- Do not write business logic or UI components.
- Focus strictly on configuration files, linting, TypeScript paths, and workspace linking.
- Keep the setup as minimal and fast as possible.
