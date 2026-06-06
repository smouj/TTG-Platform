// ============================================================
// Trading Tazos Game — Magazine Page Shell
// 90s gaming magazine aesthetic: cream paper, yellow masthead,
// comic typography, 3px black borders, halftone patterns.
// Full visual coherence — no dark backgrounds.
// ============================================================
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { sfxEnsureUnlocked } from "@/lib/audio/sfx-engine"
import LanguageSwitcher from "@/components/ui/language-switcher"
import {
  BookOpen, Swords, BarChart3, ShoppingBag,
  Target, Disc3, Layers, LogOut, Home, Settings, Shield, Coins,
} from "lucide-react"

type TabId = "album" | "battle" | "stats" | "shop" | "quests" | "collection" | "decks" | "settings"

const NAV_ITEMS: { id: TabId; label: string; icon: typeof BookOpen; href: string }[] = [
  { id: "album", label: "Album", icon: BookOpen, href: "/app/album" },
  { id: "battle", label: "Battle!", icon: Swords, href: "/app/battle" },
  { id: "collection", label: "Collection", icon: Disc3, href: "/app/collection" },
  { id: "shop", label: "Shop", icon: ShoppingBag, href: "/app/shop" },
  { id: "decks", label: "Decks", icon: Layers, href: "/app/decks" },
  { id: "stats", label: "Stats", icon: BarChart3, href: "/app/stats" },
  { id: "quests", label: "Quests", icon: Target, href: "/app/quests" },
  { id: "settings", label: "Settings", icon: Settings, href: "/app/settings" },
]

