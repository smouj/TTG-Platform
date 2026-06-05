// ============================================================
// Trading Tazos Game — LauncherView
// Game-launcher landing: dark theme, big PLAY button, splash intro.
// This IS the launcher that the desktop app (.exe/.dmg) loads.
// ============================================================
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import {
  Play, Download, Settings, Globe, Disc3, BookOpen,
  Trophy, Swords, Zap, ExternalLink, ChevronRight, Sparkles, Monitor, Apple, Terminal,
} from "lucide-react"

// ── Splash Screen ──
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<"logo" | "loading" | "done">("logo")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Phase 1: Logo reveal (1.5s)
    const t1 = setTimeout(() => setPhase("loading"), 1500)
    // Phase 2: Loading bar fills (2s)
    const t2 = setTimeout(() => {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(interval); return 100 }
          return p + Math.random() * 15 + 5
        })
      }, 100)
    }, 1600)
    // Phase 3: Done → callback (total ~3.5s)
    const t3 = setTimeout(() => onFinish(), 3600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onFinish])

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
      {/* Logo */}
      <div className={`transition-all duration-700 ${phase === "logo" ? "opacity-100 scale-100" : "opacity-60 scale-95"}`}>
        <img
          src="/logo/logo-icon-black.webp"
          alt="Trading Tazos Game"
          className="w-32 h-32 sm:w-40 sm:h-40 drop-shadow-[0_0_40px_rgba(255,204,0,0.5)]"
        />
      </div>

      {/* Title */}
      <h1 className={`mt-6 text-3xl sm:text-5xl font-black text-white uppercase tracking-[0.3em] transition-all duration-500 ${
        phase === "logo" ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      }`}>
        TRADING TAZOS
      </h1>
      <p className={`text-xs sm:text-sm font-bold text-[#FFCC00]/60 uppercase tracking-[0.5em] mt-2 transition-all duration-500 delay-200 ${
        phase === "logo" ? "opacity-0" : "opacity-100"
      }`}>
        Game Studio
      </p>

      {/* Loading bar */}
      <div className={`mt-10 w-48 sm:w-64 transition-all duration-500 ${phase === "loading" ? "opacity-100" : "opacity-0"}`}>
        <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#FFCC00] rounded-full transition-all duration-200 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-[8px] font-bold text-white/20 text-right mt-1 uppercase tracking-wider">
          v0.3.1 — Initializing engine...
        </p>
      </div>

      {/* Particle dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-[#FFCC00]/40 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: Math.random() * 0.5 + 0.1,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Platform Badge ──
function PlatformBadge({ icon: Icon, label, available }: { icon: typeof Monitor; label: string; available: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase border ${
      available ? "border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/5" : "border-white/10 text-white/20 bg-white/[0.02]"
    }`}>
      <Icon className="w-3 h-3" />
      <span>{label}</span>
      <span className={`w-1 h-1 rounded-full ${available ? "bg-[#22C55E]" : "bg-white/10"}`} />
    </div>
  )
}

// ── Main Launcher ──
export default function LauncherView() {
  const { user } = useAuth()
  const [showSplash, setShowSplash] = useState(false)
  const [hoverPlay, setHoverPlay] = useState(false)

  const handlePlay = useCallback(() => {
    setShowSplash(true)
  }, [])

  const handleSplashDone = useCallback(() => {
    setShowSplash(false)
    // Navigate based on auth state
    if (user) {
      window.location.href = "/app/album"
    } else {
      window.location.href = "/login"
    }
  }, [user])

  return (
    <>
      {/* Splash overlay */}
      {showSplash && <SplashScreen onFinish={handleSplashDone} />}

      {/* Launcher background */}
      <div className="min-h-screen relative overflow-hidden bg-black flex flex-col">
        {/* Ambient glow behind logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[600px] h-[400px] bg-[#FFCC00]/5 blur-[120px] rounded-full pointer-events-none" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* ═══════════════════════════════════════════ */}
        {/* TOP NAV BAR                                  */}
        {/* ═══════════════════════════════════════════ */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <img src="/logo/logo-icon-black.webp" alt="TTG" className="w-7 h-7 opacity-80" />
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] hidden sm:inline">Trading Tazos</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/how-to-play" className="text-[10px] font-bold text-white/40 hover:text-white/80 uppercase tracking-wider transition-colors">How to Play</Link>
            <Link href="/collections" className="text-[10px] font-bold text-white/40 hover:text-white/80 uppercase tracking-wider transition-colors">Collections</Link>
            <Link href="/leaderboard" className="text-[10px] font-bold text-white/40 hover:text-white/80 uppercase tracking-wider transition-colors">Leaderboard</Link>
            <Link href="/faq" className="text-[10px] font-bold text-white/40 hover:text-white/80 uppercase tracking-wider transition-colors hidden sm:inline">FAQ</Link>
            {user ? (
              <Link href="/app/album" className="text-[10px] font-black text-[#FFCC00] hover:text-[#FFE566] uppercase tracking-wider transition-colors">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="text-[10px] font-black text-white/60 hover:text-white uppercase tracking-wider transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </nav>

        {/* ═══════════════════════════════════════════ */}
        {/* CENTER — LOGO + PLAY BUTTON                  */}
        {/* ═══════════════════════════════════════════ */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 -mt-10">
          {/* Logo */}
          <div className="relative">
            <img
              src="/logo/logo-icon-black.webp"
              alt="Trading Tazos Game"
              className="w-28 h-28 sm:w-36 sm:h-36 drop-shadow-[0_0_60px_rgba(255,204,0,0.3)] animate-pulse-glow"
            />
            {/* Ring glow animation */}
            <div className="absolute inset-0 rounded-full border border-[#FFCC00]/10 animate-spin-slow" />
            <div className="absolute -inset-4 rounded-full border border-[#FFCC00]/5 animate-spin-slow-reverse" />
          </div>

          {/* Title */}
          <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-[0.15em] text-center">
            TRADING<span className="text-[#FFCC00]"> TAZOS</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm font-bold text-white/30 uppercase tracking-[0.4em]">
            Collect · Build · Battle
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-6 text-[10px] font-bold text-white/20 uppercase tracking-wider">
            <span>319 Tazos</span>
            <span className="w-0.5 h-3 bg-white/10" />
            <span>3 Franchises</span>
            <span className="w-0.5 h-3 bg-white/10" />
            <span>9 Stats</span>
            <span className="w-0.5 h-3 bg-white/10" />
            <span>5-Card Decks</span>
          </div>

          {/* ══ PLAY BUTTON ══ */}
          <button
            onClick={handlePlay}
            onMouseEnter={() => setHoverPlay(true)}
            onMouseLeave={() => setHoverPlay(false)}
            className="group relative mt-8 px-12 sm:px-16 py-4 sm:py-5 overflow-hidden transition-all duration-300"
            style={{
              background: hoverPlay
                ? "linear-gradient(135deg, #FFE566 0%, #FFCC00 50%, #FFB800 100%)"
                : "linear-gradient(135deg, #FFCC00 0%, #FFB800 100%)",
              boxShadow: hoverPlay
                ? "0 0 60px rgba(255,204,0,0.4), 0 0 120px rgba(255,204,0,0.15)"
                : "0 0 30px rgba(255,204,0,0.2)",
            }}
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center gap-3 text-base sm:text-xl font-black text-[#1a1a1a] uppercase tracking-[0.2em]">
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-[#1a1a1a]" />
              JUGAR
            </span>
          </button>

          {/* Status line */}
          <p className="mt-3 text-[9px] font-bold text-white/20 uppercase tracking-wider">
            {user ? `Welcome back, ${user.displayName || user.name}` : "v0.3.1 — Ready to launch"}
          </p>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* BOTTOM BAR — Platforms + Quick Links         */}
        {/* ═══════════════════════════════════════════ */}
        <div className="relative z-10 border-t border-white/[0.06] px-6 py-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Platforms */}
            <div className="flex items-center gap-2">
              <PlatformBadge icon={Globe} label="Browser" available />
              <PlatformBadge icon={Monitor} label="Windows" available />
              <PlatformBadge icon={Apple} label="macOS" available />
              <PlatformBadge icon={Terminal} label="Linux" available />
            </div>

            {/* Quick links */}
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/download" className="flex items-center gap-1 text-[10px] font-bold text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors">
                <Download className="w-3 h-3" /> Download
              </Link>
              <Link href="/tazos" className="flex items-center gap-1 text-[10px] font-bold text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors">
                <Disc3 className="w-3 h-3" /> Tazo Catalog
              </Link>
              <Link href="/battle-system" className="flex items-center gap-1 text-[10px] font-bold text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors">
                <Swords className="w-3 h-3" /> Battle System
              </Link>
              <span className="text-[9px] font-bold text-white/10">v0.3.1</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
