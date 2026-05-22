/**
 * Twitter/X character counting utilities.
 *
 * Twitter has specific counting rules:
 * - URLs always count as 23 characters regardless of length
 * - Most Unicode characters count as 1 character (including our bold Unicode)
 * - CJK characters count as 1 character
 * - Emojis count as 2 characters (but Twitter's web client handles this)
 *
 * The standard limit is 280 characters (or 25,000 for Premium+).
 */

export const TWITTER_CHAR_LIMIT = 280;
export const TWITTER_PREMIUM_LIMIT = 25000;
export const TWITTER_URL_LENGTH = 23;

/**
 * Regex for detecting URLs in text.
 * Matches http, https, and www. prefixed URLs.
 */
const URL_PATTERN = /https?:\/\/[^\s]+|www\.[^\s]+/gi;

/**
 * Count characters as Twitter would count them.
 * URLs are counted as 23 characters regardless of actual length.
 */
export function twitterCharCount(text: string): number {
  if (!text) return 0;

  // Replace URLs with 23-char placeholders
  const normalized = text.replace(URL_PATTERN, "x".repeat(TWITTER_URL_LENGTH));

  // Twitter counts Unicode code points, not UTF-16 code units
  // Array.from handles surrogate pairs correctly
  return Array.from(normalized).length;
}

/**
 * Get character count info for a given text.
 */
export interface CharCountInfo {
  /** Character count as Twitter would count it */
  count: number;
  /** Characters remaining under the standard 280 limit */
  remaining: number;
  /** Whether the text exceeds the 280-char limit */
  isOverLimit: boolean;
  /** Whether the text exceeds the 25,000-char Premium+ limit */
  isOverPremiumLimit: boolean;
  /** Number of URLs detected */
  urlCount: number;
}

export function getCharCountInfo(text: string): CharCountInfo {
  const count = twitterCharCount(text);
  const urls = text.match(URL_PATTERN);

  return {
    count,
    remaining: TWITTER_CHAR_LIMIT - count,
    isOverLimit: count > TWITTER_CHAR_LIMIT,
    isOverPremiumLimit: count > TWITTER_PREMIUM_LIMIT,
    urlCount: urls?.length ?? 0,
  };
}
