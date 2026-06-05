import PublicPageShell from "@/components/layout/public-page-shell"
import Image from "next/image"
import Link from "next/link"
import { Star, ShieldCheck, Zap, Flame, Cpu } from "lucide-react"

const FEATURED_TAZOS = [
  { number: 1, name: "Lumipuff", franchise: "minimon", image: "/tazos-artgen/minimon/minimon-001.png", rarity: "Common", role: "Striker", rarityColor: "#9CA3AF" },
  { number: 2, name: "Bubblit", franchise: "minimon", image: "/tazos-artgen/minimon/minimon-002.jpg", rarity: "Common", role: "Tank", rarityColor: "#9CA3AF" },
  { number: 3, name: "Emberkit", franchise: "minimon", image: "/tazos-artgen/minimon/minimon-003.jpg", rarity: "Common", role: "Striker", rarityColor: "#9CA3AF" },
  { number: 4, name: "Leafroll", franchise: "minimon", image: "/tazos-artgen/minimon/minimon-004.jpg", rarity: "Uncommon", role: "Anchor", rarityColor: "#22C55E" },
  { number: 5, name: "Voltbud", franchise: "minimon", image: "/tazos-artgen/minimon/minimon-005.jpg", rarity: "Uncommon", role: "Speedster", rarityColor: "#22C55E" },
  { number: 151, name: "Voltcrab-X", franchise: "cybermon", image: "/tazos-artgen/cybermon/cybermon-001.png", rarity: "Rare", role: "Attacker", rarityColor: "#3B82F6" },
]

const FRANCHISE_STYLE: Record<string, { bg: string; text: string }> = {
  minimon: { bg: "#FFCB05", text: "#7C2D12" },
  cybermon: { bg: "#00A1E9", text: "#FFFFFF" },
  dracobell: { bg: "#FF6B00", text: "#FFFFFF" },
}

export default function TazosCatalogPage() {
  return (
    <PublicPageShell>
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-4">Tazo Catalog</h1>
        <p className="text-lg font-bold text-[#1a1a1a]/60 mb-10">
          Browse all 319 tazos across 3 collections. Filter by franchise, rarity, category, and more.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { name: "Minimon", slug: "minimon", count: 51, color: "#FFCC00", icon: Zap },
            { name: "Dracobell", slug: "dracobell", count: 118, color: "#FF6B00", icon: Flame },
            { name: "Cybermon", slug: "cybermon", count: 150, color: "#00B4D8", icon: Cpu },
          ].map((c) => (
            <Link
              key={c.slug}
              href={`/tazos?collection=${c.slug}`}
              className="border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a] transition-all p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <c.icon className="w-6 h-6" style={{ color: c.color }} />
                <div>
                  <h3 className="text-base font-black uppercase text-[#1a1a1a]">{c.name}</h3>
                  <p className="text-xs font-bold text-[#1a1a1a]/50">{c.count} tazos</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Featured Tazos — public preview */}
        <div className="mb-10">
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mb-1">Featured Tazos</h2>
          <p className="text-xs font-bold text-[#1a1a1a]/40 mb-4">A preview of what awaits in the full catalog.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {FEATURED_TAZOS.map((t) => {
              const style = FRANCHISE_STYLE[t.franchise] || FRANCHISE_STYLE.minimon
              return (
                <div
                  key={`${t.franchise}-${t.number}`}
                  className="mag-card bg-white rounded-lg p-3 flex flex-col items-center gap-2 hover:translate-y-[-2px] active:translate-y-0 transition-transform"
                >
                  {/* Tazo Disc */}
                  <div className="relative w-[80px] h-[80px] rounded-full border-3 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] overflow-hidden" style={{ background: `linear-gradient(135deg, ${style.bg}, ${style.bg}dd)` }}>
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover rounded-full" />
                    <span className="absolute bottom-0.5 right-1 text-[7px] font-black bg-white/90 border border-[#1a1a1a] px-1 leading-tight text-[#1a1a1a]">
                      #{t.number}
                    </span>
                  </div>
                  {/* Name */}
                  <p className="text-[10px] sm:text-[11px] font-black text-[#1a1a1a] text-center leading-tight truncate w-full">
                    {t.name}
                  </p>
                  {/* Franchise badge */}
                  <span className="text-[7px] font-black uppercase tracking-wide px-1.5 py-0.5 border border-[#1a1a1a]" style={{ background: style.bg, color: style.text }}>
                    {t.franchise}
                  </span>
                  {/* Rarity */}
                  <span className="text-[8px] font-bold" style={{ color: t.rarityColor }}>
                    {t.rarity}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-4 border-[#1a1a1a] shadow-[8px_8px_0px_#1a1a1a] bg-[#FFCC00] p-8 text-center">
          <h2 className="text-xl font-black uppercase text-[#1a1a1a] mb-3">Full Catalog Available In-App</h2>
          <p className="text-sm font-bold text-[#1a1a1a]/60 mb-6 max-w-md mx-auto">
            The complete tazo catalog with search, filters, pagination, and 9-stat detail views is available after signing in. Create your free account to browse all 319 tazos.
          </p>
          <Link href="/register" className="mag-btn inline-block bg-[#E3350D] text-white border-2 border-[#1a1a1a] px-8 py-4 text-sm font-black uppercase tracking-wider shadow-[4px_4px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#1a1a1a] transition-all">
            Sign Up to Browse
          </Link>
        </div>

        <div className="mt-8">
          <div className="border-3 border-[#1a1a1a] bg-white p-6">
            <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-3">Rarity Tiers</h3>
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold">
              {[["★ Common", "text-gray-400"], ["★★ Uncommon", "text-green-600"], ["★★★ Rare", "text-blue-600"], ["★★★★ Ultra", "text-purple-600"], ["★★★★★ Legendary", "text-yellow-600"]].map(([r, col]) => (
                <div key={r} className="border-2 border-[#1a1a1a] p-3 bg-[#fffbe6]">
                  <span className={col}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PublicPageShell>
  )
}
