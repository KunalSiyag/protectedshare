import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Self-Host ProtectedShare",
  description:
    "Run ProtectedShare on your own infrastructure with a Docker image or by cloning the repository.",
  alternates: {
    canonical: "https://protectedshare.me/self-host",
  },
  openGraph: {
    title: "Self-Host ProtectedShare",
    description:
      "Run ProtectedShare on your own infrastructure with a Docker image or by cloning the repository.",
    url: "https://protectedshare.me/self-host",
    type: "website",
  },
};

const steps = [
  "Clone the repository or pull the published container image.",
  "Set the API backend URL and any optional analytics env vars.",
  "Build and run the web app, then point it at your own deployment.",
];

export default function SelfHostPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <p className="text-xs font-mono uppercase tracking-[0.24em] text-blue-600 dark:text-emerald-400 mb-4">
        Self-Hosting
      </p>
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
        Run ProtectedShare on your own infrastructure.
      </h1>
      <p className="mt-5 text-base md:text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-3xl">
        You can host ProtectedShare yourself if you want tighter control,
        reproducible builds, or an internal deployment for your team. The
        published Docker image is the easiest way to get a known-good runtime,
        but cloning the repository and deploying it manually also works.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step}
            className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 p-5"
          >
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
              Step {index + 1}
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-700 dark:text-zinc-300">
              {step}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950/40 p-6">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
          What the image helps with
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          <li>One repeatable runtime instead of local machine differences.</li>
          <li>Easier onboarding for teams that do not want to install Node first.</li>
          <li>A cleaner path for versioned releases and deployment automation.</li>
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/blog"
          className="inline-flex items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
        >
          Read the blog
        </Link>
        <Link
          href="/secrets"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-zinc-950 hover:bg-blue-700 dark:hover:bg-zinc-100 transition-colors"
        >
          Try the app
        </Link>
      </div>
    </main>
  );
}
