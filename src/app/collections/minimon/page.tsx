import { ServerPageContent } from "@/components/game/server-page-content"
import type { Metadata } from "next"
import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"
import { FRANCHISE_BY_SLUG } from "@/lib/franchise-config"
import { TazoCollectionShowcase } from "../_tazo-showcase"

export const metadata: Metadata = {
  title: "Minimon Collection — Original Series | Trading Tazos Game",
  description: "Explore the Minimon tazo collection — creature companions from Luminara, a world of elemental energy and natural evolution. 50 tazos with balanced combat stats.",
  openGraph: { title: "Minimon Collection — Creature Companions | Trading Tazos Game", description: "50 Minimon tazos from the world of Luminara. Classic creature designs with balanced combat stats." },
}

const minimon = FRANCHISE_BY_SLUG.minimon

const regions = [
  { name: "Sunnyvale Fields", style: "Rolling fields, farms, and small villages", types: "Normal, solar, plant" },
  { name: "Mossdeep Woods", style: "Ancient forests with deep roots", types: "Plant, insect, earth, mystic" },
  { name: "Bluefin Coast", style: "Beaches, reefs, and distant lighthouses", types: "Water, wind, soft ice" },
  { name: "Cinderpop Hills", style: "Warm hills & volcanic caves", types: "Fire, rock, metal" },
  { name: "Stormtail Ridge", style: "Storm-swept mountain peaks", types: "Electric, flying, lesser dragon" },
  { name: "Moonberry Hollow", style: "A strange nocturnal zone", types: "Shadow, dream, illusion" },
  { name: "Aurora Summit", style: "Legendary endgame region", types: "Rare forms and guardians" },
]

const bloomPhases = [
  { name: "Tiny Form", desc: "Small, tender, and fragile" },
  { name: "Trail Form", desc: "Adventurous — more defined abilities" },
  { name: "Guardian Form", desc: "Strong, protective, and mature" },
  { name: "Mythic Bloom", desc: "Legendary, rare, nearly one-of-a-kind" },
]

const FRANCHISE_COLOR = "#FFCB05"

