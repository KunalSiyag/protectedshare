/**
 * Unicode character maps for converting standard ASCII to
 * Mathematical Sans-Serif Bold characters (U+1D5D4–U+1D607).
 *
 * These are the characters commonly used in Twitter/X posts
 * to achieve "bold" text since the platform doesn't support markdown.
 */

// Mathematical Sans-Serif Bold Uppercase: U+1D5D4 – U+1D5ED
// Mathematical Sans-Serif Bold Lowercase: U+1D5EE – U+1D607
const BOLD_UPPER_START = 0x1d5d4;
const BOLD_LOWER_START = 0x1d5ee;

// Mathematical Sans-Serif Bold Italic Uppercase: U+1D63C – U+1D655
// Mathematical Sans-Serif Bold Italic Lowercase: U+1D656 – U+1D66F
const BOLD_ITALIC_UPPER_START = 0x1d63c;
const BOLD_ITALIC_LOWER_START = 0x1d656;

// Mathematical Bold Digits: U+1D7CE – U+1D7D7
const BOLD_DIGIT_START = 0x1d7ce;

function charToBold(ch: string): string {
  const code = ch.charCodeAt(0);
  // Uppercase A-Z
  if (code >= 0x41 && code <= 0x5a) {
    return String.fromCodePoint(BOLD_UPPER_START + (code - 0x41));
  }
  // Lowercase a-z
  if (code >= 0x61 && code <= 0x7a) {
    return String.fromCodePoint(BOLD_LOWER_START + (code - 0x61));
  }
  // Digits 0-9
  if (code >= 0x30 && code <= 0x39) {
    return String.fromCodePoint(BOLD_DIGIT_START + (code - 0x30));
  }
  return ch;
}

function charToBoldItalic(ch: string): string {
  const code = ch.charCodeAt(0);
  // Uppercase A-Z
  if (code >= 0x41 && code <= 0x5a) {
    return String.fromCodePoint(BOLD_ITALIC_UPPER_START + (code - 0x41));
  }
  // Lowercase a-z
  if (code >= 0x61 && code <= 0x7a) {
    return String.fromCodePoint(BOLD_ITALIC_LOWER_START + (code - 0x61));
  }
  return ch;
}

/**
 * Convert a plain ASCII string to Mathematical Sans-Serif Bold Unicode.
 * Non-ASCII characters are passed through unchanged.
 */
export function toBoldUnicode(text: string): string {
  return Array.from(text).map(charToBold).join("");
}

/**
 * Convert a plain ASCII string to Mathematical Sans-Serif Bold Italic Unicode.
 * Non-ASCII characters are passed through unchanged.
 */
export function toBoldItalicUnicode(text: string): string {
  return Array.from(text).map(charToBoldItalic).join("");
}
