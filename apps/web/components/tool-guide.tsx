import type { ReactNode } from "react";
import { cn } from "@protectedshare/ui";
import AppLink from "./app-link";
import JsonLd from "./json-ld";
import { SITE_URL, breadcrumbJsonLd, faqPageJsonLd } from "../lib/seo";
import { ContentSection, Faq, PointList, RelatedTools, type FaqItem } from "../app/tools/_components/tool-content";

export type ToolGuideStep = { title: string; body: ReactNode };
export type ToolGuidePoint = { title: string; body: ReactNode };
export type ToolGuideFact = { label: string; value: ReactNode };
export type ToolGuideLink = { href: string; title: string; body: string };

export type ToolGuideProps = {
  /** WebApplication name, e.g. "ProtectedShare Secure Notes". */
  appName: string;
  /** Route path, e.g. "/notes". Used for the canonical URL in JSON-LD. */
  path: string;
  /** One or two sentences for the WebApplication description. */
  description: string;
  /** WebApplication featureList: short, true statements. */
  features: string[];
  /** Last breadcrumb label, e.g. "Secure notes". */
  breadcrumb: string;
  how: { title: string; steps: readonly [ToolGuideStep, ToolGuideStep, ToolGuideStep] };
  uses: { title: string; items: readonly ToolGuidePoint[] };
  limits: { title: string; items: readonly ToolGuideFact[]; footnote?: ReactNode };
  /** Plain-text answers: the same items feed the visible FAQ and the FAQPage JSON-LD. */
  faq: { title: string; items: readonly FaqItem[] };
  related: readonly ToolGuideLink[];
  /**
   * Give sections ids (#how-it-works, #faq…) for deep links. Off on /chat, where any bare
   * #fragment is read as a room ID, so a link like /chat#faq would prefill "faq" as an invite.
   */
  anchors?: boolean;
  className?: string;
};

function Steps({ steps }: { steps: readonly ToolGuideStep[] }) {
  return (
    <ol className="grid gap-x-8 gap-y-7 sm:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title} className="min-w-0">
          <span
            aria-hidden="true"
            className="tabular flex size-7 items-center justify-center rounded-full border border-line-strong bg-surface font-mono text-[12px] font-medium text-ink-2"
          >
            {index + 1}
          </span>
          <h3 className="mt-3 text-ui font-semibold text-ink">{step.title}</h3>
          <p className="mt-1.5 text-[15px] leading-6 text-ink-2">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

/** Label and value rows between hairlines, like the retention table on the privacy page. */
function FactList({ items }: { items: readonly ToolGuideFact[] }) {
  return (
    <dl className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <div key={item.label} className="grid gap-1 py-3.5 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-6">
          <dt className="text-[15px] font-medium leading-6 text-ink">{item.label}</dt>
          <dd className="text-[15px] leading-6 text-ink-2">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The guide sits below the tool, so its content columns skip layout and paint until they near the
 * viewport (about 40% fewer layout objects on a phone's first render). The text stays in the DOM
 * for readers, find-in-page and crawlers, and `auto` remembers the real height once rendered.
 * The negative margin and matching padding give hover backgrounds and focus rings room, since
 * content-visibility clips painting to this box.
 */
function Deferred({ children }: { children: ReactNode }) {
  return <div className="-mx-4 px-4 [contain-intrinsic-size:auto_600px] [content-visibility:auto]">{children}</div>;
}

/** Inline link inside guide prose. */
export function GuideLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <AppLink
      href={href}
      className="font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
    >
      {children}
    </AppLink>
  );
}

/**
 * Server-rendered guide under a tool: how it works, when to use it, limits and what's stored,
 * FAQ and related links, plus WebApplication, FAQPage and BreadcrumbList JSON-LD built from
 * the same content. Place it after the tool so the tool stays above the fold.
 */
export default function ToolGuide({
  appName,
  path,
  description,
  features,
  breadcrumb,
  how,
  uses,
  limits,
  faq,
  related,
  anchors = true,
  className,
}: ToolGuideProps) {
  const id = (name: string) => (anchors ? name : undefined);
  const appJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: appName,
    url: `${SITE_URL}${path}`,
    description,
    applicationCategory: "SecurityApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires a browser with Web Crypto.",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: features,
  };

  return (
    <div className={cn("mt-16 md:mt-20", className)}>
      <JsonLd data={appJsonLd} />
      <JsonLd data={faqPageJsonLd(faq.items)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: breadcrumb, path },
        ])}
      />

      <ContentSection id={id("how-it-works")} eyebrow="How it works" title={how.title}>
        <Deferred>
          <Steps steps={how.steps} />
        </Deferred>
      </ContentSection>

      <ContentSection id={id("use-cases")} eyebrow="When to use it" title={uses.title}>
        <Deferred>
          <PointList items={[...uses.items]} />
        </Deferred>
      </ContentSection>

      <ContentSection id={id("limits")} eyebrow="Limits and storage" title={limits.title}>
        <Deferred>
          <FactList items={limits.items} />
          {limits.footnote ? <p className="mt-5 text-[15px] leading-6 text-ink-2">{limits.footnote}</p> : null}
        </Deferred>
      </ContentSection>

      <ContentSection id={id("faq")} eyebrow="FAQ" title={faq.title}>
        <Deferred>
          <Faq items={faq.items} />
        </Deferred>
      </ContentSection>

      <ContentSection id={id("related")} title="Related tools and comparisons">
        <Deferred>
          <RelatedTools items={[...related]} />
        </Deferred>
      </ContentSection>
    </div>
  );
}
