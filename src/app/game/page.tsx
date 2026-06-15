"use client"

// ============================================================
// Trading Tazos Game — Game Hub /game
// The central playable entry point per GDD §4.1.
// NEVER returns 404. Guest-accessible.
// ============================================================

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { playSFX, sfxEnsureUnlocked } from "@/lib/audio/sfx-engine"
import {
  Swords, Bot, Globe, Play, Zap, Shield, Crosshair, Star, Users,
  User, Layers, Loader2, BookOpen, Download, ArrowRight, Trophy,
  PackageOpen, Disc3, Medal, Gift, Clock, Sparkles, Sword, Gamepad2,
} from "lucide-react"

// ── Mode definitions ──
interface HubMode {
  id: string
  icon: typeof Bot
  title: string
  desc: string
  color: string
  badge?: string
  href: string
  guestOk: boolean
}
const MODES: HubMode[] = [
  {
    id: "practice", icon: Bot, title: "Practice", guestOk: true,
    desc: "Train against AI — no stakes, no pressure. Adjustable difficulty.",
    color: "#22C55E", badge: "FREE PLAY", href: "/game/practice",
  },
  {
    id: "ranked", icon: Trophy, title: "Ranked", guestOk: false,
    desc: "Compete in PvP matchmaking. Climb Bronze→Grandmaster.",
    color: "#E3350D", badge: "COMPETITIVE", href: "/game/ranked",
  },
  {
    id: "friend", icon: Users, title: "Friend Room", guestOk: false,
    desc: "Private PvP with room code. Custom rules, no Elo stakes.",
    color: "#3B4CCA", badge: "PRIVATE", href: "/game/friend/new",
  },
]

const QUICK_ACTIONS = [
  { icon: PackageOpen, label: "Open Bags", href: "/app/shop", color: "#FF6B00", guest: true },
  { icon: Disc3, label: "Collection", href: "/app/collection", color: "#00A1E9", guest: true },
  { icon: Layers, label: "Deck Builder", href: "/app/decks", color: "#A855F7", guest: false },
  { icon: Medal, label: "Rankings", href: "/?page=leaderboard", color: "#F59E0B", guest: true },
]

const STATS_HIGHLIGHTS = [
  { value: "150", label: "Tazos", color: "#FFCC00" },
  { value: "3", label: "Series", color: "#E3350D" },
  { value: "9", label: "Stats", color: "#3B4CCA" },
  { value: "Free", label: "Forever", color: "#22C55E" },
]

