import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const response = NextResponse.next();

  // If the host is NOT our production domain, tell search engines to not index it.
  // This solves the "Multi-Domain Trap" / duplicate content penalty from staging/preview domains.
  if (host && !host.includes("protectedshare.me")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|logo.svg).*)",
};
