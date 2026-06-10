/**
 * Returns a relative API path (e.g. "/api/notes").
 * The browser makes a same-origin request to the Next.js app,
 * which proxies it to the configured backend via the runtime route handler.
 * This avoids CORS issues and keeps deployment env vars in one place.
 */
export function apiUrl(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error("API path must start with '/'.");
  }

  return path;
}
