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

async function proxy(request: Request): Promise<Response> {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(
    `${API_BACKEND_URL}${incomingUrl.pathname}${incomingUrl.search}`,
  );

  const headers = new Headers(request.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
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
