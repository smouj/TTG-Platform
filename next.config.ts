import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  turbopack: {
    root: __dirname,
  },

  // Force-include packages that static analysis misses
  // Exclude dev files from standalone build (saves ~270MB)
  outputFileTracingExcludes: {
    "/**/scripts/**": ["*"],
    "/**/ai-creature-log.json": ["*"],
    "/**/all-tazos.json": ["*"],
  },

  // Force-include packages + manifests missing in Turbopack standalone builds
  outputFileTracingIncludes: {
    "/**/*": ["nodemailer", "stripe", "bcryptjs"],
    "/_not-found": [".next/server/app/not-found*", ".next/server/app/_not-found*"],
    "/app/battle": [".next/server/app/app/battle/page_client-reference-manifest.js"],
    "/app/battle/play": [".next/server/app/app/battle/play/page_client-reference-manifest.js"],
  },

  // ── Security Headers ──
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fundingchoicesmessages.google.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self'",
              "connect-src 'self' wss://tradingtazosgame.com ws://localhost:* https://www.google-analytics.com",
              "frame-src 'self' https://js.stripe.com",
              "media-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ── Redirects ──
  async redirects() {
    return [
      // Legacy SEO routes
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/terms-of-service", destination: "/terms", permanent: true },
      { source: "/signup", destination: "/register", permanent: true },

      // Battle
      { source: "/arena", destination: "/app/battle", permanent: false },

      // App nav merge — Album merged into Collection
      { source: "/app/album", destination: "/app/collection", permanent: true },
      { source: "/app/album/:path*", destination: "/app/collection", permanent: true },

      // Standalone pages → launcher tabs (single source of truth)
      { source: "/wiki", destination: "/?page=wiki", permanent: true },
      { source: "/collections", destination: "/?page=collections", permanent: true },
      
      // Collection series pages → unified launcher (removes old yellow-header pages)
      { source: "/collections/cybermon", destination: "/?page=collections", permanent: true },
      { source: "/collections/dracobell", destination: "/?page=collections", permanent: true },
      { source: "/collections/minimon", destination: "/?page=collections", permanent: true },
      { source: "/tazos", destination: "/?page=tazos", permanent: true },
      { source: "/faq", destination: "/?page=faq", permanent: true },
      { source: "/how-to-play", destination: "/?page=how-to-play", permanent: true },
      { source: "/leaderboard", destination: "/?page=leaderboard", permanent: true },
      { source: "/download", destination: "/?page=download", permanent: true },
      { source: "/battle-system", destination: "/?page=how-to-play", permanent: true },

      // Legacy admin routes — renamed for clarity
      { source: "/admin/tubes", destination: "/admin/decks", permanent: true },
      { source: "/admin/tube-models", destination: "/admin/deck-models", permanent: true },
      { source: "/admin/bag-models", destination: "/admin/shop-bag-models", permanent: true },

      // Legacy RPGClaw routes → redirect home
      { source: "/earth", destination: "/", permanent: true },
      { source: "/status", destination: "/leaderboard", permanent: true },

      // Public shop preview → launcher landing
      { source: "/shop", destination: "/?page=shop", permanent: false },

      // Favicon fallbacks
      { source: "/favicon.ico", destination: "/favicon.png", permanent: true },
      { source: "/favicon-32x32.png", destination: "/favicon.png", permanent: true },
    ];
  },
};

export default nextConfig;
