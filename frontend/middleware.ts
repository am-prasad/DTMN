/**
 * C4: Admin route authentication guard.
 *
 * Checks for the presence of auth cookies before serving any /admin route.
 * The API is the true authority (it validates the JWT on every request);
 * this middleware provides the UX experience of redirecting to login rather
 * than letting the user see a broken shell with failed data fetches.
 *
 * Note: httpOnly cookies are not readable by JS, but Next.js middleware runs
 * on the Edge and CAN read them via request.cookies.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the login page through unconditionally
  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // Check for either auth cookie.  The access token expires in 15 min but the
  // refresh token lasts 7 days; presence of either means the user has a session
  // (the API will reject the access token if expired, the client will then
  // call /auth/refresh which issues a new one — see lib/api.ts).
  const hasSession =
    request.cookies.has("access_token") || request.cookies.has("refresh_token");

  if (!hasSession) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};