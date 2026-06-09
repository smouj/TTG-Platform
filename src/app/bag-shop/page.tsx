import { Metadata } from "next"
import Link from "next/link"
import { ShoppingBag, Star, Zap, Coins, ArrowRight, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Bag Shop — Trading Tazos Game",
  description: "Open bags and collect tazos across 3 franchises — Classic, Premium, and Mega bags with unique rarity boosts.",
}

const BAGS = [
  { type: "classic", name: "Classic Bag", cost: 10, bonusChance: 12, rareBoost: 1, color: "#FFCC00", bg: "#FFF8E7", border: "#E5B800", franchise: "minimon", franchiseName: "Minimon", icon: ShoppingBag, tagline: "Original collection tazos", desc: "Perfect for new collectors. Classic Minimon tazos with standard rarity distribution.", rarity: [{ l:"Common",p:55},{l:"Uncommon",p:30},{l:"Rare",p:12},{l:"Ultra Rare",p:2.5},{l:"Legendary",p:0.5}] },
  { type: "premium", name: "Premium Bag", cost: 10, bonusChance: 18, rareBoost: 2, color: "#3B82F6", bg: "#EFF6FF", border: "#2563EB", franchise: "cybermon", franchiseName: "Cybermon", icon: Star, tagline: "Digital monsters and tech", desc: "Boosted rare chances. Cybermon tazos with digital finishes and enhanced rarity.", rarity: [{ l:"Common",p:45},{l:"Uncommon",p:32},{l:"Rare",p:18},{l:"Ultra Rare",p:4},{l:"Legendary",p:1}] },
  { type: "mega", name: "Mega Bag", cost: 10, bonusChance: 30, rareBoost: 4, color: "#F97316", bg: "#FFF7ED", border: "#EA580C", franchise: "dracobell", franchiseName: "Dracobell", icon: Zap, tagline: "Legendary auras, top rarity", desc: "Maximum rarity boost. Dracobell tazos with legendary finishes.", rarity: [{ l:"Common",p:35},{l:"Uncommon",p:30},{l:"Rare",p:25},{l:"Ultra Rare",p:7},{l:"Legendary",p:3}] },
]

const RC: Record<string, string> = { Common:"#9CA3AF", Uncommon:"#22C55E", Rare:"#3B82F6","Ultra Rare":"#A855F7", Legendary:"#F59E0B" }

async function fetchTazos() {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://tradingtazosgame.com"
    const res = await fetch(`${base}/api/tazos?limit=15&publishStatus=published`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return (await res.json()).tazos || []
  } catch { return null }
}

