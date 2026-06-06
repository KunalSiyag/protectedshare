/**
 * Returns a relative API path (e.g. "/api/notes").
 * The browser makes a same-origin request to the Next.js app,
 * which proxies it to the Cloudflare Worker via the rewrite in next.config.ts.
 * This avoids CORS issues and env-var mismatches entirely.
 */
export function apiUrl(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error("API path must start with '/'.");
  }

  return path;
}

