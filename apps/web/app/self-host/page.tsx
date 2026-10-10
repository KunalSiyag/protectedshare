import type { ReactNode } from "react";
import { ArrowUpRight, Container, Database, Globe, Timer } from "lucide-react";
import { buttonVariants } from "@protectedshare/ui";
import CodeBlock from "../../components/code-block";
import { DefinitionList, PageHeader, RailSection } from "../../components/marketing";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Self-Host on Cloudflare",
  description:
    "Run the ProtectedShare API as a Cloudflare Worker with D1 and a 30-minute cleanup cron, and the web app from the GitHub Container Registry image or your own build.",
  path: "/self-host",
});

const REPO_URL = "https://github.com/KunalSiyag/protectedshare";
const PACKAGE_URL = "https://github.com/kunalsiyag/protectedshare/pkgs/container/protectedshare-web";
const API_WORKFLOW_URL = `${REPO_URL}/blob/main/.github/workflows/deploy-api.yml`;
const WEB_WORKFLOW_URL = `${REPO_URL}/blob/main/.github/workflows/publish-web-image.yml`;

const code = "rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-[0.875em] text-ink";
const linkClass = "font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink";

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="relative grid grid-cols-[28px_minmax(0,1fr)] gap-4 pb-10 last:pb-0">
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-[13.5px] top-8 w-px bg-line [li:last-child>&]:hidden"
      />
      <span className="tabular relative flex size-7 items-center justify-center rounded-full border border-line-strong bg-surface text-meta font-semibold text-ink">
        {n}
      </span>
      <div className="min-w-0 pt-0.5">
        <h3 className="text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink">{title}</h3>
        <div className="mt-2 flex flex-col gap-3 text-ui text-ink-2">{children}</div>
      </div>
    </li>
  );
}

const PIECES = [
  {
    icon: Globe,
    title: "Web app",
    body: "Next.js. All encryption runs here, in the visitor's browser. It proxies /api/* to your API.",
  },
  {
    icon: Database,
    title: "API",
    body: "A Hono app on Cloudflare Workers with one D1 database. Stores ciphertext and metadata only.",
  },
  {
    icon: Timer,
    title: "Cleanup cron",
    body: "Runs every 30 minutes and deletes expired shares, drops, requests, receipts and idle chat rows.",
  },
] as const;

