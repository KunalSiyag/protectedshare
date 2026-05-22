import { cleanupAll } from "./cleanup";
import { markdownToUnicode } from "./markdown-to-unicode";

/**
 * Full formatting pipeline: AI text → Twitter-ready Unicode text.
 *
 * Steps:
 * 1. Clean up AI artifacts (filler phrases, headers, excessive lists)
 * 2. Convert remaining markdown to Unicode bold/italic
 *
 * The order matters — cleanup first removes structural markdown
 * (headers, horizontal rules) so the Unicode pass only handles
 * inline emphasis markers.
 */
export function formatForTwitter(input: string): string {
  if (!input.trim()) return "";
  const cleaned = cleanupAll(input);
  const formatted = markdownToUnicode(cleaned);
  return formatted;
}
