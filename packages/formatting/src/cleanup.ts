/**
 * Cleanup utilities for AI-generated text.
 *
 * Removes excessive formatting, normalizes whitespace, and converts
 * AI-typical patterns (bullet lists, numbered lists, headers) into
 * clean Twitter-ready text.
 */

/**
 * Remove markdown headers (# through ######) and replace with the content.
 * The content is converted to bold Unicode via the markdown pipeline,
 * so we just strip the `#` prefixes here.
 */
export function stripMarkdownHeaders(input: string): string {
  return input.replace(/^#{1,6}\s+/gm, "");
}

/**
 * Normalize bullet points:
 * - Convert `- `, `* `, `• ` to a clean `→ ` prefix
 * - Remove excessive nesting (indented sub-bullets get flattened)
 */
export function normalizeBullets(input: string): string {
  // Match bullets that may be wrapped in bold markers: **- text** or just - text
  return input.replace(/^[\t ]*(?:\*{1,2})?[-•]\s+/gm, "→ ");
}

/**
 * Convert numbered lists (1. , 2. , etc.) to a cleaner format.
 */
export function normalizeNumberedLists(input: string): string {
  // Match numbered items that may be wrapped in bold markers: **1. text** or just 1. text
  return input.replace(/^[\t ]*(?:\*{1,2})?\d+\.\s+/gm, () => {
    return "→ ";
  });
}

/**
 * Remove horizontal rules (---, ***, ___).
 */
export function removeHorizontalRules(input: string): string {
  return input.replace(/^[-*_]{3,}\s*$/gm, "");
}

/**
 * Collapse 3+ consecutive newlines into exactly 2 (one blank line).
 */
export function collapseExcessiveNewlines(input: string): string {
  return input.replace(/\n{3,}/g, "\n\n");
}

/**
 * Remove trailing whitespace from each line.
 */
export function trimTrailingWhitespace(input: string): string {
  return input.replace(/[ \t]+$/gm, "");
}

/**
 * Remove common AI filler phrases.
 */
export function removeFillerPhrases(input: string): string {
  const fillers = [
    /^(Sure[,!]?\s*(here('s| is)[^.]*\.|I'd be happy to help[^.]*\.))\s*/i,
    /^(Of course[,!]?\s*[^.]*\.)\s*/i,
    /^(Absolutely[,!]?\s*[^.]*\.)\s*/i,
    /^(Great question[,!]?\s*)\s*/i,
    // Tail fillers — also strip surrounding italic/bold markers (*...*, **...**)
    /\s*\*{0,2}Let me know if you (need|want|have) [^.]*\.?\*{0,2}\s*$/i,
    /\s*\*{0,2}I hope (this|that) helps[.!]?\*{0,2}\s*$/i,
    /\s*\*{0,2}Feel free to [^.]*\.?\*{0,2}\s*$/i,
  ];

  let result = input;
  for (const filler of fillers) {
    result = result.replace(filler, "");
  }
  return result;
}

/**
 * Handle the common AI pattern where numbered items are entirely bold-wrapped:
 * `**1. Title**` → `**Title**` (the bold markers stay for Unicode conversion)
 */
export function stripBoldWrappedNumbers(input: string): string {
  return input.replace(/^(\*{2})\d+\.\s+/gm, "$1");
}

/**
 * Remove orphaned trailing emphasis markers left over from partial stripping.
 * E.g., a line ending with `**` when there's no opening `**` on that line.
 */
export function cleanupOrphanedMarkers(input: string): string {
  return input.split("\n").map((line) => {
    // Count ** pairs — if unbalanced, strip the orphans
    const doubleStarCount = (line.match(/\*\*/g) || []).length;
    if (doubleStarCount % 2 !== 0) {
      // Remove the last orphaned **
      const lastIdx = line.lastIndexOf("**");
      if (lastIdx >= 0) {
        line = line.slice(0, lastIdx) + line.slice(lastIdx + 2);
      }
    }
    // Same for single * (italic)
    const singleStarMatches = line.replace(/\*\*/g, ""); // remove pairs first
    const singleStarCount = (singleStarMatches.match(/\*/g) || []).length;
    if (singleStarCount % 2 !== 0) {
      const lastIdx = line.lastIndexOf("*");
      if (lastIdx >= 0) {
        line = line.slice(0, lastIdx) + line.slice(lastIdx + 1);
      }
    }
    return line;
  }).join("\n");
}

/**
 * Apply all cleanup transformations in the correct order.
 */
export function cleanupAll(input: string): string {
  let result = input;
  result = removeFillerPhrases(result);
  result = stripMarkdownHeaders(result);
  result = removeHorizontalRules(result);
  result = stripBoldWrappedNumbers(result);
  result = normalizeBullets(result);
  result = normalizeNumberedLists(result);
  result = cleanupOrphanedMarkers(result);
  result = trimTrailingWhitespace(result);
  result = collapseExcessiveNewlines(result);
  return result.trim();
}

