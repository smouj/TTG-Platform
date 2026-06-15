import { ServerPageContent } from "@/components/game/server-page-content"
import type { Metadata } from "next"
import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"
import { FRANCHISE_BY_SLUG } from "@/lib/franchise-config"
import { TazoCollectionShowcase } from "../_tazo-showcase"

export const metadata: Metadata = {
  title: "Dracobell Collection — Original Series | Trading Tazos Game",
  description: "Discover the Dracobell tazo collection — martial arts warriors from the world of Bellora across 6 unique categories. 50 tazos with rare Holo 3D variants.",
  openGraph: { title: "Dracobell Collection — Legendary Warriors | Trading Tazos Game", description: "50 Dracobell tazos across 6 categories. Clans, tournaments, dragon energy, and legendary Bell Shards." },
}

const dracobell = FRANCHISE_BY_SLUG.dracobell

const regions = [
  { name: "Ember Valley", clan: "Ember Fist", style: "Fire, direct attack" },
  { name: "Storm Peaks", clan: "Storm Fang", style: "Lightning, speed" },
  { name: "Iron Plateau", clan: "Iron Horn", style: "Defense, endurance" },
  { name: "Frost Temple", clan: "Frost Scale", style: "Control, precision" },
  { name: "Shadow Basin", clan: "Shadow Claw", style: "Counterattack, stealth" },
  { name: "Golden Shrine", clan: "Golden Roar", style: "Aura, mastery" },
  { name: "Dragon Crater", clan: "Dragon Bell", style: "Ancestral power" },
]

const bellShards = [
  { name: "Flame Shard", power: "Offensive strength" },
  { name: "Storm Shard", power: "Speed" },
  { name: "Iron Shard", power: "Endurance" },
  { name: "Frost Shard", power: "Control" },
  { name: "Shadow Shard", power: "Technique" },
  { name: "Gold Shard", power: "Superior aura" },
  { name: "Dragon Shard", power: "Legendary transformation" },
]

const ascensionPhases = [
  { name: "Base Fighter", desc: "The warrior's normal form" },
  { name: "Aura Release", desc: "First release of inner energy" },
  { name: "Clan Ascension", desc: "Form bonded to the clan and its technique" },
  { name: "Champion Ascension", desc: "High-tournament form" },
  { name: "Dragon Bell", desc: "Legendary form linked to the bell" },
]

const bellArts = [
  { name: "Dragon Breaker", desc: "Frontal strike wrapped in draconic aura" },
  { name: "Ember Rush", desc: "Swift fire attack" },
  { name: "Storm Spiral", desc: "Electric spinning kick" },
  { name: "Iron Shell", desc: "Full-body absolute defense" },
  { name: "Frost Lock", desc: "Technique that slows the opponent" },
  { name: "Shadow Reversal", desc: "Counter from the blind spot" },
  { name: "Golden Roar", desc: "Champion aura explosion" },
]

const auraTypes = [
  { name: "Red Aura", trait: "Fury, fire, attack" },
  { name: "Blue Aura", trait: "Control, calm, precision" },
  { name: "Gold Aura", trait: "Mastery, superior power" },
  { name: "Black Aura", trait: "Shadow, dangerous technique" },
  { name: "White Aura", trait: "Purity, defense, focus" },
  { name: "Dragon Aura", trait: "Legendary form" },
]

const FRANCHISE_COLOR = "#FF6B00"

