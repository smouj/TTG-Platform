// ============================================================
// Trading Tazos Game — Public Tazo Catalog
// ============================================================
"use client"

import { useState, useEffect, useCallback } from "react"
import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"
import { Star, Zap, Flame, Cpu, Loader2, Package, ChevronLeft, ChevronRight } from "lucide-react"
import TazoCard from "@/components/game/tazo-card"
import TazoDetailModal from "@/components/game/tazo-detail-modal"
import { useVisibilityRefresh } from "@/lib/use-visibility-refresh"

interface TazoData {
  id: string; name: string; displayName: string; number: string
  franchise: string; franchiseSlug?: string
  imageUrl: string | null; rarity: string
  attack?: number; defense?: number; bounce?: number; spin?: number; precision?: number
  finish?: string; creatureVariant?: string; shinyImageUrl?: string | null
}

const FRANCHISE_STYLE: Record<string, { bg: string; text: string; gradient: string; icon: typeof Zap }> = {
  minimon: { bg: "#FFCB05", text: "#7C2D12", gradient: "linear-gradient(135deg, #FFCB05, #FF8C00)", icon: Zap },
  cybermon: { bg: "#00A1E9", text: "#FFFFFF", gradient: "linear-gradient(135deg, #00A1E9, #0057B7)", icon: Cpu },
  dracobell: { bg: "#FF6B00", text: "#FFFFFF", gradient: "linear-gradient(135deg, #FF6B00, #CC4400)", icon: Flame },
  "draco-bell": { bg: "#FF6B00", text: "#FFFFFF", gradient: "linear-gradient(135deg, #FF6B00, #CC4400)", icon: Flame },
}

const RARITY_COLORS: Record<string, string> = {
  common: "#9CA3AF", uncommon: "#22C55E", rare: "#3B82F6", epic: "#EF4444", ultra: "#A855F7", legendary: "#F59E0B",
}

const FRANCHISES = ["all", "minimon", "cybermon", "dracobell"]
const PAGE_SIZE = 48

// Map API tazo data to format expected by shared TazoCard / TazoDetailModal
function toTazoCard(t: TazoData): any {
  return {
    ...t,
    franchiseSlug: t.franchiseSlug || t.franchise || "minimon",
    franchise: t.franchise || "minimon",
    franchiseName: t.franchise.charAt(0).toUpperCase() + t.franchise.slice(1),
    isOwned: false, // public catalog — none are owned
    condition: t.finish === "holo" ? "holo" : t.finish === "metallic" ? "metallic" : "mint",
    battleWins: 0,
    battleLosses: 0,
    weight: 50, stability: 50, control: 50,
    imageUrl: t.imageUrl || "/tazos-artgen/backs/minimon-back.png",
  }
}

