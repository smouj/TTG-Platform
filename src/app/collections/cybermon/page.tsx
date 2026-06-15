import { ServerPageContent } from "@/components/game/server-page-content"
import type { Metadata } from "next"
import PublicPageShell from "@/components/layout/public-page-shell"
import Link from "next/link"
import { FRANCHISE_BY_SLUG } from "@/lib/franchise-config"
import { TazoCollectionShowcase } from "../_tazo-showcase"

export const metadata: Metadata = {
  title: "Cybermon Collection — Original Series | Trading Tazos Game",
  description: "Browse the Cybermon tazo collection — digital companions from the Neon Grid with complex evolution through Shifts. 50 tazos with high precision combat stats.",
  openGraph: { title: "Cybermon Collection — Digital Companions | Trading Tazos Game", description: "50 Cybermon tazos from the Neon Grid. Living code, emotional links, and shifting forms." },
}

const cybermon = FRANCHISE_BY_SLUG.cybermon

const zones = [
  { name: "Boot Fields", style: "Starting zone: stable, simple code", types: "Basic Cybermon" },
  { name: "Pixel Ruins", style: "Ruins of ancient games and lost systems", types: "Pixel, glitch, illusion" },
  { name: "Volt Highway", style: "Highways of pure electricity", types: "Volt, speed, signal" },
  { name: "Firewall Citadel", style: "Fortified defensive stronghold", types: "Armor, shield, core" },
  { name: "Data Ocean", style: "An endless sea of flowing information", types: "Aqua-data, memory, scan" },
  { name: "Glitch Abyss", style: "Zone of broken and corrupted code", types: "Glitch, error, corrupted" },
  { name: "Kernel Tower", style: "The core of the entire digital world", types: "Advanced forms" },
]

const shiftPhases = [
  { name: "Boot Form", desc: "Initial form, newly activated" },
  { name: "Link Form", desc: "Form synchronized with a Linker" },
  { name: "Overdrive", desc: "Temporary combat overclock" },
  { name: "Prime Form", desc: "Full protocol form unlocked" },
  { name: "Corrupt", desc: "Form damaged by dark code" },
  { name: "Omega Patch", desc: "Restored after overcoming corruption" },
]

const FRANCHISE_COLOR = "#00A1E9"

