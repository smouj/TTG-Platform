// ============================================================
// Trading Tazos Game — Central Site Configuration
// ============================================================
// Single source of truth for all site-level constants,
// metadata, and structured data used across the codebase.
// ============================================================

export const SITE_CONFIG = {
  name: "Trading Tazos Game",
  shortName: "TTG",
  version: "0.10.0",
  canonicalUrl: "https://tradingtazosgame.com",
  totalTazos: 139,
  publishedTazos: 139,
  totalSeries: 3,
  statsCount: 9,
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
        "Natural creatures born from Life Sparks in the luminous realm of Luminara. Pathfinders form Bond Marks with them, and each one grows through the Blooming process.",
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
        "Martial fighters from the Bellora clan lands. Roar Aura, clan discipline, Bell Shards, and Dragon Bell mastery fuel their fighting spirit.",
    },
    {
      id: "cybermon",
      slug: "cybermon",
      name: "Cybermon",
      total: 50,
      published: 50,
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
    title: "Collect, Trade & Battle 139+ Tazos — Free Online Game",
    description:
      "Trading Tazos Game is a free browser-based skill game. Collect 139+ tazos across Minimon, Dracobell & Cybermon collections, build decks of 5, and battle in a physics-driven 3D arena. No download required.",
    canonicalPath: "/",
  },
  "how-to-play": {
    title: "How to Play — Trading Tazos Game",
    description:
      "Learn how to collect, trade, and battle tazos. Master the 9 combat stats (Attack, Defense, Spin, Control, Bounce, Weight, Resistance, Stability, Precision), build decks, and compete in the 3D arena.",
    canonicalPath: "/?page=how-to-play",
  },
  "collections-minimon": {
    title: "Minimon Collection — Creature Companions from Luminara | Trading Tazos Game",
    description:
      "Explore the Minimon series — 50 natural creatures from Luminara. Discover regions, blooming evolution, Pathfinders, creature habitats, and elemental companions.",
    canonicalPath: "/collections/minimon",
  },
  "collections-dracobell": {
    title: "Dracobell Collection — Martial Warriors of Bellora | Trading Tazos Game",
    description:
      "Explore the Dracobell series — 50 martial warriors from Bellora. Clans, Roar Aura, Bell Shards, ascension phases, and the legendary Dracobell tournament.",
    canonicalPath: "/collections/dracobell",
  },
  "collections-cybermon": {
    title: "Cybermon Collection — Digital Beasts of the Neon Grid | Trading Tazos Game",
    description:
      "Explore the Cybermon series — 50 digital monsters from the Neon Grid. Sectors, Soul Protocols, shift phases, Linkers, and the fight against the Null Signal.",
    canonicalPath: "/collections/cybermon",
  },
  collections: {
    title: "Collections — 139+ Tazos Across 3 Series | Trading Tazos Game",
    description:
      "Explore all 139+ tazos across Minimon (Luminara), Dracobell (Bellora), and Cybermon (Neon Grid). Each series has up to 50 unique creatures with lore, stats, and finishes.",
    canonicalPath: "/?page=collections",
  },
  tazos: {
    title: "Tazo Catalog — Browse All Published Tazos | Trading Tazos Game",
    description:
      "Browse the full catalog of published tazos. Filter by series, rarity, condition, and element. Each tazo has 9 combat stats, a finish type, and unique art.",
    canonicalPath: "/?page=tazos",
  },
  leaderboard: {
    title: "Leaderboard — Top Players & Rankings | Trading Tazos Game",
    description:
      "See the top-ranked players in Trading Tazos Game. Rankings by battles won, tazos collected, and CREDITS earned. Compete to climb the leaderboard.",
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
      "How Trading Tazos Game collects, uses, and protects your data. Cookie usage, analytics (Google Search Console), and your privacy rights under GDPR.",
    canonicalPath: "/?page=privacy",
  },
  terms: {
    title: "Terms of Service — Trading Tazos Game",
    description:
      "Terms and conditions for using Trading Tazos Game. Rules of conduct, account responsibilities, intellectual property, and disclaimers.",
    canonicalPath: "/?page=terms",
  },
  "refund-policy": {
    title: "Refund Policy — Trading Tazos Game",
    description:
      "Refund policy for Trading Tazos Game. Our game is free-to-play with no purchases. Credits cannot be purchased with real money. Contact support for any concerns.",
    canonicalPath: "/?page=refund-policy",
  },
  disclaimer: {
    title: "Disclaimer — Trading Tazos Game",
    description:
      "Trading Tazos Game is an independent fictional digital tazo game. Not affiliated with any third-party brand, franchise, or licensed intellectual property.",
    canonicalPath: "/?page=disclaimer",
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
      "How Trading Tazos Game uses cookies. Essential functional cookies, analytics (Google Search Console), and third-party advertising cookies.",
    canonicalPath: "/?page=cookies",
  },
  wiki: {
    title: "TTG Wiki — Catálogo Oficial de Criaturas, Héroes y Villanos | Trading Tazos Game",
    description:
      "Explora el catálogo oficial de Trading Tazos Game: 151 Minimon, 128 Cybermon y 72 Draco Bell. Criaturas, personajes, villanos, aliados, técnicas y lore del universo TTG.",
    canonicalPath: "/?page=wiki",
  },
}

// ── Footer links ──

export const FOOTER_LINKS = {
  info: [
    { label: "Tazos", href: "/?page=tazos" },
    { label: "Shop", href: "/?page=shop" },
    { label: "How to Play", href: "/?page=how-to-play" },
    { label: "FAQ", href: "/?page=faq" },
    { label: "Privacy", href: "/?page=privacy" },
    { label: "Terms", href: "/?page=terms" },
    { label: "Cookies", href: "/?page=cookies" },
    { label: "Contact", href: "/?page=contact" },
  ],
  legal: [],
  social: [
    { label: "X / Twitter", href: "https://x.com/tazosgame" },
    { label: "Reddit", href: "https://www.reddit.com/r/tradingtazosgame/" },
    { label: "Telegram", href: "https://t.me/tradingtazosgame" },
    { label: "Discord", href: "https://discord.gg/4mUhnc2REb" },
    { label: "Instagram", href: "https://www.instagram.com/tradingtazosgame/" },
  ],
}
