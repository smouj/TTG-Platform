import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: false,
  turbopack: {
    root: __dirname,
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
      { source: "/refund-policy", destination: "/terms", permanent: true },
      { source: "/reset-password", destination: "/login", permanent: true },
      { source: "/verify-email", destination: "/login", permanent: true },
      { source: "/signup", destination: "/register", permanent: true },

      // Battle
      { source: "/arena", destination: "/app/battle", permanent: false },

      // Legacy RPGClaw routes → redirect home
      { source: "/earth", destination: "/", permanent: true },
      { source: "/status", destination: "/leaderboard", permanent: true },

      // Favicon fallbacks
      { source: "/favicon.ico", destination: "/favicon.png", permanent: true },
      { source: "/favicon-32x32.png", destination: "/favicon.png", permanent: true },
    ];
  },
};

export default nextConfig;
