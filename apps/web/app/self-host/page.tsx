import { Fragment, type ReactNode } from "react";
import { ArrowUpRight, Container, Database, Globe, Timer } from "lucide-react";
import { buttonVariants } from "@protectedshare/ui";
import CodeBlock from "../../components/code-block";
import { DefinitionList, PageHeader, RailSection } from "../../components/marketing";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Self-Host on Cloudflare",
  description:
    "Run the ProtectedShare API on Cloudflare Workers with D1, R2 and a cleanup cron, and the web app from the container image or your own build.",
  path: "/self-host",
});

const REPO_URL = "https://github.com/KunalSiyag/protectedshare";
const PACKAGE_URL = "https://github.com/kunalsiyag/protectedshare/pkgs/container/protectedshare-web";
const API_WORKFLOW_URL = `${REPO_URL}/blob/main/.github/workflows/deploy-api.yml`;
const WEB_WORKFLOW_URL = `${REPO_URL}/blob/main/.github/workflows/publish-web-image.yml`;

const code = "rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-[0.875em] text-ink";
const linkClass = "font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink";

/** A long setting name that may wrap after an underscore instead of overflowing the term column. */
function SettingName({ children }: { children: string }) {
  return (
    <>
      {children.split("_").map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <>
              _<wbr />
            </>
          ) : null}
          {part}
        </Fragment>
      ))}
    </>
  );
}

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
    body: "A Hono app on Cloudflare Workers with one D1 database and an R2 bucket for file-drop chunks. Stores ciphertext and metadata only.",
  },
  {
    icon: Timer,
    title: "Cleanup cron",
    body: "Runs every 30 minutes and deletes expired shares, drops and their R2 chunks, requests, receipts, idle chat rows and other expired records.",
  },
] as const;