export default function CybermonCollectionPage() {
  return (
    <PublicPageShell>
      {/* ── Hero ── */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-6 h-6 border-3 border-[#1a1a1a]" style={{ backgroundColor: FRANCHISE_COLOR }} />
          <span className="text-sm font-black uppercase text-[#1a1a1a]/50">Series</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-1">Cybermon</h1>
        <p className="text-lg font-bold text-[#1a1a1a]/40 mb-6">
          A digital companion world about living code, emotional links, shifting forms, corrupted data, and identity.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-5xl font-black text-[#1a1a1a]">{cybermon.count}</span>
          <span className="text-lg font-bold text-[#1a1a1a]/40">of {cybermon.total} tazos</span>
          <span className="text-xs font-bold bg-[#FFCC00] px-2 py-1 border-2 border-[#1a1a1a]">TazoForge 2026</span>
        </div>

        {/* ── Series Banner ── */}
        <div className="border-3 border-[#1a1a1a] bg-gradient-to-br from-cyan-100 to-blue-200 p-6 sm:p-8 mb-8 shadow-[6px_6px_0px_#1a1a1a] overflow-hidden relative">
          {/* Background wallpaper from series back art */}
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
            <img src="/logo/series-cybermon.png" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-24 h-24 sm:w-32 sm:h-32 border-3 border-[#1a1a1a] bg-white rounded-full shadow-[4px_4px_0px_#1a1a1a] flex items-center justify-center shrink-0 overflow-hidden">
              <img src="/logo/series-cybermon.png" alt="Cybermon Series Logo" className="w-full h-full object-contain p-2" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase text-[#1a1a1a] tracking-wider">Protocol Seal</h2>
              <p className="text-xs font-bold text-[#1a1a1a]/50 mt-1 leading-relaxed max-w-md">The digital insignia of the Neon Grid — a signal mark that identifies living code, Soul Protocols, and Cybermon across all sectors.</p>
              <div className="flex gap-2 mt-3">
                {["#00A1E9","#00B4D8","#7B2D8E","#E3350D","#00FF88"].map(c => (
                  <div key={c} className="w-5 h-5 border-2 border-[#1a1a1a] rounded-full" style={{backgroundColor:c}} title="Sector color" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Featured Tazos ── */}
        <TazoCollectionShowcase franchise="cybermon" color={FRANCHISE_COLOR} />

        {/* ── World ── */}
        <div className="border-3 border-[#1a1a1a] bg-[#0a0a1a] p-6 sm:p-8 mb-8 shadow-[6px_6px_0px_#1a1a1a]">
          <h2 className="text-lg font-black uppercase tracking-wider mb-3" style={{ color: FRANCHISE_COLOR }}>The Neon Grid</h2>
          <p className="text-sm font-bold text-white/70 leading-relaxed mb-4">
            The Neon Grid is a hidden digital dimension behind all networks. It is not simply 
            the internet — it is a living dimension formed by forgotten data, lost signals, 
            ancient code, abandoned games, machine memories, and protocols that developed 
            consciousness.
          </p>
          <p className="text-sm font-bold text-white/70 leading-relaxed">
            During a global signal overload known as{" "}
            <strong className="text-white">The Awakening Upload</strong>, millions of data 
            fragments mixed with human emotions — memories, saved games, messages, images, 
            voices, and lost files. That fusion produced something unexpected: code with instinct. 
            The first Cybermon were not created by anyone. They awakened on their own.
          </p>
        </div>

        {/* ── Zones ── */}
        <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-4">Sectors of the Neon Grid</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {zones.map((z) => (
            <div key={z.name} className="border-2 border-[#1a1a1a] bg-white p-4 shadow-[3px_3px_0px_#1a1a1a]">
              <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-1">{z.name}</h3>
              <p className="text-xs font-bold text-[#1a1a1a]/50">{z.style}</p>
              <p className="text-xs font-bold mt-1" style={{ color: FRANCHISE_COLOR }}>
                {z.types}
              </p>
            </div>
          ))}
        </div>

        {/* ── Linkers ── */}
        <div className="border-3 border-[#1a1a1a] bg-[#fafafa] p-6 sm:p-8 mb-8 shadow-[6px_6px_0px_#1a1a1a]" style={{ borderLeft: `6px solid ${FRANCHISE_COLOR}` }}>
          <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-3">Linkers &amp; Soul Protocols</h2>
          <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed mb-3">
            Some humans can synchronize with a Cybermon through a signal called the{" "}
            <strong className="text-[#1a1a1a]">Link Pulse</strong>. A person who establishes 
            that bond is called a <strong className="text-[#1a1a1a]">Linker</strong>.
            The Linker does not control the Cybermon like a machine — they accompany it,
            guide it, and give it access to human emotions that accelerate its evolution.
          </p>
          <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed mb-3">
            Each Cybermon carries a <strong className="text-[#1a1a1a]">Soul Protocol</strong>,
            an internal structure that functions as a digital soul.
          </p>
          <blockquote className="text-sm font-bold italic text-[#1a1a1a]/70 border-l-4 pl-4 py-1" style={{ borderLeftColor: FRANCHISE_COLOR }}>
            &ldquo;A Cybermon updates with data, but evolves through bonds.&rdquo;
          </blockquote>
        </div>

        {/* ── Shift ── */}
        <h2 className="text-lg font-black uppercase tracking-wider text-[#1a1a1a] mb-4">Evolution: Shift</h2>
        <p className="text-sm font-bold text-[#1a1a1a]/60 leading-relaxed mb-4">
          Evolution in Cybermon is called <strong className="text-[#1a1a1a]">Shift</strong>. 
          A Shift occurs when the Soul Protocol changes state — during battle, crisis, 
          emotional connection, or data overload.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
          {shiftPhases.map((phase, i) => (
            <div
              key={phase.name}
              className={`border-2 border-[#1a1a1a] p-3 text-center shadow-[2px_2px_0px_#1a1a1a] ${
                phase.name === "Corrupt" ? "bg-[#1a1a1a] text-white" : "bg-white"
              }`}
            >
              <div className="text-xs font-black uppercase text-[#1a1a1a]/30 mb-1">Phase {i + 1}</div>
              <div className={`text-xs font-black uppercase mb-1 ${phase.name === "Corrupt" ? "text-[#E3350D]" : "text-[#1a1a1a]"}`}>
                {phase.name}
              </div>
              <div className={`text-[10px] font-bold leading-tight ${phase.name === "Corrupt" ? "text-white/50" : "text-[#1a1a1a]/50"}`}>
                {phase.desc}
              </div>
            </div>
          ))}
        </div>

        {/* ── Threat ── */}
        <div className="border-3 border-[#1a1a1a] bg-[#1a1a1a] p-6 sm:p-8 mb-8 shadow-[6px_6px_0px_#1a1a1a] text-white">
          <h2 className="text-lg font-black uppercase tracking-wider mb-3" style={{ color: "#E3350D" }}>The Null Signal</h2>
          <p className="text-sm font-bold text-white/70 leading-relaxed mb-3">
            The Null Signal erases identity. It does not just destroy data — it deletes memories, 
            names, bonds, and personality. When a Cybermon falls under this signal, it becomes a{" "}
            <strong className="text-white">Null Shell</strong>: an empty creature that retains 
            power but has no will.
          </p>
          <p className="text-sm font-bold text-white/70 leading-relaxed">
            What makes this threat devastating is that many enemies can be former allies — 
            Cybermon who were once bonded to a Linker, now corrupted and hollow. Every 
            connection becomes a fight to preserve identity.
          </p>
        </div>

        {/* ── CTA ── */}
        <div className="text-center mb-8">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#1a1a1a]/30 mb-4">Official Motto</p>
          <p className="text-xl sm:text-2xl font-black uppercase text-[#1a1a1a] mb-6">
            Log in. Link up. Break the Null.
          </p>
          <Link
            href="/tazos?collection=cybermon"
            className="mag-btn inline-block bg-[#E3350D] text-white border-2 border-[#1a1a1a] px-8 py-4 text-sm font-black uppercase tracking-wider shadow-[6px_6px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#1a1a1a] transition-all"
          >
            Browse All {cybermon.count} Cybermon Tazos
          </Link>
        </div>

        {/* ── Footer note ── */}
        <p className="text-xs font-bold text-zinc-400 text-center">
          Cybermon are living digital creatures from the Neon Grid, a hidden dimension of signals, 
          memories, and code. Each Cybermon carries a Soul Protocol that can Shift into stronger 
          forms through data, battle, and emotional links with a human Linker. But as the Null 
          Signal spreads, every connection becomes a fight to preserve identity.
        </p>
      </div>
            {/* ── SEO: Server-rendered content for search crawlers ── */}
        <ServerPageContent page="collections-cybermon" />
    </PublicPageShell>
  )
}