export default function MinimonCollectionPage() {
  return (
    <PublicPageShell>
      {/* ── Hero ── */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-6 border-3 border-[#1a1a1a]" style={{ backgroundColor: FRANCHISE_COLOR }} />
          <span className="text-sm font-black uppercase text-[#1a1a1a]/50">Series</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-1">Minimon</h1>
        <p className="text-lg font-bold text-[#1a1a1a]/40 mb-6">
          A creature adventure world about exploration, friendship, elemental habitats, and natural evolution.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-5xl font-black text-[#1a1a1a]">{minimon.count}</span>
          <span className="text-lg font-bold text-[#1a1a1a]/40">of {minimon.total} tazos</span>
          <span className="text-xs font-bold bg-[#FFCC00] px-2 py-1 border-2 border-[#1a1a1a]">TazoForge 2026</span>
        </div>

        {/* ── Series Banner ── */}
        <div className="border-3 border-[#1a1a1a] bg-gradient-to-br from-yellow-50 to-amber-100 p-6 sm:p-8 mb-8 shadow-[6px_6px_0px_#1a1a1a] overflow-hidden relative">
          {/* Background wallpaper from series back art */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
            <img src="/logo/series-minimon.png" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 border-3 border-[#1a1a1a] bg-white rounded-full shadow-[4px_4px_0px_#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/logo/series-minimon.png" alt="Minimon Series Logo" className="w-full h-full object-contain p-2" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase text-[#1a1a1a] tracking-wider">Official Seal</h2>
              <p className="text-xs font-bold text-[#1a1a1a]/50 mt-1 leading-relaxed max-w-md">Official Pathfinder seal — bearing the mark of Luminara, the land where Life Sparks awaken and Minimon are born.</p>
              <div className="flex gap-2 mt-3">
                {["#FFCC00","#FF8C00","#4CAF50","#E3350D","#3B82F6"].map(c => (
                  <div key={c} className="w-5 h-5 border-2 border-[#1a1a1a] rounded-full" style={{backgroundColor:c}} title="Region color" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Featured Tazos ── */}
        <TazoCollectionShowcase franchise="minimon" color={FRANCHISE_COLOR} />

        {/* ── World ── */}
        <div className="border-3 border-[#1a1a1a] bg-[#fafafa] p-6 sm:p-8 mb-8 shadow-[6px_6px_0px_#1a1a1a]">
          <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-3">The World of Luminara</h2>
          <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed mb-4">
            Luminara is a luminous land of colorful regions, winding paths, small villages, 
            natural laboratories, and places where elemental energy takes shape. It is not a medieval 
            or futuristic world — it is a world of adventure, discovery, and wonder.
          </p>
          <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed">
            Centuries ago, Luminara was filled with an invisible energy called{" "}
            <strong className="text-[#1a1a1a]">Life Spark</strong>. This energy flowed 
            through the trees, rivers, caves, clouds, and mountains. When Life Spark accumulated 
            in one place for a long time, a Minimon was born. That is why each creature is 
            connected to its environment.
          </p>
        </div>

        {/* ── Regions ── */}
        <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-4">Regions of Luminara</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {regions.map((r) => (
            <div key={r.name} className="border-2 border-[#1a1a1a] bg-white p-4 shadow-[3px_3px_0px_#1a1a1a]">
              <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-1">{r.name}</h3>
              <p className="text-xs font-bold text-[#1a1a1a]/50">{r.style}</p>
              <p className="text-xs font-bold mt-1" style={{ color: FRANCHISE_COLOR }}>
                {r.types}
              </p>
            </div>
          ))}
        </div>

        {/* ── Pathfinders ── */}
        <div className="border-3 border-[#1a1a1a] bg-[#fafafa] p-6 sm:p-8 mb-8 shadow-[6px_6px_0px_#1a1a1a]" style={{ borderLeft: `6px solid ${FRANCHISE_COLOR}` }}>
          <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-3">Pathfinders &amp; Bond Marks</h2>
          <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed mb-3">
            In Luminara exist people called <strong className="text-[#1a1a1a]">Pathfinders</strong>. 
            They are not military trainers. They are explorers, caretakers, and travelers who study 
            Minimon, accompany them, and document their forms.
          </p>
          <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed mb-3">
            A Pathfinder does not &ldquo;own&rdquo; a Minimon. They create a{" "}
            <strong className="text-[#1a1a1a]">Bond Mark</strong>, a mark of trust that 
            allows both to travel together.
          </p>
          <blockquote className="text-sm font-bold italic text-[#1a1a1a]/70 border-l-4 pl-4 py-1" style={{ borderLeftColor: FRANCHISE_COLOR }}>
            &ldquo;A Minimon does not obey out of obligation. It follows you because it trusts you.&rdquo;
          </blockquote>
        </div>

        {/* ── Blooming ── */}
        <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-4">Evolution: Blooming</h2>
        <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed mb-4">
          Evolution in Minimon is called <strong className="text-[#1a1a1a]">Blooming</strong>. 
          A Minimon evolves when its Life Spark matures — through bonding with its Pathfinder, 
          overcoming challenges, protecting another Minimon, entering an elemental zone, 
          reaching experience thresholds, or awakening a strong emotion.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
          {bloomPhases.map((phase, i) => (
            <div key={phase.name} className="border-2 border-[#1a1a1a] bg-white p-3 text-center shadow-[2px_2px_0px_#1a1a1a]">
              <div className="text-xs font-black uppercase text-[#1a1a1a]/30 mb-1">Phase {i + 1}</div>
              <div className="text-xs font-black uppercase text-[#1a1a1a] mb-1">{phase.name}</div>
              <div className="text-[10px] font-bold text-[#1a1a1a]/50 leading-tight">{phase.desc}</div>
            </div>
          ))}
        </div>

        {/* ── Threat ── */}
        <div className="border-3 border-[#1a1a1a] bg-[#1a1a1a] p-6 sm:p-8 mb-8 shadow-[6px_6px_0px_#1a1a1a] text-white">
          <h2 className="text-lg font-black uppercase tracking-wider mb-3" style={{ color: FRANCHISE_COLOR }}>The Stillness</h2>
          <p className="text-sm font-bold text-white/70 leading-relaxed mb-3">
            The Stillness is a force that stops evolution. It does not destroy directly, 
            but freezes the natural growth of Minimon. Affected creatures lose color, 
            personality, and the ability to change. They become{" "}
            <strong className="text-white">Faded Minimon</strong>.
          </p>
          <p className="text-sm font-bold text-white/70 leading-relaxed">
            A Pathfinder&apos;s goal is not to destroy them — it is to restore their Life Spark.
          </p>
        </div>

        {/* ── Call to Action ── */}
        <div className="text-center mb-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#1a1a1a]/30 mb-4">Official Motto</p>
          <p className="text-xl sm:text-2xl font-black uppercase text-[#1a1a1a] mb-6">
            Find them. Bond with them. Watch them bloom.
          </p>
          <Link
            href="/tazos?collection=minimon"
            className="mag-btn inline-block bg-[#E3350D] text-white border-2 border-[#1a1a1a] px-8 py-4 text-sm font-black uppercase tracking-wider shadow-[6px_6px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1a1a1a] transition-all"
          >
            Browse All {minimon.count} Minimon Tazos
          </Link>
        </div>

        {/* ── Footer note ── */}
        <p className="text-xs font-bold text-zinc-400 text-center">
          Minimon are small creatures born from the Life Spark, a natural energy that flows through 
          the regions of Luminara. Pathfinders travel with them, form bonds, discover new species, 
          and help each Minimon unlock its next Bloom. Every journey begins with one tiny companion 
          — and a world full of forms waiting to be found.
        </p>
      </div>
            {/* ── SEO: Server-rendered content for search crawlers ── */}
        <ServerPageContent page="collections-minimon" />
    </PublicPageShell>
  )
}
