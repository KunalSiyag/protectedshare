const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Strips CR/LF so a value cannot inject headers when used in a subject line. */
export function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").slice(0, 200);
}
