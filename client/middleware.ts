import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // Protected routes
  const isProtectedRoute = 
    pathname.startsWith("/browse") || 
    pathname.startsWith("/movies") || 
    pathname.startsWith("/admin") || 
    pathname.startsWith("/profile");

  // Auth routes
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/browse", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/browse/:path*",
    "/movies/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/login",
    "/register",
  ],
};
