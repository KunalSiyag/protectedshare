import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight, Check, Minus } from "lucide-react";
import { buttonVariants, cn } from "@protectedshare/ui";
import AppLink from "../../components/app-link";
import ContactTrigger from "../../components/contact-trigger";
import JsonLd from "../../components/json-ld";
import { breadcrumbJsonLd, faqPageJsonLd, pageMetadata } from "../../lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Pricing",
  description:
    "ProtectedShare is free to use at protectedshare.me and free to self-host under the MIT license. Organizations can ask about a dedicated instance.",
  path: "/pricing",
  keywords: ["protectedshare pricing", "free secret sharing", "self-hosted secret sharing", "dedicated instance"],
});

const GITHUB_URL = "https://github.com/KunalSiyag/protectedshare";

type Plan = {
  name: string;
  price: string;
  priceNote: string;
  forWho: string;
  cta: ReactNode;
  points: string[];
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "Free",
    priceNote: "Hosted at protectedshare.me",
    forWho: "For anyone handing a secret to someone else today.",
    cta: (
      <AppLink href="/notes" className={buttonVariants({ className: "w-full" })}>
        Create a secret
      </AppLink>
    ),
    points: [
      "Every tool: notes, EnvShare, file drops, requests, chat, notepad",
      "Files up to 25 MB per drop",
      "1–100 reads or downloads per link",
      "Links last up to 30 days",
      "Read receipts and revoke from the creating browser",
      "No account, no email",
    ],
  },
  {
    name: "Self-host",
    price: "Free",
    priceNote: "MIT license, your infrastructure",
    forWho: "For teams that want the server under their own control.",
    cta: (
      <AppLink href="/self-host" className={buttonVariants({ variant: "secondary", className: "w-full" })}>
        Read the self-host guide
      </AppLink>
    ),
    points: [
      "The same code that runs protectedshare.me",
      "API on your Cloudflare account: Workers and D1",
      "Web app on any Node host or from the Docker image",
      "Your domain, your logs, your retention",
      "Change the limits in the source if you need to",
      "Support through GitHub issues",
    ],
  },
  {
    name: "Dedicated instance",
    price: "On request",
    priceNote: "Terms agreed case by case",
    forWho: "For organizations that want a deployment of their own.",
    cta: (
      <ContactTrigger className={buttonVariants({ variant: "secondary", className: "w-full" })}>
        Talk to us
      </ContactTrigger>
    ),
    points: [
      "A separate deployment with its own database",
      "Your custom domain",
      "Isolated from the public site's traffic and data",
      "Hosting and terms discussed with you",
    ],
  },
];

const ROWS: { label: string; values: (boolean | string)[] }[] = [
  { label: "All tools", values: [true, true, true] },
  { label: "Encryption in the browser", values: [true, true, true] },
  { label: "Who runs the server", values: ["Us", "You", "Agreed with you"] },
  { label: "Where data is stored", values: ["Our D1 database", "Your D1 database", "A separate database"] },
  { label: "Custom domain", values: [false, true, true] },
  { label: "Account needed", values: [false, false, false] },
];

const FAQS = [
  {
    question: "Is it really free?",
    answer:
      "Yes. Every tool on protectedshare.me is free and there is no paid tier for individuals. There are no ads. The code is MIT licensed, so you can also run it yourself at no cost beyond your own hosting.",
  },
  {
    question: "What are the limits?",
    answer:
      "Links expire after at most 30 days. Notes can burn after the first read; EnvShare secrets and file drops allow 1 to 100 reads or downloads. A file drop holds up to 25 MB. Chat messages are deleted when everyone leaves the room.",
  },
  {
    question: "Why are there no accounts?",
    answer:
      "Because the job doesn't need one. An account would mean storing who you are next to what you share. Links you create are remembered in My links, in your browser only, with a token that lets you check or revoke them.",
  },
  {
    question: "What does a dedicated instance cost?",
    answer:
      "There is no list price. It depends on what you need, so tell us through the contact form and we'll reply by email.",
  },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 text-ink">
        <Check aria-hidden="true" className="size-4 text-ok" strokeWidth={2.25} />
        <span className="sr-only">Yes</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center text-ink-3">
        <Minus aria-hidden="true" className="size-4" strokeWidth={2} />
        <span className="sr-only">No</span>
      </span>
    );
  }
  return <span className="text-ink-2">{value}</span>;
}

