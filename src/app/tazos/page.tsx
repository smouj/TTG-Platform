// ============================================================
// Trading Tazos Game — Public Tazo Catalog
// ============================================================
"use client"

import { useState, useEffect } from "react"
import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"
import { Star, Zap, Flame, Cpu, Loader2 } from "lucide-react"

interface TazoData {
  id: string; name: string; displayName: string; number: string
  franchise: string; franchiseSlug?: string
  imageUrl: string | null; rarity: string
  attack?: number; defense?: number; bounce?: number; spin?: number; precision?: number
}

const FRANCHISE_STYLE: Record<string, { bg: string; text: string; gradient: string; back: string; icon: typeof Zap }> = {
  minimon: { bg: "#FFCB05", text: "#7C2D12", gradient: "linear-gradient(135deg, #FFCB05, #FF8C00)", back: "/tazos-artgen/backs/minimon-back.png", icon: Zap },
  cybermon: { bg: "#00A1E9", text: "#FFFFFF", gradient: "linear-gradient(135deg, #00A1E9, #0057B7)", back: "/tazos-artgen/backs/cybermon-back.png", icon: Cpu },
  dracobell: { bg: "#FF6B00", text: "#FFFFFF", gradient: "linear-gradient(135deg, #FF6B00, #CC4400)", back: "/tazos-artgen/backs/dracobell-back.png", icon: Flame },
}

const RARITY_COLORS: Record<string, string> = {
  common: "#9CA3AF", uncommon: "#22C55E", rare: "#3B82F6", ultra: "#A855F7", legendary: "#F59E0B",
}

const FRANCHISES = ["all", "minimon", "cybermon", "dracobell"]

function TazoCard({ tazo }: { tazo: TazoData }) {
  const style = FRANCHISE_STYLE[tazo.franchise] || FRANCHISE_STYLE.minimon
  const total = (tazo.attack || 0) + (tazo.defense || 0) + (tazo.bounce || 0) + (tazo.spin || 0) + (tazo.precision || 0)
  return (
    <div className="mag-card bg-white p-3 flex flex-col items-center gap-1.5 hover:translate-y-[-2px] active:translate-y-0 transition-transform">
      <div className="relative w-20 h-20 rounded-full border-3 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] overflow-hidden" style={{ background: style.gradient, padding: "3px" }}>
        {tazo.imageUrl ? (
          <img src={tazo.imageUrl} alt={tazo.name} className="w-full h-full object-cover rounded-full" loading="lazy" />
        ) : (
          <div className="w-full h-full rounded-full flex items-center justify-center text-white font-black text-xl">?</div>
        )}
        <span className="absolute bottom-0.5 right-1 text-[7px] font-black bg-white/90 border border-[#1a1a1a] px-1 leading-tight text-[#1a1a1a]">#{tazo.number}</span>
      </div>
      <p className="text-[10px] font-black text-[#1a1a1a] text-center leading-tight truncate w-full">{tazo.name}</p>
      <div className="flex items-center gap-1">
        <span className="text-[7px] font-black uppercase tracking-wide px-1.5 py-0.5 border border-[#1a1a1a]" style={{ background: style.bg, color: style.text }}>{tazo.franchise}</span>
        <span className="text-[8px] font-bold" style={{ color: RARITY_COLORS[tazo.rarity] || "#9CA3AF" }}>{tazo.rarity}</span>
      </div>
      {total > 0 && <span className="text-[8px] font-black text-[#1a1a1a]/30">{total} total</span>}
    </div>
  )
}

export default function TazosCatalogPage() {
  const [tazos, setTazos] = useState<TazoData[]>([])
  const [loading, setLoading] = useState(true)
  const [franchise, setFranchise] = useState("all")

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/tazos?limit=200")
        const data = await res.json()
        setTazos(data.tazos || [])
      } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [])

  const filtered = franchise === "all" ? tazos : tazos.filter(t => t.franchise === franchise)

  const franchiseCounts = {
    all: tazos.length,
    minimon: tazos.filter(t => t.franchise === "minimon").length,
    cybermon: tazos.filter(t => t.franchise === "cybermon").length,
    dracobell: tazos.filter(t => t.franchise === "dracobell").length,
  }

  return (
    <PublicPageShell>
      <div className="max-w-5xl mx-auto py-12 sm:py-16 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-2">
            Tazo Catalog
          </h1>
          <p className="text-lg font-bold text-[#1a1a1a]/60">
            Browse {tazos.length || 319} tazos across 3 collections. Sign in for full stats, deck building, and battle.
          </p>
        </div>

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
                className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a] transition-all p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <c.icon className="w-6 h-6" style={{ color: c.color }} />
                  <h3 className="text-base font-black uppercase text-[#1a1a1a]">{c.name}</h3>
                </div>
                <p className="text-xs font-bold text-[#1a1a1a]/50">{count} tazos &middot; View lore →</p>
              </Link>
            )
          })}
        </div>

        {/* Franchise tabs */}
        <div className="flex gap-2">
          {FRANCHISES.map(f => (
            <button
              key={f}
              onClick={() => setFranchise(f)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider border-2 transition-all ${
                franchise === f
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#FFCC00]"
                  : "bg-white text-[#1a1a1a] border-[#1a1a1a]/15 hover:border-[#FFCC00]"
              }`}
            >
              {f === "all" ? `All (${franchiseCounts.all})` : `${f} (${franchiseCounts[f] || 0})`}
            </button>
          ))}
        </div>

        {/* Tazo grid */}
        {loading ? (
          <div className="text-center py-20"><Loader2 className="w-10 h-10 animate-spin mx-auto text-[#FFCC00]" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filtered.slice(0, 60).map(t => (
              <TazoCard key={t.id} tazo={t} />
            ))}
          </div>
        )}

        {!loading && filtered.length > 60 && (
          <p className="text-center text-xs font-bold text-[#1a1a1a]/40">
            Showing 60 of {filtered.length} tazos. Sign in to browse the full catalog with advanced filters and search.
          </p>
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
              <div key={r} className="border-2 border-[#1a1a1a] p-3 bg-[#fffbe6] shadow-[2px_2px_0px_#1a1a1a]">
                <span className="text-[10px] font-black" style={{ color: col }}>{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