export default function DracobellCollectionPage() {
  return (
    <PublicPageShell>
      {/* ── Hero ── */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-6 border-3 border-[#1a1a1a]" style={{ backgroundColor: FRANCHISE_COLOR }} />
          <span className="text-sm font-black uppercase text-[#1a1a1a]/50">Series</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-1">Dracobell</h1>
        <p className="text-lg font-bold text-[#1a1a1a]/40 mb-6">
          A martial action world about clans, tournaments, aura, transformations, dragon power, and legendary fragments.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-5xl font-black text-[#1a1a1a]">{dracobell.count}</span>
          <span className="text-lg font-bold text-[#1a1a1a]/40">of {dracobell.total} tazos</span>
          <span className="text-xs font-bold bg-[#FFCC00] px-2 py-1 border-2 border-[#1a1a1a]">TazoForge 2026</span>
        </div>

        {/* ── Series Banner ── */}
        <div className="border-3 border-[#1a1a1a] bg-gradient-to-br from-orange-100 to-red-100 p-6 sm:p-8 mb-8 shadow-[6px_6px_0px_#1a1a1a] overflow-hidden relative">
          {/* Background wallpaper from series back art */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
            <img src="/logo/series-dracobell.png" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 border-3 border-[#1a1a1a] bg-white rounded-full shadow-[4px_4px_0px_#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/logo/series-dracobell.png" alt="Dracobell Series Logo" className="w-full h-full object-contain p-2" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase text-[#1a1a1a] tracking-wider">Clan Crest</h2>
              <p className="text-xs font-bold text-[#1a1a1a]/50 mt-1 leading-relaxed max-w-md">The insignia carried by warriors of Bellora — forged from meteorite metal and dragon scales, bearing the mark of the shattered Dracobell.</p>
              <div className="flex gap-2 mt-3">
                {["#FF6B00","#E3350D","#FFCC00","#1a1a1a","#7B2D8E"].map(c => (
                  <div key={c} className="w-5 h-5 border-2 border-[#1a1a1a] rounded-full" style={{backgroundColor:c}} title="Clan color" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Featured Tazos ── */}
        <TazoCollectionShowcase franchise="dracobell" color={FRANCHISE_COLOR} />

        {/* ── World ── */}
        <div className="border-3 border-[#1a1a1a] bg-[#1a0a00] p-6 sm:p-8 mb-8 shadow-[6px_6px_0px_#1a1a1a]">
          <h2 className="text-lg font-black uppercase tracking-wider mb-3" style={{ color: FRANCHISE_COLOR }}>The World of Bellora</h2>
          <p className="text-sm font-bold text-white/70 leading-relaxed mb-4">
            Bellora is a world of combat regions governed by clans. Each clan protects 
            a technique, a philosophy, and a fragment of an ancient sonic relic — the{" "}
            <strong className="text-white">Dracobell</strong>.
          </p>
          <p className="text-sm font-bold text-white/70 leading-relaxed">
            The Dracobell is a legendary bell forged from meteorite metal and ancient dragon 
            scales. According to legend, when the complete bell rings, it can awaken the 
            true potential of any warrior. But the bell was shattered during a war between 
            clans. Its fragments — the{" "}
            <strong style={{ color: FRANCHISE_COLOR }}>Bell Shards</strong> — are now 
            scattered across Bellora, each containing a piece of the original power.
          </p>
        </div>

        {/* ── Regions ── */}
        <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-4">Clans of Bellora</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {regions.map((r) => (
            <div key={r.name} className="border-2 border-[#1a1a1a] bg-white p-4 shadow-[3px_3px_0px_#1a1a1a]">
              <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-1">{r.name}</h3>
              <p className="text-xs font-bold" style={{ color: FRANCHISE_COLOR }}>{r.clan}</p>
              <p className="text-xs font-bold text-[#1a1a1a]/50 mt-1">{r.style}</p>
            </div>
          ))}
        </div>

        {/* ── Bell Shards ── */}
        <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-4">The Bell Shards</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
          {bellShards.map((s) => (
            <div key={s.name} className="border-2 border-[#1a1a1a] bg-white p-3 text-center shadow-[2px_2px_0px_#1a1a1a]">
              <div className="text-xs font-black uppercase text-[#1a1a1a] mb-1">{s.name}</div>
              <div className="text-[10px] font-bold text-[#1a1a1a]/50">{s.power}</div>
            </div>
          ))}
        </div>

        {/* ── Roar Aura ── */}
        <div className="border-3 border-[#1a1a1a] bg-[#fafafa] p-6 sm:p-8 mb-8 shadow-[6px_6px_0px_#1a1a1a]" style={{ borderLeft: `6px solid ${FRANCHISE_COLOR}` }}>
          <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-3">Roar Aura</h2>
          <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed mb-4">
            The energy of Dracobell is called <strong className="text-[#1a1a1a]">Roar Aura</strong>. 
            It is not common magic — it is an inner force born from discipline, will, and 
            fighting spirit. Each warrior manifests their Roar Aura differently.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {auraTypes.map((a) => (
              <div key={a.name} className="border border-[#1a1a1a]/20 bg-white p-2 text-center">
                <div className="text-xs font-black uppercase text-[#1a1a1a]">{a.name}</div>
                <div className="text-[10px] font-bold text-[#1a1a1a]/50 mt-0.5">{a.trait}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Ascensions ── */}
        <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-4">Transformation: Ascension</h2>
        <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed mb-4">
          An <strong className="text-[#1a1a1a]">Ascension</strong> occurs when a fighter 
          surpasses their physical and spiritual limits. It is the Dracobell equivalent of 
          evolution — not a biological change, but a martial breakthrough.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
          {ascensionPhases.map((phase, i) => (
            <div key={phase.name} className="border-2 border-[#1a1a1a] bg-white p-3 text-center shadow-[2px_2px_0px_#1a1a1a]">
              <div className="text-xs font-black uppercase text-[#1a1a1a]/30 mb-1">Phase {i + 1}</div>
              <div className="text-xs font-black uppercase text-[#1a1a1a] mb-1">{phase.name}</div>
              <div className="text-[10px] font-bold text-[#1a1a1a]/50 leading-tight">{phase.desc}</div>
            </div>
          ))}
        </div>

        {/* ── Bell Arts ── */}
        <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-4">Bell Arts</h2>
        <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed mb-4">
          Each warrior possesses a signature technique called a{" "}
          <strong className="text-[#1a1a1a]">Bell Art</strong>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
          {bellArts.map((art) => (
            <div key={art.name} className="border-2 border-[#1a1a1a] bg-white p-3 shadow-[2px_2px_0px_#1a1a1a] flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#1a1a1a]">{art.name}</span>
              <span className="text-[10px] font-bold text-[#1a1a1a]/50">{art.desc}</span>
            </div>
          ))}
        </div>

        {/* ── Tournament ── */}
        <div className="border-3 border-[#1a1a1a] bg-[#fafafa] p-6 sm:p-8 mb-8 shadow-[6px_6px_0px_#1a1a1a]" style={{ borderLeft: `6px solid ${FRANCHISE_COLOR}` }}>
          <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-3">The Grand Bell Tournament</h2>
          <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed mb-3">
            The main event of Bellora is the <strong className="text-[#1a1a1a]">Grand Bell Tournament</strong>. 
            It is not just a sporting event — it is a test of lineage, honor, and power. 
            Champions from each clan face each other to win Bell Shards. Whoever gathers 
            enough fragments can ring the incomplete Dracobell and awaken a higher Ascension.
          </p>
        </div>

        {/* ── Threat ── */}
        <div className="border-3 border-[#1a1a1a] bg-[#1a1a1a] p-6 sm:p-8 mb-8 shadow-[6px_6px_0px_#1a1a1a] text-white">
          <h2 className="text-lg font-black uppercase tracking-wider mb-3" style={{ color: FRANCHISE_COLOR }}>The Silent Clan</h2>
          <p className="text-sm font-bold text-white/70 leading-relaxed mb-3">
            The Silent Clan believes the Dracobell must not be restored. To them, the bell&apos;s 
            sound only brings wars, rivalry, and destruction. Their goal is to gather the 
            Bell Shards — not to use the bell, but to silence it forever.
          </p>
          <p className="text-sm font-bold text-white/70 leading-relaxed">
            This creates a richer conflict: the heroes believe the bell can unite Bellora, 
            while The Silent Clan believes it will only bring another war. Both sides have 
            reasons. The tournament decides the future of the world.
          </p>
        </div>

        {/* ── CTA ── */}
        <div className="text-center mb-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#1a1a1a]/30 mb-4">Official Motto</p>
          <p className="text-xl sm:text-2xl font-black uppercase text-[#1a1a1a] mb-6">
            Train hard. Ring loud. Rise beyond.
          </p>
          <Link
            href="/tazos?collection=dracobell"
            className="mag-btn inline-block bg-[#E3350D] text-white border-2 border-[#1a1a1a] px-8 py-4 text-sm font-black uppercase tracking-wider shadow-[6px_6px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1a1a1a] transition-all"
          >
            Browse All {dracobell.count} Dracobell Tazos
          </Link>
        </div>

        {/* ── Footer note ── */}
        <p className="text-xs font-bold text-zinc-400 text-center">
          Dracobell is an action-fighting saga set in Bellora, a world of clans, tournaments, 
          dragon energy, and legendary Bell Shards. Warriors train to awaken their Roar Aura, 
          master unique Bell Arts, and ascend beyond their limits. When the Dracobell rings, 
          only true champions rise.
        </p>
      </div>
            {/* ── SEO: Server-rendered content for search crawlers ── */}
        <ServerPageContent page="collections-dracobell" />
    </PublicPageShell>
  )
}
