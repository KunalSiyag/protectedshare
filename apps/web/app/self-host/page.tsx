import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Deploy ProtectedShare",
  description:
    "Deploy your own hosted ProtectedShare using the GitHub Container Registry package published by CI/CD.",
  alternates: {
    canonical: "https://protectedshare.me/self-host",
  },
  openGraph: {
    title: "Deploy ProtectedShare",
    description:
      "Deploy your own hosted ProtectedShare using the GitHub Container Registry package published by CI/CD.",
    url: "https://protectedshare.me/self-host",
    type: "website",
  },
};

const packageUrl =
  "https://github.com/kunalsiyag/protectedshare/pkgs/container/protectedshare-web";
const actionsUrl = "https://github.com/kunalsiyag/protectedshare/actions";

const steps = [
  {
    title: "1. Publish the GitHub package",
    description:
      "Merge to main or push a version tag. GitHub Actions builds and publishes the web image to GitHub Container Registry automatically.",
    cta: "Open the workflow",
    href: actionsUrl,
  },
  {
    title: "2. Set your backend URL",
    description:
      "Point the container at your API backend with API_BACKEND_URL. If you use the hosted backend, you can skip this step.",
    cta: "View the package",
    href: packageUrl,
  },
  {
    title: "3. Run or deploy the image",
    description:
      "Pull ghcr.io/kunalsiyag/protectedshare-web:latest and deploy it to your host, VPS, or container platform.",
    cta: "Copy the pull command",
    href: "#pull-command",
  },
] as const;

export default function SelfHostPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-mono uppercase tracking-[0.24em] text-blue-600 dark:text-emerald-400 mb-4">
          Self-Hosting
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          Deploy ProtectedShare with a CI-built GitHub package.
        </h1>
        <p className="mt-5 text-base md:text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          This is the path for the new site: no legacy shortcuts, no manual
          source rebuild required for every deployment, and a package you can
          pull from GitHub Container Registry.
        </p>
      </div>

      <section className="mt-14 relative">
        <div className="absolute left-1/2 top-0 bottom-0 hidden md:block w-px bg-blue-500/20 dark:bg-emerald-400/20 -translate-x-1/2" />
        <div className="space-y-12 md:space-y-16">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className="relative md:grid md:grid-cols-[1fr_auto_1fr] md:items-center"
            >
              <div className="hidden md:flex justify-end pr-10">
                {index % 2 === 0 ? (
                  <div className="max-w-lg text-right">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                      {step.title}
                    </h2>
                    <p className="mt-3 text-sm md:text-base leading-7 text-zinc-600 dark:text-zinc-400">
                      {step.description}
                    </p>
                    <div className="mt-4">
                      <Link
                        href={step.href}
                        className="inline-flex items-center justify-center rounded-md bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                      >
                        {step.cta}
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="hidden md:flex items-center justify-center">
                <div className="relative z-10 w-7 h-7 rounded-full border border-blue-500 dark:border-emerald-400 bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-emerald-400">
                  {index + 1}
                </div>
              </div>

              <div className="md:pl-10">
                {index % 2 === 1 ? (
                  <div className="max-w-lg">
                    <div className="md:hidden mb-3 inline-flex items-center justify-center w-7 h-7 rounded-full border border-blue-500 dark:border-emerald-400 text-xs font-semibold text-blue-600 dark:text-emerald-400">
                      {index + 1}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                      {step.title}
                    </h2>
                    <p className="mt-3 text-sm md:text-base leading-7 text-zinc-600 dark:text-zinc-400">
                      {step.description}
                    </p>
                    <div className="mt-4">
                      <Link
                        href={step.href}
                        className="inline-flex items-center justify-center rounded-md bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                      >
                        {step.cta}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-lg md:hidden">
                    <div className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-blue-500 dark:border-emerald-400 text-xs font-semibold text-blue-600 dark:text-emerald-400 mb-3">
                      {index + 1}
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
                      {step.title}
                    </h2>
                    <p className="mt-3 text-sm md:text-base leading-7 text-zinc-600 dark:text-zinc-400">
                      {step.description}
                    </p>
                    <div className="mt-4">
                      <Link
                        href={step.href}
                        className="inline-flex items-center justify-center rounded-md bg-zinc-900 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
                      >
                        {step.cta}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
          <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
            Why the package is better than cloning the repo
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
            <li>It gives you one reproducible artifact from CI/CD.</li>
            <li>You skip local installs, workspace setup, and dependency drift.</li>
            <li>Updates are versioned and easier to roll back.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-6">
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
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link
          href={packageUrl}
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
        >
          Open GitHub package
        </Link>
        <Link
          href={actionsUrl}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors"
        >
          View CI/CD workflow
        </Link>
      </div>
    </main>
  );
}
