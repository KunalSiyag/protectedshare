"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import { ImageOff } from "lucide-react";

/**
 * Markdown for decrypted notes. Raw HTML is dropped, unsafe URLs are stripped by
 * react-markdown's default transform, and images are never loaded: an image URL in a secret
 * note would tell a third-party server when (and from which IP) the note was opened.
 */
const components: Components = {
  h1: ({ children }) => <h2 className="mb-3 mt-6 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-ink first:mt-0">{children}</h2>,
  h2: ({ children }) => <h3 className="mb-2.5 mt-6 text-[18px] font-semibold leading-6 tracking-[-0.015em] text-ink first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-2 mt-5 text-[16px] font-semibold leading-6 text-ink first:mt-0">{children}</h4>,
  h4: ({ children }) => <h5 className="mb-2 mt-4 text-ui font-semibold text-ink first:mt-0">{children}</h5>,
  h5: ({ children }) => <h6 className="mb-2 mt-4 text-ui font-semibold text-ink first:mt-0">{children}</h6>,
  h6: ({ children }) => <h6 className="mb-2 mt-4 text-small font-semibold uppercase tracking-[0.06em] text-ink-2 first:mt-0">{children}</h6>,
  p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6 marker:text-ink-3">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6 marker:text-ink-3">{children}</ol>,
  li: ({ children }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }) => <blockquote className="my-4 border-l-2 border-line-strong pl-4 text-ink-2">{children}</blockquote>,
  hr: () => <hr className="my-6 border-line" />,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  code: ({ className, children }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded-[5px] border border-line bg-surface-2 px-1 py-px font-mono text-[0.88em] text-ink">{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-field border border-line bg-surface-2/70 p-3.5 font-mono text-small leading-[1.6] text-ink [&_code]:border-0 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  img: ({ alt }) => (
    <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-dashed border-line-strong px-2 py-0.5 text-small text-ink-3">
      <ImageOff aria-hidden="true" className="size-3.5" />
      Image not loaded{alt ? `: ${alt}` : ""}
    </span>
  ),
};

export default function SafeMarkdown({ children }: { children: string }) {
  return (
    <div className="text-prose text-ink-2 [overflow-wrap:anywhere]">
      <ReactMarkdown skipHtml components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
