// ============================================================
// Trading Tazos Game — Middleware
// ============================================================

import { NextRequest, NextResponse } from "next/server"

// Dashboard root → album
const ROOT_REDIRECTS: Record<string, string> = {
  "/app": "/app/album",
}

// Legacy pages → new /app/* paths
const LEGACY_PAGES: Record<string, string> = {
  "/collection": "/app/collection",
  "/decks": "/app/decks",
  "/quests": "/app/quests",
  "/shop": "/app/shop",
  "/album": "/app/album",
  "/battle": "/app/battle",
  "/scanner": "/app/scanner",
  "/stats": "/app/stats",
}

// Auth pages (redirect to dashboard if already logged in)
const AUTH_PAGES = ["/login", "/register"]

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value
  const { pathname } = req.nextUrl

  // Root redirects
  if (ROOT_REDIRECTS[pathname]) {
    return NextResponse.redirect(new URL(ROOT_REDIRECTS[pathname], req.url), 307)
  }

  // Legacy page redirects → /app/*
  if (LEGACY_PAGES[pathname]) {
    return NextResponse.redirect(new URL(LEGACY_PAGES[pathname], req.url), 308)
  }

  // /app/* — entire dashboard requires authentication
  if (pathname.startsWith("/app/")) {
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // Redirect authenticated users away from login/register → dashboard
  if (AUTH_PAGES.includes(pathname) && token) {
    return NextResponse.redirect(new URL("/app/album", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Dashboard root redirect
    "/app",
    // Dashboard pages (protected)
    "/app/:path*",
    // Legacy redirects
    "/collection", "/collection/:path*",
    "/decks", "/decks/:path*",
    "/quests", "/quests/:path*",
    "/shop", "/shop/:path*",
    "/album",
    "/battle", "/battle/:path*",
    "/scanner", "/scanner/:path*",
    "/stats", "/stats/:path*",
    // Auth pages
    "/login", "/register",
  ],
}