export default function SelfHostPage() {
  return (
    <main className="w-full">
      <PageHeader
        eyebrow="Self-host"
        title="Run your own ProtectedShare"
        lead="Two pieces: a Cloudflare Worker with a D1 database and an R2 bucket for the API, and the Next.js web app pointed at it. Both are in the same MIT-licensed repo."
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
            <Step n={1} title="Create the database and the bucket">
              <p>
                Create a D1 database, then put the <code className={code}>database_id</code> it prints into{" "}
                <code className={code}>apps/api/wrangler.toml</code>. Then create the R2 bucket that holds encrypted
                file-drop chunks. It has to exist before you deploy, or the deploy fails.
              </p>
              <CodeBlock
                label="Terminal"
                code={`cd apps/api\nnpx wrangler d1 create protectedshare\nnpx wrangler r2 bucket create protectedshare-drops`}
              />
              <p>
                Rather keep chunks in D1? Delete the <code className={code}>[[r2_buckets]]</code> block from{" "}
                <code className={code}>wrangler.toml</code>; the API notices and stores them in the database. With R2, a
                lifecycle rule is recommended. It expires anything a delete missed; the cron also sweeps orphaned chunks,
                but each run scans only the first ~10,000 drops in the bucket:
              </p>
              <CodeBlock
                label="Recommended"
                code="npx wrangler r2 bucket lifecycle add protectedshare-drops expire-old-drops drops/ --expire-days 31"
              />
            </Step>

            <Step n={2} title="Apply the schema">
              <p>
                A new database takes the full schema in one go. <code className={code}>schema.sql</code> already includes
                everything from migrations 0001 to 0009.
              </p>
              <CodeBlock code="npx wrangler d1 execute protectedshare --remote --file=schema.sql" label="New database" />
              <p>
                Upgrading an older install? Apply the migrations you&apos;re missing, in order:{" "}
                <code className={code}>0005_v2.sql</code> (receipts, file drops, secret requests, chat rooms),{" "}
                <code className={code}>0006_security.sql</code> (download sessions, the request respond hash),{" "}
                <code className={code}>0007_r2_limits_stats_reports.sql</code> (usage counts, abuse reports, lockouts,
                chunk sizes), <code className={code}>0008_push.sql</code> (read notifications) and{" "}
                <code className={code}>0009_drop_budget.sql</code> (the file-drop spending guard). If one reports a
                duplicate column, that column is already there and you can move on. The Worker also creates missing
                tables and columns on first use.
              </p>
              <CodeBlock
                code={`npx wrangler d1 execute protectedshare --remote --file=migrations/0007_r2_limits_stats_reports.sql
npx wrangler d1 execute protectedshare --remote --file=migrations/0008_push.sql
npx wrangler d1 execute protectedshare --remote --file=migrations/0009_drop_budget.sql`}
                label="Existing database, newest migrations"
              />
            </Step>

            <Step n={3} title="Deploy the Worker">
              <p>
                <code className={code}>wrangler.toml</code> already declares the cleanup cron (
                <code className={code}>*/30 * * * *</code>), Workers observability logs, the R2 binding and six rate
                limiters. Each limiter&apos;s <code className={code}>namespace_id</code> (71001 to 71006) must be unique
                within your Cloudflare account, so change any that clash. Delete a{" "}
                <code className={code}>[[ratelimits]]</code> block to skip that check.
              </p>
              <CodeBlock code="npx wrangler deploy" label="Terminal" />
              <p>
                If your web app uses its built-in <code className={code}>/api</code> proxy, every request reaches the
                Worker from your server&apos;s IP address, so <code className={code}>RL_CREATE</code> (600 new links a
                minute per IP) becomes a cap for the whole site. Raise it or delete it. A host&apos;s rewrite softens this
                but doesn&apos;t remove it: the Worker then sees the host&apos;s shared egress IPs. Setting{" "}
                <code className={code}>NEXT_PUBLIC_API_ORIGIN</code> removes it, because browsers then call the Worker
                themselves.
              </p>
              <p>
                Optional Worker secrets: <code className={code}>RESEND_API_KEY</code> emails contact-form messages and
                abuse reports (without it they&apos;re only saved in D1), and <code className={code}>ADMIN_TOKEN</code>,
                at least 32 characters, turns on <code className={code}>DELETE /api/admin/:kind/:id</code> for takedowns.
                The emails go to <code className={code}>NOTIFY_EMAIL_TO</code> (default admin@protectedshare.me) from{" "}
                <code className={code}>NOTIFY_EMAIL_DOMAIN</code> (default protectedshare.me), which must be a domain
                your Resend account has verified. Those two aren&apos;t secret: set them under{" "}
                <code className={code}>[vars]</code> in <code className={code}>wrangler.toml</code>, or as secrets.
              </p>
              <CodeBlock code={`npx wrangler secret put RESEND_API_KEY\nnpx wrangler secret put ADMIN_TOKEN`} label="Optional" />
            </Step>

            <Step n={4} title="Turn on read notifications (optional)">
              <p>
                Generate a VAPID key pair and store it, with a contact address for push services, as Worker secrets.
                Nothing is written to disk.
              </p>
              <CodeBlock
                label="Terminal"
                code={`npm run vapid:generate
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put VAPID_SUBJECT   # e.g. mailto:you@example.com`}
              />
              <p>
                Then build the web app with <code className={code}>NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> set to the same
                public key. Without the three secrets the API refuses to register browsers; without the web setting the
                notification bell doesn&apos;t appear. Rotating the keys quietly ends existing subscriptions.
              </p>
            </Step>
          </ol>
        </RailSection>

        <RailSection title="Run the web app" description="Use the published image, or build it yourself.">
          <div className="flex max-w-[720px] flex-col gap-4 text-ui text-ink-2">
            <p>
              The image on GitHub Container Registry is the same web app as protectedshare.me, without analytics or read
              notifications: <code className={code}>NEXT_PUBLIC_*</code> settings are baked in when the app is built, and
              the image is built with none. Point it at your Worker with <code className={code}>API_BACKEND_URL</code>,
              read at runtime.
            </p>
            <CodeBlock
              label="Docker"
              code={`docker pull ghcr.io/kunalsiyag/protectedshare-web:latest
docker run --rm -p 3000:3000 \\
  -e API_BACKEND_URL=https://protectedshare-api.<you>.workers.dev \\
  ghcr.io/kunalsiyag/protectedshare-web:latest`}
            />
            <p>
              To build your own image from the repo root (put any <code className={code}>NEXT_PUBLIC_*</code> values in{" "}
              <code className={code}>apps/web/.env.production</code> first):
            </p>
            <CodeBlock label="Docker" code="docker build -f apps/web/Dockerfile -t protectedshare-web ." />
            <p>
              Or deploy <code className={code}>apps/web</code> to any Next.js host with the same{" "}
              <code className={code}>API_BACKEND_URL</code>, and set the build-time settings below there. Leave them
              unset to ship without analytics or notifications. On Vercel, note that{" "}
              <code className={code}>apps/web/vercel.json</code> rewrites <code className={code}>/api</code> straight to
              protectedshare.me&apos;s API Worker. Point that rewrite at your own Worker, or delete the file to use the
              built-in proxy. Better: give the Worker its own domain and set{" "}
              <code className={code}>NEXT_PUBLIC_API_ORIGIN</code> to it, so browsers call it directly and API traffic
              (file drops included) doesn&apos;t count against your web host&apos;s bandwidth.
            </p>
          </div>
        </RailSection>

        <RailSection title="Run the MCP server" description="Optional. For Claude and other MCP clients.">
          <div className="flex max-w-[720px] flex-col gap-4 text-ui text-ink-2">
            <p>
              The remote connector is a second Worker in <code className={code}>apps/mcp</code>. It encrypts in memory
              and passes your API ciphertext and hashes to create a link, and a link&apos;s manage token to check or
              revoke it.
            </p>
            <CodeBlock label="Terminal" code={`cd apps/mcp\nnpx wrangler deploy`} />
            <p>
              Before deploying, edit <code className={code}>apps/mcp/wrangler.toml</code>. Delete the{" "}
              <code className={code}>routes</code> block (it claims <code className={code}>mcp.protectedshare.me</code>)
              and use the workers.dev URL or your own domain. Point <code className={code}>SITE_URL</code> at your web
              app. Keep the <code className={code}>[[services]]</code> binding if your API Worker is{" "}
              <code className={code}>protectedshare-api</code> in the same account; otherwise delete it and set{" "}
              <code className={code}>API_BASE_URL</code> (with neither, it calls protectedshare.me&apos;s API).{" "}
              <code className={code}>ALLOWED_ORIGINS</code> lists the
              hostnames allowed in an Origin header besides localhost. The optional limiters{" "}
              <code className={code}>RL_MCP</code> (600 requests a minute per IP, <code className={code}>namespace_id</code>{" "}
              71101) and <code className={code}>RL_MCP_CREATE</code> (120 calls a minute per IP to the tools that create
              links, 71102) group IPv6 addresses by /64 and must not clash with other limiters in your account. The
              Worker takes one JSON-RPC message per request and refuses batches.
            </p>
            <p>
              The local server needs no deploy: point <code className={code}>npx protectedshare-mcp</code> at your
              instance with <code className={code}>PROTECTEDSHARE_API_URL</code> (https, except for localhost).
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
                term: <SettingName>NEXT_PUBLIC_CF_BEACON_TOKEN</SettingName>,
                detail:
                  "Web app, build time, optional. Cloudflare Web Analytics site token: cookieless, full page loads only, never on share pages. Your privacy page states whether it's on.",
              },
              {
                term: <SettingName>NEXT_PUBLIC_VAPID_PUBLIC_KEY</SettingName>,
                detail: "Web app, build time, optional. The Worker's VAPID public key. Without it, read notifications are off.",
              },
              {
                term: <SettingName>NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION</SettingName>,
                detail: "Web app, build time, optional. Google Search Console verification code for the site's meta tag.",
              },
              {
                term: <SettingName>NEXT_PUBLIC_API_ORIGIN</SettingName>,
                detail:
                  "Web app, build time, optional. The API Worker's own origin, e.g. https://api.example.com. Browsers then call it directly (it's added to the CSP), so API traffic never passes through the web host. Unset, the app relays /api to API_BACKEND_URL.",
              },
              {
                term: "DB",
                detail: "Worker binding to your D1 database, in wrangler.toml.",
              },
              {
                term: "DROPS_BUCKET",
                detail: (
                  <>
                    Worker binding to the R2 bucket for file-drop chunks, in wrangler.toml (<code>[[r2_buckets]]</code>).
                    Delete the block to keep chunks in D1.
                  </>
                ),
              },
              {
                term: (
                  <>
                    <SettingName>DROP_STORAGE_LIMIT_GB</SettingName>, <SettingName>R2_CLASS_A_DAILY_LIMIT</SettingName>,{" "}
                    <SettingName>R2_CLASS_B_DAILY_LIMIT</SettingName>
                  </>
                ),
                detail: (
                  <>
                    Worker variables in wrangler.toml (<code>[vars]</code>), optional. The spending guard: file drops stop
                    taking new uploads or downloads at these caps instead of running up an R2 bill. Defaults: 9 GB stored,
                    30,000 R2 writes and 300,000 reads per UTC day, which stay inside R2&apos;s free allowance for the
                    month. Raising them can cost money.
                  </>
                ),
              },
              {
                term: "RL_AUTH … RL_CREATE",
                detail: (
                  <>
                    Worker, in wrangler.toml (<code>[[ratelimits]]</code>), optional. Per minute: 10 wrong keys or
                    passwords per share, room or notepad (password-protected ones then lock for 10 minutes), 30 room
                    joins and 120 messages per room, 10 answers per request, 5 reports per link (report emails: 5 a
                    minute per Cloudflare location), and 600 creates per client IP (IPv6 by /64). Namespace ids must be
                    unique in your account. A missing block skips that check.
                  </>
                ),
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
                detail: "Worker secret, optional. Emails contact-form messages and abuse reports to NOTIFY_EMAIL_TO through Resend.",
              },
              {
                term: "NOTIFY_EMAIL_TO",
                detail: "Worker variable or secret, optional. Where contact-form and abuse-report emails go. Default admin@protectedshare.me.",
              },
              {
                term: <SettingName>NOTIFY_EMAIL_DOMAIN</SettingName>,
                detail:
                  "Worker variable or secret, optional. The domain those emails are sent from (deals@ and reports@). Default protectedshare.me. It must be verified in your Resend account.",
              },
              {
                term: "ADMIN_TOKEN",
                detail: (
                  <>
                    Worker secret, optional, at least 32 characters. Turns on <code>DELETE /api/admin/:kind/:id</code>{" "}
                    (header <code>X-Admin-Token</code>) to take a share down. Unset or shorter, that route answers 404.
                  </>
                ),
              },
              {
                term: (
                  <>
                    VAPID_PUBLIC_KEY
                    <br />
                    VAPID_PRIVATE_KEY
                    <br />
                    VAPID_SUBJECT
                  </>
                ),
                detail: (
                  <>
                    Worker secrets, optional. Read notifications. Generate the pair with{" "}
                    <code>npm run vapid:generate -w @protectedshare/api</code>; the subject is a <code>mailto:</code> or{" "}
                    <code>https:</code> address push services can reach you at.
                  </>
                ),
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
              secrets. It doesn&apos;t run migrations or create the R2 bucket; do those yourself first.
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
npm run dev:web   # web on http://localhost:3000
npm run dev:mcp   # optional: MCP on http://localhost:8790/mcp`}
            />
            <p>
              Run each dev server in its own terminal. Set <code className={code}>API_BACKEND_URL</code> as above;
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
