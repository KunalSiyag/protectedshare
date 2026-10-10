const API_BACKEND_URL =
  process.env.API_BACKEND_URL ||
  "https://protectedshare-api.protectedshare.workers.dev";

const HOP_BY_HOP_HEADERS = [
  "connection",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
];

// Let the runtime set these for the bytes it actually sends. Node's fetch decodes
// compressed upstream bodies, so forwarding content-encoding/length would corrupt
// responses; asking upstream for identity also keeps SSE unbuffered. `expect`
// (curl sends it for bodies over 1 MiB) makes undici reject the request.
const REQUEST_STRIP_HEADERS = ["content-length", "accept-encoding", "expect"];
const RESPONSE_STRIP_HEADERS = ["content-encoding", "content-length"];

// The API authenticates with explicit X-* token headers, never cookies, so cookies set on this
// origin (analytics or otherwise) have no reason to reach it. Client-supplied forwarding headers
// are dropped so a caller can't claim another IP; the edge in front of the API sets its own.
const CLIENT_STRIP_HEADERS = [
  "cookie",
  "x-forwarded-for",
  "x-real-ip",
  "forwarded",
  "true-client-ip",
  "cf-connecting-ip",
];

/** Largest body the proxy forwards. File-drop chunks are ~1.1 MB; everything else is far smaller. */
const MAX_BODY_BYTES = 2_000_000;

class PayloadTooLargeError extends Error {}

function payloadTooLarge(): Response {
  return Response.json(
    { error: "This request is too large.", code: "PAYLOAD_TOO_LARGE" },
    { status: 413 },
  );
}

/** Reads the body byte-for-byte, stopping as soon as it passes the cap (Content-Length can lie). */
async function readBodyCapped(request: Request): Promise<ArrayBuffer | undefined> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw new PayloadTooLargeError();
  if (!request.body) return undefined;

  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel().catch(() => {});
      throw new PayloadTooLargeError();
    }
    parts.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    body.set(part, offset);
    offset += part.byteLength;
  }
  return body.buffer;
}

async function proxy(request: Request): Promise<Response> {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(
    `${API_BACKEND_URL}${incomingUrl.pathname}${incomingUrl.search}`,
  );

  const headers = new Headers(request.headers);
  for (const header of [...HOP_BY_HOP_HEADERS, ...REQUEST_STRIP_HEADERS, ...CLIENT_STRIP_HEADERS]) {
    headers.delete(header);
  }

  // Binary bodies (file-drop chunks) are forwarded byte-for-byte; custom auth
  // headers (X-Auth-Token, X-Manage-Token, X-Upload-Token, X-Download-Token, X-Delete-Token) pass
  // through untouched with the rest of the request headers.
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let bodyBuffer: ArrayBuffer | undefined;
  if (hasBody) {
    try {
      bodyBuffer = await readBodyCapped(request);
    } catch (error: unknown) {
      if (error instanceof PayloadTooLargeError) return payloadTooLarge();
      throw error;
    }
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: bodyBuffer,
      redirect: "manual",
      signal: request.signal,
    });
  } catch (error: unknown) {
    if (request.signal.aborted) {
      throw error;
    }
    // Never retry against another backend: a local request silently landing on
    // production would write test data there. Fail loudly instead.
    console.error(`[Proxy] API backend unreachable at ${upstreamUrl.origin}:`, error);
    return Response.json(
      { error: "The API is unreachable right now. Try again in a moment.", code: "UPSTREAM_UNREACHABLE" },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers(upstreamResponse.headers);
  for (const header of [...HOP_BY_HOP_HEADERS, ...RESPONSE_STRIP_HEADERS]) {
    responseHeaders.delete(header);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export const runtime = "nodejs";

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
