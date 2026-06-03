// ============================================================
// Trading Tazos Game — Middleware
// Handles auth redirects and route protection.
// ============================================================

import { NextRequest, NextResponse } from "next/server"

// Pages that require authentication
const PROTECTED_PAGES = ["/collection", "/decks", "/quests", "/shop"]

// Pages that redirect to home if already logged in
const AUTH_PAGES = ["/login", "/register"]

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value
  const { pathname } = req.nextUrl

  // Redirect authenticated users away from login/register
  if (AUTH_PAGES.includes(pathname) && token) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Redirect unauthenticated users away from protected pages
  if (PROTECTED_PAGES.some(p => pathname === p || pathname.startsWith(p + "/")) && !token) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/collection/:path*",
    "/decks/:path*",
    "/quests/:path*",
    "/shop/:path*",
    "/login",
    "/register",
  ],
}
