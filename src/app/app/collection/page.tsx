"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import TazoDiscImage from "@/components/game/tazo-disc-image"
import {
  Package, Swords, Star, TrendingUp, ArrowUpDown,
  Clock, ChevronRight, BookOpen, Sparkles,
  ShoppingBag, Gift, Camera, Search, Eye, Heart, PlusCircle,
  Disc3, Layers, Target,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────
interface DeckTazo { id: string; name: string; displayName: string; number: string; imageUrl: string; rarity: string; franchiseSlug: string; attack: number; defense: number; resistance: number }
interface Deck { id: string; name: string; isActive: boolean; tazos: DeckTazo[] }
interface CollectionTazo { id: string; tazoId: string; quantity: number; acquiredAt: string; obtainedFrom?: string | null; isFavorite: boolean; inDeckId?: string | null; deckName?: string | null; wear?: number; battleCount?: number; tazo: DeckTazo & { precision: number; bounce: number; control: number; spin: number; stability: number; weight: number; franchise: string; imageUrl?: string | null; number?: string | number; franchiseColor?: string } }
interface CollectionData { items: CollectionTazo[]; total: number; totalUnique: number; decks: Deck[]; franchiseSummary: Record<string, number> }

// ── Constants ──────────────────────────────────────────
const FRANCHISE_GRADIENT: Record<string, string> = {
  minimon: "linear-gradient(135deg, #FFCB05, #FF8C00)",
  cybermon: "linear-gradient(135deg, #00A1E9, #0057B7)",
  dracobell: "linear-gradient(135deg, #FF6B00, #CC4400)",
}
const FRANCHISE_LABEL: Record<string, string> = {
  minimon: "Minimon", cybermon: "Cybermon", dracobell: "Dracobell",
}
const FRANCHISE_BG: Record<string, string> = {
  minimon: "#FFF8E7", cybermon: "#E7F6FF", dracobell: "#FFF3EB",
}
const RARITY_STARS: Record<string, string> = {
  common: "★", uncommon: "★★", rare: "★★★", ultra: "★★★★", legendary: "★★★★★",
}
const RARITY_COLOR: Record<string, string> = {
  common: "#9CA3AF", uncommon: "#22C55E", rare: "#3B82F6", ultra: "#A855F7", legendary: "#F59E0B",
}
const OBTAINED_ICON: Record<string, any> = { bag: ShoppingBag, starter: Gift, scanner: Camera }
const OBTAINED_LABEL: Record<string, string> = { bag: "Bag", starter: "Starter", scan: "Scan" }
const SORT_OPTIONS = [
  { key: "power", label: "Power ↓" },
  { key: "power-asc", label: "Power ↑" },
  { key: "rarity", label: "Rarity ↓" },
  { key: "name", label: "Name A→Z" },
  { key: "recent", label: "Newest" },
] as const
type SortKey = typeof SORT_OPTIONS[number]["key"]

// ── Helpers ────────────────────────────────────────────
function totalPower(t: CollectionTazo["tazo"]): number {
  return t.attack + t.defense + t.resistance + t.weight + t.stability + t.spin + t.control + t.bounce + t.precision
}
function rarityOrder(r: string): number {
  const o: Record<string, number> = { common: 0, uncommon: 1, rare: 2, ultra: 3, legendary: 4 }; return o[r] ?? 0
}
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

// ── Component ──────────────────────────────────────────
export default function CollectionPage() {
  const { t } = useI18n()
  const { user, token, loading } = useAuth()
  const [data, setData] = useState<CollectionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "deck" | "duplicates" | "recent" | "favorites" | "listed">("all")
  const [franchiseFilter, setFranchiseFilter] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("power")
  const [flippedItems, setFlippedItems] = useState<Set<string>>(new Set())
  const [listedUserTazoIds, setListedUserTazoIds] = useState<Set<string>>(new Set())

  // Back art for each franchise
  const FRANCHISE_BACK: Record<string, string> = {
    minimon: "/tazos-artgen/backs/minimon-back.png",
    cybermon: "/tazos-artgen/backs/cybermon-back.png",
    dracobell: "/tazos-artgen/backs/dracobell-back.png",
  }

  // Toggle flip by unique collection item ID (NOT by tazoId — avoids flipping all duplicates)
  const toggleFlip = (itemId: string) => {
    setFlippedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  useEffect(() => {
    let cancelled = false
    if (!token) return
    fetch("/api/collection?limit=500&includeDecks=true", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => { if (!cancelled) setData(d) })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [token])

  // Fetch active listings for this user
  useEffect(() => {
    if (!token || !user) return
    fetch(`/api/trade?sellerId=${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const ids = new Set<string>()
        for (const l of d.listings || []) {
          if (l.userTazoId) ids.add(l.userTazoId)
        }
        setListedUserTazoIds(ids)
      })
      .catch(() => {})
  }, [token, user])

  // ── Derived data ──────────────────────────────────────
  const { strongest, rarest, recentTazos, deckTazos, duplicateTazos, favoriteTazos, listedTazos, franchiseItems } = useMemo(() => {
    if (!data?.items.length) return { strongest: null, rarest: null, recentTazos: [], deckTazos: [], duplicateTazos: [], favoriteTazos: [], listedTazos: [], franchiseItems: {} as Record<string, CollectionTazo[]> }
    const byRarity = [...data.items].sort((a, b) => rarityOrder(b.tazo.rarity) - rarityOrder(a.tazo.rarity))
    const byPower = [...data.items].sort((a, b) => totalPower(b.tazo) - totalPower(a.tazo))
    const recent = [...data.items].sort((a, b) => new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime()).slice(0, 8)
    const inDeck = data.items.filter(i => i.inDeckId)
    const dupes = data.items.filter(i => i.quantity > 1)
    const favs = data.items.filter(i => i.isFavorite)
    const listed = data.items.filter(i => listedUserTazoIds.has(i.id))
    // Group by franchise
    const fi: Record<string, CollectionTazo[]> = {}
    for (const item of data.items) {
      const slug = item.tazo.franchiseSlug || item.tazo.franchise || "unknown"
      if (!fi[slug]) fi[slug] = []
      fi[slug].push(item)
    }
    return { strongest: byPower[0] || null, rarest: byRarity[0] || null, recentTazos: recent, deckTazos: inDeck, duplicateTazos: dupes, favoriteTazos: favs, listedTazos: listed, franchiseItems: fi }
  }, [data])

  const filteredItems = useMemo(() => {
    if (!data) return []
    let items: CollectionTazo[] = []
    switch (filter) {
      case "deck": items = deckTazos; break
      case "duplicates": items = duplicateTazos; break
      case "recent": items = recentTazos; break
      case "favorites": items = favoriteTazos; break
      case "listed": items = listedTazos; break
      default: items = data.items
    }
    if (franchiseFilter) {
      items = items.filter(i => (i.tazo.franchiseSlug || i.tazo.franchise) === franchiseFilter)
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      items = items.filter(i =>
        (i.tazo.name || "").toLowerCase().includes(q) ||
        (i.tazo.displayName || "").toLowerCase().includes(q) ||
        String(i.tazo.number || "").includes(q)
      )
    }
    // Sort
    items = [...items].sort((a, b) => {
      switch (sortKey) {
        case "power": return totalPower(b.tazo) - totalPower(a.tazo)
        case "power-asc": return totalPower(a.tazo) - totalPower(b.tazo)
        case "rarity": return rarityOrder(b.tazo.rarity) - rarityOrder(a.tazo.rarity)
        case "name": return (a.tazo.name || "").localeCompare(b.tazo.name || "")
        case "recent": return new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime()
        default: return 0
      }
    })
    return items
  }, [data, filter, franchiseFilter, deckTazos, duplicateTazos, recentTazos, favoriteTazos, listedTazos, searchTerm, sortKey])

  // ── Loading ───────────────────────────────────────────
  if (loading || (token && !data && !error)) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="mag-spinner w-12 h-12 rounded-full border-4 border-[#FFCC00] border-t-[#E3350D]" />
      </div>
    )
  }

  // ── Not logged in ─────────────────────────────────────
  if (!user) {
    return (
      <div className="py-20 text-center space-y-5">
        <Package className="w-14 h-14 text-[#1a1a1a]/15 mx-auto" />
        <p className="font-black text-sm text-[#1a1a1a]/40 uppercase tracking-wider">
          {t.auth_login_subtitle || "Sign in to see your collection"}
        </p>
        <Link
          href="/login"
          className="inline-block py-3 px-8 mag-btn bg-[#E3350D] text-white text-xs font-black uppercase tracking-widest"
        >
          {t.auth_login || "Sign In"}
        </Link>
      </div>
    )
  }

  // ── Empty state ───────────────────────────────────────
  if (data && data.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="relative inline-block">
          <Package className="w-24 h-24 text-[#FFCC00]" style={{ filter: "drop-shadow(4px 4px 0px #1a1a1a)" }} />
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-[#E3350D]" />
        </div>
        <h2 className="text-3xl font-black text-[#1a1a1a] uppercase tracking-wide mag-stroke-sm">
          Your collection is empty!
        </h2>
        <p className="text-sm font-bold text-[#1a1a1a]/50 max-w-md mx-auto">
          Open bags to discover new tazos and start building your collection.
          Each bag contains random tazos from different franchises!
        </p>
        <Link
          href="/app/shop"
          className="inline-block py-4 px-10 mag-btn text-base font-black uppercase tracking-widest"
          style={{ background: "#E3350D", color: "white" }}
        >
          <ShoppingBag className="w-5 h-5 inline mr-2" />
          Open Bags
        </Link>
      </div>
    )
  }

  if (!data) return null

  // ── Main View ─────────────────────────────────────────
  const activeDeck = data.decks?.find(d => d.isActive)
  const TOTAL_TOTAL = 349 // Same as global DB total

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
      {/* ═══════════════════════════════════════════════ */}
      {/* ① COLLECTION HEADER                            */}
      {/* ═══════════════════════════════════════════════ */}
      <div
        className="px-4 py-3 flex flex-wrap items-center gap-3 relative overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.025) 6px, rgba(255,255,255,0.025) 12px), linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 100%)`,
          border: "3px solid #1a1a1a",
          boxShadow: "4px 4px 0px #FFCC00",
        }}
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #FFCB05, #FF6B00)", border: "2px solid #1a1a1a" }}>
            <Disc3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider leading-none">
              MY COLLECTION
            </h1>
            <p className="text-[10px] font-bold text-white/40 tracking-wide mt-0.5">
              {data.totalUnique} unique · {data.total} total tazos
            </p>
          </div>
        </div>
        <div className="relative z-10 ml-auto flex items-center gap-2">
          <span className="text-[9px] font-black text-[#FFCC00] bg-white/10 px-2 py-0.5 border border-[#FFCC00]/30 tracking-wider">
            {data.totalUnique} / {TOTAL_TOTAL}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ② PROGRESS BAR                                 */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="border-3 border-[#1a1a1a] bg-white shadow-[3px_3px_0px_#1a1a1a]">
        <div className="p-3 sm:p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-[#1a1a1a]/50 uppercase tracking-wider">Collection progress</span>
              <span className="text-[10px] font-black text-[#1a1a1a]">{Math.round((data.totalUnique / TOTAL_TOTAL) * 100)}%</span>
            </div>
            <div className="h-4 border-2 border-[#1a1a1a] bg-[#fffef0] overflow-hidden shadow-[inset_2px_2px_0px_rgba(26,26,26,0.1)]">
              <div
                className="h-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, (data.totalUnique / TOTAL_TOTAL) * 100)}%`,
                  background: "linear-gradient(90deg, #FFCB05, #FF6B00, #E3350D)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ③ STATS ROW                                    */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Deck */}
        <StatsCard
          icon={<Swords className="w-4 h-4" />} iconColor="#E3350D"
          label="Active Deck" value={activeDeck ? `${activeDeck.tazos.length}/20` : "0/20"}
          valueColor="#E3350D"
          detail={activeDeck?.name}
          href={"/app/decks"}
        />

        {/* Strongest */}
        <StatsCard
          icon={<TrendingUp className="w-4 h-4" />} iconColor="#FFCC00"
          label="Strongest" value={strongest ? totalPower(strongest.tazo).toString() : "—"}
          valueColor="#1a1a1a"
          detail={strongest ? `${strongest.tazo.displayName || strongest.tazo.name} · TP` : undefined}
        />

        {/* Rarest */}
        <StatsCard
          icon={<Star className="w-4 h-4" />} iconColor="#F59E0B"
          label="Rarest" value={rarest ? RARITY_STARS[rarest.tazo.rarity] || "—" : "—"}
          valueColor={rarest ? (RARITY_COLOR[rarest.tazo.rarity] || "#9CA3AF") : "#1a1a1a"}
          detail={rarest ? `${rarest.tazo.displayName || rarest.tazo.name} · ${rarest.tazo.rarity}` : undefined}
        />

        {/* Duplicates + Favorites summary */}
        <StatsCard
          icon={<Sparkles className="w-4 h-4" />} iconColor="#3B4CCA"
          label="Extras" value={`${duplicateTazos.length} dupes`}
          valueColor="#3B4CCA"
          detail={`${favoriteTazos.length} favorites`}
        />
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ④ ACTIVE DECK PREVIEW                          */}
      {/* ═══════════════════════════════════════════════ */}
      {activeDeck && activeDeck.tazos.length > 0 && (
        <div
          className="p-4 mag-card-yellow space-y-3"
          style={{ border: "3px solid #1a1a1a", boxShadow: "4px 4px 0px #1a1a1a" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-[#E3350D]" />
              <div>
                <span className="text-sm font-black text-[#1a1a1a] uppercase tracking-wide">
                  {activeDeck.name}
                </span>
                <span className="text-[9px] font-black text-[#E3350D] ml-2 bg-white px-2 py-0.5 border border-[#E3350D] uppercase">
                  ACTIVE DECK
                </span>
              </div>
            </div>
            <Link
              href="/app/battle"
              className="mag-btn px-5 py-2 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
              style={{ background: "#E3350D", color: "white", border: "3px solid #1a1a1a", boxShadow: "3px 3px 0px #1a1a1a" }}
            >
              BATTLE <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {activeDeck.tazos.map((dt) => {
              const gradient = FRANCHISE_GRADIENT[dt.franchiseSlug] || "#1a1a1a"
              return (
                <div
                  key={dt.id}
                  className="flex items-center gap-2 p-2 bg-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
                >
                  <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-[#1a1a1a]"
                    style={{ background: gradient }}>
                    <TazoDiscImage
                      src={dt.imageUrl}
                      alt={dt.name || ""}
                      size={36}
                      scale={1.08}
                      borderWidth={0}
                      finish={(dt as any).finish}
                      creatureVariant={(dt as any).creatureVariant}
                      shinyImageUrl={(dt as any).shinyImageUrl}
                      lazy
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-[#1a1a1a] truncate leading-tight">
                      {dt.name || dt.displayName}
                    </p>
                    <div className="flex items-center gap-1.5 text-[8px] font-black">
                      <span style={{ color: "#E3350D" }}>{dt.attack}</span>
                      <span style={{ color: "#3B4CCA" }}>{dt.defense}</span>
                      <span className="text-[#1a1a1a]/40">·</span>
                      <span style={{ color: "#06B6D4" }}>{dt.resistance}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ⑤ TOOLBAR — Filters + Search + Sort            */}
      {/* ═══════════════════════════════════════════════ */}
      <div
        className="p-3 border-3 border-[#1a1a1a] bg-white shadow-[3px_3px_0px_#1a1a1a] space-y-3"
      >
        {/* Top row: Filter pills + Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {([
            { key: "all", label: "All", count: data.items.length },
            { key: "deck", label: "In Deck", count: deckTazos.length },
            { key: "favorites", label: "Favorites", count: favoriteTazos.length },
            { key: "duplicates", label: "Duplicates", count: duplicateTazos.length },
            { key: "recent", label: "Recent", count: recentTazos.length },
            { key: "listed", label: "Listed", count: listedTazos.length },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border-2 border-[#1a1a1a] transition-all"
              style={{
                background: filter === f.key ? "#1a1a1a" : "white",
                color: filter === f.key ? "#FFCC00" : "#1a1a1a",
                boxShadow: filter === f.key ? "2px 2px 0px #FFCC00" : "2px 2px 0px #1a1a1a",
              }}
            >
              {f.label} <span className="ml-1 opacity-50">({f.count})</span>
            </button>
          ))}

          {/* Sort dropdown — right aligned */}
          <div className="ml-auto relative">
            <select
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
              className="appearance-none pl-3 pr-8 py-1.5 text-[10px] font-black uppercase tracking-wider border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] cursor-pointer shadow-[2px_2px_0px_#1a1a1a]"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#1a1a1a]/40 pointer-events-none" />
          </div>
        </div>

        {/* Bottom row: Search + Franchise pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1a1a1a]/25" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name or number..."
              className="w-full pl-8 pr-4 py-2 text-[10px] font-bold border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/20 shadow-[2px_2px_0px_#1a1a1a] focus:outline-none focus:border-[#FFCC00]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#1a1a1a]/30 hover:text-[#1a1a1a] text-[11px] font-black"
              >
                ✕
              </button>
            )}
          </div>

          {/* Franchise quick-filter pills */}
          {data.franchiseSummary && Object.keys(data.franchiseSummary).length > 0 && (
            <div className="flex gap-1.5">
              <button
                onClick={() => setFranchiseFilter(null)}
                className="text-[9px] font-black px-2.5 py-1.5 border-2 border-[#1a1a1a] uppercase tracking-wider transition-all"
                style={{
                  background: franchiseFilter === null ? "#1a1a1a" : "white",
                  color: franchiseFilter === null ? "#FFCC00" : "#1a1a1a",
                  boxShadow: franchiseFilter === null ? "2px 2px 0px #FFCC00" : "2px 2px 0px #1a1a1a",
                }}
              >
                ALL
              </button>
              {Object.entries(data.franchiseSummary).map(([slug, count]) => (
                <button
                  key={slug}
                  onClick={() => setFranchiseFilter(franchiseFilter === slug ? null : slug)}
                  className="text-[9px] font-black px-2.5 py-1.5 border-2 border-[#1a1a1a] uppercase tracking-wider transition-all flex items-center gap-1"
                  style={{
                    background: franchiseFilter === slug ? "#1a1a1a" : FRANCHISE_BG[slug] || "white",
                    color: franchiseFilter === slug ? "white" : "#1a1a1a",
                    boxShadow: franchiseFilter === slug ? "2px 2px 0px #1a1a1a" : "2px 2px 0px #1a1a1a",
                  }}
                >
                  <span className="w-2 h-2 rounded-full border border-current" style={{ background: FRANCHISE_GRADIENT[slug] }} />
                  {FRANCHISE_LABEL[slug] || slug} ({count})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ⑥ COLLECTION GRID — Grouped by franchise       */}
      {/* ═══════════════════════════════════════════════ */}
      {filteredItems.length > 0 ? (
        <div className="space-y-5">
          {/* Group items by franchise for better hierarchy */}
          {(() => {
            const grouped: Record<string, CollectionTazo[]> = {}
            for (const item of filteredItems) {
              const slug = item.tazo.franchiseSlug || item.tazo.franchise || "unknown"
              if (!grouped[slug]) grouped[slug] = []
              grouped[slug].push(item)
            }

            return Object.entries(grouped).map(([slug, items]) => {
              const gradient = FRANCHISE_GRADIENT[slug] || "#1a1a1a"
              const label = FRANCHISE_LABEL[slug] || slug
              return (
                <div key={slug}>
                  {/* Franchise section header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-2 shrink-0" style={{ background: gradient, border: "2px solid #1a1a1a" }} />
                    <h3 className="text-sm font-black text-[#1a1a1a] uppercase tracking-wider">
                      {label} <span className="text-[#1a1a1a]/30 text-xs">· {items.length} tazos</span>
                    </h3>
                    <div className="flex-1 h-0.5 bg-[#1a1a1a]/10" />
                  </div>

                  {/* Items grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {items.map((item) => {
                      const power = totalPower(item.tazo)
                      const ObtainedIcon = item.obtainedFrom ? (OBTAINED_ICON[item.obtainedFrom] || null) : null
                      const obtainedLabel = item.obtainedFrom ? (OBTAINED_LABEL[item.obtainedFrom] || item.obtainedFrom) : null
                      const isInDeck = !!item.inDeckId
                      const isFlipped = flippedItems.has(item.id)

                      return (
                        <div
                          key={item.id}
                          className="group border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] overflow-hidden hover:shadow-[5px_5px_0px_#1a1a1a] hover:-translate-y-[2px] transition-all bg-white relative"
                        >
                          {/* Deck indicator */}
                          {isInDeck && (
                            <div
                              className="absolute top-0 right-0 z-10 w-6 h-6 flex items-center justify-center"
                              style={{ background: "#E3350D", borderBottom: "2px solid #1a1a1a", borderLeft: "2px solid #1a1a1a" }}
                              title={`In deck: ${item.deckName || "Active Deck"}`}
                            >
                              <Swords className="w-3 h-3 text-white" />
                            </div>
                          )}

                          {/* Favorite star */}
                          {item.isFavorite && (
                            <div className="absolute top-0 left-0 z-10 w-6 h-6 flex items-center justify-center">
                              <Star className="w-3.5 h-3.5 text-[#FFCC00] fill-[#FFCC00]" style={{ filter: "drop-shadow(1px 1px 0px #1a1a1a)" }} />
                            </div>
                          )}

                          {/* Franchise strip */}
                          <div className="h-1.5" style={{ background: gradient }} />

                          {/* TazoDiscImage — ⚠️ Flip keyed by item.id (not tazoId) */}
                          <div className="p-3 flex items-center justify-center bg-[#fffef0]" style={{ aspectRatio: "1" }}>
                            <TazoDiscImage
                              src={isFlipped
                                ? (FRANCHISE_BACK[item.tazo.franchiseSlug] || FRANCHISE_BACK.minimon)
                                : item.tazo.imageUrl}
                              alt={isFlipped ? `Back of ${item.tazo.name || "tazo"}` : item.tazo.name || ""}
                              size="100%"
                              scale={1.12}
                              borderWidth={2}
                              borderColor="#1a1a1a33"
                              franchiseSlug={item.tazo.franchiseSlug}
                              number={item.tazo.number}
                              finish={(item.tazo as any).finish}
                              creatureVariant={(item.tazo as any).creatureVariant}
                              shinyImageUrl={(item.tazo as any).shinyImageUrl}
                              wear={item.wear || 0}
                              isBack={isFlipped}
                              onFlip={() => toggleFlip(item.id)}
                              overlay={
                                item.quantity > 1 ? (
                                  <div className="absolute top-1 right-1 bg-[#FFCC00] text-[#1a1a1a] text-[9px] font-black px-1.5 py-0.5 border border-[#1a1a1a] shadow-[1px_1px_0px_#1a1a1a] rounded-sm pointer-events-auto z-30">
                                    x{item.quantity}
                                  </div>
                                ) : undefined
                              }
                              lazy
                            />
                          </div>

                          {/* Flip hint */}
                          <div className="text-center bg-[#fffef0] border-t border-[#1a1a1a]/10">
                            <button
                              onClick={() => toggleFlip(item.id)}
                              className="w-full py-1 text-[7px] font-black text-[#1a1a1a]/25 uppercase tracking-wider hover:text-[#1a1a1a]/50 hover:bg-[#1a1a1a]/5 transition-colors"
                            >
                              {isFlipped ? "BACK · CLICK FOR FRONT" : "CLICK TO FLIP"}
                            </button>
                          </div>

                          {/* Info panel */}
                          <div className="p-2.5 space-y-2 bg-white">
                            {/* Name + series */}
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-[#1a1a1a] truncate leading-tight">
                                {item.tazo.name || item.tazo.displayName || `#${item.tazo.number}`}
                              </p>
                              <p className="text-[9px] font-bold text-[#1a1a1a]/40 uppercase mt-0.5">
                                {label} #{item.tazo.number}
                              </p>
                            </div>

                            {/* Rarity bar + wear badge */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="text-[8px] font-black uppercase px-1.5 py-0.5 border border-[#1a1a1a]/20"
                                style={{
                                  background: (RARITY_COLOR[item.tazo.rarity] || "#9CA3AF") + "15",
                                  color: RARITY_COLOR[item.tazo.rarity] || "#9CA3AF",
                                }}
                              >
                                {RARITY_STARS[item.tazo.rarity] || ""}
                              </span>
                              {/* Wear badge */}
                              {((item as any).wear || 0) > 0 && (
                                <span
                                  className="text-[7px] font-black uppercase px-1.5 py-0.5 border rounded-full"
                                  style={{
                                    background: ((item as any).wear <= 15 ? "#22C55E15" : (item as any).wear <= 40 ? "#FFCC0015" : (item as any).wear <= 70 ? "#FF880015" : "#CC000015"),
                                    color: (item as any).wear <= 15 ? "#22C55E" : (item as any).wear <= 40 ? "#CCAA00" : (item as any).wear <= 70 ? "#FF8800" : "#CC0000",
                                    borderColor: ((item as any).wear <= 15 ? "#22C55E" : (item as any).wear <= 40 ? "#CCAA00" : (item as any).wear <= 70 ? "#FF8800" : "#CC0000") + "30",
                                  }}
                                >
                                  {(item as any).wear <= 15 ? "LP" : (item as any).wear <= 40 ? "PL" : (item as any).wear <= 70 ? "HP" : "DM"}
                                </span>
                              )}
                              <span className="text-[8px] font-bold text-[#1a1a1a]/30">{power} TP</span>
                              {/* Listed on Marketplace badge */}
                              {listedUserTazoIds.has(item.id) && (
                                <span
                                  className="text-[7px] font-black uppercase px-1.5 py-0.5 border rounded-full"
                                  style={{
                                    background: "#3B82F615",
                                    color: "#3B82F6",
                                    borderColor: "#3B82F630",
                                  }}
                                >
                                  FOR SALE
                                </span>
                              )}
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { label: "ATK", value: item.tazo.attack, color: "#E3350D" },
                                { label: "DEF", value: item.tazo.defense, color: "#3B4CCA" },
                                { label: "SPD", value: Math.round((item.tazo.spin + item.tazo.bounce + item.tazo.precision) / 3), color: "#06B6D4" },
                              ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                  <div className="text-[7px] font-black text-[#1a1a1a]/40 uppercase leading-none mb-0.5">{stat.label}</div>
                                  <div className="text-xs font-black leading-none" style={{ color: stat.color }}>{stat.value}</div>
                                </div>
                              ))}
                            </div>

                            {/* Acquired info */}
                            <div className="flex items-center gap-2 text-[8px]">
                              <span className="font-bold text-[#1a1a1a]/30 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {timeAgo(item.acquiredAt)}
                              </span>
                              {ObtainedIcon && obtainedLabel && (
                                <span className="font-bold text-[#1a1a1a]/40 flex items-center gap-0.5 border-l border-[#1a1a1a]/10 pl-2">
                                  <ObtainedIcon className="w-2.5 h-2.5" />
                                  {obtainedLabel}
                                </span>
                              )}
                            </div>

                            {/* Quick actions */}
                            <div className="flex gap-1 pt-1.5 border-t border-[#1a1a1a]/10">
                              <Link
                                href={`/tazos?highlight=${item.tazoId}`}
                                className="flex-1 text-[7px] font-black uppercase text-center py-1.5 border border-[#1a1a1a]/20 hover:bg-[#1a1a1a]/5 transition-colors flex items-center justify-center gap-0.5"
                                title="View details"
                              >
                                <Eye className="w-2.5 h-2.5" /> View
                              </Link>
                              <Link
                                href="/app/decks"
                                className="flex-1 text-[7px] font-black uppercase text-center py-1.5 border border-[#1a1a1a]/20 hover:bg-[#1a1a1a]/5 transition-colors flex items-center justify-center gap-0.5"
                                title="Add to deck"
                              >
                                <PlusCircle className="w-2.5 h-2.5" /> Deck
                              </Link>
                              <button
                                className="flex-1 text-[7px] font-black uppercase text-center py-1.5 border border-[#1a1a1a]/20 hover:bg-[#FFCC00]/10 transition-colors flex items-center justify-center gap-0.5"
                                title={item.isFavorite ? "Favorited" : "Add to favorites"}
                              >
                                <Heart className={`w-2.5 h-2.5 ${item.isFavorite ? "fill-[#E3350D] text-[#E3350D]" : ""}`} />
                                {item.isFavorite ? "Liked" : "Like"}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          })()}
        </div>
      ) : (
        /* Empty filter state */
        <div className="text-center py-16 border-3 border-[#1a1a1a] bg-white shadow-[3px_3px_0px_#1a1a1a]">
          <Search className="w-10 h-10 text-[#1a1a1a]/15 mx-auto mb-3" />
          <p className="font-black text-sm text-[#1a1a1a]/30 uppercase tracking-wider">
            No tazos match this filter
          </p>
          <button
            onClick={() => { setFilter("all"); setFranchiseFilter(null); setSearchTerm("") }}
            className="mt-3 text-[10px] font-black underline text-[#E3350D] uppercase hover:text-[#1a1a1a] transition-colors"
          >
            Reset all filters
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ⑦ QUICK LINKS                                  */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Link href="/tazos" className="mag-btn px-5 py-2.5 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
          style={{ background: "white", color: "#1a1a1a", border: "3px solid #1a1a1a", boxShadow: "3px 3px 0px #1a1a1a" }}>
          <BookOpen className="w-4 h-4" /> Tazo Catalog
        </Link>
        <Link href="/app/battle" className="mag-btn px-5 py-2.5 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
          style={{ background: "#E3350D", color: "white", border: "3px solid #1a1a1a", boxShadow: "3px 3px 0px #1a1a1a" }}>
          <Swords className="w-4 h-4" /> Battle
        </Link>
        <Link href="/app/shop" className="mag-btn px-5 py-2.5 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
          style={{ background: "#FFCC00", color: "#1a1a1a", border: "3px solid #1a1a1a", boxShadow: "3px 3px 0px #1a1a1a" }}>
          <ShoppingBag className="w-4 h-4" /> Open More Bags
        </Link>
      </div>
    </div>
  )
}

// ── Stats Card Sub-Component ──────────────────────────────
function StatsCard({
  icon, iconColor, label, value, valueColor, detail, href,
}: {
  icon: React.ReactNode
  iconColor: string
  label: string
  value: string
  valueColor: string
  detail?: string
  href?: string
}) {
  const content = (
    <div
      className="p-3 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] bg-white hover:shadow-[4px_4px_0px_#1a1a1a] hover:-translate-y-[1px] transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="text-[#1a1a1a]/60" style={{ color: iconColor }}>
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase text-[#1a1a1a]/50 tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-black" style={{ color: valueColor }}>{value}</div>
      {detail && (
        <p className="text-[10px] font-bold text-[#1a1a1a]/50 truncate mt-1">{detail}</p>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
