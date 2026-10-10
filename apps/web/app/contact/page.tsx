import { ArrowUpRight, Mail } from "lucide-react";
import { buttonVariants } from "@protectedshare/ui";
import ContactTrigger from "../../components/contact-trigger";
import { DefinitionList, PageHeader, RailSection } from "../../components/marketing";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description: "Ask about ProtectedShare, report a problem, or enquire about a dedicated instance. Email admin@protectedshare.me.",
  path: "/contact",
});

const EMAIL = "admin@protectedshare.me";
const GITHUB_ISSUES = "https://github.com/KunalSiyag/protectedshare/issues";

const linkClass = "font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-ink";

export default function ContactPage() {
  return (
    <main className="w-full">
      <PageHeader
        eyebrow="Contact"
        title="Talk to a person"
        lead="Questions, bug reports, security issues, or a dedicated instance for your team. Email works best, or use the form."
      >
        <a href={`mailto:${EMAIL}`} className={buttonVariants({ variant: "primary" })}>
          <Mail aria-hidden="true" />
          {EMAIL}
        </a>
        <ContactTrigger className={buttonVariants({ variant: "secondary" })}>Use the contact form</ContactTrigger>
      </PageHeader>

      <div className="mt-14">
        <RailSection title="Where to send what" description="Pick the route that fits. All of them reach the same maintainer.">
          <DefinitionList
            items={[
              {
                term: "Bugs and feature ideas",
                detail: (
                  <>
                    Open an issue on{" "}
                    <a href={GITHUB_ISSUES} className={linkClass}>
                      GitHub
                    </a>{" "}
                    so others can follow along. Include the browser and the steps that got you there.
                  </>
                ),
              },
              {
                term: "Security reports",
                detail: (
                  <>
                    Email <a href={`mailto:${EMAIL}`} className={linkClass}>{EMAIL}</a> with steps to reproduce.
                    Please don&apos;t post an unpatched issue publicly first.
                  </>
                ),
              },
              {
                term: "Abuse reports",
                detail: (
                  <>
                    Send the link ID (the part after <code>/notes/</code>, <code>/secrets/</code> or <code>/files/</code>).
                    We can&apos;t read encrypted content, but we can delete a share by its ID. Don&apos;t send the full link
                    with the key.
                  </>
                ),
              },
              {
                term: "Dedicated instance",
                detail:
                  "If your organization wants its own deployment, write and tell us what you need. Nothing about price or terms is published yet; we work it out with you. You can also self-host for free.",
              },
            ]}
          />
        </RailSection>

        <RailSection title="What the form stores" description="So you know before you write.">
          <p className="max-w-[640px] text-ui text-ink-2">
            The contact form saves your name, email, optional company, and message in our database so we can reply. It
            may also be forwarded to our inbox by email. It is not encrypted end to end, so never paste a secret into it.
            Details are on the{" "}
            <a href="/privacy#contact" className={linkClass}>
              privacy page
            </a>
            .
          </p>
          <a
            href="/self-host"
            className="mt-5 inline-flex items-center gap-1 text-small font-medium text-ink-2 transition-colors hover:text-ink"
          >
            Prefer to run it yourself? Self-host guide
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
        </RailSection>
      </div>
    </main>
  );
}