export default function GameHubPage() {
  const { user, loading: authLoading } = useAuth() as { user: any; loading: boolean }
  const [stats, setStats] = useState<{ ownedTazos?: number; credits?: number } | null>(null)

  useEffect(() => {
    sfxEnsureUnlocked()
    if (user) {
      fetch("/api/me")
        .then(r => r.json())
        .then(d => setStats(d))
        .catch(() => {})
    }
  }, [user])

  const handleModeClick = useCallback((mode: HubMode) => {
    playSFX("click")
    if (!mode.guestOk && !user) {
      // Redirect to login for auth-required modes
      window.location.href = `/login?redirect=${encodeURIComponent(mode.href)}`
      return
    }
    window.location.href = mode.href
  }, [user])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#FFF9E6" }}>
        <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" />
        <Loader2 className="w-8 h-8 text-[#FFCC00] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#FFF9E6" }}>
      <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" />

      {/* ═══ TOP BAR ═══ */}
      <header className="relative z-10 border-b-[5px] border-[#FFCC00] bg-[#1a1a1a] px-4 sm:px-6 py-2.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/favicon-192.png" alt="TTG" className="w-7 h-7" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-[0.06em] leading-none">
                <span className="text-[#FFCC00]">GAME</span> HUB
              </h2>
              <p className="text-[7px] font-bold text-[#FFCC00]/60 uppercase tracking-[0.3em] leading-none mt-0.5">Choose your battle</p>
            </div>
          </Link>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-white/60">
                <User className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">{user.name || "Player"}</span>
              </div>
              {stats?.credits != null && (
                <span className="text-[10px] font-black text-[#FFCC00] bg-[#FFCC00]/10 px-2 py-0.5 border border-[#FFCC00]/20">
                  {stats.credits} CREDITS
                </span>
              )}
            </div>
          ) : (
            <Link href="/login" className="px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider border border-white/30 hover:border-[#FFCC00] hover:text-[#FFCC00] transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-4xl space-y-8">

          {/* ── GUEST BANNER ── */}
          {!user && (
            <div className="border-2 border-[#FFCC00]/30 bg-[#FFCC00]/5 px-4 py-3 flex items-center gap-3 flex-wrap">
              <Gamepad2 className="w-4 h-4 text-[#FFCC00] shrink-0" />
              <p className="text-[11px] sm:text-xs font-bold text-[#1a1a1a]/60 flex-1">
                Playing as guest — Practice mode is fully available. Sign in to save progress, play Ranked, and build your collection.
              </p>
              <Link href="/login" className="text-[10px] font-black text-[#1a1a1a] bg-[#FFCC00] px-3 py-1.5 border border-[#1a1a1a]/20 hover:bg-[#FFE566] transition-colors uppercase tracking-wider whitespace-nowrap">
                Sign In Free
              </Link>
            </div>
          )}

          {/* ── MODE CARDS ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Swords className="w-4 h-4 text-[#E3350D]" />
              <h1 className="text-sm sm:text-base font-black text-[#1a1a1a] uppercase tracking-[0.06em]">Select Game Mode</h1>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
              {MODES.map(mode => {
                const Icon = mode.icon
                const locked = !mode.guestOk && !user
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleModeClick(mode)}
                    onMouseEnter={() => sfxEnsureUnlocked()}
                    className={`relative text-left border-[3px] border-[#1a1a1a] bg-white overflow-hidden transition-all group ${
                      locked ? "opacity-60 cursor-not-allowed" : "hover:-translate-y-1 hover:shadow-[5px_5px_0px_#1a1a1a] cursor-pointer"
                    }`}
                    style={{ boxShadow: locked ? "2px 2px 0 #1a1a1a" : "3px 3px 0 #1a1a1a" }}
                    disabled={locked}
                  >
                    {/* Color strip */}
                    <div className="h-1.5" style={{ background: mode.color }} />
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-[3px] border-[#1a1a1a] bg-white group-hover:scale-110 transition-transform"
                          style={{ boxShadow: "2px 2px 0 #1a1a1a" }}>
                          <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: mode.color }} />
                        </div>
                        {mode.badge && (
                          <span className="text-[7px] font-black uppercase px-1.5 py-0.5 border border-[#1a1a1a]/15"
                            style={{ color: mode.color, background: `${mode.color}10` }}>
                            {mode.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-[#1a1a1a] uppercase mb-0.5">
                        {mode.title}
                        {locked && <span className="ml-1.5 text-[9px] text-[#1a1a1a]/25">🔒</span>}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] font-bold text-[#1a1a1a]/45 leading-relaxed">{mode.desc}</p>
                      {locked && (
                        <p className="mt-1.5 text-[9px] font-black text-[#E3350D]/60 uppercase">Sign in required</p>
                      )}
                      {!locked && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase"
                          style={{ color: mode.color }}>
                          PLAY <ArrowRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── QUICK ACTIONS ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-[#FFCC00]" />
              <h2 className="text-xs font-black text-[#1a1a1a]/40 uppercase tracking-[0.15em]">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {QUICK_ACTIONS.map(a => {
                const Icon = a.icon
                const locked = !a.guest && !user
                return (
                  <Link key={a.label}
                    href={locked ? "/login" : a.href}
                    onClick={() => playSFX("click")}
                    className={`flex flex-col items-center gap-1.5 p-2.5 sm:p-3 border-2 border-[#1a1a1a]/10 bg-white hover:border-[#1a1a1a]/25 hover:bg-[#FFF9E6]/60 transition-all group/qk ${locked ? "opacity-50" : ""}`}>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border-2 border-[#1a1a1a]/10 bg-white group-hover/qk:scale-110 transition-transform">
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: a.color }} />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black text-[#1a1a1a] uppercase tracking-wider text-center leading-tight">
                      {a.label}
                    </span>
                    {locked && <span className="text-[7px] text-[#1a1a1a]/25">🔒</span>}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* ── STATS STRIP ── */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 pt-4 border-t-2 border-[#1a1a1a]/5">
            {STATS_HIGHLIGHTS.map(s => (
              <span key={s.label} className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-[#1a1a1a]/30 uppercase">
                <span className="text-sm sm:text-base" style={{ color: s.color }}>{s.value}</span>
                {s.label}
              </span>
            ))}
          </div>

          {/* ── BACK HOME ── */}
          <div className="text-center pt-2">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[10px] font-black text-[#1a1a1a]/25 uppercase hover:text-[#FFCC00] transition-colors tracking-[0.15em]">
              ← Back to Trading Tazos Game
            </Link>
          </div>

        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="relative z-10 border-t-[5px] border-[#FFCC00] bg-[#1a1a1a] py-2.5 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-4 text-[8px] font-bold text-white/15 uppercase">
          <span>© {new Date().getFullYear()} Trading Tazos Game</span>
          <span className="text-white/10">·</span>
          <Link href="/" className="hover:text-[#FFCC00] transition-colors">Home</Link>
          <span className="text-white/10">·</span>
          <Link href="/?page=faq" className="hover:text-[#FFCC00] transition-colors">FAQ</Link>
        </div>
      </footer>
    </div>
  )
}
