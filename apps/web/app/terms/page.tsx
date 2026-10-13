import type { ReactNode } from "react";
import { cn } from "@protectedshare/ui";
import { MetaDot, PageHeader, proseClassName } from "../../components/marketing";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "Terms for using ProtectedShare to encrypt and share notes, secrets, files, requests, notepad vaults and chat messages.",
  path: "/terms",
});

const EMAIL = "admin@protectedshare.me";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="border-t border-line pt-8 first:border-t-0 first:pt-0">
      <h2 className="!mt-0">{title}</h2>
      {children}
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="w-full">
      <PageHeader
        eyebrow="Legal"
        title="Terms of service"
        lead="Plain terms for a free tool. Use it lawfully, keep your own keys, and know that we can't recover what we can't read."
        meta={
          <>
            <span>Last updated October 12, 2026</span>
            <MetaDot />
            <span>Applies to protectedshare.me</span>
          </>
        }
      />

      <article className={cn(proseClassName, "mt-12 flex flex-col gap-10")}>
        <Section id="agreement" title="Using ProtectedShare">
          <p>
            By using protectedshare.me you agree to these terms. If you don&apos;t agree, please don&apos;t use the hosted
            service. The source code is MIT licensed; if you run your own copy, the license governs the code and you set
            your own terms.
          </p>
        </Section>

        <Section id="service" title="What the service is">
          <p>
            ProtectedShare is a set of free browser tools: secure notes, EnvShare, file drop, secret requests, chat, an
            encrypted notepad, and smaller tools such as a password generator and an offline text encryptor. Encryption
            happens in your browser. The
            server stores ciphertext and the metadata described in our <a href="/privacy">privacy policy</a>.
          </p>
          <p>
            Limits apply and may change: shares expire within 30 days, file drops are capped at 25 MB, and chat messages
            are removed when a room empties. Don&apos;t use ProtectedShare as the only place you keep anything you need to
            keep.
          </p>
        </Section>

        <Section id="keys" title="Your keys are your responsibility">
          <p>
            Links and passwords are the only way to open what you share. We never receive them, so we can&apos;t reset,
            recover or resend them. Anyone who has a full link (or the link and its password) can open the share until it
            expires or runs out of reads. Send links to the right people, through channels you trust.
          </p>
        </Section>

        <Section id="acceptable-use" title="Acceptable use">
          <p>Don&apos;t use ProtectedShare to store or send:</p>
          <ul>
            <li>anything illegal where you or the recipient are, including child sexual abuse material</li>
            <li>malware, or material meant to break into or disrupt other people&apos;s systems</li>
            <li>content that harasses, threatens or exploits someone, or that you have no right to share</li>
          </ul>
          <p>
            This applies to file drops in particular. We can&apos;t see what&apos;s inside an encrypted file, but if we
            receive a credible report that includes the share id, we will delete it, and we may block abuse of the service,
            such as automated bulk uploads. To report a share, use the Report abuse link on the page that opens it, or
            email <a href={`mailto:${EMAIL}`}>{EMAIL}</a> with the id, not the full link. Our{" "}
            <a href="/privacy#reports">privacy policy</a> says what a report stores.
          </p>
        </Section>

        <Section id="availability" title="Availability">
          <p>
            The service is free and provided as is. We try to keep it running, but it may be slow, unavailable or changed
            without notice. Shares can be lost if something fails, and we may remove features.
          </p>
        </Section>

        <Section id="warranty" title="No warranty, limited liability">
          <p>
            We provide ProtectedShare without warranties of any kind. We don&apos;t promise it is free of bugs or that its
            cryptography will hold against every future attack. To the extent the law allows, we aren&apos;t liable for
            indirect or consequential losses, or for loss of data, arising from your use of the service.
          </p>
        </Section>

        <Section id="changes" title="Changes">
          <p>
            We may update these terms. When we do, the date at the top changes. If you keep using the service after that,
            the new terms apply. Questions go to <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
        </Section>
      </article>
    </main>
  );
}
