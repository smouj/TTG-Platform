// ============================================================
// Trading Tazos Game — Franchise Config (Single Source of Truth)
//
// All franchise metadata lives here.
// `count` and `total` represent the canonical Season 1 collection size.
// Runtime published counts come from `/api/stats`.
// ============================================================

export interface FranchiseConfig {
  slug: string
  name: string
  /** Canonical Season 1 tazos */
  count: number
  /** Canonical Season 1 total */
  total: number
  year: number
  origin: string
  color: string
  categories: string[]
}

export const FRANCHISES: FranchiseConfig[] = [
  {
    slug: "minimon",
    name: "Minimon",
    count: 50,
    total: 50,
    year: 2026,
    origin: "TazoForge Studios",
    color: "var(--ttg-yellow)",
    categories: ["Tazos"],
  },
  {
    slug: "dracobell",
    name: "Dracobell",
    count: 45,
    total: 50,
    year: 2026,
    origin: "TazoForge Studios",
    color: "var(--ttg-dracobell)",
    categories: ["Tazos", "Megatazos", "Supertazos Octogonales", "Supertazos Voladores", "Mastertazos", "Holo 3D"],
  },
  {
    slug: "cybermon",
    name: "Cybermon",
    count: 44,
    total: 50,
    year: 2026,
    origin: "TazoForge Studios",
    color: "#00B4D8",
    categories: ["Caps"],
  },
]

/** Quick lookup by slug */
export const FRANCHISE_BY_SLUG: Record<string, FranchiseConfig> = Object.fromEntries(
  FRANCHISES.map((f) => [f.slug, f])
)

/** Total canonical Season 1 tazos across all franchises */
export const TOTAL_PLANNED = FRANCHISES.reduce((sum, f) => sum + f.total, 0)

/** Current static Season 1 target; runtime published counts come from /api/stats */
export const TOTAL_PUBLISHED = FRANCHISES.reduce((sum, f) => sum + f.count, 0)