// ── HUD status bar (bottom) — magazine-style ──
function GameHUD({ credits, tazoCount }: { credits?: number; tazoCount?: number }) {
  const { user } = useAuth()
  if (!user) return null
  return (
    <div className="sticky bottom-0 z-40 bg-[#FFCC00] border-t-4 border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#1a1a1a]">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-[#1a1a1a]/50">{user.displayName || user.name}</span>
          <span className="flex items-center gap-1">
            <Coins className="w-3 h-3" /> {credits != null ? credits : "—"}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-[#1a1a1a]/40">{tazoCount != null ? `${tazoCount}/319` : ""} TAZOS</span>
          <span className="text-[#1a1a1a]/25 text-[7px] sm:text-[8px] tracking-[0.15em]">v0.3.1</span>
        </div>
      </div>
    </div>
  )
}

export default function MagazinePageShell({
  children,
  currentTab,
  showFooter = true,
}: {
  children: React.ReactNode
  currentTab?: TabId
  showFooter?: boolean
}) {
  const { t } = useI18n()
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [credits, setCredits] = useState<number>(0)

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem("token")
    fetch("/api/credits", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json())
      .then(d => { if (d.credits != null) setCredits(d.credits) })
      .catch(() => {})
  }, [user])

  // Unlock audio context on first interaction
  useEffect(() => { sfxEnsureUnlocked() }, [])

  return (
    <div className="min-h-screen flex flex-col mag-bg">
      {/* Halftone overlay — magazine texture */}
      <div className="mag-halftone fixed inset-0 pointer-events-none opacity-20 z-0" />

      {/* ═══════════════════════════════════════ */}
      {/* MAGAZINE MASTHEAD                        */}
      {/* ═══════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-[#FFCC00] border-b-4 border-[#1a1a1a] mag-stripes">
        {/* Top bar — utility strip */}
        <div className="bg-[#1a1a1a] text-white text-center py-1 px-3 sm:px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-zinc-400 hover:text-[#FFCC00] transition-colors tracking-wider uppercase">
            <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">{t.nav_back_to_home || "Back to Home"}</span>
          </Link>
          <span className="text-[9px] sm:text-[10px] font-black tracking-[3px] uppercase text-[#FFCC00]">
            {t.siteMastheadBadge || "MAGAZINE"}
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            {!loading && user && user.email === "dev.viewer@medaclawarena.com" && (
              <Link href="/admin" className="text-[9px] font-black text-[#E3350D] hover:text-white tracking-wider uppercase"><Shield className="w-3 h-3 inline mr-1" /><span className="hidden sm:inline">Admin</span></Link>
            )}
            {!loading && user ? (
              <button onClick={() => { logout(); router.push("/") }} className="flex items-center gap-1 px-2 py-1 text-[9px] sm:text-[10px] font-black text-[#E3350D] bg-white/10 hover:bg-[#E3350D]/15 border border-[#E3350D]/30 hover:border-[#E3350D] transition-colors tracking-wider uppercase">
                <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span>{t.auth_logout || "Logout"}</span>
              </button>
            ) : (
              <span className="text-[9px] sm:text-[10px] font-bold text-zinc-500 tracking-wider uppercase">{t.siteMastheadBadge || "DASHBOARD"}</span>
            )}
          </div>
        </div>

        {/* Title Row */}
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="relative shrink-0">
              <img src="/logo/logo-icon-black.webp" alt="TTG" className="w-11 h-11 sm:w-14 sm:h-14 drop-shadow-[3px_3px_0px_rgba(26,26,26,0.3)]" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black leading-none tracking-tight" style={{ color: "#1a1a1a" }}>
                {t.siteTitle || "TRADING TAZOS GAME"}
              </h1>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-sm sm:text-lg lg:text-xl font-black leading-none" style={{ color: "#E3350D" }}>
                  {t.siteSubtitle || "COLLECT. TRADE. BATTLE."}
                </span>
                <span className="hidden sm:inline text-[9px] font-black text-[#1a1a1a] bg-white border-2 border-[#1a1a1a] px-1.5 py-0.5 shadow-[2px_2px_0px_#1a1a1a] uppercase tracking-wider">
                  {t.siteIssue || "ISSUE #001"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <nav className="max-w-7xl mx-auto px-2 sm:px-4 pb-0">
          <div className="flex flex-wrap gap-0.5">
            {NAV_ITEMS.map(({ id, label, icon: Icon, href }) => {
              const isActive = currentTab === id || pathname === href
              return (
                <Link key={id} href={href}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 font-black text-[9px] sm:text-[11px] tracking-wider uppercase transition-all duration-150 whitespace-nowrap rounded-t-lg ${
                    isActive
                      ? "bg-[#FFCC00] text-[#1a1a1a] -mb-[1px] border-2 border-b-0 border-[#1a1a1a]"
                      : "bg-white/70 text-[#1a1a1a]/50 border-2 border-b-0 border-[#1a1a1a]/15 hover:bg-white hover:text-[#1a1a1a] hover:border-[#1a1a1a]/30"
                  }`}>
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      {/* ═══════════════════════════════════════ */}
      {/* PAGE CONTENT                             */}
      {/* ═══════════════════════════════════════ */}
      <main className="relative z-10 flex-1 pb-12">
        <div className="max-w-7xl mx-auto relative">
          {children}
        </div>
      </main>

      {/* ═══════════════════════════════════════ */}
      {/* GAME HUD (bottom status bar)            */}
      {/* ═══════════════════════════════════════ */}
      <GameHUD credits={credits} tazoCount={user?.tazoCount} />

      {/* ═══════════════════════════════════════ */}
      {/* MAGAZINE FOOTER                          */}
      {/* ═══════════════════════════════════════ */}
      {showFooter && (
        <footer className="bg-[#1a1a1a] border-t-4 border-[#FFCC00]">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex justify-center gap-2 mb-2">
              {["#FFCC00", "#3B4CCA", "#FF6B00", "#78C850", "#00A1E9"].map((color, i) => (
                <div key={i} className="w-2 h-2 rounded-full border border-white/30" style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1">
              <p className="text-[10px] sm:text-xs font-bold text-zinc-400 tracking-wide">
                {t.siteTitle || "TRADING TAZOS GAME"} &copy; {new Date().getFullYear()} — {t.siteFooterTribute || "Fan-made collector experience"}
              </p>
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-zinc-500">
                <a href="https://github.com/smouj/Trading-Tazos-Game/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFCC00] underline">License</a>
                <span>|</span>
                <a href="mailto:support@medaclawarena.com" className="hover:text-[#FFCC00] underline">support@medaclawarena.com</a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
