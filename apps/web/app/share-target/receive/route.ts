/**
 * Fallback for the manifest's share_target when the service worker isn't running yet (normally
 * public/sw.js answers this POST on the device and it never gets here). The body is never read or
 * logged: we answer straight away and send the browser to /share-target, which sets the worker up.
 */
export const dynamic = "force-dynamic";

function seeOther(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location, "Cache-Control": "no-store" } });
}

export function POST(): Response {
  return seeOther("/share-target?error=sw");
}

export function GET(): Response {
  return seeOther("/share-target");
}
