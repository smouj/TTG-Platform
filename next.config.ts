import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  turbopack: {
    root: __dirname,
  },

  // Force-include packages that static analysis misses
  experimental: {
    outputFileTracingIncludes: {
      "/**/*": ["nodemailer", "stripe"],
    },
  },

  // ── Security Headers ──
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-XSS-Protection", value: "1; mode=block" },
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
      { source: "/collections", destination: "/?page=collections", permanent: true },
      { source: "/tazos", destination: "/?page=tazos", permanent: true },
      { source: "/faq", destination: "/?page=faq", permanent: true },
      { source: "/how-to-play", destination: "/?page=how-to-play", permanent: true },
      { source: "/leaderboard", destination: "/?page=leaderboard", permanent: true },
      { source: "/download", destination: "/?page=download", permanent: true },
      { source: "/battle-system", destination: "/?page=how-to-play", permanent: true },

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
