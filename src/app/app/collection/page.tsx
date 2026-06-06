"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import TazoDiscImage from "@/components/game/tazo-disc-image"
import {
  Package, Swords, Star, TrendingUp,
  Clock, ChevronRight, BookOpen, Sparkles,
  ShoppingBag, Gift, Camera, Search, Eye, Heart, PlusCircle,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────
interface DeckTazo { id: string; name: string; displayName: string; number: string; imageUrl: string; rarity: string; franchiseSlug: string; attack: number; defense: number; resistance: number }
interface Deck { id: string; name: string; isActive: boolean; tazos: DeckTazo[] }
interface CollectionTazo { id: string; tazoId: string; quantity: number; acquiredAt: string; obtainedFrom?: string | null; isFavorite: boolean; inDeckId?: string | null; deckName?: string | null; tazo: DeckTazo & { precision: number; bounce: number; control: number; spin: number; stability: number; weight: number; franchise: string; imageUrl?: string | null; number?: string | number } }
interface CollectionData { items: CollectionTazo[]; total: number; totalUnique: number; decks: Deck[]; franchiseSummary: Record<string, number> }

// ── Constants ──────────────────────────────────────────
const FRANCHISE_GRADIENT: Record<string, string> = {
  minimon: "linear-gradient(135deg, #FFCB05, #FF8C00)",
  cybermon: "linear-gradient(135deg, #00A1E9, #0057B7)",
  dracobell: "linear-gradient(135deg, #FF6B00, #CC4400)",
}
const FRANCHISE_ICON: Record<string, string> = {
  minimon: "M", cybermon: "C", dracobell: "D",
}
const RARITY_STARS: Record<string, string> = {
  common: "★", uncommon: "★★", rare: "★★★", ultra: "★★★★", legendary: "★★★★★",
}
const RARITY_COLOR: Record<string, string> = {
  common: "#9CA3AF", uncommon: "#22C55E", rare: "#3B82F6", ultra: "#A855F7", legendary: "#F59E0B",
}
const OBTAINED_ICON: Record<string, any> = { bag: ShoppingBag, starter: Gift, scanner: Camera }
const OBTAINED_LABEL: Record<string, string> = { bag: "Bag", starter: "Starter", scan: "Scan" }

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

// ── Component ──────────────────────────────────────────
export default function CollectionPage() {
  const { t } = useI18n()
  const { user, token, loading } = useAuth()
  const [data, setData] = useState<CollectionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "deck" | "duplicates" | "recent" | "favorites">("all")
  const [searchTerm, setSearchTerm] = useState("")

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

  // ── Derived data ──────────────────────────────────────
  const { strongest, rarest, recentTazos, deckTazos, duplicateTazos, favoriteTazos } = useMemo(() => {
    if (!data?.items.length) return { strongest: null, rarest: null, recentTazos: [], deckTazos: [], duplicateTazos: [], favoriteTazos: [] }
    const sorted = [...data.items].sort((a, b) => totalPower(b.tazo) - totalPower(a.tazo))
    const byRarity = [...data.items].sort((a, b) => rarityOrder(b.tazo.rarity) - rarityOrder(a.tazo.rarity))
    const recent = [...data.items].sort((a, b) => new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime()).slice(0, 8)
    const inDeck = data.items.filter(i => i.inDeckId)
    const dupes = data.items.filter(i => i.quantity > 1)
    const favs = data.items.filter(i => i.isFavorite)
    return { strongest: sorted[0] || null, rarest: byRarity[0] || null, recentTazos: recent, deckTazos: inDeck, duplicateTazos: dupes, favoriteTazos: favs }
  }, [data])

  const filteredItems = useMemo(() => {
    if (!data) return []
    let items: CollectionTazo[] = []
    switch (filter) {
      case "deck": items = deckTazos; break
      case "duplicates": items = duplicateTazos; break
      case "recent": items = recentTazos; break
      case "favorites": items = favoriteTazos; break
      default: items = data.items
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      items = items.filter(i =>
        (i.tazo.name || "").toLowerCase().includes(q) ||
        (i.tazo.displayName || "").toLowerCase().includes(q) ||
        String(i.tazo.number || "").includes(q)
      )
    }
    return items
  }, [data, filter, deckTazos, duplicateTazos, recentTazos, favoriteTazos, searchTerm])

  // ── Loading state ─────────────────────────────────────
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

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 space-y-5">
      {/* ═══════════════════════════════════════════════ */}
      {/* HEADER BANNER                                 */}
      {/* ═══════════════════════════════════════════════ */}
      <div
        className="rounded-none px-4 py-3 flex flex-wrap items-center gap-3 relative overflow-hidden"
        style={{
          background: "linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 100%)",
          borderBottom: "4px solid #FFCC00",
        }}
      >
        <div className="absolute inset-0 mag-halftone opacity-10 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-2">
          <Package className="w-6 h-6 text-[#FFCC00]" />
          <span className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
            MY COLLECTION
          </span>
        </div>
        <div className="relative z-10 ml-auto flex items-center gap-3">
          <span className="text-xs font-black text-[#FFCC00] bg-white/10 px-2 py-0.5 border border-[#FFCC00]/30">
            {data.totalUnique} unique
          </span>
          <span className="text-xs font-black text-white/60">
            {data.total} total
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* STATS ROW                                        */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Active Deck */}
        <div className="p-3 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] bg-white">
          <div className="flex items-center gap-1.5 mb-1">
            <Swords className="w-3.5 h-3.5 text-[#E3350D]" />
            <span className="text-[9px] font-black uppercase text-[#1a1a1a]/50 tracking-wider">Active Deck</span>
          </div>
          <div className="text-xl font-black text-[#E3350D]">
            {activeDeck ? activeDeck.tazos.length : 0}<span className="text-sm text-[#1a1a1a]/30">/20</span>
          </div>
          {activeDeck && (
            <p className="text-[10px] font-bold text-[#1a1a1a]/60 truncate mt-0.5">{activeDeck.name}</p>
          )}
        </div>

        {/* Strongest */}
        <div className="p-3 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] bg-white">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-[#FFCC00]" />
            <span className="text-[9px] font-black uppercase text-[#1a1a1a]/50 tracking-wider">Strongest</span>
          </div>
          {strongest ? (
            <>
              <div className="text-sm font-black text-[#1a1a1a] truncate">
                {strongest.tazo.displayName || strongest.tazo.name}
              </div>
              <div className="text-[10px] font-bold text-[#E3350D]">{totalPower(strongest.tazo)} Power</div>
            </>
          ) : (
            <span className="text-xs text-[#1a1a1a]/30 font-bold">—</span>
          )}
        </div>

        {/* Rarest */}
        <div className="p-3 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] bg-white">
          <div className="flex items-center gap-1.5 mb-1">
            <Star className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="text-[9px] font-black uppercase text-[#1a1a1a]/50 tracking-wider">Rarest</span>
          </div>
          {rarest ? (
            <>
              <div className="text-sm font-black text-[#1a1a1a] truncate">
                {rarest.tazo.displayName || rarest.tazo.name}
              </div>
              <div className="text-[10px] font-bold" style={{ color: RARITY_COLOR[rarest.tazo.rarity] || "#9CA3AF" }}>
                {RARITY_STARS[rarest.tazo.rarity] || ""} {rarest.tazo.rarity}
              </div>
            </>
          ) : (
            <span className="text-xs text-[#1a1a1a]/30 font-bold">—</span>
          )}
        </div>

        {/* Duplicates */}
        <div className="p-3 border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] bg-white">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#3B4CCA]" />
            <span className="text-[9px] font-black uppercase text-[#1a1a1a]/50 tracking-wider">Duplicates</span>
          </div>
          <div className="text-xl font-black text-[#3B4CCA]">{duplicateTazos.length}</div>
          <div className="text-[10px] font-bold text-[#1a1a1a]/60">
            {duplicateTazos.reduce((s, i) => s + i.quantity - 1, 0)} extra tazos
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* DECK PREVIEW + ACTIONS                         */}
      {/* ═══════════════════════════════════════════════ */}
      {activeDeck && activeDeck.tazos.length > 0 && (
        <div
          className="p-3 sm:p-4 mag-card-yellow space-y-3"
          style={{ border: "3px solid #1a1a1a", boxShadow: "4px 4px 0px #1a1a1a" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-[#E3350D]" />
              <span className="text-sm font-black text-[#1a1a1a] uppercase tracking-wide">
                Battle Deck: {activeDeck.name}
              </span>
            </div>
            <Link
              href="/app/battle"
              className="mag-btn px-4 py-1.5 text-[11px] font-black uppercase tracking-wider flex items-center gap-1"
              style={{ background: "#E3350D", color: "white" }}
            >
              BATTLE <ChevronRight className="w-3.5 h-3.5" />
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
                  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-[#1a1a1a]"
                    style={{ background: gradient }}>
                    <TazoDiscImage
                      src={dt.imageUrl}
                      alt={dt.name || ""}
                      size={40}
                      scale={1.05}
                      borderWidth={0}
                      lazy
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-[#1a1a1a] truncate leading-tight">
                      {dt.name || dt.displayName}
                    </p>
                    <div className="flex items-center gap-1 text-[8px] font-bold">
                      <span style={{ color: "#E3350D" }}>{dt.attack}</span>
                      <span style={{ color: "#3B4CCA" }}>{dt.defense}</span>
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
      {/* FILTER + SEARCH BAR                           */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          { key: "all", label: "All", count: data.items.length },
          { key: "deck", label: "In Deck", count: deckTazos.length },
          { key: "favorites", label: "Favorites", count: favoriteTazos.length },
          { key: "duplicates", label: "Duplicates", count: duplicateTazos.length },
          { key: "recent", label: "Recent", count: recentTazos.length },
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

        {/* Search */}
        <div className="relative ml-auto min-w-[140px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1a1a1a]/30" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full pl-7 pr-3 py-1.5 text-[10px] font-bold border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/25 shadow-[2px_2px_0px_#1a1a1a]"
          />
        </div>

        {/* Franchise quick-filters */}
        {data.franchiseSummary && Object.keys(data.franchiseSummary).length > 0 && (
          <div className="flex gap-1.5">
            {Object.entries(data.franchiseSummary).map(([slug, count]) => (
              <span
                key={slug}
                className="text-[9px] font-black text-white px-2 py-0.5 border border-[#1a1a1a] uppercase tracking-wider"
                style={{ background: FRANCHISE_GRADIENT[slug] || "#1a1a1a" }}
              >
                {FRANCHISE_ICON[slug] || ""} {slug} ({count})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* COLLECTION GRID                               */}
      {/* ═══════════════════════════════════════════════ */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-3 sm:p-4"
        style={{
          background: "#fffef0",
          border: "3px solid #1a1a1a",
          boxShadow: "4px 4px 0px #1a1a1a",
        }}
      >
        {filteredItems.map((item) => {
          const gradient = FRANCHISE_GRADIENT[item.tazo.franchiseSlug] || "#1a1a1a"
          const power = totalPower(item.tazo)
          const ObtainedIcon = item.obtainedFrom ? (OBTAINED_ICON[item.obtainedFrom] || null) : null
          const obtainedLabel = item.obtainedFrom ? (OBTAINED_LABEL[item.obtainedFrom] || item.obtainedFrom) : null
          const isInDeck = !!item.inDeckId

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

              {/* TazoDiscImage */}
              <div className="p-3 flex items-center justify-center bg-[#fffef0]" style={{ aspectRatio: "1" }}>
                <TazoDiscImage
                  src={item.tazo.imageUrl}
                  alt={item.tazo.name || ""}
                  size="100%"
                  scale={1.12}
                  borderWidth={2}
                  borderColor="#1a1a1a33"
                  franchiseSlug={item.tazo.franchiseSlug}
                  number={item.tazo.number}
                  overlay={
                    item.quantity > 1 ? (
                      <div className="absolute top-1 right-1 bg-[#FFCC00] text-[#1a1a1a] text-[9px] font-black px-1.5 py-0.5 border border-[#1a1a1a] shadow-[1px_1px_0px_#1a1a1a] rounded-sm pointer-events-auto">
                        x{item.quantity}
                      </div>
                    ) : undefined
                  }
                  lazy
                />
              </div>

              {/* Info panel */}
              <div className="p-2 space-y-2">
                {/* Name + series */}
                <div className="min-w-0">
                  <p className="text-[11px] font-black text-[#1a1a1a] truncate leading-tight">
                    {item.tazo.name || item.tazo.displayName || `#${item.tazo.number}`}
                  </p>
                  <p className="text-[9px] font-bold text-[#1a1a1a]/40 uppercase">
                    {item.tazo.franchise || item.tazo.franchiseSlug} #{item.tazo.number}
                  </p>
                </div>

                {/* Rarity bar */}
                <div className="flex items-center gap-1">
                  <span
                    className="text-[8px] font-black uppercase px-1.5 py-0.5 border border-[#1a1a1a]"
                    style={{
                      background: (RARITY_COLOR[item.tazo.rarity] || "#9CA3AF") + "20",
                      color: RARITY_COLOR[item.tazo.rarity] || "#9CA3AF",
                    }}
                  >
                    {RARITY_STARS[item.tazo.rarity] || ""}
                  </span>
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

                {/* Power + acquired info */}
                <div className="flex items-center justify-between text-[8px]">
                  <span className="font-black text-[#1a1a1a]/50">{power} TP</span>
                  <span className="font-bold text-[#1a1a1a]/30 flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {timeAgo(item.acquiredAt)}
                  </span>
                </div>

                {/* Quick actions */}
                <div className="flex gap-1 pt-1 border-t border-[#1a1a1a]/10">
                  <Link
                    href={`/tazos?highlight=${item.tazoId}`}
                    className="flex-1 text-[7px] font-black uppercase text-center py-1 border border-[#1a1a1a]/20 hover:bg-[#1a1a1a]/5 transition-colors flex items-center justify-center gap-0.5"
                    title="View details"
                  >
                    <Eye className="w-2 h-2" /> View
                  </Link>
                  <Link
                    href="/app/decks"
                    className="flex-1 text-[7px] font-black uppercase text-center py-1 border border-[#1a1a1a]/20 hover:bg-[#1a1a1a]/5 transition-colors flex items-center justify-center gap-0.5"
                    title="Add to deck"
                  >
                    <PlusCircle className="w-2 h-2" /> Deck
                  </Link>
                  <button
                    className="flex-1 text-[7px] font-black uppercase text-center py-1 border border-[#1a1a1a]/20 hover:bg-[#FFCC00]/10 transition-colors flex items-center justify-center gap-0.5"
                    title={item.isFavorite ? "Favorited" : "Add to favorites"}
                  >
                    <Heart className={`w-2 h-2 ${item.isFavorite ? "fill-[#E3350D] text-[#E3350D]" : ""}`} />
                    {item.isFavorite ? "Liked" : "Like"}
                  </button>
                </div>

                {/* Obtained from badge */}
                {ObtainedIcon && obtainedLabel && (
                  <div className="flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 border border-[#1a1a1a]/20"
                    style={{ color: "#1a1a1a60" }}>
                    <ObtainedIcon className="w-2.5 h-2.5" />
                    {obtainedLabel}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Grid empty state for active filter */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12 border-3 border-[#1a1a1a] bg-white">
          <p className="font-black text-sm text-[#1a1a1a]/30 uppercase tracking-wider">
            No tazos match this filter
          </p>
          <button
            onClick={() => { setFilter("all"); setSearchTerm("") }}
            className="mt-2 text-[10px] font-black underline text-[#E3350D] uppercase"
          >
            Show all
          </button>
        </div>
      )}

      {/* Footer: Quick links */}
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Link href="/app/album" className="mag-btn px-5 py-2.5 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
          style={{ background: "white", color: "#1a1a1a", border: "3px solid #1a1a1a", boxShadow: "3px 3px 0px #1a1a1a" }}>
          <BookOpen className="w-4 h-4" /> View Album
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
