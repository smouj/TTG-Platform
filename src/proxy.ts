// ============================================================
// Trading Tazos Game — Proxy
// Auth route protection + legacy redirects.
// ============================================================

import { NextRequest, NextResponse } from "next/server"

const ROOT_REDIRECTS: Record<string, string> = {
  "/app": "/app/album",
}

const LEGACY_PAGES: Record<string, string> = {
  "/collection": "/app/collection",
  "/decks": "/app/decks",
  "/quests": "/app/quests",
  "/shop": "/app/shop",
  "/album": "/app/album",
  "/battle": "/app/battle",
  "/scanner": "/app/album",
  "/stats": "/app/stats",
  "/profile": "/app/settings",
  "/settings": "/app/settings",
  "/inventory": "/app/collection",
}

const AUTH_REDIRECT_PAGES = ["/login"]

export function proxy(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value
  const { pathname } = req.nextUrl

  if (ROOT_REDIRECTS[pathname]) {
    return NextResponse.redirect(new URL(ROOT_REDIRECTS[pathname], req.url), 307)
  }

  if (LEGACY_PAGES[pathname]) {
    return NextResponse.redirect(new URL(LEGACY_PAGES[pathname], req.url), 308)
  }

  if (pathname.startsWith("/app/")) {
    if (!token || isJwtExpired(token)) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("redirect", pathname)
      const res = NextResponse.redirect(loginUrl)
      res.cookies.delete("auth_token")
      res.cookies.delete("ttg_session")
      return res
    }
    return NextResponse.next()
  }

  if (AUTH_REDIRECT_PAGES.includes(pathname) && token && !isJwtExpired(token)) {
    return NextResponse.redirect(new URL("/app/album", req.url))
  }

  return NextResponse.next()
}

function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"))
    return payload.exp ? Date.now() / 1000 > payload.exp : true
  } catch {
    return true
  }
}

export const config = {
  matcher: [
    "/app",
    "/app/:path*",
    "/collection", "/collection/:path*",
    "/decks", "/decks/:path*",
    "/quests", "/quests/:path*",
    "/shop", "/shop/:path*",
    "/album",
    "/battle", "/battle/:path*",
    "/scanner", "/scanner/:path*",
    "/stats", "/stats/:path*",
    "/profile",
    "/settings", "/settings/:path*",
    "/inventory",
    "/login", "/register",
  ],
}
