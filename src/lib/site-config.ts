// ============================================================
// Trading Tazos Game — Central Site Configuration
// ============================================================
// Single source of truth for all site-level constants,
// metadata, and structured data used across the codebase.
// ============================================================

export const SITE_CONFIG = {
  name: "Trading Tazos Game",
  shortName: "TTG",
  version: "0.6.2",
  canonicalUrl: "https://tradingtazosgame.com",
  totalTazos: 150, // 149 published + 1 pending (Cybermon #50 missing composite)
  publishedTazos: 149,
  totalSeries: 3,
  statsCount: 8,
  freeToPlay: true,
  tagline: "Collect. Trade. Battle.",
  disclaimer:
    "Trading Tazos Game is an independent fictional digital tazo game. Not affiliated with any third-party brand.",
  supportEmail: "support@tradingtazosgame.com",

  series: [
    {
      id: "minimon",
      slug: "minimon",
      name: "Minimon",
      total: 50,
      published: 50,
      year: 2026,
      realm: "Luminara",
      description:
        "Natural creatures born from Vital Sparks in the luminous realm of Luminara. They grow through trust, purpose, and lineage awakening.",
    },
    {
      id: "dracobell",
      slug: "dracobell",
      name: "Dracobell",
      total: 50,
      published: 50,
      year: 2026,
      realm: "Bellora",
      description:
        "Martial fighters from the Bellora clan lands. Roar Aura, clan discipline, Bell Shards, and Crown Bell mastery fuel their fighting spirit.",
    },
    {
      id: "cybermon",
      slug: "cybermon",
      name: "Cybermon",
      total: 50,
      published: 49,
      year: 2026,
      realm: "Neon Grid",
      description:
        "Living digital monsters from the Neon Grid. Soul Protocols shift through patches, surges, cores, and prime forms in a reality of living code.",
    },
  ],

  social: {
    x: "https://x.com/tazosgame",
    reddit: "https://www.reddit.com/r/tradingtazosgame/",
    telegram: "https://t.me/tradingtazosgame",
    instagram: "https://www.instagram.com/tradingtazosgame/",
    discord: "https://discord.gg/4mUhnc2REb",
    github: "https://github.com/smouj/Trading-Tazos-Game",
  },
} as const

// ── Derived helpers ──

export function getSeriesBySlug(slug: string) {
  return SITE_CONFIG.series.find((s) => s.slug === slug)
}

export function getTotalPlanned(): number {
  return SITE_CONFIG.series.reduce((sum, s) => sum + s.total, 0)
}

export function getTotalPublished(): number {
  return SITE_CONFIG.series.reduce((sum, s) => sum + s.published, 0)
}

export function getLanguageAlternates(canonicalPath = "") {
  const canonical = `${SITE_CONFIG.canonicalUrl}${canonicalPath}`
  const separator = canonical.includes("?") ? "&" : "?"
  return {
    canonical,
    languages: {
      en: canonical,
      es: `${canonical}${separator}lang=es`,
    },
  }
}

// ── Page-level metadata helpers ──

export interface PageMeta {
  title: string
  description: string
  canonicalPath?: string
  noIndex?: boolean
  ogImage?: string
}

