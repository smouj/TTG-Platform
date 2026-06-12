// ============================================================
// Trading Tazos Game — FAQ Content (single source of truth)
// ============================================================
// Used by both the visible FAQ page and JSON-LD FAQPage schema.
// Edit here to keep both in sync automatically.
// ============================================================

import { SITE_CONFIG } from "@/lib/site-config"

export interface FaqEntry {
  q: string
  a: string
}

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    q: "What is Trading Tazos Game?",
    a: `A browser-based skill game where you collect and battle with digital tazos. Open bags to discover ${SITE_CONFIG.totalTazos} unique tazos across 3 franchises (Minimon, Dracobell, Cybermon). Build decks of 5, then enter the 3D arena where you aim, charge, and slam your tazos to flip opponent discs and capture them for points.`,
  },
  {
    q: "Is it free to play?",
    a: "Yes, completely free. Start with 100 credits and 30 welcome bags. Earn up to 225 credits daily: battles (10 per win, 10 wins/day max), daily bonus (25), and rewarded ads (100). No credit card required.",
  },
  {
    q: "How does the battle system work?",
    a: "Use the Vertical Slam system: aim your crosshair at the center, charge the power bar for slam force, then tilt to control your landing angle. Flip opponent tazos to capture them. Miss and you lose your thrown tazo. Eliminate all opponent tazos to claim victory!",
  },
  {
    q: "What are the combat stats?",
    a: "Each tazo has 9 stats: Attack, Defense, Resistance, Weight, Stability, Spin, Control, Bounce, and Precision. Building a balanced deck with complementary stats is key.",
  },
  {
    q: "Can I play on mobile?",
    a: "Yes! Visit tradingtazosgame.com on your phone, install as PWA, and play full-screen. Desktop versions also available.",
  },
  {
    q: "How do credits work?",
    a: "Credits buy tazo bags (100 credits each). Earn them through battles (10cr/win, max 10 wins/day), quests, daily bonuses (25cr), and rewarded ads (5×20cr). The Starter credit pack gives you 5 bags — perfect to begin your collection.",
  },
  {
    q: "What quests are there?",
    a: "17 quests across 4 categories (Beginner, Daily, Weekly, Special) and 18 achievements with Bronze → Platinum tiers.",
  },
  {
    q: "How do I get started?",
    a: "Create a free account, open your welcome bags, build a deck of 5, and enter the Battle Arena.",
  },
  {
    q: "Is Trading Tazos Game affiliated with any real brand?",
    a: "No. TTG is an independent fictional digital tazo game. Minimon, Dracobell, and Cybermon are original fictional IPs created for this game. TTG is not affiliated with, endorsed by, or connected to any third-party toy, anime, game or collectible brand.",
  },
  {
    q: "What data does the site collect?",
    a: "We collect your username, email, gameplay data (tazos, decks, battles), and technical logs for security. We use Plausible Analytics (privacy-friendly, no personal data). See our Privacy Policy for details.",
  },
  {
    q: "Does the site show ads?",
    a: "TTG may show non-personalized ads through Google AdSense. No personalized ads are served without your consent. We don't track you across websites.",
  },
]

/** Generates Schema.org FAQPage JSON-LD */
export function generateFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ENTRIES.map((entry) => ({
      "@type": "Question",
      name: entry.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: entry.a.replace(/`/g, "").replace(/\*\*/g, ""),
      },
    })),
  }
}