export default function PricingPage() {
  return (
    <main className="w-full">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Pricing", path: "/pricing" }])} />
      <JsonLd data={faqPageJsonLd(FAQS)} />

      <header className="max-w-[720px]">
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-3 text-[34px] font-semibold leading-[40px] tracking-[-0.035em] text-ink sm:text-h1">
          Free to use. Free to run yourself.
        </h1>
        <p className="mt-4 text-lead text-ink-2">
          There&apos;s no paid plan and nothing to upgrade. If your organization wants its own deployment, ask.
        </p>
      </header>

      <section aria-label="Plans" className="mt-12 grid overflow-hidden rounded-panel border border-line bg-surface lg:grid-cols-3">
        {PLANS.map((plan, index) => (
          <div
            key={plan.name}
            className={cn("flex min-w-0 flex-col p-6 sm:p-7", index > 0 && "border-t border-line lg:border-l lg:border-t-0")}
          >
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{plan.name}</h2>
            <p className="mt-1 text-small text-ink-3 lg:min-h-[36px]">{plan.forWho}</p>
            <p className="mt-6 text-[32px] font-semibold leading-[36px] tracking-[-0.03em] text-ink">{plan.price}</p>
            <p className="mt-1 text-small text-ink-3">{plan.priceNote}</p>
            <div className="mt-6">{plan.cta}</div>
            <ul className="mt-6 flex flex-col gap-2.5 border-t border-line pt-5">
              {plan.points.map((point) => (
                <li key={point} className="flex gap-2.5 text-small leading-[20px] text-ink-2">
                  <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-ink-3" strokeWidth={2.25} />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="compare-title" className="mt-16">
        <h2 id="compare-title" className="text-h3 text-ink">
          Side by side
        </h2>
        <div className="mt-5 overflow-x-auto rounded-panel border border-line bg-surface">
          <table className="w-full min-w-[620px] border-collapse text-left text-small">
            <thead>
              <tr className="border-b border-line bg-surface-2/50">
                <th scope="col" className="px-4 py-2.5 text-meta font-medium text-ink-3">
                  <span className="sr-only">Feature</span>
                </th>
                {PLANS.map((plan) => (
                  <th key={plan.name} scope="col" className="px-4 py-2.5 text-meta font-medium text-ink-3">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-line last:border-b-0">
                  <th scope="row" className="px-4 py-3 font-medium text-ink">
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td key={index} className="px-4 py-3">
                      <Cell value={value} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="pricing-faq" className="mt-16 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
        <h2 id="pricing-faq" className="text-h3 text-ink">
          Questions
        </h2>
        <dl className="min-w-0 border-t border-line">
          {FAQS.map((item) => (
            <div key={item.question} className="border-b border-line py-5">
              <dt className="text-[16px] font-medium leading-[24px] text-ink">{item.question}</dt>
              <dd className="mt-1.5 max-w-[68ch] text-prose text-ink-2">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-2 text-small text-ink-3">
        <span>Want to check before you trust it?</span>
        <AppLink href="/security" className="inline-flex items-center gap-1 font-medium text-ink hover:underline hover:underline-offset-4">
          Security model <ArrowRight aria-hidden="true" className="size-3.5" />
        </AppLink>
        <a href={GITHUB_URL} className="inline-flex items-center gap-1 font-medium text-ink hover:underline hover:underline-offset-4">
          Source on GitHub <ArrowRight aria-hidden="true" className="size-3.5" />
        </a>
      </p>
    </main>
  );
}
