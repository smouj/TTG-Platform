// ============================================================
// Trading Tazos Game — Game Types
// Real-world verified tazo collections from Spain.
// ============================================================

export interface Tazo {
  id: string
  name: string | null
  displayName: string | null
  slug: string
  franchiseId: string
  collectionId: string
  number: string
  variant: string | null
  category: string | null
  manufacturer: string | null
  country: string | null
  sourceStatus: SourceStatus
  combatType: string | null
  condition: TazoCondition
  physicalType: PhysicalType
  rarity: Rarity
  imageUrl: string | null
  backImageUrl?: string | null
  finish?: string | null
  creatureVariant?: string | null
  shinyImageUrl?: string | null
  wear?: number
  skill: string | null
  skillDesc: string | null
  evolutionFrom: string | null
  evolutionTo: string | null
  transformStage: string | null
  transformOf: string | null
  attack: number
  defense: number
  resistance: number
  weight: number
  stability: number
  spin: number
  control: number
  bounce: number
  precision: number
  role?: string | null
  stackable?: boolean
  maxStackOn?: number
  isOwned: boolean
  obtainedFrom?: ObtainedFrom | null
  battleWins: number
  battleLosses: number
  franchise?: string | null
  franchiseName?: string | null
  franchiseColor?: string | null
  franchiseSlug?: string | null
  collection?: string | null
  collectionName?: string | null
  collectionSlug?: string | null
  collectionYear?: number | null
  createdAt: string
  updatedAt: string
}

export interface Franchise {
  id: string
  name: string
  slug: string
  color: string
  icon: string | null
  description: string | null
  mechanic: string | null
  collections?: Collection[]
  tazos?: Tazo[]
}

export interface Collection {
  id: string
  name: string
  slug: string
  franchiseId: string
  franchise?: Franchise
  year: number | null
  totalTazos: number
  description: string | null
  manufacturer: string | null
  country: string | null
  tazos?: Tazo[]
}

// ---- Source Status ----
export type SourceStatus = "verified" | "partial" | "pending_visual_check"

export const SOURCE_STATUS_CONFIG: Record<SourceStatus, { label: string; color: string; bg: string }> = {
  verified: { label: "Verified", color: "text-emerald-600", bg: "bg-emerald-100" },
  partial: { label: "Partial", color: "text-amber-600", bg: "bg-amber-100" },
  pending_visual_check: { label: "Pending Visual Check", color: "text-gray-500", bg: "bg-gray-100" },
}

// ---- Obtained From (acquisition source) ----
export type ObtainedFrom = "bag" | "starter" | "scanner"

export const OBTAINED_FROM_CONFIG: Record<ObtainedFrom, { label: string; icon: string; color: string; bg: string }> = {
  bag: { label: "Bag", icon: "B", color: "#92400E", bg: "#FEF3C7" },
  starter: { label: "Starter", icon: "S", color: "#1E3A5F", bg: "#DBEAFE" },
  scanner: { label: "Scanned", icon: "SC", color: "#065F46", bg: "#D1FAE5" },
}

// ---- Legacy combat types (for compatibility) ----
export const MINIMON_TYPES = ["fire", "water", "grass", "electric", "psychic", "ghost", "dragon", "normal"] as const
export const CYBERMON_TYPES = ["vaccine", "virus", "data"] as const
export const DRACOBELL_TYPES = ["saiyan", "namekian", "android", "majin", "frieza"] as const

// ---- Dracobell Categories ----
export const DRACOBELL_CATEGORIES = [
  "tazos",
  "supertazos_voladores",
  "supertazos_octogonales",
  "megatazos",
  "holo_3d",
  "mastertazos",
] as const

export type DracoBellCategory = (typeof DRACOBELL_CATEGORIES)[number]

export const DRACOBELL_CATEGORY_CONFIG: Record<DracoBellCategory, { label: string; description: string }> = {
  tazos: { label: "Tazos", description: "Serie base, 5 puntas, #1-10" },
  supertazos_voladores: { label: "Supertazos Voladores", description: "Con muescas para lanzar, #11-30" },
  supertazos_octogonales: { label: "Supertazos Octogonales", description: "8 puntas, #31-50" },
  megatazos: { label: "Megatazos", description: "Tamaño grande, #51-70" },
  holo_3d: { label: "Holo 3D", description: "Lenticulares, #1-10" },
  mastertazos: { label: "Mastertazos", description: "Edición especial coleccionista" },
}

// ---- Legacy Types (kept for compatibility) ----
export type TazoCondition = "mint" | "good" | "used" | "worn" | "holo" | "metallic"
export type PhysicalType = "cardboard" | "plastic" | "metal" | "holo"
export type Rarity = "common" | "uncommon" | "rare" | "ultra" | "legendary"

export const RARITY_CONFIG: Record<Rarity, { label: string; color: string; bgColor: string; borderColor: string }> = {
  common: { label: "Common", color: "text-gray-600", bgColor: "bg-gray-100", borderColor: "border-gray-300" },
  uncommon: { label: "Uncommon", color: "text-green-600", bgColor: "bg-green-100", borderColor: "border-green-300" },
  rare: { label: "Rare", color: "text-blue-600", bgColor: "bg-blue-100", borderColor: "border-blue-300" },
  ultra: { label: "Ultra", color: "text-purple-600", bgColor: "bg-purple-100", borderColor: "border-purple-300" },
  legendary: { label: "Legendary", color: "text-amber-600", bgColor: "bg-amber-100", borderColor: "border-amber-400" },
}

export const CONDITION_CONFIG: Record<TazoCondition, { label: string; color: string; icon: string; effect: string }> = {
  mint: { label: "Mint", color: "text-emerald-600", icon: "M", effect: "+20% collection value" },
  good: { label: "Good", color: "text-green-600", icon: "OK", effect: "Normal stats" },
  used: { label: "Used", color: "text-yellow-600", icon: "U", effect: "-10% control" },
  worn: { label: "Worn", color: "text-orange-600", icon: "W", effect: "-20% spin, +15% veteran bonus" },
  holo: { label: "Holographic", color: "text-cyan-600", icon: "H", effect: "+30% precision" },
  metallic: { label: "Metallic", color: "text-slate-600", icon: "MT", effect: "+25% weight" },
}

export const PHYSICAL_TYPE_CONFIG: Record<PhysicalType, { label: string; color: string }> = {
  cardboard: { label: "Cardboard", color: "text-amber-700" },
  plastic: { label: "Plastic", color: "text-blue-600" },
  metal: { label: "Metal", color: "text-slate-600" },
  holo: { label: "Holo", color: "text-cyan-500" },
}

export type GameView = "album" | "battle" | "scanner" | "stats"
