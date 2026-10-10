import { Fragment, type ReactNode } from "react";
import { cn } from "@protectedshare/ui";

/**
 * A small, safe formatter: **bold**, _italic_, `code`, ```code blocks``` and http(s) links.
 * It builds React nodes from text; there is no HTML path, so nothing a sender types can
 * become markup.
 */

const INLINE = /(`[^`\n]+`)|(\*\*[^*\n][^\n]*?\*\*)|((?:^|(?<=[\s(]))_[^_\n]+_(?=$|[\s.,!?;:)]))|(https?:\/\/[^\s<>"]+)/g;
const TRAILING = /[.,!?;:)\]'"]+$/;

function linkify(raw: string, key: string, self: boolean): ReactNode[] {
  let url = raw;
  let tail = "";
  const trailing = url.match(TRAILING);
  if (trailing) {
    // Keep a closing paren that belongs to the URL, e.g. wiki links.
    const opens = (url.match(/\(/g) ?? []).length;
    const closes = (url.match(/\)/g) ?? []).length;
    tail = trailing[0];
    if (tail.endsWith(")") && opens >= closes) tail = tail.replace(/\)+$/, "");
    url = url.slice(0, url.length - tail.length);
  }
  let valid = false;
  try {
    const parsed = new URL(url);
    valid = parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    valid = false;
  }
  if (!valid) return [raw];
  return [
    <a
      key={key}
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className={cn(
        "break-all underline decoration-1 underline-offset-[3px] outline-none focus-visible:rounded-[3px] focus-visible:ring-2 focus-visible:ring-seal/45",
        self ? "decoration-on-ink/50 hover:decoration-on-ink" : "decoration-ink-3/60 hover:decoration-ink"
      )}
    >
      {url}
    </a>,
    tail,
  ];
}

function inline(text: string, keyPrefix: string, self: boolean, depth = 0): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let index = 0;
  INLINE.lastIndex = 0;
  const matches = Array.from(text.matchAll(INLINE));
  for (const match of matches) {
    const start = match.index ?? 0;
    if (start > last) out.push(text.slice(last, start));
    const key = `${keyPrefix}-${index++}`;
    const [whole, code, bold, italic, url] = match;
    if (code) {
      out.push(
        <code
          key={key}
          className={cn(
            "rounded-[5px] px-[5px] py-px font-mono text-[0.86em]",
            self ? "bg-on-ink/[0.14]" : "bg-ink/[0.06]"
          )}
        >
          {code.slice(1, -1)}
        </code>
      );
    } else if (bold) {
      out.push(
        <strong key={key} className="font-semibold">
          {depth < 2 ? inline(bold.slice(2, -2), key, self, depth + 1) : bold.slice(2, -2)}
        </strong>
      );
    } else if (italic) {
      out.push(
        <em key={key} className="italic">
          {depth < 2 ? inline(italic.slice(1, -1), key, self, depth + 1) : italic.slice(1, -1)}
        </em>
      );
    } else if (url) {
      out.push(...linkify(url, key, self));
    } else {
      out.push(whole);
    }
    last = start + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function RichText({ text, self }: { text: string; self: boolean }) {
  const parts = text.split(/```/);
  // Odd segments are inside fences (only when the fence is closed).
  const closed = parts.length % 2 === 1;
  return (
    <>
      {parts.map((part, index) => {
        const isCode = index % 2 === 1 && (closed || index < parts.length - 1);
        if (isCode) {
          const body = part.replace(/^[a-zA-Z0-9_+-]*\n/, "").replace(/\n$/, "");
          return (
            <pre
              key={index}
              className={cn(
                "my-1 max-w-full overflow-x-auto whitespace-pre rounded-[8px] px-3 py-2 font-mono text-[12.5px] leading-[19px]",
                self ? "bg-on-ink/[0.12]" : "border border-line bg-surface-2/70"
              )}
            >
              <code>{body}</code>
            </pre>
          );
        }
        const segment = !closed && index === parts.length - 1 && index > 0 ? "```" + part : part;
        const trimmed = index > 0 ? segment.replace(/^\n/, "") : segment;
        const finalText = index < parts.length - 1 ? trimmed.replace(/\n$/, "") : trimmed;
        if (!finalText) return null;
        return <Fragment key={index}>{inline(finalText, `p${index}`, self)}</Fragment>;
      })}
    </>
  );
}
