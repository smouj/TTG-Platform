import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

// Proxy redirects (from legacy proxy.ts)
const ROOT_REDIRECTS: Record<string, string> = {
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
};

const LEGACY_GAME_ROUTES = [
  "/collection", "/decks", "/quests", "/shop",
  "/battle", "/scanner", "/stats", "/profile",
  "/settings", "/inventory", "/login", "/register",
  "/forgot-password", "/reset-password", "/verify-email",
];

// i18n middleware
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle proxy-level redirects (before i18n)
  if (ROOT_REDIRECTS[pathname] && pathname !== "/tazos") {
    // For root redirects that map to SPA pages, apply i18n-aware redirect
    return NextResponse.redirect(new URL(ROOT_REDIRECTS[pathname], request.url), 307);
  }

  // /tazos → /wiki (explicit redirect)
  if (pathname === "/tazos") {
    return NextResponse.redirect(new URL("/wiki", request.url), 308);
  }

  // Legacy game routes → home
  if (LEGACY_GAME_ROUTES.includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url), 308);
  }

  // Old app/* routes → home
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return NextResponse.redirect(new URL("/", request.url), 308);
  }

  // Let i18n middleware handle the rest
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|tazos-artgen|assets|.*\\..*).*)",
  ],
};
