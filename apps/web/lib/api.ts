/**
 * Where the browser sends API calls.
 *
 * With NEXT_PUBLIC_API_ORIGIN set at build time (the hosted site: https://api.protectedshare.me),
 * the browser calls the API Worker directly, so API traffic (file-drop chunks included) never
 * passes through the web app's host. The Worker answers CORS for any origin, and next.config.ts
 * adds the origin to connect-src.
 *
 * Without it, paths stay relative ("/api/notes"): a same-origin request the web app relays to
 * API_BACKEND_URL (app/api/[[...path]]/route.ts). That suits self-hosting and local development.
 */
const API_ORIGIN = apiOrigin(process.env.NEXT_PUBLIC_API_ORIGIN);

/** The configured origin without trailing slashes, or "" when unset. */
export function apiOrigin(value: string | undefined): string {
  let origin = value?.trim() ?? "";
  while (origin.endsWith("/")) origin = origin.slice(0, -1);
  return origin;
}

export function apiUrl(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error("API path must start with '/'.");
  }

  return `${API_ORIGIN}${path}`;
}