export default async function BagShopPage() {
  const tazos = await fetchTazos()
  const byF: Record<string, any[]> = {}
  if (tazos) for (const t of tazos) { const f = t.franchiseSlug || t.franchise?.slug || t.franchise; if (f) { if (!byF[f]) byF[f] = []; if (byF[f].length < 5) byF[f].push(t) } }

  return (
    <div className="min-h-screen bg-[#fffef0]">
      <header className="border-b-3 border-[#1a1a1a] bg-[#FFCC00]" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.04) 8px, rgba(0,0,0,0.04) 16px), repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(0,0,0,0.04) 8px, rgba(0,0,0,0.04) 16px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
          <Link href="/" className="text-lg sm:text-xl font-black text-[#1a1a1a] uppercase tracking-tight">TRADING TAZOS GAME</Link>
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link href="/tazos" className="text-[10px] sm:text-xs font-black text-[#1a1a1a]/70 hover:text-[#1a1a1a] uppercase tracking-wider transition-colors">Tazos</Link>
            <Link href="/?page=how-to-play" className="text-[10px] sm:text-xs font-black text-[#1a1a1a]/70 hover:text-[#1a1a1a] uppercase tracking-wider transition-colors">How to Play</Link>
            <Link href="/login" className="text-[10px] sm:text-xs font-black text-[#1a1a1a] bg-white px-3 py-1.5 border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all uppercase tracking-wider">Sign In</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10 sm:space-y-14">
        <section className="text-center space-y-3">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#1a1a1a] uppercase tracking-tight">Bag Shop</h1>
          <p className="text-sm sm:text-base text-[#1a1a1a]/60 max-w-lg mx-auto font-bold">Open bags to discover and collect tazos across 3 franchises. <span className="text-[#1a1a1a]/40">30 of 349 tazos released — more coming soon!</span></p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFCC00]/10 border border-[#FFCC00]/30"><Coins className="w-3.5 h-3.5 text-[#D97706]" /><span className="text-[10px] font-black text-[#1a1a1a] uppercase">10 credits per bag</span></div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#22C55E]/10 border border-[#22C55E]/30"><Sparkles className="w-3.5 h-3.5 text-[#22C55E]" /><span className="text-[10px] font-black text-[#1a1a1a] uppercase">Free to play</span></div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4 sm:gap-6">
          {BAGS.map(bag => {
            const Icon = bag.icon; const ex = byF[bag.franchise] || []
            return <div key={bag.type} className="border-3 border-[#1a1a1a] bg-white overflow-hidden" style={{ boxShadow: `4px 4px 0px ${bag.border}40` }}>
              <div className="px-4 sm:px-5 py-4 border-b-2 border-[#1a1a1a]/10" style={{ backgroundColor: bag.bg }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-[#1a1a1a] flex-shrink-0" style={{ backgroundColor: bag.color }}><Icon className="w-4 h-4 text-white" /></div>
                    <div><h2 className="text-sm sm:text-base font-black text-[#1a1a1a] uppercase leading-tight">{bag.name}</h2><p className="text-[9px] sm:text-[10px] font-bold text-[#1a1a1a]/50">{bag.tagline}</p></div>
                  </div>
                  <div className="flex items-center gap-0.5 bg-white px-2 py-1 border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"><Coins className="w-3 h-3 text-[#D97706]" /><span className="text-xs font-black text-[#1a1a1a]">{bag.cost}</span></div>
                </div>
                <p className="text-[10px] sm:text-xs text-[#1a1a1a]/60 font-bold leading-relaxed">{bag.desc}</p>
                <div className="mt-3 space-y-1.5">
                  <div className="flex h-2 rounded-full overflow-hidden border border-[#1a1a1a]/10">{bag.rarity.map(r => <div key={r.l} className="h-full" style={{ width: `${r.p}%`, backgroundColor: RC[r.l] }} title={`${r.l}: ${r.p}%`} />)}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">{bag.rarity.map(r => <div key={r.l} className="flex items-center gap-1"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: RC[r.l] }} /><span className="text-[8px] font-bold text-[#1a1a1a]/50 uppercase">{r.l}</span><span className="text-[8px] font-black text-[#1a1a1a]">{r.p}%</span></div>)}</div>
                </div>
                <div className="flex gap-3 mt-3">
                  <div className="flex items-center gap-1"><span className="text-[8px] font-black text-[#1a1a1a]/40 uppercase">Bonus</span><span className="text-[10px] font-black" style={{ color: bag.color }}>{bag.bonusChance}%</span></div>
                  <div className="flex items-center gap-1"><span className="text-[8px] font-black text-[#1a1a1a]/40 uppercase">Rare Boost</span><span className="text-[10px] font-black" style={{ color: bag.color }}>×{bag.rareBoost}</span></div>
                </div>
              </div>
              <div className="px-4 sm:px-5 py-3 space-y-2">
                <div className="flex items-center gap-2"><span className="text-[8px] font-black text-[#1a1a1a]/30 uppercase">Franchise</span><span className="text-[10px] font-black uppercase px-2 py-0.5 border border-[#1a1a1a]/20" style={{ backgroundColor: bag.bg, color: bag.border }}>{bag.franchiseName}</span></div>
                {ex.length > 0 && <div><span className="text-[8px] font-black text-[#1a1a1a]/25 uppercase">Example tazos</span>
                  <div className="flex gap-1.5 mt-1">
                    {ex.map((t: any) => <div key={t.id} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#1a1a1a]/15 overflow-hidden bg-[#1a1a1a]/5 flex-shrink-0 hover:border-[#FFCC00] hover:scale-110 transition-all" title={t.displayName||t.name}><div className="w-full h-full rounded-full overflow-hidden relative"><img src={t.imageUrl||`/tazos-generated/${t.franchiseSlug||"minimon"}/${t.slug}.png`} alt={t.displayName||t.name} className="w-full h-full object-cover" loading="lazy" /></div></div>)}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-dashed border-[#1a1a1a]/10 flex items-center justify-center flex-shrink-0"><span className="text-[7px] font-black text-[#1a1a1a]/25">+more</span></div>
                  </div></div>}
              </div>
            </div>
          })}
        </section>

        <section className="border-3 border-[#1a1a1a] bg-white p-6 sm:p-8 text-center space-y-4 relative overflow-hidden" style={{ boxShadow: "6px 6px 0px #FFCC0040" }}>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(45deg, #1a1a1a 0px, #1a1a1a 2px, transparent 2px, transparent 12px)" }} />
          <div className="relative z-10 space-y-3">
            <h2 className="text-lg sm:text-2xl font-black text-[#1a1a1a] uppercase tracking-tight">Ready to Start Collecting?</h2>
            <p className="text-sm text-[#1a1a1a]/50 font-bold max-w-md mx-auto">Sign up free and get starter credits to open your first bags. Collect, trade, and battle with 30 tazos across 3 franchises.</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link href="/register" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 text-xs sm:text-sm font-black uppercase tracking-wider bg-[#E3350D] text-white border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all">Sign Up Free <ArrowRight className="w-4 h-4" /></Link>
              <Link href="/login" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 text-xs sm:text-sm font-black uppercase tracking-wider bg-white text-[#1a1a1a] border-3 border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all">Sign In</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-3 border-[#1a1a1a] bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/tazos" className="text-[10px] font-bold text-white/40 hover:text-white/70 uppercase tracking-wider transition-colors">Tazos</Link>
            <Link href="/?page=how-to-play" className="text-[10px] font-bold text-white/40 hover:text-white/70 uppercase tracking-wider transition-colors">Battle</Link>
            <Link href="/faq" className="text-[10px] font-bold text-white/40 hover:text-white/70 uppercase tracking-wider transition-colors">FAQ</Link>
            <Link href="/privacy" className="text-[10px] font-bold text-white/40 hover:text-white/70 uppercase tracking-wider transition-colors">Privacy</Link>
          </div>
          <span className="text-[8px] font-bold text-white/15 uppercase tracking-[0.2em]">© 2026 Trading Tazos Game · v0.5.0</span>
        </div>
      </footer>
    </div>
  )
}
