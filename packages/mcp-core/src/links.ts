/**
 * Link shapes, byte-compatible with the web app:
 *
 *   Secure Note      {site}/notes/{id}#k={key}
 *   EnvShare         {site}/secrets/{id}#k={key}
 *   File drop        {site}/files/{id}#k={key}
 *   Request (send)   {site}/request/{id}#k={labelKey}
 *   Request (inbox)  {site}/request/{id}/inbox#p={privateKey}&k={labelKey}
 *
 * Fragments are built and read exactly like apps/web/lib/share-window.ts
 * (withFragmentParams / readFragmentParams). The fragment never leaves the process.
 */

export type LinkKind = "note" | "secret" | "drop" | "request";

export type ShareLink = {
  kind: LinkKind;
  id: string;
  /** True for /request/{id}/inbox. */
  inbox: boolean;
  /** Decoded `#name=value&…` pairs. Empty for fragments without "=" (legacy v1 password fragments). */
  params: Record<string, string>;
  /** The link's own origin, e.g. "https://protectedshare.me". */
  origin: string;
};

const KIND_BY_SEGMENT: Record<string, LinkKind> = {
  notes: "note",
  secrets: "secret",
  files: "drop",
  request: "request",
};

export const SEGMENT_BY_KIND: Record<LinkKind, string> = {
  note: "notes",
  secret: "secrets",
  drop: "files",
  request: "request",
};

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function isShareId(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

/** Mirrors readFragmentParams() in apps/web/lib/share-window.ts. */
export function fragmentParams(hash: string): Record<string, string> {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw.includes("=")) return {};
  const params: Record<string, string> = {};
  for (const part of raw.split("&")) {
    const [name, ...rest] = part.split("=");
    if (!name) continue;
    try {
      params[name] = decodeURIComponent(rest.join("="));
    } catch {
      params[name] = rest.join("=");
    }
  }
  return params;
}

/** Mirrors withFragmentParams() in apps/web/lib/share-window.ts. */
export function withFragment(url: string, params: Record<string, string>): string {
  const fragment = Object.entries(params)
    .map(([name, value]) => `${name}=${encodeURIComponent(value)}`)
    .join("&");
  return fragment ? `${url}#${fragment}` : url;
}

export function sharePath(kind: LinkKind, id: string): string {
  return `/${SEGMENT_BY_KIND[kind]}/${encodeURIComponent(id)}`;
}

/** Parses a ProtectedShare link. Accepts a missing scheme ("protectedshare.me/notes/…"). */
export function parseShareLink(input: string): ShareLink | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 8192) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2 || segments.length > 3) return null;
  const kind = KIND_BY_SEGMENT[segments[0] ?? ""];
  if (!kind) return null;
  let id: string;
  try {
    id = decodeURIComponent(segments[1] ?? "");
  } catch {
    return null;
  }
  if (!isShareId(id)) return null;
  const inbox = segments.length === 3;
  if (inbox && !(kind === "request" && segments[2] === "inbox")) return null;
  return { kind, id, inbox, params: fragmentParams(url.hash), origin: url.origin };
}

function effectivePort(url: URL): string {
  return url.port || (url.protocol === "http:" ? "80" : "443");
}

/**
 * Whether a link belongs to the instance this server talks to. "www." is ignored, and http vs
 * https is ignored for public hosts (only the id and the fragment are used, never the link's
 * own host). Ports must match, so localhost:3000 links don't mix with other local servers.
 */
export function isSameSite(linkOrigin: string, siteUrl: string): boolean {
  try {
    const link = new URL(linkOrigin);
    const site = new URL(siteUrl);
    const strip = (host: string) => host.toLowerCase().replace(/^www\./, "");
    if (strip(link.hostname) !== strip(site.hostname)) return false;
    const local = site.hostname === "localhost" || site.hostname === "127.0.0.1" || site.hostname === "[::1]";
    if (local) return link.protocol === site.protocol && effectivePort(link) === effectivePort(site);
    return link.port === site.port;
  } catch {
    return false;
  }
}

/** Drops trailing "/" characters in linear time (a `/\/+$/` regex backtracks on long runs of slashes). */
export function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value.charCodeAt(end - 1) === 47) end -= 1;
  return value.slice(0, end);
}

/** "https://protectedshare.me/" → "https://protectedshare.me". Throws on anything that isn't http(s). */
export function normalizeSiteUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("The site URL must be http(s).");
  return url.origin;
}
