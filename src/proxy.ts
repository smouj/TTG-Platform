// ============================================================
// Trading Tazos Game — Proxy
// Public redirects + LEGACY game routes → landing page.
// (Auth removed: website is marketing-only now)
// ============================================================

import { NextRequest, NextResponse } from "next/server"

const ROOT_REDIRECTS: Record<string, string> = {
  "/app": "/",
  "/privacy": "/?page=privacy",
  "/terms": "/?page=terms",
  "/cookies": "/?page=cookies",
  "/contact": "/?page=contact",
  "/refund-policy": "/?page=refund-policy",
  "/disclaimer": "/?page=disclaimer",
  "/tazos": "/?page=wiki",
  "/faq": "/?page=faq",
  "/how-to-play": "/?page=how-to-play",
  "/download": "/?page=download",
  "/leaderboard": "/?page=leaderboard",
}

// Legacy game routes → landing page (game moved to TTG-Engine)
const LEGACY_GAME_ROUTES = [
  "/collection", "/decks", "/quests", "/shop",
  "/battle", "/scanner", "/stats", "/profile",
  "/settings", "/inventory", "/login", "/register",
  "/forgot-password", "/reset-password", "/verify-email",
]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (ROOT_REDIRECTS[pathname] && !req.nextUrl.searchParams.has("tab")) {
    return NextResponse.redirect(new URL(ROOT_REDIRECTS[pathname], req.url), 307)
  }

  if (LEGACY_GAME_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/", req.url), 308)
  }

  // Old app/* routes → landing
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return NextResponse.redirect(new URL("/", req.url), 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/app/:path*",
    "/privacy",
    "/terms",
    "/contact",
    "/faq",
    "/download",
    "/leaderboard",
    "/cookies",
    "/refund-policy",
    "/disclaimer",
    "/tazos",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
    "/how-to-play",
    "/collection",
    "/decks",
    "/quests",
    "/shop",
    "/battle",
    "/scanner",
    "/stats",
    "/profile",
    "/settings",
    "/inventory",
  ],
}
