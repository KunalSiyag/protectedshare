import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumb } from "../../components/breadcrumb";
import JsonLd from "../../components/json-ld";
import { PageHeader } from "../../components/marketing";
import { AUTHORS } from "../../lib/authors";
import { itemListJsonLd, pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Authors",
  description:
    "Who writes the ProtectedShare blog: guides on browser-side encryption, one-time links and sharing credentials safely.",
  path: "/authors",
});

export default function AuthorsPage() {
  const authors = AUTHORS.map((author) => ({ ...author, path: `/authors/${author.slug}` }));

  return (
    <main className="w-full">
      <JsonLd data={itemListJsonLd(authors.map((author) => ({ name: author.name, path: author.path })))} />
      <Breadcrumb
        items={[
          { name: "Home", path: "/" },
          { name: "Authors", path: "/authors" },
        ]}
      />

      <PageHeader
        eyebrow="Authors"
        title="Who writes here"
        lead="The people behind the guides on this blog."
      />

      <ul className="mt-12 max-w-[720px] border-t border-line">
        {authors.map((author) => (
          <li key={author.slug} className="border-b border-line">
            <Link href={author.path} className="group flex items-center gap-4 py-4">
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-semibold leading-6 tracking-[-0.01em] text-ink decoration-line-strong underline-offset-[4px] group-hover:underline">
                  {author.name}
                </span>
                <span className="mt-0.5 block text-small text-ink-3">{author.role}</span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-3.5 shrink-0 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