export default function SelfHostPage() {
  return (
    <main className="w-full">
      <PageHeader
        eyebrow="Self-host"
        title="Run your own ProtectedShare"
        lead="Two pieces: a Cloudflare Worker with a D1 database for the API, and the Next.js web app pointed at it. Both are in the same MIT-licensed repo."
      >
        <a href={REPO_URL} className={buttonVariants({ variant: "primary" })}>
          Open the repo
        </a>
        <a href={PACKAGE_URL} className={buttonVariants({ variant: "secondary" })}>
          <Container aria-hidden="true" />
          Container image
        </a>
      </PageHeader>

      <section aria-label="What you deploy" className="mt-12 grid gap-px overflow-hidden rounded-panel border border-line bg-line sm:grid-cols-3">
        {PIECES.map((piece) => {
          const Icon = piece.icon;
          return (
            <div key={piece.title} className="bg-bg p-5">
              <Icon aria-hidden="true" className="size-[18px] text-ink-3" strokeWidth={1.75} />
              <h2 className="mt-3 text-[15px] font-semibold tracking-[-0.01em] text-ink">{piece.title}</h2>
              <p className="mt-1 text-small text-ink-2">{piece.body}</p>
            </div>
          );
        })}
      </section>

      <div className="mt-14">
        <RailSection
          title="Deploy the API"
          description="Needs a Cloudflare account and Node 22. Run these from apps/api."
        >
          <ol className="max-w-[720px]">
            <Step n={1} title="Create the database">
              <p>
                Create a D1 database, then put the <code className={code}>database_id</code> it prints into{" "}
                <code className={code}>apps/api/wrangler.toml</code>.
              </p>
              <CodeBlock label="Terminal" code={`cd apps/api\nnpx wrangler d1 create protectedshare`} />
            </Step>

            <Step n={2} title="Apply the schema">
              <p>
                A new database takes the full schema in one go. <code className={code}>schema.sql</code> already includes
                everything from migrations 0001 to 0005.
              </p>
              <CodeBlock code="npx wrangler d1 execute protectedshare --remote --file=schema.sql" label="New database" />
              <p>
                Upgrading an older install? Apply the migrations you&apos;re missing, in order. For v2 that&apos;s{" "}
                <code className={code}>0005_v2.sql</code>, which adds receipts, file drops, secret requests, chat rooms
                and the v2 columns. If it reports a duplicate column, that column is already there and you can move on.
                The Worker also creates missing tables and columns on first use.
              </p>
              <CodeBlock
                code="npx wrangler d1 execute protectedshare --remote --file=migrations/0005_v2.sql"
                label="Existing database"
              />
            </Step>

            <Step n={3} title="Deploy the Worker">
              <p>
                <code className={code}>wrangler.toml</code> already declares the cleanup cron (
                <code className={code}>*/30 * * * *</code>) and turns on Workers observability logs. Change either before
                deploying if you want different behavior.
              </p>
              <CodeBlock code="npx wrangler deploy" label="Terminal" />
              <p>
                Optional: set <code className={code}>RESEND_API_KEY</code> as a Worker secret if you want contact-form
                messages emailed to you. Without it they&apos;re only saved in D1.
              </p>
            </Step>
          </ol>
        </RailSection>

        <RailSection title="Run the web app" description="Use the published image, or build it yourself.">
          <div className="flex max-w-[720px] flex-col gap-4 text-ui text-ink-2">
            <p>
              The image on GitHub Container Registry is the same web app as protectedshare.me, without analytics. Point it
              at your Worker with <code className={code}>API_BACKEND_URL</code>, read at runtime.
            </p>
            <CodeBlock
              label="Docker"
              code={`docker pull ghcr.io/kunalsiyag/protectedshare-web:latest
docker run --rm -p 3000:3000 \\
  -e API_BACKEND_URL=https://protectedshare-api.<you>.workers.dev \\
  ghcr.io/kunalsiyag/protectedshare-web:latest`}
            />
            <p>To build your own image from the repo root:</p>
            <CodeBlock label="Docker" code="docker build -f apps/web/Dockerfile -t protectedshare-web ." />
            <p>
              Or deploy <code className={code}>apps/web</code> to any Next.js host with the same{" "}
              <code className={code}>API_BACKEND_URL</code>. <code className={code}>NEXT_PUBLIC_GA_ID</code> turns on
              Google Analytics, and it&apos;s read at build time. Leave it unset to ship without analytics.
            </p>
          </div>
        </RailSection>

        <RailSection title="Settings" description="Everything you can configure.">
          <DefinitionList
            termClassName="font-mono text-[12.5px]"
            items={[
              {
                term: "API_BACKEND_URL",
                detail: "Web app, runtime. Base URL of your Worker. The app proxies /api/* to it. If unset, it falls back to the hosted protectedshare.me API, so always set it.",
              },
              {
                term: "NEXT_PUBLIC_GA_ID",
                detail: "Web app, build time, optional. Google Analytics measurement id. Your privacy page states whether it's on.",
              },
              {
                term: "DB",
                detail: "Worker binding to your D1 database, in wrangler.toml.",
              },
              {
                term: "[triggers] crons",
                detail: (
                  <>
                    Worker, in wrangler.toml. Defaults to <code>*/30 * * * *</code>. Reads past expiry are refused either
                    way; the cron frees the storage.
                  </>
                ),
              },
              {
                term: "RESEND_API_KEY",
                detail: "Worker secret, optional. Emails contact-form messages to the admin address.",
              },
            ]}
          />
        </RailSection>

        <RailSection title="Deploy from GitHub" description="Optional. The repo ships two workflows.">
          <div className="flex max-w-[720px] flex-col gap-4 text-ui text-ink-2">
            <p>
              <a href={API_WORKFLOW_URL} className={linkClass}>
                deploy-api.yml
              </a>{" "}
              deploys the Worker on pushes to main that touch the API, if the repository has{" "}
              <code className={code}>CLOUDFLARE_API_TOKEN</code> and <code className={code}>CLOUDFLARE_ACCOUNT_ID</code>{" "}
              secrets. It doesn&apos;t run migrations; apply those yourself.
            </p>
            <p>
              <a href={WEB_WORKFLOW_URL} className={linkClass}>
                publish-web-image.yml
              </a>{" "}
              builds the web image and pushes it to your fork&apos;s GitHub Container Registry.
            </p>
          </div>
        </RailSection>

        <RailSection title="Run it locally">
          <div className="flex max-w-[720px] flex-col gap-4 text-ui text-ink-2">
            <CodeBlock
              label="Terminal"
              code={`npm install
cd apps/api && npx wrangler d1 execute protectedshare --local --file=schema.sql && cd ../..
echo "API_BACKEND_URL=http://localhost:8787" > apps/web/.env.local
npm run dev:api   # API on http://localhost:8787
npm run dev:web   # web on http://localhost:3000`}
            />
            <p>
              Run the two dev servers in separate terminals. Set <code className={code}>API_BACKEND_URL</code> as above;
              without it the web app proxies to the hosted API.
            </p>
            <a
              href={`${REPO_URL}#readme`}
              className="inline-flex items-center gap-1 text-small font-medium text-ink-2 transition-colors hover:text-ink"
            >
              Full README on GitHub
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </a>
          </div>
        </RailSection>
      </div>
    </main>
  );
}
