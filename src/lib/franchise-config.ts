// ============================================================
// Trading Tazos Game — Franchise Config (Single Source of Truth)
//
// All franchise metadata lives here. When new tazos are published,
// update `count` here and it propagates everywhere automatically.
// `total` and `planned` are aspirational target numbers.
// ============================================================

export interface FranchiseConfig {
  slug: string
  name: string
  /** Currently published tazos */
  count: number
  /** Planned total tazos (aspirational) */
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
    year: 2000,
    origin: "Matutano",
    color: "#FFCC00",
    categories: ["Tazos"],
  },
  {
    slug: "dracobell",
    name: "Dracobell",
    count: 50,
    total: 50,
    year: 1995,
    origin: "Matutano",
    color: "#FF6B00",
    categories: ["Tazos", "Megatazos", "Supertazos Octogonales", "Supertazos Voladores", "Mastertazos", "Holo 3D"],
  },
  {
    slug: "cybermon",
    name: "Cybermon",
    count: 48,
    total: 48,
    year: 2000,
    origin: "Magic Box",
    color: "#00B4D8",
    categories: ["Caps"],
  },
]

/** Quick lookup by slug */
export const FRANCHISE_BY_SLUG: Record<string, FranchiseConfig> = Object.fromEntries(
  FRANCHISES.map((f) => [f.slug, f])
)

/** Total planned tazos across all franchises */
export const TOTAL_PLANNED = FRANCHISES.reduce((sum, f) => sum + f.total, 0)

/** Total published tazos across all franchises */
export const TOTAL_PUBLISHED = FRANCHISES.reduce((sum, f) => sum + f.count, 0)
