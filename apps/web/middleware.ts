import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "protectedshare.me";

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("host") || "";
  const hostname = hostHeader.split(":")[0].toLowerCase();

  if (hostname === `www.${CANONICAL_HOST}`) {
    const destination = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      `https://${CANONICAL_HOST}`
    );
    return NextResponse.redirect(destination, 301);
  }

  const response = NextResponse.next();

  // Preview, staging, and localhost must not compete with the canonical domain.
  if (hostname && hostname !== CANONICAL_HOST) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|logo.svg).*)",
};
