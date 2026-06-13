// ============================================================
// TTG Middleware — Cache-Control headers for public pages.
// ============================================================
// Public magazine pages are mostly static (client-side auth only)
// so we can cache them aggressively. APIs and app routes are
// excluded to avoid stale auth states.
// ============================================================

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Paths that get public caching (1h CDN, 24h stale-while-revalidate)
const CACHED_PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/privacy",
  "/terms",
  "/cookies",
  "/refund-policy",
])

// paths that should never be cached
const NO_CACHE_PREFIXES = ["/api/", "/app/", "/admin/", "/_next/", "/ws"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip caching for APIs, app routes, static assets
  if (NO_CACHE_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Apply caching for known public pages
  if (CACHED_PUBLIC_PATHS.has(pathname)) {
    const response = NextResponse.next()
    response.headers.set(
      "Cache-Control",
      "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400"
    )
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon|logo|tazos-generated|tazos-tubes|textures|fonts|ads\\.txt|robots\\.txt|sitemap\\.xml|manifest\\.json|llms\\.txt).*)",
  ],
}
