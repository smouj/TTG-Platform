// ============================================================
// Trading Tazos Game — Magazine Launcher View
// 90s gaming-magazine aesthetic: halftone dots, heavy black
// borders, comic typography, CMYK accents, retro print feel.
// This IS the launcher that the desktop app (.exe/.dmg) loads.
//
// v2: Integrated content pages — the masthead tabs render
// How to Play, Collections, Tazos, Leaderboard, Download,
// and FAQ inside the same magazine shell, replacing the hero.
// ============================================================
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  Download, Globe, Monitor, Apple, Terminal,
  Zap, Star, Disc3, Swords, Medal, PackageOpen,
  BookOpen, ShoppingBag, BarChart3, Dices,
  ChevronLeft, ChevronRight, ExternalLink,
  Trophy, Coins, Package, ArrowLeft, Loader2,
  Crown, X, ArrowUp, HelpCircle
} from "lucide-react"
import TazoDetailModal from '@/components/game/tazo-detail-modal'

// ── Types ──

type PageId = "home" | "how-to-play" | "collections" | "collections-minimon"
  | "collections-cybermon" | "collections-dracobell" | "tazos" | "leaderboard"
  | "download" | "faq"

const PAGE_LABELS: Record<PageId, string> = {
  home: "Home",
  "how-to-play": "How to Play",
  collections: "Collections",
  "collections-minimon": "Minimon",
  "collections-cybermon": "Cybermon",
  "collections-dracobell": "Dracobell",
  tazos: "Tazos",
  leaderboard: "Rankings",
  download: "Download",
  faq: "FAQ",
}

// ── Magazine Splash Screen ──

