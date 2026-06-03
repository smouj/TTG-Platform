// ============================================================
// Trading Tazos Game — Middleware
// Handles auth redirects and route protection.
// ============================================================

import { NextRequest, NextResponse } from "next/server"

// Legacy pages that redirect to /app?tab=...
const LEGACY_PAGES: Record<string, string> = {
  "/collection": "/app?tab=collection",
  "/decks": "/app?tab=decks",
  "/quests": "/app?tab=quests",
  "/shop": "/app?tab=shop",
  "/album": "/app?tab=album",
  "/battle": "/app?tab=battle",
  "/scanner": "/app?tab=scanner",
  "/stats": "/app?tab=stats",
}

// Auth pages (redirect to /app if already logged in)
const AUTH_PAGES = ["/login", "/register"]

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value
  const { pathname } = req.nextUrl

  // Legacy page redirects → /app?tab=...
  if (LEGACY_PAGES[pathname]) {
    return NextResponse.redirect(new URL(LEGACY_PAGES[pathname], req.url), 308)
  }

  // /app — entire dashboard requires authentication
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("redirect", pathname + req.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Redirect authenticated users away from login/register → dashboard
  if (AUTH_PAGES.includes(pathname) && token) {
    return NextResponse.redirect(new URL("/app", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Dashboard (protected)
    "/app",
    "/app/:path*",
    // Legacy redirects
    "/collection",
    "/collection/:path*",
    "/decks",
    "/decks/:path*",
    "/quests",
    "/quests/:path*",
    "/shop",
    "/shop/:path*",
    "/album",
    "/battle",
    "/battle/:path*",
    "/scanner",
    "/scanner/:path*",
    "/stats",
    "/stats/:path*",
    // Auth pages
    "/login",
    "/register",
  ],
}
