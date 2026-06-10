import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Deploy ProtectedShare",
  description:
    "Deploy the ProtectedShare web package from GitHub Container Registry and the backend Cloudflare Worker separately for a fully self-hosted setup.",
  alternates: {
    canonical: "https://protectedshare.me/self-host",
  },
  openGraph: {
    title: "Deploy ProtectedShare",
    description:
      "Deploy the ProtectedShare web package from GitHub Container Registry and the backend Cloudflare Worker separately for a fully self-hosted setup.",
    url: "https://protectedshare.me/self-host",
    type: "website",
  },
};

const webPackageUrl =
  "https://github.com/kunalsiyag/protectedshare/pkgs/container/protectedshare-web";
const webActionsUrl =
  "https://github.com/kunalsiyag/protectedshare/actions/workflows/publish-web-image.yml";
const apiActionsUrl =
  "https://github.com/kunalsiyag/protectedshare/actions/workflows/deploy-api.yml";

const webSteps = [
  {
    title: "1. Publish the web package",
    description:
      "Push to main or tag a release. GitHub Actions builds the Next.js web app and publishes it to GitHub Container Registry.",
  },
  {
    title: "2. Pull the image",
    description:
      "Use ghcr.io/kunalsiyag/protectedshare-web:latest to run the same frontend you see on the hosted site.",
  },
  {
    title: "3. Point it at a backend",
    description:
      "Set API_BACKEND_URL at runtime so the web app talks to your own Worker deployment or the hosted backend.",
  },
] as const;

const apiSteps = [
  {
    title: "1. Create your Cloudflare Worker",
    description:
      "Use apps/api as the backend project. It needs a Cloudflare account, a Worker, and a D1 database binding.",
  },
  {
    title: "2. Apply schema and configure D1",
    description:
      "Create a D1 database, bind it in wrangler.toml, and apply schema.sql before your first deploy.",
  },
  {
    title: "3. Deploy with Wrangler or CI",
    description:
      "Deploy the Worker manually or with the API workflow so the frontend package has a backend to talk to.",
  },
] as const;

export default function SelfHostPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12 md:py-20">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-blue-600 dark:text-emerald-400 mb-4">
          Self-Hosting
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          Deploy the web app and backend separately.
        </h1>
        <p className="mt-5 text-base md:text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          For full transparency, the GitHub package ships the frontend only.
          The backend is a separate Cloudflare Worker with its own D1 database.
          If you want a fully self-hosted deployment, you need both pieces.
        </p>
      </div>

      <section className="mt-10 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/5 p-6">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
          What the package does and does not include
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/50 p-4">
            <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
              Included
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              <li>The Next.js frontend and all public pages.</li>
              <li>Browser-side encryption, notes, blog, and marketing UI.</li>
              <li>The runtime proxy that points `/api/*` at a backend URL.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/50 p-4">
            <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
              Not included
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              <li>The Cloudflare Worker backend.</li>
              <li>The D1 database and its data.</li>
              <li>Any production secrets or account credentials.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
            Frontend package
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            This package is what most people will pull from GitHub Container
            Registry. It gives them the same website you see here, but it still
            needs a backend to be fully functional.
          </p>

          <div className="mt-6 space-y-5">
            {webSteps.map((step, index) => (
              <div
                key={step.title}
                className="flex gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-500 dark:border-emerald-400 text-xs font-semibold text-blue-600 dark:text-emerald-400">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={webPackageUrl}
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
            >
              Open package
            </Link>
            <Link
              href={webActionsUrl}
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
            >
              View web workflow
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-xl font-bold text-zinc-950 dark:text-white">
            Backend deployment
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            The backend is a Cloudflare Worker. That means it should be deployed
            separately, then the frontend package should be pointed at it with
            <code className="mx-1 rounded bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 text-xs">
              API_BACKEND_URL
            </code>
            .
          </p>

          <div className="mt-6 space-y-5">
            {apiSteps.map((step, index) => (
              <div
                key={step.title}
                className="flex gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-500 dark:border-emerald-400 text-xs font-semibold text-blue-600 dark:text-emerald-400">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={apiActionsUrl}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors"
            >
              View API workflow
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
            >
              Read the docs blog
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
          Full stack self-host flow
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          <li>Deploy the backend Worker and create or bind its D1 database.</li>
          <li>Publish or pull the web package from GitHub Container Registry.</li>
          <li>Set <code className="rounded bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 text-xs">API_BACKEND_URL</code> to the backend URL.</li>
          <li>Run the web container and confirm the frontend can reach the backend.</li>
        </ol>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
          Pull command
        </h2>
        <pre
          id="pull-command"
          className="mt-4 overflow-x-auto rounded-xl bg-zinc-950 text-zinc-100 p-4 text-xs leading-6"
        >
          <code>{`docker pull ghcr.io/kunalsiyag/protectedshare-web:latest
docker run --rm -p 3000:3000 \
  -e API_BACKEND_URL=https://your-api.example.com \
  ghcr.io/kunalsiyag/protectedshare-web:latest`}</code>
        </pre>
      </section>

      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link
          href={webPackageUrl}
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
        >
          Open GitHub package
        </Link>
        <Link
          href={apiActionsUrl}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors"
        >
          Open API workflow
        </Link>
      </div>
    </main>
  );
}
