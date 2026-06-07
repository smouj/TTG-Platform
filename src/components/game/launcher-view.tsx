// ============================================================
// Trading Tazos Game — Magazine Launcher View
// 90s gaming-magazine aesthetic: halftone dots, heavy black
// borders, comic typography, CMYK accents, retro print feel.
// This IS the launcher that the desktop app (.exe/.dmg) loads.
// ============================================================
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import {
  Download, Globe, Monitor, Apple, Terminal,
  Zap, Star, Disc3, Swords, Medal, PackageOpen,
  BookOpen, ShoppingBag, BarChart3, Dices,
  ChevronLeft, ChevronRight,
} from "lucide-react"

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
      {/* Halftone dots */}
      <div className="mag-dots absolute inset-0 opacity-30" />

      {/* Logo */}
      <div className={`relative transition-all duration-600 ${
        phase === "cover" ? "scale-100 opacity-100" : "scale-90 opacity-70"
      }`}>
        {/* Starburst behind logo */}
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

      {/* Title — comic style */}
      <h1 className="mt-5 text-3xl sm:text-5xl font-black text-[#1a1a1a] uppercase tracking-[0.1em] text-center leading-none"
        style={{ textShadow: "3px 3px 0 rgba(227,53,13,0.3)" }}>
        TRADING<span className="text-[#E3350D]">TAZOS</span><span className="text-[#1a1a1a]">GAME</span>
      </h1>

      {/* Magazine subtitle */}
      <div className={`mt-2 flex items-center gap-2 transition-all duration-500 ${
        phase === "cover" ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}>
        <span className="w-3 h-[2px] bg-[#1a1a1a]" />
        <span className="text-[10px] sm:text-xs font-black text-[#1a1a1a]/50 uppercase tracking-[0.4em]">
          Official Game (Beta)
        </span>
        <span className="w-3 h-[2px] bg-[#1a1a1a]" />
      </div>

      {/* Loading — magazine page flip progress */}
      <div className={`mt-8 transition-all duration-500 ${
        phase === "flip" ? "opacity-100" : "opacity-0"
      }`}>
        {/* Magazine-stripe loading bar */}
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

// ── Magazine Platform Badge ──
function PlatformBadge({ icon: Icon, label }: { icon: typeof Monitor; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 border-2 border-[#1a1a1a] bg-white"
      style={{ boxShadow: "2px 2px 0 #1a1a1a" }}>
      <Icon className="w-3 h-3 text-[#1a1a1a]" />
      <span className="text-[9px] font-black text-[#1a1a1a] uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ── Stat Badge ──
function StatBadge({ number, label, color }: { number: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 border-2 border-[#1a1a1a] bg-white"
      style={{ boxShadow: `3px 3px 0 ${color}40` }}>
      <span className="text-lg sm:text-xl font-black text-[#1a1a1a] leading-none">{number}</span>
      <span className="text-[8px] font-black text-[#1a1a1a]/60 uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  )
}

// ── Preview Slider ──
const PREVIEW_SLIDES = [
  {
    icon: Disc3, label: "Tazo Collection",
    desc: "Browse all 319 tazos with search, filters & flip view. Track your album progress.",
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

  useEffect(() => {
    timerRef.current = setInterval(next, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [next])

  const slide = PREVIEW_SLIDES[active]
  const Icon = slide.icon

  return (
    <div className="w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[380px]">
      {/* Slide card */}
      <div className="relative border-3 border-[#1a1a1a] overflow-hidden transition-all duration-400"
        style={{ background: slide.bg, boxShadow: "4px 4px 0 #1a1a1a" }}>
        {/* Color accent bar */}
        <div className="h-1.5" style={{ background: slide.color }} />
        
        <div className="flex items-start gap-3 p-3 sm:p-4">
          {/* Icon block */}
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center border-2 border-[#1a1a1a] bg-white"
            style={{ boxShadow: "2px 2px 0 #1a1a1a" }}>
            <Icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: slide.color }} />
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-black text-[#1a1a1a] uppercase tracking-wider leading-tight">
              {slide.label}
            </h3>
            <p className="mt-0.5 text-[10px] sm:text-[11px] font-bold text-[#1a1a1a]/55 leading-relaxed">
              {slide.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Nav controls */}
      <div className="flex items-center justify-between mt-2">
        <button onClick={prev}
          className="flex items-center justify-center w-7 h-7 border-2 border-[#1a1a1a] bg-white hover:bg-[#FFF9E6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          style={{ boxShadow: "2px 2px 0 #1a1a1a" }}>
          <ChevronLeft className="w-3.5 h-3.5 text-[#1a1a1a]" />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {PREVIEW_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="transition-all duration-300 rounded-full"
              style={{
                width: i === active ? "18px" : "6px",
                height: "6px",
                background: i === active ? "#1a1a1a" : "#1a1a1a20",
                borderRadius: "3px",
              }} />
          ))}
        </div>

        <button onClick={next}
          className="flex items-center justify-center w-7 h-7 border-2 border-[#1a1a1a] bg-white hover:bg-[#FFF9E6] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          style={{ boxShadow: "2px 2px 0 #1a1a1a" }}>
          <ChevronRight className="w-3.5 h-3.5 text-[#1a1a1a]" />
        </button>
      </div>

      {/* Slide counter */}
      <p className="mt-1 text-center text-[8px] font-black text-[#1a1a1a]/25 uppercase tracking-[0.3em]">
        {active + 1} / {PREVIEW_SLIDES.length}
      </p>
    </div>
  )
}

// ── Main Magazine Launcher ──
export default function LauncherView() {
  const { user } = useAuth()
  const [showSplash, setShowSplash] = useState(false)
  const [hoverPlay, setHoverPlay] = useState(false)
  const [pressPlay, setPressPlay] = useState(false)
  const [showNews, setShowNews] = useState(false)

  const handlePlay = useCallback(() => setShowSplash(true), [])
  const handleSplashDone = useCallback(() => {
    setShowSplash(false)
    window.location.href = user ? "/app/collection" : "/login"
  }, [user])

  return (
    <>
      {showSplash && <MagazineSplash onFinish={handleSplashDone} />}

      {/* ── MAGAZINE PAGE ── */}
      <div className="min-h-screen flex flex-col relative"
        style={{ background: "#FFF9E6" }}>

        {/* Halftone overlay */}
        <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" />

        {/* ═══════════════════════════════════════════ */}
        {/* MAGAZINE MASTHEAD                          */}
        {/* ═══════════════════════════════════════════ */}
        <header className="relative z-10 border-b-[5px] border-[#1a1a1a]" style={{ background: "#1a1a1a" }}>
          {/* Main masthead */}
          <div className="flex items-center justify-between px-3 sm:px-5 py-2.5">
            <div className="flex items-center gap-2.5">
              <img src="/favicon-192.png" alt="TTG" className="w-7 h-7 sm:w-8 sm:h-8" />
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-[0.08em] leading-none">
                  TRADING<span className="text-[#FFCC00]">TAZOS</span><span className="text-white/80">GAME</span>
                </h2>
                <p className="text-[8px] font-bold text-[#FFCC00]/70 uppercase tracking-[0.3em] leading-none mt-0.5">
                  Official Game (Beta)
                </p>
              </div>
            </div>

            {/* Nav links — magazine section tabs */}
            <nav className="hidden sm:flex items-center gap-1">
              {[
                ["/how-to-play", "How to Play"],
                ["/collections", "Collections"],
                ["/leaderboard", "Rankings"],
                ["/faq", "FAQ"],
              ].map(([href, label]) => (
                <Link key={href} href={href}
                  className="px-2.5 py-1 text-[10px] font-black text-white/50 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">
                  {label}
                </Link>
              ))}
            </nav>

            {/* Auth */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Link href="/app/collection"
                    className="px-3 py-1 text-[10px] font-black text-[#1a1a1a] bg-[#FFCC00] uppercase tracking-wider border-2 border-white/20 hover:bg-[#FFE566] transition-colors">
                    Dashboard
                  </Link>
                  <button onClick={() => { localStorage.removeItem("ttg-token"); document.cookie = "auth_token=; Max-Age=0; path=/"; document.cookie = "ttg_session=; Max-Age=0; path=/"; window.location.href = "/"; }}
                    className="px-3 py-1 text-[10px] font-black text-white/40 uppercase tracking-wider border-2 border-white/10 hover:border-[#E3350D] hover:text-[#E3350D] transition-colors">
                    Log Out
                  </button>
                </>
              ) : (
                <Link href="/login"
                  className="px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider border-2 border-white/30 hover:border-[#FFCC00] hover:text-[#FFCC00] transition-colors">
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          <nav className="sm:hidden flex items-center justify-center gap-0 px-2 pb-2">
            {[
              ["/how-to-play", "How to Play"],
              ["/collections", "Collections"],
              ["/leaderboard", "Rankings"],
            ].map(([href, label]) => (
              <Link key={href} href={href}
                className="px-2 py-0.5 text-[9px] font-black text-white/40 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">
                {label}
              </Link>
            ))}
          </nav>
        </header>

        {/* ═══════════════════════════════════════════ */}
        {/* HERO — Magazine Cover Layout                 */}
        {/* ═══════════════════════════════════════════ */}
        <main className="relative z-10 flex-1 flex flex-col px-3 sm:px-5">
          {/* Diagonal stripe accent — top */}
          <div className="absolute top-0 left-0 right-0 h-2 mag-stripes opacity-20 pointer-events-none" />

          <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 py-8 sm:py-10 lg:py-0">

            {/* ═══ LEFT COLUMN — Logo + Stats + Badges ═══ */}
            <div className="flex flex-col items-center lg:items-start gap-4 sm:gap-5">

              {/* Logo with magazine frame */}
              <div className="relative">
                {/* Comic burst behind logo */}
                <div className="absolute -inset-6 sm:-inset-8 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="absolute w-0.5 sm:w-1 bg-[#E3350D]/20"
                      style={{
                        height: `${20 + Math.random() * 30}%`,
                        left: "50%", top: "50%",
                        transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-60%)`,
                      }} />
                  ))}
                </div>

                {/* Yellow ring */}
                <div className="absolute -inset-3 rounded-full border-[3px] border-[#FFCC00] pointer-events-none" />
                <div className="absolute -inset-[18px] rounded-full border-2 border-[#1a1a1a]/10 pointer-events-none" />

                <img
                  src="/logo/logo-icon-black.webp"
                  alt="TTG"
                  className="w-18 h-18 sm:w-24 sm:h-24 lg:w-20 lg:h-20"
                  style={{ filter: "drop-shadow(4px 4px 0 rgba(26,26,26,0.3))" }}
                />
              </div>

              {/* Compact tagline */}
              <div className="text-center lg:text-left">
                <h2 className="text-sm sm:text-base lg:text-lg font-black text-[#1a1a1a] uppercase tracking-[0.08em] leading-tight">
                  <span className="text-[#E3350D]">Collect</span> · <span className="text-[#FFCC00]">Trade</span> · <span className="text-[#00A1E9]">Battle</span>
                </h2>
                <p className="mt-0.5 text-[10px] font-bold text-[#1a1a1a]/40 uppercase tracking-[0.2em]">
                  The classic tazo arena
                </p>
              </div>

              {/* ── Preview Slider ── */}
              <PreviewSlider />

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                <StatBadge number="319" label="Tazos" color="#FFCC00" />
                <StatBadge number="3" label="Worlds" color="#E3350D" />
                <StatBadge number="9" label="Stats" color="#00A1E9" />
                <StatBadge number="5" label="Cards" color="#22C55E" />
              </div>

              {/* Starburst badges */}
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

            {/* ═══ RIGHT COLUMN — PLAY Button + Featured cards ═══ */}
            <div className="flex flex-col items-center gap-5 sm:gap-6">

              {/* ═══ MASSIVE PLAY BUTTON ═══ */}
              <button
                onClick={handlePlay}
                onMouseEnter={() => setHoverPlay(true)}
                onMouseLeave={() => { setHoverPlay(false); setPressPlay(false); }}
                onMouseDown={() => setPressPlay(true)}
                onMouseUp={() => setPressPlay(false)}
                onTouchStart={() => setPressPlay(true)}
                onTouchEnd={() => setPressPlay(false)}
                className="group relative select-none"
                style={{
                  transform: pressPlay ? "translate(2px, 2px)" : hoverPlay ? "translate(-2px, -2px)" : "translate(0, 0)",
                  transition: "transform 0.15s ease",
                }}
              >
                {/* Shadow layer */}
                <div className="absolute inset-0 translate-x-2 translate-y-2"
                  style={{ background: "#1a1a1a" }} />

                {/* Main button */}
                <div className="relative px-10 sm:px-14 md:px-20 py-3.5 sm:py-4 md:py-5 border-[4px] border-[#1a1a1a] overflow-hidden"
                  style={{
                    background: (hoverPlay || pressPlay)
                      ? "linear-gradient(180deg, #FFE566 0%, #FFCC00 50%, #F5B800 100%)"
                      : "linear-gradient(180deg, #FFCC00 0%, #F0A800 100%)",
                    boxShadow: (hoverPlay || pressPlay)
                      ? "inset 0 -4px 0 rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.3)"
                      : "inset 0 -3px 0 rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  {/* Comic action lines on hover */}
                  <div className={`absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 transition-opacity duration-200 ${
                    hoverPlay ? "opacity-100" : "opacity-0"
                  }`}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-3 h-0.5 bg-[#1a1a1a]/40"
                        style={{ marginRight: `${-(i * 4)}px`, width: `${12 + i * 6}px` }} />
                    ))}
                  </div>

                  <span className="relative text-lg sm:text-xl md:text-2xl font-black text-[#1a1a1a] uppercase tracking-[0.15em] whitespace-nowrap">
                    Play Now
                  </span>

                  {/* Overlay halftone */}
                  <div className="mag-halftone absolute inset-0 opacity-20 pointer-events-none" />
                </div>


              </button>

              {/* Status */}
              <p className="text-[10px] font-black text-[#1a1a1a]/40 uppercase tracking-wider text-center">
                {user
                  ? "Ready for battle?"
                  : "Create a free account to start playing!"}
              </p>

              {/* Feature cards — magazine "articles" */}
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {[
                  {
                    icon: PackageOpen, label: "Open Bags",
                    desc: "319 tazos to collect",
                    color: "#FFCC00", href: "/tazos",
                  },
                  {
                    icon: Swords, label: "Practice Mode",
                    desc: "No account needed!",
                    color: "#E3350D", href: "/game/practice",
                  },
                  {
                    icon: Disc3, label: "319 Tazos",
                    desc: "Collect them all!",
                    color: "#00A1E9", href: "/tazos",
                  },
                  {
                    icon: Medal, label: "Leaderboard",
                    desc: "See top players",
                    color: "#22C55E", href: "/leaderboard",
                  },
                ].map(({ icon: Icon, label, desc, color, href }) => (
                  <Link key={label} href={href}
                    className="group flex items-start gap-2 p-2.5 border-2 border-[#1a1a1a] bg-white hover:bg-[#FFF9E6] transition-colors"
                    style={{
                      boxShadow: "3px 3px 0 #1a1a1a",
                      transform: "translate(0, 0)",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "translate(-1px, -1px)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "translate(0, 0)")}
                  >
                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center border-2 border-[#1a1a1a]"
                      style={{ backgroundColor: `${color}30` }}>
                      <Icon className="w-3.5 h-3.5 text-[#1a1a1a]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-[#1a1a1a] uppercase tracking-wider leading-none">{label}</p>
                      <p className="text-[8px] font-bold text-[#1a1a1a]/50 uppercase mt-0.5">{desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* ═══════════════════════════════════════════ */}
        {/* FOOTER — Platforms + Bottom Info             */}
        {/* ═══════════════════════════════════════════ */}
        <footer className="relative z-10 border-t-[5px] border-[#1a1a1a]"
          style={{ background: "#1a1a1a" }}>

          {/* Platform bar */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 px-3 py-2.5 border-b border-white/10">
            <PlatformBadge icon={Globe} label="Browser" />
            <PlatformBadge icon={Monitor} label="Windows" />
            <PlatformBadge icon={Apple} label="macOS" />
            <PlatformBadge icon={Terminal} label="Linux" />
            <Link href="/download"
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black text-[#1a1a1a] bg-[#FFCC00] uppercase tracking-wider border-2 border-white/20 hover:bg-[#FFE566] transition-colors">
              <Download className="w-3 h-3" /> Download
            </Link>
          </div>

          {/* Bottom links */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-5 py-2 gap-2">
            <div className="flex items-center gap-3 sm:gap-5">
              <Link href="/tazos" className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">
                Tazo Catalog
              </Link>
              <Link href="/battle-system" className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">
                Battle System
              </Link>
              <Link href="/faq" className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">
                FAQ
              </Link>
              <Link href="/privacy" className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors">
                Privacy
              </Link>
            </div>
            <span className="text-[8px] font-black text-white/15 uppercase tracking-[0.3em]">
              © 2026 Trading Tazos Game · v0.3.1
            </span>
          </div>
        </footer>

        {/* Diagonal stripe accent — bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-2 mag-stripes opacity-20 pointer-events-none" />
      </div>
    </>
  )
}
