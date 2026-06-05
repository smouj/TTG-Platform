// ============================================================
// Trading Tazos Game — Game Shell
// Video-game client experience: dark immersive background,
// game-style navigation, HUD overlay, ambient effects.
// Used ONLY by /app/* pages (the actual game).
// ============================================================
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import LanguageSwitcher from "@/components/ui/language-switcher"
import {
  BookOpen, Swords, BarChart3, ShoppingBag,
  Target, Disc3, Layers, LogOut, Settings, Home, Zap,
  User, ChevronDown, Volume2, VolumeX, Gamepad2,
} from "lucide-react"

type TabId = "album" | "battle" | "stats" | "shop" | "quests" | "collection" | "decks" | "settings"

const NAV_ITEMS: { id: TabId; label: string; icon: typeof BookOpen; href: string }[] = [
  { id: "album", label: "Album", icon: BookOpen, href: "/app/album" },
  { id: "battle", label: "Battle", icon: Swords, href: "/app/battle" },
  { id: "collection", label: "Collection", icon: Disc3, href: "/app/collection" },
  { id: "shop", label: "Shop", icon: ShoppingBag, href: "/app/shop" },
  { id: "decks", label: "Decks", icon: Layers, href: "/app/decks" },
  { id: "stats", label: "Stats", icon: BarChart3, href: "/app/stats" },
  { id: "quests", label: "Quests", icon: Target, href: "/app/quests" },
  { id: "settings", label: "Settings", icon: Settings, href: "/app/settings" },
]

// ── Ambient particle background ──
function GameAmbient() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Dark gradient base */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #0f0f1a 60%, #0a0a14 100%)",
      }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px",
      }} />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full opacity-[0.03]"
        style={{ background: "radial-gradient(circle, #FFCC00, transparent 70%)" }} />
      <div className="absolute bottom-1/3 -right-20 w-96 h-96 rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, #00A1E9, transparent 70%)" }} />
      <div className="absolute top-2/3 left-1/3 w-64 h-64 rounded-full opacity-[0.03]"
        style={{ background: "radial-gradient(circle, #E3350D, transparent 70%)" }} />

      {/* Floating particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="absolute w-0.5 h-0.5 bg-[#FFCC00]/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float-particle ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
      ))}
    </div>
  )
}

// ── Game Status Bar (bottom HUD) ──
function GameStatusBar({ credits, tazoCount, tazoTotal }: { credits?: number; tazoCount?: number; tazoTotal?: number }) {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-[10px] font-bold">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-white/50">
            <User className="w-3 h-3" /> {user.displayName || user.name}
          </span>
          <span className="flex items-center gap-1.5 text-[#FFCC00]">
            <Zap className="w-3 h-3" /> {credits != null ? credits : "—"} Credits
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/30">{tazoCount != null ? `${tazoCount}/${tazoTotal || 319}` : "—"} Tazos</span>
          <span className="text-white/15">v0.3.1</span>
        </div>
      </div>
    </div>
  )
}

export default function GameShell({
  children,
  currentTab,
}: {
  children: React.ReactNode
  currentTab?: TabId
}) {
  const { t } = useI18n()
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [credits, setCredits] = useState<number | undefined>(undefined)
  const [menuOpen, setMenuOpen] = useState(false)

  // Fetch credits
  useEffect(() => {
    if (!user) { setCredits(undefined); return }
    const token = localStorage.getItem("token")
    fetch("/api/auth/me", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user?.credits != null) setCredits(d.user.credits) })
      .catch(() => {})
  }, [user])

  const handleLogout = () => { logout(); router.push("/") }

  return (
    <div className="min-h-screen relative bg-[#0a0a14] text-white flex flex-col">
      {/* Ambient background */}
      <GameAmbient />

      {/* ═══════════════════════════════════════════ */}
      {/* GAME NAV BAR                                  */}
      {/* ═══════════════════════════════════════════ */}
      <header className="relative z-30 border-b border-white/[0.06] bg-black/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between h-12 sm:h-14">

          {/* Logo + Home */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <img src="/logo/logo-icon-black.webp" alt="TTG" className="w-7 h-7 sm:w-8 sm:h-8 opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="hidden sm:block">
              <span className="text-[10px] font-black text-white/80 uppercase tracking-[0.12em]">TRADING</span>
              <span className="text-[10px] font-black text-[#FFCC00] uppercase tracking-[0.12em] ml-1">TAZOS</span>
            </div>
          </Link>

          {/* Desktop nav tabs */}
          <nav className="hidden md:flex items-center gap-0.5 mx-2">
            {NAV_ITEMS.map(({ id, label, icon: Icon, href }) => {
              const isActive = currentTab === id || pathname === href
              return (
                <Link key={id} href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition-all duration-150 ${
                    isActive
                      ? "text-[#FFCC00] bg-[#FFCC00]/10 border-b-2 border-[#FFCC00]"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                  }`}>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#FFCC00]" : ""}`} />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile menu toggle */}
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center gap-1 px-2 py-1 text-[10px] font-black text-white/50 hover:text-white uppercase tracking-wider transition-colors">
              <Gamepad2 className="w-3.5 h-3.5" />
              <ChevronDown className={`w-3 h-3 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            <LanguageSwitcher />

            {!loading && user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[10px] font-bold text-white/30 tracking-wider">{user.displayName || user.name}</span>
                <button onClick={handleLogout}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-white/30 hover:text-[#E3350D] uppercase tracking-wider transition-colors">
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {menuOpen && (
          <nav className="md:hidden border-t border-white/[0.06] bg-black/90 backdrop-blur-md px-2 py-2 grid grid-cols-4 gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon, href }) => {
              const isActive = currentTab === id || pathname === href
              return (
                <Link key={id} href={href} onClick={() => setMenuOpen(false)}
                  className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[9px] font-black uppercase tracking-wider transition-all ${
                    isActive
                      ? "text-[#FFCC00] bg-[#FFCC00]/10"
                      : "text-white/40 hover:text-white/60"
                  }`}>
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#FFCC00]" : ""}`} />
                  {label}
                </Link>
              )
            })}
          </nav>
        )}
      </header>

      {/* ═══════════════════════════════════════════ */}
      {/* GAME CONTENT AREA                            */}
      {/* ═══════════════════════════════════════════ */}
      <main className="relative z-10 flex-1 pb-10">
        {children}
      </main>

      {/* ═══════════════════════════════════════════ */}
      {/* STATUS BAR (bottom HUD)                      */}
      {/* ═══════════════════════════════════════════ */}
      <GameStatusBar credits={credits} />

      {/* Floating particle animation */}
      <style jsx global>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
