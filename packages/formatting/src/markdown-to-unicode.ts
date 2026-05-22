import { toBoldUnicode, toBoldItalicUnicode } from "./unicode-maps";

/**
 * Convert markdown-style formatting to Unicode equivalents.
 *
 * Supported conversions:
 * - `***text***` or `___text___` → Bold Italic Unicode
 * - `**text**` or `__text__` → Bold Unicode
 * - `*text*` or `_text_` → (kept as-is or converted to italic unicode — we keep as-is for X readability)
 * - `` `code` `` → Wrapped in「」brackets for visual distinction
 *
 * Processing order matters: bold-italic before bold before italic
 * to prevent partial matches.
 */
export function markdownToUnicode(input: string): string {
  let result = input;

  // 1. Bold-italic: ***text*** or ___text___
  result = result.replace(
    /(\*{3}|_{3})(.+?)\1/g,
    (_match, _delim, content: string) => toBoldItalicUnicode(content)
  );

  // 2. Bold: **text** or __text__
  result = result.replace(
    /(\*{2}|_{2})(.+?)\1/g,
    (_match, _delim, content: string) => toBoldUnicode(content)
  );

  // 3. Inline code: `code` → 「code」
  result = result.replace(
    /`([^`]+)`/g,
    (_match, content: string) => `「${content}」`
  );

  return result;
}
