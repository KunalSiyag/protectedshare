import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import AppLink from "../../components/app-link";

/** Flattens React children to plain text (for heading ids). */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 64);
}

/** `## Heading` lines from markdown, for the table of contents. */
export function extractHeadings(markdown: string): { id: string; text: string }[] {
  return markdown
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const text = line.slice(3).trim();
      return { id: slugify(text), text };
    });
}

const components: Components = {
  h2: ({ children }) => (
    <h2
      id={slugify(textOf(children))}
      className="mt-12 text-[22px] font-semibold leading-[28px] tracking-[-0.02em] text-ink first:mt-0"
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 id={slugify(textOf(children))} className="mt-8 text-[17px] font-semibold leading-6 tracking-[-0.01em] text-ink">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="mt-5 text-prose text-ink-2 [h2+&]:mt-3 [h3+&]:mt-2">{children}</p>,
  ul: ({ children }) => <ul className="mt-5 list-disc pl-5 text-prose text-ink-2 marker:text-ink-3">{children}</ul>,
  ol: ({ children }) => <ol className="mt-5 list-decimal pl-5 text-prose text-ink-2 marker:text-ink-3">{children}</ol>,
  li: ({ children }) => <li className="mt-2 pl-1">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-l-2 border-line-strong pl-4 text-ink-2 [&>p]:mt-2">{children}</blockquote>
  ),
  hr: () => <hr className="my-10 border-line" />,
  a: ({ children, href }) => {
    const className =
      "font-medium text-ink underline decoration-line-strong underline-offset-[3px] transition-colors hover:decoration-ink";
    if (href?.startsWith("/")) {
      return (
        <AppLink href={href} className={className}>
          {children}
        </AppLink>
      );
    }
    return (
      <a href={href} className={className} rel="noopener">
        {children}
      </a>
    );
  },
  pre: ({ children }) => (
    <pre className="mt-6 overflow-x-auto rounded-field border border-line bg-surface-2 px-4 py-3.5 font-mono text-[13px] leading-[21px] text-ink [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-[inherit]">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-[0.875em] text-ink">{children}</code>
  ),
  table: ({ children }) => (
    <div className="mt-6 overflow-x-auto rounded-field border border-line">
      <table className="w-full border-collapse text-left text-small">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-surface-2/60">{children}</thead>,
  th: ({ children }) => <th className="border-b border-line px-3.5 py-2.5 font-semibold text-ink">{children}</th>,
  td: ({ children }) => <td className="border-b border-line px-3.5 py-2.5 align-top text-ink-2">{children}</td>,
};

export default function Markdown({ children }: { children: string }) {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
}