function MagazineSplash({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<"cover" | "flip" | "done">("cover")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("flip"), 1200)
    const t2 = setTimeout(() => {
      const i = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(i); return 100 }
          return Math.min(100, p + Math.random() * 18 + 8)
        })
      }, 80)
    }, 1300)
    const t3 = setTimeout(() => onFinish(), 3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onFinish])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{ background: "#FFF9E6" }}>
      <div className="mag-dots absolute inset-0 opacity-30" />
      <div className={`relative transition-all duration-600 ${
        phase === "cover" ? "scale-100 opacity-100" : "scale-90 opacity-70"
      }`}>
        <div className="absolute -inset-8 sm:-inset-10 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[6px] border-[#E3350D]/30" />
          <div className="absolute w-20 h-20 sm:w-28 sm:h-28 rounded-full border-[4px] border-[#FFCC00]/40" />
          <div className="absolute w-16 h-16 sm:w-24 sm:h-24 rounded-full border-[3px] border-[#E3350D]/20" />
        </div>
        <img
          src="/logo/logo-icon-black.webp"
          alt="Trading Tazos"
          className="w-28 h-28 sm:w-36 sm:h-36 relative z-10"
          style={{ filter: "drop-shadow(6px 6px 0 rgba(26,26,26,0.3))" }}
        />
      </div>
      <h1 className="mt-5 text-3xl sm:text-5xl font-black text-[#1a1a1a] uppercase tracking-[0.1em] text-center leading-none"
        style={{ textShadow: "3px 3px 0 rgba(227,53,13,0.3)" }}>
        TRADING<span className="text-[#E3350D]">TAZOS</span><span className="text-[#1a1a1a]">GAME</span>
      </h1>
      <div className={`mt-2 flex items-center gap-2 transition-all duration-500 ${
        phase === "cover" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}>
        <span className="w-3 h-[2px] bg-[#1a1a1a]" />
        <span className="text-[10px] sm:text-xs font-black text-[#1a1a1a]/50 uppercase tracking-[0.4em]">
          Official Game (Beta)
        </span>
        <span className="w-3 h-[2px] bg-[#1a1a1a]" />
      </div>
      <div className={`mt-8 transition-all duration-500 ${
        phase === "flip" ? "opacity-100" : "opacity-0"
      }`}>
        <div className="relative w-56 sm:w-72 h-3 border-2 border-[#1a1a1a] overflow-hidden"
          style={{
            background: "repeating-linear-gradient(-45deg, #FFCC00, #FFCC00 6px, #F0A800 6px, #F0A800 12px)",
          }}>
          <div className="absolute inset-0 bg-[#1a1a1a] transition-all duration-75"
            style={{ left: `${Math.min(progress, 100)}%` }} />
        </div>
        <p className="mt-2 text-[9px] font-black text-[#1a1a1a]/40 text-center uppercase tracking-[0.3em]">
          Loading magazine #{phase === "cover" ? "001" : Math.floor(progress / 10) + 1}...
        </p>
      </div>
    </div>
  )
}

// ── Shared sub-components ──

function PlatformBadge({ icon: Icon, label }: { icon: typeof Monitor; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 border-2 border-[#1a1a1a] bg-white"
      style={{ boxShadow: "2px 2px 0 #1a1a1a" }}>
      <Icon className="w-3 h-3 text-[#1a1a1a]" />
      <span className="text-[9px] font-black text-[#1a1a1a] uppercase tracking-wider">{label}</span>
    </div>
  )
}

function StatBadge({ number, label, color }: { number: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 border-2 border-[#1a1a1a] bg-white"
      style={{ boxShadow: `3px 3px 0 ${color}40` }}>
      <span className="text-lg sm:text-xl font-black text-[#1a1a1a] leading-none">{number}</span>
      <span className="text-[8px] font-black text-[#1a1a1a]/60 uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  )
}

function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={onBack}
        className="flex items-center justify-center w-8 h-8 border-2 border-[#1a1a1a] bg-white hover:bg-[#FFF9E6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        style={{ boxShadow: "2px 2px 0 #1a1a1a" }}
      >
        <ArrowLeft className="w-4 h-4 text-[#1a1a1a]" />
      </button>
      <h2 className="text-xl sm:text-2xl font-black text-[#1a1a1a] uppercase tracking-[0.05em]">{title}</h2>
    </div>
  )
}

function SectionCard({ step, color, title, children, bgColor }: {
  step?: number; color: string; title: string; children: React.ReactNode; bgColor?: string
}) {
  return (
    <div className="border-2 border-[#1a1a1a] bg-white p-5"
      style={{ boxShadow: "4px 4px 0 #1a1a1a" }}>
      <div className="flex items-center gap-3 mb-3">
        {step && (
          <span className="inline-flex items-center justify-center w-10 h-10 border-2 border-[#1a1a1a] text-lg font-black text-white flex-shrink-0"
            style={{ background: bgColor || color }}>{step}</span>
        )}
        <h3 className="text-base font-black uppercase text-[#1a1a1a]">{title}</h3>
      </div>
      <div className="text-xs font-bold text-[#1a1a1a]/60 space-y-1.5 leading-relaxed">
        {children}
      </div>
    </div>
  )
}

// ── Preview Slider (home page) ──

const PREVIEW_SLIDES = [
  {
    icon: Disc3, label: "Tazo Collection",
    desc: "Browse all 349 tazos with search, filters & flip view. Track your album progress.",
    color: "#00A1E9", bg: "#E8F4FD",
  },
  {
    icon: Swords, label: "3D Battle Arena",
    desc: "Aim, throw & flip in skill-based combat. Practice vs CPU or challenge friends.",
    color: "#E3350D", bg: "#FDE8E8",
  },
  {
    icon: ShoppingBag, label: "Open Tazo Bags",
    desc: "Claim daily bonuses & tear open classic bags. Rare holos & mastertazos await.",
    color: "#FFCC00", bg: "#FFF9E6",
  },
  {
    icon: BarChart3, label: "Leaderboards",
    desc: "Compete globally. Rise through the ranks with battle wins & collection score.",
    color: "#22C55E", bg: "#E8FDE8",
  },
  {
    icon: BookOpen, label: "Deck Builder",
    desc: "Build custom 20-tazo decks. Pick 5 starters & fine-tune your battle strategy.",
    color: "#A855F7", bg: "#F3E8FD",
  },
  {
    icon: Dices, label: "Quests & Progress",
    desc: "Complete daily quests, unlock achievements & level up your collector rank.",
    color: "#F59E0B", bg: "#FEF9E8",
  },
]

function PreviewSlider() {
  const [active, setActive] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const next = useCallback(() => setActive(p => (p + 1) % PREVIEW_SLIDES.length), [])
  const prev = useCallback(() => setActive(p => (p - 1 + PREVIEW_SLIDES.length) % PREVIEW_SLIDES.length), [])
  useEffect(() => { timerRef.current = setInterval(next, 4000); return () => { if (timerRef.current) clearInterval(timerRef.current) } }, [next])
  const slide = PREVIEW_SLIDES[active]; const Icon = slide.icon
  return (
    <div className="w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[380px]">
      <div className="relative border-3 border-[#1a1a1a] overflow-hidden transition-all duration-400"
        style={{ background: slide.bg, boxShadow: "4px 4px 0 #1a1a1a" }}>
        <div className="h-1.5" style={{ background: slide.color }} />
        <div className="flex items-start gap-3 p-3 sm:p-4">
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center border-2 border-[#1a1a1a] bg-white"
            style={{ boxShadow: "2px 2px 0 #1a1a1a" }}>
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: slide.color }} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-black text-[#1a1a1a] uppercase tracking-wider leading-tight">{slide.label}</h3>
            <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold text-[#1a1a1a]/55 leading-relaxed">{slide.desc}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <button onClick={prev} className="flex items-center justify-center w-7 h-7 border-2 border-[#1a1a1a] bg-white hover:bg-[#FFF9E6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          style={{ boxShadow: "2px 2px 0 #1a1a1a" }}><ChevronLeft className="w-3.5 h-3.5 text-[#1a1a1a]" /></button>
        <div className="flex items-center gap-1.5">
          {PREVIEW_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className="transition-all duration-300 rounded-full"
              style={{ width: i === active ? "18px" : "6px", height: "6px", background: i === active ? "#1a1a1a" : "#1a1a1a20", borderRadius: "3px" }} />
          ))}
        </div>
        <button onClick={next} className="flex items-center justify-center w-7 h-7 border-2 border-[#1a1a1a] bg-white hover:bg-[#FFF9E6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          style={{ boxShadow: "2px 2px 0 #1a1a1a" }}><ChevronRight className="w-3.5 h-3.5 text-[#1a1a1a]" /></button>
      </div>
      <p className="mt-1 text-center text-[8px] font-black text-[#1a1a1a]/25 uppercase tracking-[0.3em]">{active + 1} / {PREVIEW_SLIDES.length}</p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// PAGE CONTENT COMPONENTS
// ══════════════════════════════════════════════════════════

// ── Tazo Showcase (landing page preview) ──

function TazoShowcase() {
  const [tazos, setTazos] = useState<any[]>([])
  useEffect(() => {
    fetch("/api/tazos?limit=12")
      .then(r => r.json())
      .then(d => setTazos(d.tazos || []))
      .catch(() => {})
  }, [])
  if (tazos.length < 6) return null
  return (
    <div className="max-w-5xl mx-auto w-full px-4 pb-8 space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-0.5 bg-[#1a1a1a]/10" />
        <span className="text-[10px] font-black text-[#1a1a1a]/30 uppercase tracking-[0.2em] whitespace-nowrap">Featured Tazos</span>
        <div className="flex-1 h-0.5 bg-[#1a1a1a]/10" />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {tazos.slice(0, 8).map((t: any) => (
          <div
            key={t.id}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-3 border-[#1a1a1a] flex items-center justify-center overflow-hidden bg-[#fffef0] shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {t.imageUrl ? (
              <img
                src={t.imageUrl}
                alt={t.displayName || t.name || ""}
                className="w-full h-full object-cover scale-110"
                draggable={false}
                title={`${t.displayName || t.name} — ${t.franchiseName || t.franchise}`}
              />
            ) : (
              <Disc3 className="w-8 h-8 text-[#1a1a1a]/10" />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-[8px] font-black text-[#1a1a1a]/20 uppercase tracking-[0.25em]">
        {tazos.length > 12 ? `+${tazos.length - 12} more...` : "3 franchises · 349 total"}
      </p>
    </div>
  )
}

// ── Home Hero ──

function HomeHero({ user, onPlay }: { user: any; onPlay: () => void }) {
  const [hoverPlay, setHoverPlay] = useState(false)
  const [pressPlay, setPressPlay] = useState(false)
  return (
    <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 py-8 sm:py-10 lg:py-0">
      {/* LEFT */}
      <div className="flex flex-col items-center lg:items-start gap-4 sm:gap-5">
        <div className="relative">
          <div className="absolute -inset-6 sm:-inset-8 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="absolute w-0.5 sm:w-1 bg-[#E3350D]/20"
                style={{ height: `${20 + Math.random() * 30}%`, left: "50%", top: "50%",
                  transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-60%)` }} />
            ))}
          </div>
          <div className="absolute -inset-3 rounded-full border-[3px] border-[#FFCC00] pointer-events-none" />
          <div className="absolute -inset-[18px] rounded-full border-2 border-[#1a1a1a]/10 pointer-events-none" />
          <img src="/logo/logo-icon-black.webp" alt="TTG"
            className="w-18 h-18 sm:w-24 sm:h-24 lg:w-20 lg:h-20"
            style={{ filter: "drop-shadow(4px 4px 0 rgba(26,26,26,0.3))" }} />
        </div>
        <div className="text-center lg:text-left">
          <h2 className="text-sm sm:text-base lg:text-lg font-black text-[#1a1a1a] uppercase tracking-[0.08em] leading-tight">
            <span className="text-[#E3350D]">Collect</span> · <span className="text-[#FFCC00]">Trade</span> · <span className="text-[#00A1E9]">Battle</span>
          </h2>
          <p className="mt-0.5 text-[10px] font-bold text-[#1a1a1a]/40 uppercase tracking-[0.2em]">The classic tazo arena</p>
        </div>
        <PreviewSlider />
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          <StatBadge number="349" label="Tazos" color="#FFCC00" />
          <StatBadge number="3" label="Worlds" color="#E3350D" />
          <StatBadge number="9" label="Stats" color="#00A1E9" />
          <StatBadge number="5" label="Cards" color="#22C55E" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black text-white uppercase"
            style={{ background: "#E3350D", clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)" }}>
            <Zap className="w-2.5 h-2.5 fill-white" /> NEW!
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-black text-[#1a1a1a] uppercase border-2 border-[#FFCC00]"
            style={{ background: "#FFCC00" }}>
            <Star className="w-2.5 h-2.5 fill-[#1a1a1a]" /> FREE TO PLAY
          </span>
        </div>
      </div>

      {/* RIGHT — Play Button */}
      <div className="flex flex-col items-center gap-5 sm:gap-6">
        <button onClick={onPlay}
          onMouseEnter={() => setHoverPlay(true)} onMouseLeave={() => { setHoverPlay(false); setPressPlay(false) }}
          onMouseDown={() => setPressPlay(true)} onMouseUp={() => setPressPlay(false)}
          onTouchStart={() => setPressPlay(true)} onTouchEnd={() => setPressPlay(false)}
          className="group relative select-none"
          style={{ transform: pressPlay ? "translate(2px, 2px)" : hoverPlay ? "translate(-2px, -2px)" : "translate(0, 0)", transition: "transform 0.15s ease" }}>
          <div className="absolute inset-0 translate-x-2 translate-y-2" style={{ background: "#1a1a1a" }} />
          <div className="relative px-10 sm:px-14 md:px-20 py-3.5 sm:py-4 md:py-5 border-[4px] border-[#1a1a1a] overflow-hidden"
            style={{
              background: (hoverPlay || pressPlay) ? "linear-gradient(180deg, #FFE566 0%, #FFCC00 50%, #F5B800 100%)" : "linear-gradient(180deg, #FFCC00 0%, #F0A800 100%)",
              boxShadow: (hoverPlay || pressPlay) ? "inset 0 -4px 0 rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.3)" : "inset 0 -3px 0 rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,0.25)",
            }}>
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 transition-opacity duration-200 ${hoverPlay ? "opacity-100" : "opacity-0"}`}>
              {[...Array(4)].map((_, i) => (<div key={i} className="w-3 h-0.5 bg-[#1a1a1a]/40" style={{ marginRight: `${-(i * 4)}px`, width: `${12 + i * 6}px` }} />))}
            </div>
            <span className="relative text-lg sm:text-xl md:text-2xl font-black text-[#1a1a1a] uppercase tracking-[0.15em] whitespace-nowrap">Play Now</span>
            <div className="mag-halftone absolute inset-0 opacity-20 pointer-events-none" />
          </div>
        </button>
        <p className="text-[10px] font-black text-[#1a1a1a]/40 uppercase tracking-wider text-center">
          {user ? "Ready for battle?" : "Create a free account to start playing!"}
        </p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {[
            { icon: PackageOpen, label: "Open Bags", desc: "349 tazos to collect", color: "#FFCC00" },
            { icon: Swords, label: "Practice Mode", desc: "No account needed!", color: "#E3350D" },
            { icon: Disc3, label: "349 Tazos", desc: "Collect them all!", color: "#00A1E9" },
            { icon: Medal, label: "Leaderboard", desc: "See top players", color: "#22C55E" },
          ].map(({ icon: Icon, label, desc, color }) => (
            <div key={label}
              className="group flex items-start gap-2 p-2.5 border-2 border-[#1a1a1a] bg-white hover:bg-[#FFF9E6] transition-colors cursor-pointer"
              style={{ boxShadow: "3px 3px 0 #1a1a1a" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translate(-1px, -1px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translate(0, 0)")}
            >
              <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center border-2 border-[#1a1a1a]" style={{ backgroundColor: `${color}30` }}>
                <Icon className="w-3.5 h-3.5 text-[#1a1a1a]" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-[#1a1a1a] uppercase tracking-wider leading-none">{label}</p>
                <p className="text-[8px] font-bold text-[#1a1a1a]/50 uppercase mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── How to Play ──

function HowToPlayContent() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <SectionCard step={1} color="#FFCC00" bgColor="#FFCC00" title="Create Your Account">
        <p>Sign up for free — you&apos;ll receive <strong>10 free bags</strong> with surprise tazos inside. Open them in the Shop to start your collection. No credit card required — the game is completely free to play.</p>
      </SectionCard>
      <SectionCard step={2} color="#FF6B00" bgColor="#FF6B00" title="Open Bags & Collect Tazos">
        <p>Each bag contains a random tazo from the collection:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li><strong>Standard Bags</strong> — Common and uncommon tazos</li>
          <li><strong>Premium Bags</strong> — Better odds for rare tazos</li>
          <li><strong>Mega Bags</strong> — Highest chance for ultra rare and legendary</li>
        </ul>
        <p>Buy more bags with credits earned by winning battles and completing quests.</p>
      </SectionCard>
      <SectionCard step={3} color="#3B4CCA" bgColor="#3B4CCA" title="Build Your Battle Deck">
        <p>Choose <strong>5 tazos</strong> to form your battle deck. Each tazo has <strong>9 combat stats</strong>:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li><strong>Attack</strong> — Impact power on opponent tazos</li>
          <li><strong>Defense</strong> — Resistance to being flipped</li>
          <li><strong>Resistance</strong> — Stays in place under pressure</li>
          <li><strong>Weight</strong> — Mass for pushing power</li>
          <li><strong>Stability</strong> — Prevents ring-outs and knockbacks</li>
          <li><strong>Spin</strong> — Maintains momentum after landing</li>
          <li><strong>Control</strong> — Reduces throw deviation</li>
          <li><strong>Bounce</strong> — Improves wall rebounds</li>
          <li><strong>Precision</strong> — Better aim accuracy</li>
        </ul>
        <p>Balance high-attack tazos with defensive ones for the best results.</p>
      </SectionCard>
      <SectionCard step={4} color="#E3350D" bgColor="#E3350D" title="Enter the Battle Arena">
        <p>Each turn has 3 phases:</p>
        <ul className="list-disc pl-5 space-y-0.5">
          <li><strong>Aim</strong> — Position the crosshair where you want your tazo to land</li>
          <li><strong>Power</strong> — Charge your throw strength with timing-based precision</li>
          <li><strong>Spin</strong> — Choose topspin, backspin, sidespin, or none</li>
        </ul>
        <p>Your tazo slides across the 3D arena. Hit hard enough and you&apos;ll <strong>flip</strong> opponent tazos — capturing them for points.</p>
      </SectionCard>
      <SectionCard step={5} color="#22C55E" bgColor="#22C55E" title="Complete Quests & Climb Ranks">
        <p>Earn credits and reputation by completing <strong>17 quests</strong> across 4 categories (Beginner, Daily, Weekly, Special). Unlock <strong>18 achievements</strong> with Bronze → Platinum tiers. Rise through the leaderboard and become the ultimate collector.</p>
      </SectionCard>
    </div>
  )
}

// ── Collections ──

const COLLECTION_DATA = [
  {
    name: "Minimon", slug: "minimon", count: 61, year: 2000, origin: "Matutano", color: "#FFCC00",
    categories: ["Tazos"],
    desc: "The original collection that started it all. 61 creature companions with balanced combat stats — perfect for learning the battle system.",
    highlights: ["Balanced stat distribution", "Classic creature designs", "Original 2000 Spanish series", "Versatile battle strategies"]
  },
  {
    name: "Dracobell", slug: "dracobell", count: 128, year: 1995, origin: "Matutano", color: "#FF6B00",
    categories: ["Tazos", "Megatazos", "Supertazos Octogonales", "Supertazos Voladores", "Mastertazos", "Holo 3D"],
    desc: "The most diverse collection with 128 martial arts warriors across 6 categories. Home to the rarest Holo 3D and Mastertazo variants.",
    highlights: ["6 unique categories", "Highest average attack stats", "Rare Holo 3D variants", "Most diverse category system"]
  },
  {
    name: "Cybermon", slug: "cybermon", count: 160, year: 2000, origin: "Magic Box", color: "#00B4D8",
    categories: ["Caps"],
    desc: "The largest collection with 160 digital companions in cap format. High precision stats and extensive evolution trees.",
    highlights: ["Largest collection — 160 tazos", "Complex evolution trees", "Highest precision stats", "Original Magic Box 2000 series"]
  },
]

function CollectionsContent({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const [showcaseTazos, setShowcaseTazos] = useState<Record<string, any[]>>({})

  useEffect(() => {
    fetch("/api/tazos?limit=6")
      .then(r => r.json())
      .then(d => {
        const byFranchise: Record<string, any[]> = {}
        for (const t of (d.tazos || [])) {
          const f = t.franchise || t.franchiseSlug || "minimon"
          if (!byFranchise[f]) byFranchise[f] = []
          if (byFranchise[f].length < 4) byFranchise[f].push(t)
        }
        setShowcaseTazos(byFranchise)
      })
      .catch(() => {})
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      <p className="text-xs font-bold text-[#1a1a1a]/50 uppercase tracking-wider">
        3 Franchises · 349 Tazos · Classic snack toy collections
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {COLLECTION_DATA.map(c => {
          const backArtUrl = `/tazos-artgen/backs/${c.slug}-back.png`
          const franchiseTazos = showcaseTazos[c.slug] || []
          return (
          <button key={c.slug} onClick={() => onNavigate(`collections-${c.slug}` as PageId)}
            className="text-left border-2 border-[#1a1a1a] bg-white overflow-hidden hover:bg-[#FFF9E6] transition-colors group"
            style={{ boxShadow: "4px 4px 0 #1a1a1a" }}>
            {/* Franchise color strip */}
            <div className="h-2" style={{ background: c.color }} />
            
            {/* Tazo + Back art showcase */}
            <div className="p-3 grid grid-cols-2 gap-2 bg-[#fffef0] border-b-2 border-[#1a1a1a]/10">
              {/* Back art of franchise */}
              <div className="rounded-full border-2 border-[#1a1a1a]/15 overflow-hidden aspect-square flex items-center justify-center bg-white shadow-[1px_1px_0px_#1a1a1a10]">
                <img 
                  src={backArtUrl} 
                  alt={`${c.name} back art`}
                  className="w-full h-full object-cover scale-110"
                  draggable={false}
                />
              </div>
              {/* Sample front tazo — or more backs if no tazos loaded */}
              <div className="rounded-full border-2 border-[#1a1a1a]/15 overflow-hidden aspect-square flex items-center justify-center bg-white shadow-[1px_1px_0px_#1a1a1a10]">
                {franchiseTazos.length > 0 ? (
                  <div className="relative w-full h-full">
                    {franchiseTazos.slice(0, 3).map((t: any, i: number) => (
                      t.imageUrl ? (
                        <img
                          key={t.id}
                          src={t.imageUrl}
                          alt={t.displayName || t.name || ""}
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{
                            transform: `rotate(${i * 15 - 15}deg) translateY(${i * 2}px)`,
                            zIndex: franchiseTazos.length - i,
                            opacity: i === 0 ? 1 : 0.55,
                          }}
                          draggable={false}
                        />
                      ) : null
                    ))}
                  </div>
                ) : (
                  <span className="text-[7px] font-black text-[#1a1a1a]/15 uppercase">FRONT</span>
                )}
              </div>
            </div>

            {/* Info section */}
            <div className="p-5">
              <h3 className="text-lg font-black text-[#1a1a1a] uppercase">{c.name}</h3>
              <p className="text-[10px] font-black text-[#1a1a1a]/50 mt-0.5">{c.count} tazos · {c.year} · {c.origin}</p>
              <p className="text-[11px] font-bold text-[#1a1a1a]/60 mt-2 leading-relaxed">{c.desc}</p>
              <div className="flex flex-wrap gap-1 mt-3">
                {c.categories.map(cat => (
                  <span key={cat} className="text-[8px] font-black text-white px-2 py-0.5 uppercase"
                    style={{ background: c.color }}>{cat}</span>
                ))}
              </div>
              <ul className="mt-3 space-y-0.5">
                {c.highlights.map((h, i) => (
                  <li key={i} className="text-[10px] font-bold text-[#1a1a1a]/50 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: c.color }} /> {h}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] font-black text-[#E3350D] uppercase group-hover:underline">View Collection →</p>
            </div>
          </button>
        )})}
      </div>
    </div>
  )
}

// ── Tazo Catalog ──

function TazosContent() {
  const [tazos, setTazos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [franchiseFilter, setFranchiseFilter] = useState("all")
  const [selectedTazo, setSelectedTazo] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    fetch("/api/tazos?limit=60").then(r => r.json()).then(d => {
      setTazos(d.tazos || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = tazos.filter(t =>
    (franchiseFilter === "all" || t.franchise === franchiseFilter) &&
    (!search || (t.displayName || t.name || "").toLowerCase().includes(search.toLowerCase()))
  )

  const handleTazoClick = (t: any) => {
    setSelectedTazo(t)
    setDetailOpen(true)
  }

  const fColors: Record<string, { bg: string; badge: string }> = {
    minimon: { bg: "#FFCB0510", badge: "#FFCB05" },
    dracobell: { bg: "#FF6B0010", badge: "#FF6B00" },
    cybermon: { bg: "#00A1E910", badge: "#00A1E9" },
  }

  return (
    <>
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search tazos..."
          className="px-3 py-1.5 text-xs font-bold border-2 border-[#1a1a1a] bg-white text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 outline-none flex-1 max-w-[200px]" />
        {["all", "minimon", "dracobell", "cybermon"].map(f => (
          <button key={f} onClick={() => setFranchiseFilter(f)}
            className={`px-3 py-1 text-[10px] font-black uppercase border-2 transition-all ${
              franchiseFilter === f
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                : "bg-white text-[#1a1a1a] border-[#1a1a1a]/15 hover:border-[#FFCC00]"
            }`}>{f === "all" ? "All" : f}</button>
        ))}
        <span className="ml-auto text-[9px] font-black text-[#1a1a1a]/25 uppercase">
          {filtered.length} tazos
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#1a1a1a]/40" /></div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {filtered.map((t: any) => {
            const f = t.franchise || "minimon"
            const fc = fColors[f] || fColors.minimon
            const rarityColor = {
              common: "#9CA3AF", uncommon: "#22C55E", rare: "#3B82F6",
              "ultra-rare": "#A855F7", legendary: "#F59E0B",
              ultra: "#A855F7",
            }[t.rarity] || "#9CA3AF"
            return (
            <button key={t.id} onClick={() => handleTazoClick(t)}
              className="text-left border-2 border-[#1a1a1a]/15 bg-white p-2 hover:bg-[#FFF9E6] hover:border-[#FFCC00] hover:shadow-[3px_3px_0px_#1a1a1a] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all group">
              {/* Disc */}
              <div className="aspect-square rounded-full overflow-hidden mb-1.5 mx-auto max-w-[80px] border-2 border-[#1a1a1a]/10 relative"
                style={{ background: fc.bg }}>
                {t.imageUrl ? (
                  <img src={t.imageUrl} alt={t.displayName || t.name}
                    className="w-full h-full object-cover scale-110" loading="lazy" />
                ) : (
                  <Disc3 className="w-6 h-6 absolute inset-0 m-auto text-[#1a1a1a]/10" />
                )}
                {/* Rarity dot */}
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white"
                  style={{ background: rarityColor }} />
              </div>
              <p className="text-[9px] font-black text-[#1a1a1a] uppercase truncate">
                {t.displayName || t.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[7px] font-bold text-[#1a1a1a]/30 uppercase">{t.franchiseName || t.franchise}</span>
                <span className="ml-auto text-[7px] font-black px-1 py-px rounded" style={{ background: `${rarityColor}15`, color: rarityColor }}>
                  {(t.rarity || "common").replace("ultra-rare", "ultra").toUpperCase()}
                </span>
              </div>
            </button>
          )})}
        </div>
      )}
    </div>

    {/* Detail Modal */}
    {selectedTazo && (
      <TazoDetailModal
        tazo={selectedTazo as any}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedTazo(null) }}
      />
    )}
    </>
  )
}

// ── Leaderboard ──

const SORTS = [
  { key: "credits", label: "CREDITS", icon: Coins },
  { key: "tazos", label: "TAZOS", icon: Package },
  { key: "battles", label: "BATTLES", icon: Swords },
]

function LeaderboardContent() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState("credits")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard?sort=${sort}&limit=20`)
      .then(r => r.json())
      .then(d => { setEntries(d.leaderboard || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sort])

  const displayName = (e: any) => e.displayName || e.name || "???"

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex gap-2">
        {SORTS.map(s => (
          <button key={s.key} onClick={() => setSort(s.key)}
            className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase border-2 transition-all ${
              sort === s.key
                ? "bg-[#1a1a1a] text-white border-[#1a1a1a] shadow-[2px_2px_0px_#FFCC00]"
                : "bg-white text-[#1a1a1a] border-[#1a1a1a]/15"
            }`}><s.icon className="w-3.5 h-3.5" /> {s.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#1a1a1a]/40" /></div>
      ) : (
        <div className="space-y-1.5">
          {entries.map((e: any, i: number) => {
            const RankIcon = i === 0 ? Crown : i === 1 ? Medal : i === 2 ? Star : undefined
            const rankColor = i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#D97706" : undefined
            return (
              <div key={e.id || i} className="flex items-center gap-3 px-4 py-2.5 border-2 border-[#1a1a1a] bg-white"
                style={{ boxShadow: rankColor ? `3px 3px 0 ${rankColor}30` : undefined }}>
                <span className="w-7 text-center text-sm font-black text-[#1a1a1a]/40">{i < 3 ? (RankIcon ? <RankIcon className="w-4 h-4 inline" style={{ color: rankColor }} /> : `#${i + 1}`) : `#${i + 1}`}</span>
                <div className="w-8 h-8 rounded-full bg-[#1a1a1a]/10 overflow-hidden flex-shrink-0">
                  {e.avatarUrl && <img src={e.avatarUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <span className="flex-1 text-xs font-black text-[#1a1a1a] truncate">{displayName(e)}</span>
                <span className="text-[11px] font-black text-[#FFCC00]">
                  {sort === "credits" ? `${(e.credits || 0).toLocaleString()} cr` :
                   sort === "tazos" ? `${e.tazoCount || e._count?.userTazos || 0} tazos` :
                   `${e.winCount || 0} wins`}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Download ──

const GITHUB_URL = "https://github.com/smouj/Trading-Tazos-Game"
const RELEASE_TAG = "v0.3.1"
const RELEASE_VER = "0.3.1"
const RELEASES_URL = `${GITHUB_URL}/releases`

const DOWNLOADS = [
  { id: "windows", icon: Monitor, color: "#00A4EF", label: "Windows", badge: "Available", badgeColor: "#22C55E",
    url: `${RELEASES_URL}/tag/${RELEASE_TAG}`, formats: [{ label: ".exe Installer", path: `trading-tazos-game-${RELEASE_VER}-win-x64.exe` }] },
  { id: "mac", icon: Apple, color: "#1a1a1a", label: "macOS", badge: "Available", badgeColor: "#22C55E",
    url: `${RELEASES_URL}/tag/${RELEASE_TAG}`, formats: [
      { label: ".dmg (Apple Silicon)", path: `trading-tazos-game-${RELEASE_VER}-mac-arm64.dmg` },
      { label: ".dmg (Intel)", path: `trading-tazos-game-${RELEASE_VER}-mac-x64.dmg` },
      { label: ".zip (Apple Silicon)", path: `trading-tazos-game-${RELEASE_VER}-mac-arm64.zip` },
      { label: ".zip (Intel)", path: `trading-tazos-game-${RELEASE_VER}-mac-x64.zip` },
    ] },
  { id: "linux", icon: Terminal, color: "#FCC624", label: "Linux", badge: "Available", badgeColor: "#22C55E",
    url: `${RELEASES_URL}/tag/${RELEASE_TAG}`, formats: [
      { label: ".AppImage (Portable)", path: `trading-tazos-game-${RELEASE_VER}-linux-x86_64.AppImage` },
      { label: ".deb (Ubuntu/Debian)", path: `trading-tazos-game-${RELEASE_VER}-linux-amd64.deb` },
    ] },
]

function DownloadContent() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-5">
      <p className="text-xs font-bold text-[#1a1a1a]/50 uppercase tracking-wider">
        Desktop installers for Windows, macOS & Linux · Also available as PWA
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {DOWNLOADS.map(d => {
          const Icon = d.icon
          return (
            <div key={d.id} className="border-2 border-[#1a1a1a] bg-white p-5"
              style={{ boxShadow: "4px 4px 0 #1a1a1a" }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-5 h-5" style={{ color: d.color }} />
                <h3 className="text-sm font-black text-[#1a1a1a] uppercase">{d.label}</h3>
                <span className="text-[8px] font-black text-white px-1.5 py-0.5 uppercase" style={{ background: d.badgeColor }}>{d.badge}</span>
              </div>
              <div className="space-y-1.5 mb-3">
                {d.formats.map(f => (
                  <a key={f.label} href={`${d.url}`} target="_blank" rel="noopener"
                    className="block text-[10px] font-bold text-[#1a1a1a]/60 hover:text-[#E3350D] transition-colors">
                    {f.label} <ExternalLink className="w-2.5 h-2.5 inline opacity-40" />
                  </a>
                ))}
              </div>
              <a href={d.url} target="_blank" rel="noopener"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black text-[#1a1a1a] bg-[#FFCC00] uppercase border-2 border-[#1a1a1a] hover:bg-[#FFE566] transition-colors">
                <Download className="w-3 h-3" /> Download
              </a>
            </div>
          )
        })}
      </div>
      <p className="text-center text-[10px] font-bold text-[#1a1a1a]/30">
        Visit <a href={RELEASES_URL} className="underline hover:text-[#E3350D]">GitHub Releases</a> for all versions
      </p>
    </div>
  )
}

// ── FAQ ──

const FAQS = [
  { q: "What is Trading Tazos Game?", a: "A browser-based skill game where you collect and battle with digital tazos. Open bags to discover 349 unique tazos across 3 franchises. Build decks of 5, then enter the 3D arena where aim, power, and spin determine victory." },
  { q: "Is it free to play?", a: "Yes, completely free. Start with 10 free bags and earn credits by battling, completing quests, and daily logins — no credit card required." },
  { q: "How does the battle system work?", a: "Each turn you aim a crosshair, charge your throw power, and select a spin type (topspin, backspin, sidespin, or none). Your tazo slides across the arena — hit opponent tazos hard enough and they flip, capturing them." },
  { q: "What are the combat stats?", a: "Each tazo has 9 stats: Attack, Defense, Resistance, Weight, Stability, Spin, Control, Bounce, and Precision. Building a balanced deck with complementary stats is key." },
  { q: "Can I play on mobile?", a: "Yes! Visit medaclawarena.com on your phone, install as PWA, and play full-screen. Desktop versions also available." },
  { q: "How do credits work?", a: "Credits buy tazo bags in the Shop. Earn them by winning battles, completing quests, and daily login bonuses." },
  { q: "What quests are there?", a: "17 quests across 4 categories (Beginner, Daily, Weekly, Special) and 18 achievements with Bronze → Platinum tiers." },
  { q: "How do I get started?", a: "Create a free account, open your welcome bags, build a deck of 5, and enter the Battle Arena." },
]

function FAQContent() {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {FAQS.map((faq, i) => (
        <details key={i} className="border-2 border-[#1a1a1a] bg-white group"
          style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
          <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#FFF9E6] transition-colors">
            <HelpCircle className="w-4 h-4 text-[#FFCC00] flex-shrink-0" />
            <span className="text-xs font-black text-[#1a1a1a] uppercase">{faq.q}</span>
          </summary>
          <p className="px-4 pb-3 text-[11px] font-bold text-[#1a1a1a]/60 leading-relaxed">{faq.a}</p>
        </details>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN LAUNCHER COMPONENT
// ══════════════════════════════════════════════════════════

const COLLECTION_DETAILS: Record<string, {
  name: string; count: number; year: number; origin: string; color: string;
  world: string; worldDesc: string;
  sections: { title: string; items: { name: string; detail: string }[] }[]
  features: string[]; motto: string; cta: string
}> = {
  minimon: {
    name: "Minimon", count: 61, year: 2000, origin: "Matutano", color: "#FFCC00",
    world: "Luminara",
    worldDesc: "A luminous land of colorful regions, winding paths, small villages, and places where elemental energy takes shape. Centuries ago, Luminara was filled with Life Spark — an invisible energy that flowed through trees, rivers, caves, clouds, and mountains. When Life Spark accumulated in one place long enough, a Minimon was born.",
    sections: [
      { title: "Regions", items: [
        { name: "Sunnyvale Fields", detail: "Rolling fields, farms, and small villages — Normal, solar, plant" },
        { name: "Mossdeep Woods", detail: "Ancient forests with deep roots — Plant, insect, earth, mystic" },
        { name: "Bluefin Coast", detail: "Beaches, reefs, and distant lighthouses — Water, wind, soft ice" },
        { name: "Cinderpop Hills", detail: "Warm hills & volcanic caves — Fire, rock, metal" },
        { name: "Stormtail Ridge", detail: "Storm-swept mountain peaks — Electric, flying, lesser dragon" },
        { name: "Moonberry Hollow", detail: "A strange nocturnal zone — Shadow, dream, illusion" },
        { name: "Aurora Summit", detail: "Legendary endgame region — Rare forms and guardians" },
      ]},
      { title: "Evolution: Blooming", items: [
        { name: "Tiny Form", detail: "Small, tender, and fragile" },
        { name: "Trail Form", detail: "Adventurous — more defined abilities" },
        { name: "Guardian Form", detail: "Strong, protective, and mature" },
        { name: "Mythic Bloom", detail: "Legendary, rare, nearly one-of-a-kind" },
      ]},
    ],
    features: ["Balanced stat distribution", "Classic creature designs", "Original Matutano 2000 series", "Versatile battle strategies"],
    motto: "Find them. Bond with them. Watch them bloom.",
    cta: "Browse All 61 Minimon Tazos",
  },
  dracobell: {
    name: "Dracobell", count: 128, year: 1995, origin: "Matutano", color: "#FF6B00",
    world: "Bellora",
    worldDesc: "A world of combat regions governed by clans. Each clan protects a technique, a philosophy, and a fragment of an ancient sonic relic — the Dracobell. Forged from meteorite metal and dragon scales, the bell was shattered during a war between clans, and its Bell Shards are now scattered across Bellora.",
    sections: [
      { title: "Clans", items: [
        { name: "Ember Valley — Ember Fist", detail: "Fire, direct attack" },
        { name: "Storm Peaks — Storm Fang", detail: "Lightning, speed" },
        { name: "Iron Plateau — Iron Horn", detail: "Defense, endurance" },
        { name: "Frost Temple — Frost Scale", detail: "Control, precision" },
        { name: "Shadow Basin — Shadow Claw", detail: "Counterattack, stealth" },
        { name: "Golden Shrine — Golden Roar", detail: "Aura, mastery" },
        { name: "Dragon Crater — Dragon Bell", detail: "Ancestral power" },
      ]},
      { title: "Transformation: Ascension", items: [
        { name: "Base Fighter", detail: "The warrior's normal form" },
        { name: "Aura Release", detail: "First release of inner energy" },
        { name: "Clan Ascension", detail: "Form bonded to the clan" },
        { name: "Champion Ascension", detail: "High-tournament form" },
        { name: "Dragon Bell", detail: "Legendary form linked to the bell" },
      ]},
    ],
    features: ["6 unique categories", "Highest average attack stats", "Rare Holo 3D variants", "Most diverse category system"],
    motto: "Train hard. Ring loud. Rise beyond.",
    cta: "Browse All 128 Dracobell Tazos",
  },
  cybermon: {
    name: "Cybermon", count: 160, year: 2000, origin: "Magic Box", color: "#00B4D8",
    world: "The Neon Grid",
    worldDesc: "A hidden digital dimension behind all networks — not simply the internet, but a living dimension formed by forgotten data, lost signals, ancient code, and protocols that developed consciousness. During The Awakening Upload, data fragments mixed with human emotions and produced something unexpected: code with instinct.",
    sections: [
      { title: "Sectors", items: [
        { name: "Boot Fields", detail: "Starting zone: stable, simple code — Basic Cybermon" },
        { name: "Pixel Ruins", detail: "Ruins of ancient games — Pixel, glitch, illusion" },
        { name: "Volt Highway", detail: "Highways of pure electricity — Volt, speed, signal" },
        { name: "Firewall Citadel", detail: "Fortified defensive stronghold — Armor, shield, core" },
        { name: "Data Ocean", detail: "Endless sea of flowing information — Aqua-data, memory" },
        { name: "Glitch Abyss", detail: "Broken and corrupted code — Glitch, error, corrupted" },
        { name: "Kernel Tower", detail: "Core of the digital world — Advanced forms" },
      ]},
      { title: "Evolution: Shift", items: [
        { name: "Boot Form", detail: "Initial form, newly activated" },
        { name: "Link Form", detail: "Synchronized with a Linker" },
        { name: "Overdrive", detail: "Temporary combat overclock" },
        { name: "Prime Form", detail: "Full protocol form unlocked" },
        { name: "Corrupt", detail: "Damaged by dark code — Omega Patch restores it" },
      ]},
    ],
    features: ["Largest collection — 160 tazos", "Complex evolution trees", "Highest precision stats", "Original Magic Box 2000 series"],
    motto: "Log in. Link up. Break the Null.",
    cta: "Browse All 160 Cybermon Tazos",
  },
}

function CollectionDetailContent({ collection }: { collection: string }) {
  const c = COLLECTION_DETAILS[collection]
  if (!c) return null
  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      {/* Intro */}
      <div className="border-2 border-[#1a1a1a] bg-white p-5" style={{ boxShadow: "4px 4px 0 #1a1a1a" }}>
        <div className="h-2 mb-3" style={{ background: c.color }} />
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-black text-[#1a1a1a]">{c.count}</span>
          <span className="text-xs font-bold text-[#1a1a1a]/40 uppercase">tazos · {c.origin} {c.year}</span>
        </div>
        <p className="text-xs font-bold text-[#1a1a1a]/60 leading-relaxed">{c.worldDesc}</p>
      </div>

      {/* Sections */}
      {c.sections.map(s => (
        <div key={s.title}>
          <h3 className="text-sm font-black uppercase text-[#1a1a1a] mb-2">{s.title}</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {s.items.map(item => (
              <div key={item.name} className="border-2 border-[#1a1a1a] bg-white p-3" style={{ boxShadow: "2px 2px 0 #1a1a1a" }}>
                <span className="text-[10px] font-black uppercase text-[#1a1a1a] block mb-0.5">{item.name}</span>
                <span className="text-[9px] font-bold text-[#1a1a1a]/50">{item.detail}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Features + Motto */}
      <div className="border-2 border-[#1a1a1a] bg-white p-5" style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
        <ul className="space-y-1 mb-3">
          {c.features.map((f, i) => (
            <li key={i} className="text-[10px] font-bold text-[#1a1a1a]/60 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: c.color }} /> {f}
            </li>
          ))}
        </ul>
        <p className="text-sm font-black uppercase text-[#1a1a1a] text-center">
          &ldquo;{c.motto}&rdquo;
        </p>
      </div>

      {/* CTA */}
      <div className="text-center">
        <a href={`/tazos?collection=${collection}`}
          className="inline-block px-6 py-2.5 text-[11px] font-black text-white bg-[#E3350D] uppercase tracking-wider border-2 border-[#1a1a1a]
                     shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_#1a1a1a]
                     active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#1a1a1a] transition-all">
          {c.cta}
        </a>
      </div>
    </div>
  )
}

export default function LauncherView() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSplash, setShowSplash] = useState(false)
  const [currentPage, setCurrentPage] = useState<PageId>("home")

  // Sync page from URL query param on mount
  useEffect(() => {
    const page = searchParams.get("page")
    if (page && PAGE_LABELS[page as PageId]) {
      setCurrentPage(page as PageId)
    }
  }, [searchParams])

  const navigate = useCallback((page: PageId) => {
    setCurrentPage(page)
    if (page === "home") {
      router.replace("/", { scroll: false })
    } else {
      router.replace(`/?page=${page}`, { scroll: false })
    }
  }, [router])

  const handlePlay = useCallback(() => setShowSplash(true), [])
  const handleSplashDone = useCallback(() => {
    setShowSplash(false)
    window.location.href = user ? "/app/collection" : "/login"
  }, [user])

  const isHome = currentPage === "home"

  return (
    <>
      {showSplash && <MagazineSplash onFinish={handleSplashDone} />}

      <div className="min-h-screen flex flex-col relative" style={{ background: "#FFF9E6" }}>
        <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" />

        {/* ═══ MASTHEAD ═══ */}
        <header className="relative z-10 border-b-[5px] border-[#1a1a1a]" style={{ background: "#1a1a1a" }}>
          <div className="flex items-center justify-between px-3 sm:px-5 py-2.5">
            <div className="flex items-center gap-2.5">
              <button onClick={() => navigate("home")} className="cursor-pointer">
                <img src="/favicon-192.png" alt="TTG" className="w-7 h-7 sm:w-8 sm:h-8" />
              </button>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-[0.08em] leading-none">
                  TRADING<span className="text-[#FFCC00]">TAZOS</span><span className="text-white/80">GAME</span>
                </h2>
                <p className="text-[8px] font-bold text-[#FFCC00]/70 uppercase tracking-[0.3em] leading-none mt-0.5">Official Game (Beta)</p>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden sm:flex items-center gap-1">
              {([
                ["home", "Home"],
                ["how-to-play", "How to Play"],
                ["collections", "Collections"],
                ["tazos", "Tazos"],
                ["leaderboard", "Rankings"],
                ["download", "Download"],
                ["faq", "FAQ"],
              ] as [PageId, string][]).map(([id, label]) => (
                <button key={id} onClick={() => navigate(id)}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-colors ${
                    currentPage === id ? "text-[#FFCC00]" : "text-white/50 hover:text-[#FFCC00]"
                  }`}>
                  {label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <a href="/app/collection"
                    className="px-3 py-1 text-[10px] font-black text-[#1a1a1a] bg-[#FFCC00] uppercase tracking-wider border-2 border-white/20 hover:bg-[#FFE566] transition-colors">
                    Dashboard
                  </a>
                  <button onClick={() => { localStorage.removeItem("ttg-token"); document.cookie = "auth_token=; Max-Age=0; path=/"; document.cookie = "ttg_session=; Max-Age=0; path=/"; window.location.href = "/"; }}
                    className="px-3 py-1 text-[10px] font-black text-white/40 uppercase tracking-wider border-2 border-white/10 hover:border-[#E3350D] hover:text-[#E3350D] transition-colors">Log Out</button>
                </>
              ) : (
                <a href="/login"
                  className="px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider border-2 border-white/30 hover:border-[#FFCC00] hover:text-[#FFCC00] transition-colors">Sign In</a>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          <nav className="sm:hidden flex items-center justify-center gap-0 px-2 pb-2 overflow-x-auto">
            {(["home", "how-to-play", "collections", "tazos", "leaderboard", "faq"] as PageId[]).map(id => (
              <button key={id} onClick={() => navigate(id)}
                className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${
                  currentPage === id ? "text-[#FFCC00]" : "text-white/40 hover:text-[#FFCC00]"
                }`}>{PAGE_LABELS[id]}</button>
            ))}
          </nav>
        </header>

        {/* ═══ CONTENT AREA ═══ */}
        <main className="relative z-10 flex-1 flex flex-col px-3 sm:px-5">
          <div className="absolute top-0 left-0 right-0 h-2 mag-stripes opacity-20 pointer-events-none" />

          {!isHome && (
            <div className="max-w-5xl mx-auto w-full pt-6">
              <PageHeader title={PAGE_LABELS[currentPage]} onBack={() => navigate("home")} />
            </div>
          )}

          <div className={`${isHome ? "space-y-8" : "pb-8"}`}>
            {currentPage === "home" && (
              <>
                <div className="flex-1 flex items-center justify-center"><HomeHero user={user} onPlay={handlePlay} /></div>
                <TazoShowcase />
              </>
            )}
            
            {currentPage === "how-to-play" && (
              <div className="w-full max-w-5xl mx-auto"><HowToPlayContent /></div>
            )}
            
            {currentPage === "collections" && (
              <div className="w-full max-w-5xl mx-auto"><CollectionsContent onNavigate={navigate} /></div>
            )}
            
            {currentPage === "tazos" && (
              <div className="w-full max-w-5xl mx-auto"><TazosContent /></div>
            )}
            
            {currentPage === "leaderboard" && (
              <div className="w-full max-w-5xl mx-auto"><LeaderboardContent /></div>
            )}
            
            {currentPage === "download" && (
              <div className="w-full max-w-5xl mx-auto"><DownloadContent /></div>
            )}
            
            {currentPage === "faq" && (
              <div className="w-full max-w-5xl mx-auto"><FAQContent /></div>
            )}

            {(currentPage === "collections-minimon" || currentPage === "collections-dracobell" || currentPage === "collections-cybermon") && (
              <div className="w-full max-w-5xl mx-auto"><CollectionDetailContent collection={currentPage.replace("collections-", "")} /></div>
            )}
          </div>
        </main>

        {/* ═══ FOOTER ═══ */}
        <footer className="relative z-10 border-t-[5px] border-[#1a1a1a]" style={{ background: "#1a1a1a" }}>
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 px-3 py-2.5 border-b border-white/10">
            <PlatformBadge icon={Globe} label="Browser" />
            <PlatformBadge icon={Monitor} label="Windows" />
            <PlatformBadge icon={Apple} label="macOS" />
            <PlatformBadge icon={Terminal} label="Linux" />
            <button onClick={() => navigate("download")}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black text-[#1a1a1a] bg-[#FFCC00] uppercase tracking-wider border-2 border-white/20 hover:bg-[#FFE566] transition-colors">
              <Download className="w-3 h-3" /> Download
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-5 py-2 gap-2">
            <div className="flex items-center gap-3 sm:gap-4">
              <button onClick={() => navigate("tazos")} className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">Tazos</button>
              <a href="/battle-system" className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">Battle</a>
              <button onClick={() => navigate("faq")} className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">FAQ</button>
              <a href="/privacy" className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">Privacy</a>
              <span className="text-white/10">|</span>
              <a href="https://x.com/medaclaw" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-[#FFCC00] hover:border-[#FFCC00]/50 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.reddit.com/r/MedaclawArena/" target="_blank" rel="noopener noreferrer" aria-label="Reddit"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-[#FFCC00] hover:border-[#FFCC00]/50 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.6 12.6c0 .663-.537 1.2-1.2 1.2-.315 0-.603-.12-.816-.318A5.952 5.952 0 0 1 12 15.6a5.952 5.952 0 0 1-4.584-2.118A1.19 1.19 0 0 1 6.6 13.8c-.663 0-1.2-.537-1.2-1.2s.537-1.2 1.2-1.2c.315 0 .603.12.816.318a5.956 5.956 0 0 1 3.384-1.788l.72-3.384 2.94.624c.039-.327.312-.582.648-.582.363 0 .66.297.66.66s-.297.66-.66.66c-.234 0-.438-.123-.552-.306l-2.496-.528-.576 2.706a5.96 5.96 0 0 1 3.492 1.794c.213-.198.501-.318.816-.318.663 0 1.2.537 1.2 1.2zM9.6 13.2c-.48 0-.84.36-.84.84 0 .48.36.84.84.84s.84-.36.84-.84c0-.48-.36-.84-.84-.84zm4.8 0c-.48 0-.84.36-.84.84 0 .48.36.84.84.84s.84-.36.84-.84c0-.48-.36-.84-.84-.84zm-2.88 3.54c.48 0 .96.12 1.44.36.48-.24.96-.36 1.44-.36.18 0 .36-.18.36-.36s-.18-.36-.36-.36c-.66 0-1.26.18-1.74.48-.3-.18-.66-.3-1.14-.3s-.84.12-1.14.3c-.48-.3-1.08-.48-1.74-.48-.18 0-.36.18-.36.36s.18.36.36.36z"/></svg>
              </a>
              <a href="https://t.me/tradingtazosgame" target="_blank" rel="noopener noreferrer" aria-label="Telegram"
                className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-[#FFCC00] hover:border-[#FFCC00]/50 transition-all">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.96 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.696.064-1.225-.46-1.9-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.24-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.1-.002.321.023.465.14.121.099.155.233.171.328.016.095.036.31.02.482z"/></svg>
              </a>
            </div>
            <span className="text-[8px] font-black text-white/15 uppercase tracking-[0.3em]">© 2026 Trading Tazos Game · v0.3.1</span>
          </div>
        </footer>

        <div className="absolute bottom-0 left-0 right-0 h-2 mag-stripes opacity-20 pointer-events-none" />
      </div>
    </>
  )
}
