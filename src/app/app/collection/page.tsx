"use client"

import { useEffect, useState, useMemo, useRef, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import TazoDiscImage from "@/components/game/tazo-disc-image"
import TazoDiscTilt from "@/components/game/tazo-disc-tilt"
import TazoDetailModal from "@/components/game/tazo-detail-modal"
import { TGAGradeBadge } from "@/components/game/tga-grade-badge"
import {
  Package, Swords, Star, TrendingUp, ArrowUpDown,
  Clock, ChevronRight, BookOpen, Sparkles,
  ShoppingBag, Gift, Camera, Search, Eye, Heart, PlusCircle,
  Disc3,
Loader2 } from "lucide-react"
import UserIdCard from "@/components/game/user-id-card"

// ── Types ──────────────────────────────────────────────
interface DeckTazo { id: string; name: string; displayName: string; slug: string; number: string; imageUrl: string; rarity: string; franchiseSlug: string; attack: number; defense: number; resistance: number }
interface Deck { id: string; name: string; isActive: boolean; tazos: DeckTazo[] }
interface CollectionTazo { id: string; tazoId: string; userTazoId?: string; isOwned?: boolean; quantity: number; acquiredAt: string; obtainedFrom?: string | null; isFavorite: boolean; inDeckId?: string | null; deckName?: string | null; wear?: number; battleCount?: number; instances?: Array<{id:string;attack:number;defense:number;resistance:number;weight:number;stability:number;spin:number;control:number;bounce:number;precision:number;finish?:string;creatureVariant?:string;isNew:boolean;acquiredAt:string;tgaTier?:number;tgaGrade?:number;tgaSurface?:number;tgaBorders?:number;tgaCertNumber?:string}>; tazo: DeckTazo & { precision: number; bounce: number; control: number; spin: number; stability: number; weight: number; franchise: string; imageUrl?: string | null; backImageUrl?: string | null; number?: string | number; franchiseColor?: string } }
interface CollectionData { items: CollectionTazo[]; total: number; totalUnique: number; decks: Deck[]; franchiseSummary: Record<string, number> }

// ── Constants ──────────────────────────────────────────
const FRANCHISE_GRADIENT: Record<string, string> = {
  minimon: "linear-gradient(135deg, var(--ttg-minimon), #FF8C00)",
  cybermon: "linear-gradient(135deg, var(--ttg-cybermon), #0057B7)",
  dracobell: "linear-gradient(135deg, var(--ttg-dracobell), #CC4400)",
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
  common: "var(--ttg-rarity-common)", uncommon: 'var(--ttg-success)', rare: "#3B82F6", ultra: 'var(--ttg-purple)', legendary: "var(--ttg-warning)",
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

// ── Tiltable Disc Component ─────────────────────────────
export default function CollectionPage() {
  const { t } = useI18n()
  const { user, token, loading } = useAuth()
  const [data, setData] = useState<CollectionData | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "deck" | "duplicates" | "recent" | "favorites" | "listed">("all")
  const [franchiseFilter, setFranchiseFilter] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("power")
  const [flippedItems, setFlippedItems] = useState<Set<string>>(new Set())
  const [listedUserTazoIds, setListedUserTazoIds] = useState<Set<string>>(new Set())
  const [detailItem, setDetailItem] = useState<CollectionTazo | null>(null)
  const [addingToDeck, setAddingToDeck] = useState<string | null>(null)
  const [deckAddMsg, setDeckAddMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null)

  // Add tazo to active deck
  const handleAddToDeck = useCallback(async (tazoId: string) => {
    setAddingToDeck(tazoId)
    setDeckAddMsg(null)
    try {
      const dr = await fetch("/api/decks", { headers: { Authorization: `Bearer ${token}` } })
      const dd = await dr.json()
      const decks = dd.decks || []
      const activeDeck = decks.find((d: any) => d.isActive) || decks[0]
      if (!activeDeck) { setDeckAddMsg({ type: "err", text: "Create a deck in Decks first" }); return }
      if (activeDeck.tazoCount >= 20) { setDeckAddMsg({ type: "err", text: "Deck is full (20/20)" }); return }
      if (activeDeck.tazos?.some((t: any) => t.id === tazoId)) { setDeckAddMsg({ type: "err", text: "Already in deck" }); return }
      const newIds = [...activeDeck.tazos.map((t: any) => t.id), tazoId]
      const res = await fetch(`/api/decks/${activeDeck.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tazoIds: newIds }),
      })
      if (res.ok) {
        setDeckAddMsg({ type: "ok", text: `Added to ${activeDeck.name}` })
        if (activeDeck.isActive) {
          // If this is the active deck, the battle lobby count will update on next load
        }
      } else {
        const err = await res.json()
        setDeckAddMsg({ type: "err", text: err.error || "Failed" })
      }
    } catch { setDeckAddMsg({ type: "err", text: "Network error" }) }
    finally { setAddingToDeck(null) }
  }, [token])

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
    fetch("/api/collection?limit=500&includeDecks=true&view=instances", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => { if (!cancelled) setData(d) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      
    // Load user data for ID Card
    fetch("/api/user/settings")
      .then(r => r.json())
      .then(d => { if (d.user) setUserData(d.user) })
      .catch(() => {})
      
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
  const { strongest, rarest, recentTazos, deckTazos, duplicateTazos, favoriteTazos, listedTazos } = useMemo(() => {
    if (!data?.items.length) return { strongest: null, rarest: null, recentTazos: [], deckTazos: [], duplicateTazos: [], favoriteTazos: [], listedTazos: [] }
    const byRarity = [...data.items].sort((a, b) => rarityOrder(b.tazo.rarity) - rarityOrder(a.tazo.rarity))
    const byPower = [...data.items].sort((a, b) => totalPower(b.tazo) - totalPower(a.tazo))
    const recent = [...data.items].sort((a, b) => new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime()).slice(0, 8)
    const inDeck = data.items.filter(i => i.inDeckId)
    // For instances view, duplicates = same tazoId appearing more than once
    const tazoIdCount = new Map<string, number>()
    for (const i of data.items) tazoIdCount.set(i.tazoId, (tazoIdCount.get(i.tazoId) || 0) + 1)
    const dupes = data.items.filter(i => (tazoIdCount.get(i.tazoId) || 0) > 1)
    const favs = data.items.filter(i => i.isFavorite)
    const listed = data.items.filter(i => listedUserTazoIds.has(i.userTazoId || i.id))
    return { strongest: byPower[0] || null, rarest: byRarity[0] || null, recentTazos: recent, deckTazos: inDeck, duplicateTazos: dupes, favoriteTazos: favs, listedTazos: listed }
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
        <div className="mag-spinner w-12 h-12 rounded-full border-4 border-ttg-yellow border-t-ttg-red" />
      </div>
    )
  }

  // ── Not logged in ─────────────────────────────────────
  if (!user) {
    return (
      <div className="py-20 text-center space-y-5">
        <Package className="w-14 h-14 text-ttg-black/15 mx-auto" />
        <p className="font-black text-sm text-ttg-black/40 uppercase tracking-wider">
          {t.auth_login_subtitle || "Sign in to see your collection"}
        </p>
        <Link
          href="/login"
          className="inline-block py-3 px-8 mag-btn bg-ttg-red text-white text-xs font-black uppercase tracking-widest"
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
          <Package className="w-24 h-24 text-ttg-yellow" style={{ filter: "drop-shadow(4px 4px 0px var(--ttg-black))" }} />
          <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-ttg-red" />
        </div>
        <h2 className="text-3xl font-black text-ttg-black uppercase tracking-wide mag-stroke-sm">
          Your collection is empty!
        </h2>
        <p className="text-sm font-bold text-ttg-black/50 max-w-md mx-auto">
          Open bags to discover new tazos and start building your collection.
          Each bag contains random tazos from different series!
        </p>
        <Link
          href="/app/shop"
          className="inline-block py-4 px-10 mag-btn text-base font-black uppercase tracking-widest"
          style={{ background: 'var(--ttg-red)', color: "white" }}
        >
          <ShoppingBag className="w-5 h-5 inline mr-2" />
          Open Bags
        </Link>
      </div>
    )
  }

  if (!data) return null

  // ── Main View ─────────────────────────────────────────
  const totalGlobal = data.totalUnique > 0 ? Math.max(data.totalUnique, 681) : 681

  return (
    <div className="max-w-7xl mx-auto w-full py-4 sm:py-6 space-y-4">
      {/* ═══════════════════════════════════════════════ */}
      {/* ① COLLECTION HEADER                            */}
      {/* ═══════════════════════════════════════════════ */}
      <div
        className="px-4 py-3 flex flex-wrap items-center gap-3 relative overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.025) 6px, rgba(255,255,255,0.025) 12px), linear-gradient(90deg, var(--ttg-black) 0%, #2a2a2a 100%)`,
          border: "3px solid var(--ttg-black)",
          boxShadow: "4px 4px 0px var(--ttg-yellow)",
        }}
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--ttg-minimon), var(--ttg-dracobell))", border: "2px solid var(--ttg-black)" }}>
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
          <span className="text-[9px] font-black text-ttg-yellow bg-white/10 px-2 py-0.5 border border-ttg-yellow/30 tracking-wider">
            {data.totalUnique} / {totalGlobal}
          </span>
        </div>
      </div>


      {/* User ID Card — compact */}
      {userData && (
        <UserIdCard
          user={userData}
          variant="compact"
        />
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ② PROGRESS BAR                                 */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="border-3 border-ttg-black bg-white shadow-[3px_3px_0px_var(--ttg-black)]">
        <div className="p-3 sm:p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-ttg-black/50 uppercase tracking-wider">Collection progress</span>
              <span className="text-[10px] font-black text-ttg-black">{Math.round((data.totalUnique / Math.max(totalGlobal, 1)) * 100)}%</span>
            </div>
            <div className="h-4 border-2 border-ttg-black bg-ttg-cream overflow-hidden shadow-[inset_2px_2px_0px_rgba(26,26,26,0.1)]">
              <div
                className="h-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.min(100, (data.totalUnique / Math.max(totalGlobal, 1)) * 100)}%`,
                  background: "linear-gradient(90deg, var(--ttg-minimon), var(--ttg-dracobell), var(--ttg-red))",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ③ STATS ROW                                    */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Strongest */}
        <StatsCard
          icon={<TrendingUp className="w-4 h-4" />} iconColor='var(--ttg-yellow)'
          label="Strongest" value={strongest ? totalPower(strongest.tazo).toString() : "—"}
          valueColor='var(--ttg-black)'
          detail={strongest ? `${strongest.tazo.displayName || strongest.tazo.name} · TP` : undefined}
        />

        {/* Rarest */}
        <StatsCard
          icon={<Star className="w-4 h-4" />} iconColor="var(--ttg-warning)"
          label="Rarest" value={rarest ? RARITY_STARS[rarest.tazo.rarity] || "—" : "—"}
          valueColor={rarest ? (RARITY_COLOR[rarest.tazo.rarity] || "var(--ttg-rarity-common)") : 'var(--ttg-black)'}
          detail={rarest ? `${rarest.tazo.displayName || rarest.tazo.name} · ${rarest.tazo.rarity}` : undefined}
        />

        {/* Duplicates + Favorites summary */}
        <StatsCard
          icon={<Sparkles className="w-4 h-4" />} iconColor='var(--ttg-blue)'
          label="Extras" value={`${duplicateTazos.length} dupes`}
          valueColor='var(--ttg-blue)'
          detail={`${favoriteTazos.length} favorites`}
        />
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* ④ TOOLBAR — Filters + Search + Sort            */}
      {/* ═══════════════════════════════════════════════ */}
      <div
        className="p-3 border-3 border-ttg-black bg-white shadow-[3px_3px_0px_var(--ttg-black)] space-y-3"
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
              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black transition-all"
              style={{
                background: filter === f.key ? 'var(--ttg-black)' : "white",
                color: filter === f.key ? 'var(--ttg-yellow)' : 'var(--ttg-black)',
                boxShadow: filter === f.key ? "2px 2px 0px var(--ttg-yellow)" : "2px 2px 0px var(--ttg-black)",
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
              className="appearance-none pl-3 pr-8 py-1.5 text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black bg-white text-ttg-black cursor-pointer shadow-[2px_2px_0px_var(--ttg-black)]"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ttg-black/40 pointer-events-none" />
          </div>
        </div>

        {/* Bottom row: Search + Franchise pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ttg-black/25" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name or number..."
              className="w-full pl-8 pr-4 py-2 text-[10px] font-bold border-2 border-ttg-black bg-white text-ttg-black placeholder:text-ttg-black/20 shadow-[2px_2px_0px_var(--ttg-black)] focus:outline-none focus:border-ttg-yellow"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ttg-black/30 hover:text-ttg-black text-[11px] font-black"
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
                className="text-[9px] font-black px-2.5 py-1.5 border-2 border-ttg-black uppercase tracking-wider transition-all"
                style={{
                  background: franchiseFilter === null ? 'var(--ttg-black)' : "white",
                  color: franchiseFilter === null ? 'var(--ttg-yellow)' : 'var(--ttg-black)',
                  boxShadow: franchiseFilter === null ? "2px 2px 0px var(--ttg-yellow)" : "2px 2px 0px var(--ttg-black)",
                }}
              >
                ALL
              </button>
              {Object.entries(data.franchiseSummary).map(([slug, count]) => (
                <button
                  key={slug}
                  onClick={() => setFranchiseFilter(franchiseFilter === slug ? null : slug)}
                  className="text-[9px] font-black px-2.5 py-1.5 border-2 border-ttg-black uppercase tracking-wider transition-all flex items-center gap-1"
                  style={{
                    background: franchiseFilter === slug ? 'var(--ttg-black)' : FRANCHISE_BG[slug] || "white",
                    color: franchiseFilter === slug ? "white" : 'var(--ttg-black)',
                    boxShadow: franchiseFilter === slug ? "2px 2px 0px var(--ttg-black)" : "2px 2px 0px var(--ttg-black)",
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
              const gradient = FRANCHISE_GRADIENT[slug] || 'var(--ttg-black)'
              const label = FRANCHISE_LABEL[slug] || slug
              return (
                <div key={slug}>
                  {/* Franchise section header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-2 shrink-0" style={{ background: gradient, border: "2px solid var(--ttg-black)" }} />
                    <h3 className="text-sm font-black text-ttg-black uppercase tracking-wider">
                      {label} <span className="text-ttg-black/30 text-xs">· {items.length} tazos</span>
                    </h3>
                    <div className="flex-1 h-0.5 bg-ttg-black/10" />
                  </div>

                  {/* Items grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {items.map((item) => {
                      const power = totalPower(item.tazo)
                      const ObtainedIcon = item.obtainedFrom ? (OBTAINED_ICON[item.obtainedFrom] || null) : null
                      const obtainedLabel = item.obtainedFrom ? (OBTAINED_LABEL[item.obtainedFrom] || item.obtainedFrom) : null
                      const isInDeck = !!item.inDeckId
                      const isFlipped = flippedItems.has(item.id)
                      const instanceStats = item.instances?.[0]
                      const hasNew = item.instances?.some(i => i.isNew) ?? false

                      return (
                        <div
                          key={item.id}
                          className="group border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] overflow-hidden hover:shadow-[5px_5px_0px_var(--ttg-black)] hover:-translate-y-[2px] transition-all bg-white relative"
                        >
                          {/* NEW badge */}
                          {hasNew && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 bg-ttg-yellow text-ttg-black border-b-2 border-x-2 border-ttg-black text-[8px] font-black shadow-[0_2px_0px_var(--ttg-black)] animate-pulse">
                              NEW!
                            </div>
                          )}
                          {/* Deck indicator */}
                          {isInDeck && (
                            <div
                              className="absolute top-0 right-0 z-10 w-6 h-6 flex items-center justify-center"
                              style={{ background: 'var(--ttg-red)', borderBottom: "2px solid var(--ttg-black)", borderLeft: "2px solid var(--ttg-black)" }}
                              title={`In deck: ${item.deckName || "Active Deck"}`}
                            >
                              <Swords className="w-3 h-3 text-white" />
                            </div>
                          )}

                          {/* Favorite star */}
                          {item.isFavorite && (
                            <div className="absolute top-0 left-0 z-10 w-6 h-6 flex items-center justify-center">
                              <Star className="w-3.5 h-3.5 text-ttg-yellow fill-ttg-yellow" style={{ filter: "drop-shadow(1px 1px 0px var(--ttg-black))" }} />
                            </div>
                          )}

                          {/* Franchise strip */}
                          <div className="h-1.5" style={{ background: gradient }} />

                          {/* TazoDiscImage with mouse-tracking tilt for finish effects */}
                          <TazoDiscTilt isFlipped={isFlipped} wear={item.wear || 0}>
                            <TazoDiscImage
                              src={isFlipped
                                ? (FRANCHISE_BACK[item.tazo.franchiseSlug] || FRANCHISE_BACK.minimon)
                                : item.tazo.imageUrl}
                              alt={isFlipped ? `Back of ${item.tazo.name || "tazo"}` : item.tazo.name || ""}
                              size="100%"
                              borderWidth={0}
                              franchiseSlug={item.tazo.franchiseSlug}
                              number={item.tazo.number}
                              finish={(item.tazo as any).finish}
                              creatureVariant={(item.tazo as any).creatureVariant}
                              shinyImageUrl={(item.tazo as any).shinyImageUrl}
                              wear={item.wear || 0}
                              isBack={isFlipped}
                              onFlip={() => toggleFlip(item.id)}
                              overlay={
                                (item.tazo as any).finish &&
                                (item.tazo as any).finish !== "normal" &&
                                (item.tazo as any).finish !== "standard" &&
                                (item.tazo as any).finish !== "matte" ? (
                                  <div className="absolute top-1 right-1 bg-ttg-yellow text-ttg-black text-[7px] font-black px-1 py-0.5 border border-ttg-black shadow-[1px_1px_0px_var(--ttg-black)] rounded-sm pointer-events-auto z-30 uppercase">
                                    {(item.tazo as any).finish?.replace(/_/g, " ")}
                                  </div>
                                ) : undefined
                              }
                              lazy
                            />
                          </TazoDiscTilt>

                          {/* Flip hint */}
                          <div className="text-center bg-ttg-cream border-t border-ttg-black/10">
                            <button
                              onClick={() => toggleFlip(item.id)}
                              className="w-full py-1 text-[7px] font-black text-ttg-black/25 uppercase tracking-wider hover:text-ttg-black/50 hover:bg-ttg-black/5 transition-colors"
                            >
                              {isFlipped ? "BACK · CLICK FOR FRONT" : "CLICK TO FLIP"}
                            </button>
                          </div>

                          {/* Info panel */}
                          <div className="p-2.5 space-y-2 bg-white">
                            {/* Name + series */}
                            <div className="min-w-0">
                              <p className="text-[11px] font-black text-ttg-black truncate leading-tight">
                                {item.tazo.name || item.tazo.displayName || `#${item.tazo.number}`}
                              </p>
                              <p className="text-[9px] font-bold text-ttg-black/40 uppercase mt-0.5">
                                {label} #{item.tazo.number}
                              </p>
                            </div>

                            {/* Rarity bar + wear badge + TGA grade */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="text-[8px] font-black uppercase px-1.5 py-0.5 border border-ttg-black/20"
                                style={{
                                  background: (RARITY_COLOR[item.tazo.rarity] || "var(--ttg-rarity-common)") + "15",
                                  color: RARITY_COLOR[item.tazo.rarity] || "var(--ttg-rarity-common)",
                                }}
                              >
                                {RARITY_STARS[item.tazo.rarity] || ""}
                              </span>
                              {/* TGA grade */}
                              {instanceStats && (
                                <TGAGradeBadge
                                  tgaGrade={instanceStats.tgaGrade}
                                  tgaTier={instanceStats.tgaTier}
                                  size="sm"
                                />
                              )}
                              {/* Wear badge */}
                              {((item as any).wear || 0) > 0 && (
                                <span
                                  className="text-[7px] font-black uppercase px-1.5 py-0.5 border rounded-full"
                                  style={{
                                    background: ((item as any).wear <= 15 ? "#22c55e15" : (item as any).wear <= 40 ? "#ffcc0015" : (item as any).wear <= 70 ? "#FF880015" : "#CC000015"),
                                    color: (item as any).wear <= 15 ? 'var(--ttg-success)' : (item as any).wear <= 40 ? "#CCAA00" : (item as any).wear <= 70 ? "#FF8800" : "#CC0000",
                                    borderColor: ((item as any).wear <= 15 ? 'var(--ttg-success)' : (item as any).wear <= 40 ? "#CCAA00" : (item as any).wear <= 70 ? "#FF8800" : "#CC0000") + "30",
                                  }}
                                >
                                  {(item as any).wear <= 15 ? "LP" : (item as any).wear <= 40 ? "PL" : (item as any).wear <= 70 ? "HP" : "DM"}
                                </span>
                              )}
                              <span className="text-[8px] font-bold text-ttg-black/30">{power} TP</span>
                              {/* Listed on Marketplace badge */}
                              {listedUserTazoIds.has(item.userTazoId || item.id) && (
                                <span
                                  className="text-[7px] font-black uppercase px-1.5 py-0.5 border rounded-full"
                                  style={{
                                    background: "#A855F715",
                                    color: "var(--ttg-rarity-rare)",
                                    borderColor: "#A855F730",
                                  }}
                                >
                                  FOR SALE
                                </span>
                              )}
                            </div>

                            {/* Stats row */}
                            <div className="grid grid-cols-3 gap-1">
                              {[
                                { label: "ATK", value: item.tazo.attack, color: 'var(--ttg-red)' },
                                { label: "DEF", value: item.tazo.defense, color: 'var(--ttg-blue)' },
                                { label: "SPD", value: Math.round((item.tazo.spin + item.tazo.bounce + item.tazo.precision) / 3), color: "var(--ttg-cybermon)" },
                              ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                  <div className="text-[7px] font-black text-ttg-black/40 uppercase leading-none mb-0.5">{stat.label}</div>
                                  <div className="text-xs font-black leading-none" style={{ color: stat.color }}>{stat.value}</div>
                                </div>
                              ))}
                            </div>

                            {/* Acquired info */}
                            <div className="flex items-center gap-2 text-[8px]">
                              <span className="font-bold text-ttg-black/30 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {timeAgo(item.acquiredAt)}
                              </span>
                              {ObtainedIcon && obtainedLabel && (
                                <span className="font-bold text-ttg-black/40 flex items-center gap-0.5 border-l border-ttg-black/10 pl-2">
                                  <ObtainedIcon className="w-2.5 h-2.5" />
                                  {obtainedLabel}
                                </span>
                              )}
                            </div>

                            {/* Quick actions */}
                            <div className="flex gap-1 pt-1.5 border-t border-ttg-black/10">
                              <button
                                onClick={() => setDetailItem(item)}
                                className="flex-1 text-[7px] font-black uppercase text-center py-1.5 border border-ttg-black/20 hover:bg-ttg-yellow/20 transition-colors flex items-center justify-center gap-0.5"
                                title="View full details"
                              >
                                <Eye className="w-2.5 h-2.5" /> View
                              </button>
                              <button
                                onClick={() => handleAddToDeck(item.tazo?.id || item.id)}
                                disabled={addingToDeck === (item.tazo?.id || item.id)}
                                className="flex-1 text-[7px] font-black uppercase text-center py-1.5 border border-ttg-black/20 hover:bg-ttg-yellow/10 disabled:opacity-50 transition-colors flex items-center justify-center gap-0.5"
                                title="Add to deck"
                              >
                                {addingToDeck === (item.tazo?.id || item.id) ? (
                                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <PlusCircle className="w-2.5 h-2.5" />
                                )} Deck
                              </button>
                              <button
                                className="flex-1 text-[7px] font-black uppercase text-center py-1.5 border border-ttg-black/20 hover:bg-ttg-yellow/10 transition-colors flex items-center justify-center gap-0.5"
                                title={item.isFavorite ? "Favorited" : "Add to favorites"}
                              >
                                <Heart className={`w-2.5 h-2.5 ${item.isFavorite ? "fill-ttg-red text-ttg-red" : ""}`} />
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
        <div className="text-center py-16 border-3 border-ttg-black bg-white shadow-[3px_3px_0px_var(--ttg-black)]">
          <Search className="w-10 h-10 text-ttg-black/15 mx-auto mb-3" />
          <p className="font-black text-sm text-ttg-black/30 uppercase tracking-wider">
            No tazos match this filter
          </p>
          <button
            onClick={() => { setFilter("all"); setFranchiseFilter(null); setSearchTerm("") }}
            className="mt-3 text-[10px] font-black underline text-ttg-red uppercase hover:text-ttg-black transition-colors"
          >
            Reset all filters
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ⑦ DETAIL PANEL (inline expand)                  */}
      {/* ═══════════════════════════════════════════════ */}
      {detailItem && (() => {
        const d = detailItem
        const dGradient = FRANCHISE_GRADIENT[d.tazo.franchiseSlug || d.tazo.franchise] || 'var(--ttg-black)'
        const dLabel = FRANCHISE_LABEL[d.tazo.franchiseSlug || d.tazo.franchise] || d.tazo.franchiseSlug || "Unknown"
        const dInst = d.instances?.[0]
        const dPower = totalPower(d.tazo)
        const isDetailFlipped = flippedItems.has(d.id)
        return (
          <div
            className="border-3 border-ttg-black bg-white shadow-[4px_4px_0px_var(--ttg-black)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3" style={{ background: dGradient, borderBottom: "3px solid var(--ttg-black)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-ttg-black overflow-hidden bg-white flex items-center justify-center shrink-0">
                  <TazoDiscImage
                    src={d.tazo.imageUrl}
                    alt={d.tazo.name || ""}
                    size={40}
                    borderWidth={0}
                    finish={(d.tazo as any).finish}
                    creatureVariant={(d.tazo as any).creatureVariant}
                    shinyImageUrl={(d.tazo as any).shinyImageUrl}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-black text-ttg-black uppercase tracking-wide leading-tight">
                    {d.tazo.displayName || d.tazo.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-black text-ttg-black/60 uppercase">
                      {dLabel} #{d.tazo.number}
                    </span>
                    <span
                      className="text-[9px] font-black uppercase px-1.5 py-0.5 border"
                      style={{
                        background: (RARITY_COLOR[d.tazo.rarity] || "var(--ttg-rarity-common)") + "20",
                        color: RARITY_COLOR[d.tazo.rarity] || "var(--ttg-rarity-common)",
                        borderColor: (RARITY_COLOR[d.tazo.rarity] || "var(--ttg-rarity-common)") + "40",
                      }}
                    >
                      {d.tazo.rarity}
                    </span>
                    {dInst && <TGAGradeBadge tgaGrade={dInst.tgaGrade} tgaTier={dInst.tgaTier} size="sm" />}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="w-8 h-8 flex items-center justify-center bg-white border-2 border-ttg-black shadow-[2px_2px_0px_var(--ttg-black)] hover:bg-ttg-yellow transition-colors font-black text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left: Large disc */}
              <div className="flex items-center justify-center">
                <div className="relative" style={{ width: 240, height: 240 }}>
                  <TazoDiscImage
                    src={isDetailFlipped
                      ? (FRANCHISE_BACK[d.tazo.franchiseSlug] || FRANCHISE_BACK.minimon)
                      : d.tazo.imageUrl}
                    alt={d.tazo.name || ""}
                    size={240}
                    borderWidth={4}
                    borderColor='var(--ttg-black)'
                    franchiseSlug={d.tazo.franchiseSlug}
                    number={d.tazo.number}
                    finish={(d.tazo as any).finish}
                    creatureVariant={(d.tazo as any).creatureVariant}
                    shinyImageUrl={(d.tazo as any).shinyImageUrl}
                    wear={d.wear || 0}
                    isBack={isDetailFlipped}
                    onFlip={() => toggleFlip(d.id)}
                  />
                </div>
              </div>

              {/* Right: Full stats */}
              <div className="space-y-3">
                {/* Power */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-ttg-black/40 uppercase tracking-wider">Total Power</span>
                  <span className="text-xl font-black text-ttg-black">{dPower}</span>
                </div>

                {/* All stats grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "ATK", value: d.tazo.attack, color: 'var(--ttg-red)' },
                    { label: "DEF", value: d.tazo.defense, color: 'var(--ttg-blue)' },
                    { label: "RES", value: d.tazo.resistance, color: "#6366F1" },
                    { label: "WGT", value: d.tazo.weight, color: "var(--ttg-warning)" },
                    { label: "STA", value: d.tazo.stability, color: "#14B8A6" },
                    { label: "SPN", value: d.tazo.spin, color: "#10B981" },
                    { label: "CTR", value: d.tazo.control, color: "#EC4899" },
                    { label: "BNC", value: d.tazo.bounce, color: "var(--ttg-dracobell)" },
                    { label: "PRC", value: d.tazo.precision, color: "var(--ttg-cybermon)" },
                  ].map(s => (
                    <div key={s.label} className="text-center p-1.5 border-2 border-ttg-black/10 bg-ttg-cream">
                      <div className="text-[7px] font-black text-ttg-black/40 uppercase">{s.label}</div>
                      <div className="text-sm font-black" style={{ color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Meta info */}
                <div className="space-y-1.5 text-[10px]">
                  {dInst?.tgaCertNumber && (
                    <div className="flex justify-between">
                      <span className="font-bold text-ttg-black/40">TGA Cert</span>
                      <span className="font-black text-ttg-black text-[9px]">#{dInst.tgaCertNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-bold text-ttg-black/40">Acquired</span>
                    <span className="font-black text-ttg-black">{timeAgo(d.acquiredAt)}</span>
                  </div>
                  {d.obtainedFrom && (
                    <div className="flex justify-between">
                      <span className="font-bold text-ttg-black/40">Source</span>
                      <span className="font-black text-ttg-black uppercase">{OBTAINED_LABEL[d.obtainedFrom] || d.obtainedFrom}</span>
                    </div>
                  )}
                  {(d as any).wear > 0 && (
                    <div className="flex justify-between">
                      <span className="font-bold text-ttg-black/40">Wear</span>
                      <span className="font-black text-ttg-black">{(d as any).wear}%</span>
                    </div>
                  )}
                  {d.inDeckId && (
                    <div className="flex justify-between">
                      <span className="font-bold text-ttg-black/40">Deck</span>
                      <span className="font-black text-ttg-red">{d.deckName || "Active Deck"}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => toggleFlip(d.id)}
                    className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black bg-white hover:bg-ttg-yellow/10 transition-colors shadow-[2px_2px_0px_var(--ttg-black)]"
                  >
                    {isDetailFlipped ? "SHOW FRONT" : "FLIP"}
                  </button>
                  <Link
                    href="/app/decks"
                    className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black bg-white hover:bg-ttg-black/5 transition-colors shadow-[2px_2px_0px_var(--ttg-black)] text-center"
                  >
                    DECK
                  </Link>
                  <Link
                    href="/app/battle"
                    className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black bg-ttg-red text-white hover:bg-ttg-red-dark transition-colors shadow-[2px_2px_0px_var(--ttg-black)] text-center"
                  >
                    BATTLE
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ═══════════════════════════════════════════════ */}
      {/* ⑧ QUICK LINKS                                  */}
      {/* ═══════════════════════════════════════════════ */}
      <div className="flex flex-wrap gap-3 justify-center pt-2">
        <Link href="/tazos" className="mag-btn px-5 py-2.5 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
          style={{ background: "white", color: 'var(--ttg-black)', border: "3px solid var(--ttg-black)", boxShadow: "3px 3px 0px var(--ttg-black)" }}>
          <BookOpen className="w-4 h-4" /> Tazo Catalog
        </Link>
        <Link href="/app/battle" className="mag-btn px-5 py-2.5 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
          style={{ background: 'var(--ttg-red)', color: "white", border: "3px solid var(--ttg-black)", boxShadow: "3px 3px 0px var(--ttg-black)" }}>
          <Swords className="w-4 h-4" /> Battle
        </Link>
        <Link href="/app/shop" className="mag-btn px-5 py-2.5 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
          style={{ background: 'var(--ttg-yellow)', color: 'var(--ttg-black)', border: "3px solid var(--ttg-black)", boxShadow: "3px 3px 0px var(--ttg-black)" }}>
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
      className="p-3 border-3 border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] bg-white hover:shadow-[4px_4px_0px_var(--ttg-black)] hover:-translate-y-[1px] transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="text-ttg-black/60" style={{ color: iconColor }}>
          {icon}
        </div>
        <span className="text-[9px] font-black uppercase text-ttg-black/50 tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-black" style={{ color: valueColor }}>{value}</div>
      {detail && (
        <p className="text-[10px] font-bold text-ttg-black/50 truncate mt-1">{detail}</p>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }
  return content
}
