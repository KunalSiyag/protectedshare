import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { cn } from "@protectedshare/ui";
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
      className="mt-12 scroll-mt-24 text-[22px] font-semibold leading-[28px] tracking-[-0.02em] text-ink first:mt-0"
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 id={slugify(textOf(children))} className="mt-8 scroll-mt-24 text-[17px] font-semibold leading-6 tracking-[-0.01em] text-ink">
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
    <code className="rounded-[5px] bg-surface-2 px-[5px] py-px font-mono text-[0.875em] text-ink [overflow-wrap:anywhere]">{children}</code>
  ),
};

/* ───────── Tables ─────────
 * react-markdown here runs without remark-gfm, so pipe tables are split out of the source and
 * rendered directly. Rows must start with "|", and the second line must be a delimiter row
 * ("| --- | :---: |"). Cells may contain inline markdown (links, code, emphasis); "\|" is a
 * literal pipe, and pipes inside `code` don't split cells.
 */

type Align = "left" | "center" | "right" | undefined;

type Segment =
  | { kind: "markdown"; source: string }
  | { kind: "table"; head: string[]; align: Align[]; rows: string[][] };

const FENCE = /^\s{0,3}(```|~~~)/;
const DELIMITER_CELL = /^:?-{3,}:?$/;

function splitRow(line: string): string[] {
  let row = line.trim();
  if (row.startsWith("|")) row = row.slice(1);
  if (row.endsWith("|") && !row.endsWith("\\|")) row = row.slice(0, -1);
  const cells: string[] = [];
  let current = "";
  let inCode = false;
  for (let index = 0; index < row.length; index += 1) {
    const char = row[index];
    if (char === "\\" && row[index + 1] === "|") {
      current += "|";
      index += 1;
      continue;
    }
    if (char === "`") inCode = !inCode;
    if (char === "|" && !inCode) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function isRow(line: string | undefined): line is string {
  return typeof line === "string" && line.trim().startsWith("|");
}

function isDelimiterRow(line: string | undefined): boolean {
  return isRow(line) && line.includes("-") && splitRow(line).every((cell) => DELIMITER_CELL.test(cell));
}

function alignOf(cell: string): Align {
  const left = cell.startsWith(":");
  const right = cell.endsWith(":");
  if (left && right) return "center";
  if (right) return "right";
  if (left) return "left";
  return undefined;
}

/** Splits markdown into plain runs and pipe tables (tables inside code fences are left alone). */
export function splitTables(markdown: string): Segment[] {
  const lines = markdown.split("\n");
  const segments: Segment[] = [];
  let buffer: string[] = [];
  let inFence = false;

  const flush = () => {
    if (buffer.length > 0) {
      segments.push({ kind: "markdown", source: buffer.join("\n") });
      buffer = [];
    }
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (FENCE.test(line)) inFence = !inFence;
    if (!inFence && isRow(line) && isDelimiterRow(lines[index + 1])) {
      const head = splitRow(line);
      const align = splitRow(lines[index + 1]).map(alignOf);
      const rows: string[][] = [];
      index += 2;
      while (isRow(lines[index])) {
        rows.push(splitRow(lines[index]));
        index += 1;
      }
      index -= 1;
      flush();
      segments.push({ kind: "table", head, align, rows });
      continue;
    }
    buffer.push(line);
  }
  flush();
  return segments;
}

/** Inline markdown for table cells: same links and code styles, no paragraph wrapper. */
const cellComponents: Components = { ...components, p: ({ children }) => <>{children}</> };

function Cell({ source }: { source: string }) {
  return <ReactMarkdown components={cellComponents}>{source}</ReactMarkdown>;
}

const ALIGN_CLASS: Record<Exclude<Align, undefined>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function Table({ head, align, rows }: { head: string[]; align: Align[]; rows: string[][] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-field border border-line">
      <table className={cn("w-full border-collapse text-left text-small", head.length > 2 && "min-w-[560px]")}>
        <thead className="bg-surface-2/60">
          <tr>
            {head.map((cell, index) => (
              <th
                key={index}
                scope="col"
                className={cn("border-b border-line px-3.5 py-2.5 align-bottom font-semibold text-ink", ALIGN_CLASS[align[index] ?? "left"])}
              >
                <Cell source={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {head.map((_, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cn(
                    "border-b border-line px-3.5 py-2.5 align-top leading-[20px]",
                    cellIndex === 0 ? "font-medium text-ink" : "text-ink-2",
                    ALIGN_CLASS[align[cellIndex] ?? "left"]
                  )}
                >
                  <Cell source={row[cellIndex] ?? ""} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Markdown({ children }: { children: string }) {
  return (
    <>
      {splitTables(children).map((segment, index) =>
        segment.kind === "table" ? (
          <Table key={index} head={segment.head} align={segment.align} rows={segment.rows} />
        ) : (
          <ReactMarkdown key={index} components={components}>
            {segment.source}
          </ReactMarkdown>
        )
      )}
    </>
  );
}