export const PAGE_META: Record<string, PageMeta> = {
  home: {
    title: "Collect, Trade & Battle 150 Tazos — Free Online Game",
    description:
      "Trading Tazos Game is a free browser-based skill game. Collect 150 tazos across Minimon, Dracobell & Cybermon collections, build decks of 5, and battle in a physics-driven 3D arena. No download required.",
    canonicalPath: "/",
  },
  "how-to-play": {
    title: "How to Play — Trading Tazos Game",
    description:
      "Learn how to collect, trade, and battle tazos. Master the 8 combat stats (Attack, Defense, Spin, Control, Bounce, Weight, Resistance, Precision), build decks, and compete in the 3D arena.",
    canonicalPath: "/?page=how-to-play",
  },
  collections: {
    title: "Collections — 150 Tazos Across 3 Series | Trading Tazos Game",
    description:
      "Explore all 150 tazos across Minimon (Luminara), Dracobell (Bellora), and Cybermon (Neon Grid). Each series has 50 unique creatures with lore, stats, and finishes.",
    canonicalPath: "/?page=collections",
  },
  tazos: {
    title: "Tazo Catalog — Browse All Published Tazos | Trading Tazos Game",
    description:
      "Browse the full catalog of published tazos. Filter by franchise, rarity, condition, and element. Each tazo has 8 combat stats, a finish type, and unique art.",
    canonicalPath: "/?page=tazos",
  },
  leaderboard: {
    title: "Leaderboard — Top Players & Rankings | Trading Tazos Game",
    description:
      "See the top-ranked players in Trading Tazos Game. Rankings by battles won, tazos collected, and credits earned. Compete to climb the leaderboard.",
    canonicalPath: "/?page=leaderboard",
  },
  download: {
    title: "Download — Trading Tazos Game Apps",
    description:
      "Download Trading Tazos Game for Windows, macOS, and Linux, or play instantly in your browser with PWA support.",
    canonicalPath: "/?page=download",
  },
  faq: {
    title: "FAQ — Frequently Asked Questions | Trading Tazos Game",
    description:
      "Answers to common questions about Trading Tazos Game. How to play, collecting tazos, bag types, battle mechanics, privacy, and more.",
    canonicalPath: "/?page=faq",
  },
  shop: {
    title: "Shop — Tazo Bags & Packs | Trading Tazos Game",
    description:
      "Browse tazo bags, packs, and bundles. Each bag contains random tazos with different rarity chances. Choose from Basic and Premium packs.",
    canonicalPath: "/?page=shop",
  },
  privacy: {
    title: "Privacy Policy — Trading Tazos Game",
    description:
      "How Trading Tazos Game collects, uses, and protects your data. Cookie usage, analytics (Plausible), and your privacy rights under GDPR.",
    canonicalPath: "/?page=privacy",
  },
  terms: {
    title: "Terms of Service — Trading Tazos Game",
    description:
      "Terms and conditions for using Trading Tazos Game. Rules of conduct, account responsibilities, intellectual property, and disclaimers.",
    canonicalPath: "/?page=terms",
  },
  contact: {
    title: "Contact — Trading Tazos Game",
    description:
      "Get in touch with the Trading Tazos Game team. Bug reports, feature requests, partnership inquiries, or just say hello.",
    canonicalPath: "/?page=contact",
  },
  login: {
    title: "Login — Trading Tazos Game",
    description:
      "Sign in to your Trading Tazos Game account to access your collection, battle arena, shop, and leaderboard rankings.",
    canonicalPath: "/login",
  },
  register: {
    title: "Create Account — Start Your Collection Free | Trading Tazos Game",
    description:
      "Create your free Trading Tazos Game account — get 30 welcome tazo bags, build collections, enter the 3D battle arena, and rise through the leaderboard.",
    canonicalPath: "/register",
  },
  "game/practice": {
    title: "Practice Battle — Trading Tazos Game",
    description:
      "Practice your tazo slamming skills against the AI. No stakes, no pressure — master the physics-based 3D battle arena.",
    canonicalPath: "/game/practice",
    noIndex: true,
  },
  "game/ranked": {
    title: "Ranked Battle — Trading Tazos Game",
    description:
      "Compete in ranked matches to climb the leaderboard. Win battles, earn credits, and prove your tazo training mastery.",
    canonicalPath: "/game/ranked",
  },
  "app/collection": {
    title: "My Collection — Trading Tazos Game",
    description:
      "View and manage your personal tazo collection. Browse owned tazos, check stats, and organize your digital album.",
    canonicalPath: "/app/collection",
    noIndex: true,
  },
  "app/shop": {
    title: "Shop — Buy Tazo Bags | Trading Tazos Game",
    description:
      "Buy tazo bags and open packs to expand your collection. Basic and Premium packs with different rarity odds.",
    canonicalPath: "/app/shop",
    noIndex: true,
  },
  "app/battle": {
    title: "Battle Arena — Trading Tazos Game",
    description:
      "Enter the 3D battle arena. Challenge AI opponents, compete in ranked matches, or battle friends in PvP mode.",
    canonicalPath: "/app/battle",
    noIndex: true,
  },
  cookies: {
    title: "Cookie Policy — Trading Tazos Game",
    description:
      "How Trading Tazos Game uses cookies. Essential functional cookies, analytics (Plausible), and third-party advertising cookies.",
    canonicalPath: "/?page=cookies",
  },
}

// ── Footer links ──

export const FOOTER_LINKS = {
  info: [
    { label: "How to Play", href: "/?page=how-to-play" },
    { label: "Collections", href: "/?page=collections" },
    { label: "Tazo Catalog", href: "/?page=tazos" },
    { label: "Leaderboard", href: "/?page=leaderboard" },
    { label: "Download", href: "/?page=download" },
    { label: "FAQ", href: "/?page=faq" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/?page=privacy" },
    { label: "Terms of Service", href: "/?page=terms" },
    { label: "Cookie Policy", href: "/?page=cookies" },
    { label: "Contact", href: "/?page=contact" },
  ],
  social: [
    { label: "X / Twitter", href: "https://x.com/tazosgame" },
    { label: "Reddit", href: "https://www.reddit.com/r/tradingtazosgame/" },
    { label: "Telegram", href: "https://t.me/tradingtazosgame" },
    { label: "Instagram", href: "https://www.instagram.com/tradingtazosgame/" },
    { label: "Discord", href: "https://discord.gg/4mUhnc2REb" },
    { label: "GitHub", href: "https://github.com/smouj/Trading-Tazos-Game" },
  ],
}
