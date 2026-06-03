// ============================================================
// Trading Tazos Game — Middleware
// Handles auth redirects and route protection.
// ============================================================

import { NextRequest, NextResponse } from "next/server"

// Pages that require authentication
const PROTECTED_PAGES = ["/app/shop", "/app/quests", "/app/collection", "/app/decks"]

// Legacy standalone pages that redirect to /app/*
const LEGACY_PAGES: Record<string, string> = {
  "/shop": "/app/shop",
  "/quests": "/app/quests",
  "/collection": "/app/collection",
  "/decks": "/app/decks",
  "/album": "/app/album",
  "/battle": "/app/battle",
  "/scanner": "/app/scanner",
  "/stats": "/app/stats",
  "/leaderboard": "/app/leaderboard",
  "/download": "/app/download",
}

// Pages that redirect to home if already logged in
const AUTH_PAGES = ["/login", "/register"]

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value
  const { pathname } = req.nextUrl

  // Legacy page redirects → /app/*
  if (LEGACY_PAGES[pathname]) {
    const target = new URL(LEGACY_PAGES[pathname], req.url)
    // Preserve any query params (e.g. redirect)
    req.nextUrl.searchParams.forEach((v, k) => target.searchParams.set(k, v))
    return NextResponse.redirect(target, 308)
  }

  // Redirect authenticated users away from login/register → dashboard
  if (AUTH_PAGES.includes(pathname) && token) {
    return NextResponse.redirect(new URL("/app", req.url))
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
    // 🔒 Protected pages
    "/app/shop",
    "/app/shop/:path*",
    "/app/quests",
    "/app/quests/:path*",
    "/app/collection",
    "/app/collection/:path*",
    "/app/decks",
    "/app/decks/:path*",
    // Legacy redirects
    "/shop",
    "/shop/:path*",
    "/quests",
    "/quests/:path*",
    "/collection",
    "/collection/:path*",
    "/decks",
    "/decks/:path*",
    "/album",
    "/battle",
    "/battle/:path*",
    "/scanner",
    "/scanner/:path*",
    "/stats",
    "/stats/:path*",
    "/leaderboard",
    "/leaderboard/:path*",
    "/download",
    "/download/:path*",
    // Auth pages
    "/login",
    "/register",
  ],
}