export default function TazosCatalogPage() {
  const [tazos, setTazos] = useState<TazoData[]>([])
  const [loading, setLoading] = useState(true)
  const [franchise, setFranchise] = useState("all")
  const [page, setPage] = useState(1)
  const [detailTazo, setDetailTazo] = useState<TazoData | null>(null)

  const fetchTazos = useCallback(async () => {
    try {
      const res = await fetch(`/api/tazos?limit=500&_t=${Date.now()}`)
      const data = await res.json()
      setTazos((data.tazos || []).map((t: any) => ({
        ...t,
        franchise: t.franchiseSlug || t.franchise?.slug || "minimon",
      })))
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTazos()
  }, [fetchTazos])

  // Auto-refresh when tab becomes visible (cache-busted)
  useVisibilityRefresh(fetchTazos)

  const filtered = franchise === "all" ? tazos : tazos.filter(t =>
    t.franchise === franchise || (franchise === "dracobell" && t.franchise === "draco-bell")
  )
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset page when franchise changes
  const setFranchiseAndReset = useCallback((f: string) => {
    setFranchise(f)
    setPage(1)
  }, [])

  const franchiseCounts = {
    all: tazos.length,
    minimon: tazos.filter(t => t.franchise === "minimon").length,
    cybermon: tazos.filter(t => t.franchise === "cybermon").length,
    dracobell: tazos.filter(t => t.franchise === "dracobell" || t.franchise === "draco-bell").length,
  }

  const visibleFranchises = ["all", ...FRANCHISES.filter(f => f !== "all" && franchiseCounts[f as keyof typeof franchiseCounts] > 0)]

  return (
    <PublicPageShell>
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 space-y-8">
        {/* Magazine Banner Strip */}
        <div className="mag-card-yellow rounded-none px-4 py-3 flex flex-wrap items-center gap-3" style={{ borderBottom: "4px solid #1a1a1a" }}>
          <div className="flex items-center gap-1.5">
            <Package className="w-5 h-5 text-[#1a1a1a]" />
            <span className="text-sm font-black text-[#1a1a1a] tracking-tight uppercase">
              Tazo Catalog
            </span>
          </div>
          <div className="w-px h-5 bg-[#1a1a1a]/30" />
          <span className="text-sm font-black text-[#E3350D] tracking-tight">
            {tazos.length || 347} TAZOS
          </span>
          <div className="w-px h-5 bg-[#1a1a1a]/30" />
          <span className="text-[10px] font-black text-[#1a1a1a]/40 uppercase tracking-wider">
            4 Collections
          </span>
        </div>

        {/* Featured Tazos preview */}
        {!loading && tazos.length > 0 && (
          <div className="mag-card-yellow rounded-none px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-[#1a1a1a]" />
              <h2 className="text-sm font-black uppercase tracking-wider text-[#1a1a1a]">Featured Tazos</h2>
              <span className="text-[10px] font-bold text-[#1a1a1a]/35">Click to see details</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {tazos
                .filter(t => t.imageUrl && (t.rarity === "legendary" || t.rarity === "ultra" || t.rarity === "rare"))
                .slice(0, 5)
                .map(t => (
                  <TazoCard key={t.id} tazo={toTazoCard(t)} onClick={(tzo: any) => setDetailTazo(t)} />
                ))}
            </div>
          </div>
        )}

        {/* Collection cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { name: "Minimon", slug: "minimon", color: "#FFCC00", icon: Zap },
            { name: "Dracobell", slug: "dracobell", color: "#FF6B00", icon: Flame },
            { name: "Cybermon", slug: "cybermon", color: "#00B4D8", icon: Cpu },
          ].map((c) => {
            const count = franchiseCounts[c.slug]
            return (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <c.icon className="w-6 h-6" style={{ color: c.color }} />
                  <h3 className="text-base font-black uppercase text-[#1a1a1a]">{c.name}</h3>
                </div>
                <p className="text-xs font-bold text-[#1a1a1a]/50">{count} tazos · View lore →</p>
              </Link>
            )
          })}
        </div>

        {/* Franchise tabs */}
        <div className="flex flex-wrap gap-2">
          {visibleFranchises.map(f => (
            <button
              key={f}
              onClick={() => setFranchiseAndReset(f)}
              className={`px-3 sm:px-4 py-2 text-[10px] font-black uppercase tracking-wider border-2 transition-all ${
                franchise === f
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#FFCC00] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                  : "bg-white text-[#1a1a1a] border-[#1a1a1a]/15 hover:border-[#FFCC00] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              }`}
            >
              {f === "all" ? `All (${franchiseCounts.all})` : `${f} (${franchiseCounts[f as keyof typeof franchiseCounts] || 0})`}
            </button>
          ))}
        </div>

        {/* Tazo grid with pagination */}
        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[#FFCC00]" /></div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {paginated.map(t => (
                <TazoCard key={t.id} tazo={toTazoCard(t)} onClick={(tzo: any) => setDetailTazo(t)} />
              ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 text-[10px] font-black uppercase tracking-wider border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-[2px_2px_0px_#1a1a1a] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                >
                  <ChevronLeft className="w-4 h-4 inline" /> Prev
                </button>
                <span className="text-xs font-black text-[#1a1a1a]/60 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 text-[10px] font-black uppercase tracking-wider border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-[2px_2px_0px_#1a1a1a] disabled:hover:translate-x-0 disabled:hover:translate-y-0"
                >
                  Next <ChevronRight className="w-4 h-4 inline" />
                </button>
              </div>
            )}

            {filtered.length === 0 && (
              <p className="text-center text-xs font-bold text-[#1a1a1a]/40 py-12">
                No tazos found for this franchise. Try another filter.
              </p>
            )}
          </>
        )}

        {/* CTA */}
        <div className="border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] bg-[#FFCC00] p-8 text-center">
          <h2 className="text-xl font-black uppercase text-[#1a1a1a] mb-3">Full Stats Unlock In-App</h2>
          <p className="text-sm font-bold text-[#1a1a1a]/60 mb-6 max-w-md mx-auto">
            Sign in to view all 9 combat stats per tazo, build decks, and enter the battle arena.
          </p>
          <Link
            href="/register"
            className="mag-btn inline-block bg-[#E3350D] text-white border-2 border-[#1a1a1a] px-8 py-4 text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a] transition-all"
          >
            Create Free Account →
          </Link>
        </div>

        {/* Rarity tiers */}
        <div className="mag-card overflow-hidden">
          <div className="mag-card-yellow px-4 py-2 flex items-center gap-2 border-b-3 border-[#1a1a1a]">
            <Star className="w-4 h-4 text-[#1a1a1a]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">Rarity Tiers</h3>
          </div>
          <div className="p-4 mag-dots grid grid-cols-5 gap-2 text-center">
            {[
              ["★ Common", "#9CA3AF"], ["★★ Uncommon", "#22C55E"], ["★★★ Rare", "#3B82F6"],
              ["★★★★ Ultra", "#A855F7"], ["★★★★★ Legendary", "#F59E0B"],
            ].map(([r, col]) => (
              <div key={String(r)} className="border-2 border-[#1a1a1a] p-3 bg-[#fffbe6] shadow-[2px_2px_0px_#1a1a1a]">
                <span className="text-[10px] font-black" style={{ color: col }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail modal */}
      <TazoDetailModal
        tazo={detailTazo ? toTazoCard(detailTazo) : null}
        open={!!detailTazo}
        onClose={() => setDetailTazo(null)}
      />
    </PublicPageShell>
  )
}
