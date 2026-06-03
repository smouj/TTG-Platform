// ============================================================
// Trading Tazos Game — Magazine Page Shell
// Single source of truth for the 90s magazine masthead + tab bar + footer.
// Used by ALL pages: main page, shop, quests, leaderboard, download.
// ============================================================
"use client"

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import LanguageSwitcher from "@/components/ui/language-switcher"
import {
  BookOpen, Swords, Scan, BarChart3, User, LogOut,
  ShoppingBag, Download, Target, Trophy, Disc3,
} from "lucide-react"

type TabId = "album" | "battle" | "scanner" | "stats" | "shop" | "quests" | "collection" | "decks" | "leaderboard" | "download"

const NAV_ITEMS: { id: TabId; labelKey?: string; fallbackLabel: string; icon: typeof BookOpen; href: string }[] = [
  { id: "album", labelKey: "tabAlbum", fallbackLabel: "Album", icon: BookOpen, href: "/app" },
  { id: "battle", labelKey: "tabBattle", fallbackLabel: "Battle!", icon: Swords, href: "/app?tab=battle" },
  { id: "scanner", labelKey: "tabScanner", fallbackLabel: "Scanner", icon: Scan, href: "/app?tab=scanner" },
  { id: "stats", labelKey: "tabStats", fallbackLabel: "Stats", icon: BarChart3, href: "/app?tab=stats" },
  { id: "shop", fallbackLabel: "Shop", icon: ShoppingBag, href: "/app?tab=shop" },
  { id: "quests", fallbackLabel: "Quests", icon: Target, href: "/app?tab=quests" },
  { id: "collection", fallbackLabel: "Collection", icon: Disc3, href: "/app?tab=collection" },
  { id: "decks", fallbackLabel: "Decks", icon: Disc3, href: "/app?tab=decks" },
  { id: "leaderboard", fallbackLabel: "Ranks", icon: Trophy, href: "/leaderboard" },
  { id: "download", fallbackLabel: "Desktop", icon: Download, href: "/download" },
]

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
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Close menu on outside click
  useEffect(() => {
    if (!showUserMenu) return
    const handler = () => setShowUserMenu(false)
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [showUserMenu])

  return (
    <div className="min-h-screen flex flex-col mag-bg">
      {/* ===== MAGAZINE MASTHEAD ===== */}
      <header className="sticky top-0 z-40 bg-[#FFCC00] border-b-4 border-[#1a1a1a] mag-stripes">
        {/* Top bar */}
        <div className="bg-[#1a1a1a] text-white text-center py-1 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="text-[10px] sm:text-xs font-bold text-zinc-400 hover:text-[#FFCC00] transition-colors tracking-wider uppercase"
                >
                  {t.auth_login}
                </Link>
                <span className="text-zinc-600">|</span>
                <Link
                  href="/register"
                  className="text-[10px] sm:text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors tracking-wider uppercase"
                >
                  {t.auth_register}
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowUserMenu(!showUserMenu) }}
                  className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-[#FFCC00] hover:text-white transition-colors tracking-wider uppercase"
                >
                  <User className="w-3 h-3" />
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute left-0 top-full mt-1 z-20 w-44 bg-zinc-900 border-2 border-zinc-700 rounded-lg shadow-xl overflow-hidden">
                    <button
                      onClick={() => { logout(); setShowUserMenu(false) }}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#E3350D] hover:bg-red-500/10 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      {t.auth_logout}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-black tracking-[3px] uppercase text-[#FFCC00]">
            {t.siteMastheadBadge || "MAGAZINE"}
          </span>
          <div className="flex-1 flex justify-end">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          {/* Title Row */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Logo */}
            <div className="relative shrink-0">
              <img
                src="/logo/logo-icon-black.png"
                alt="Trading Tazos Game"
                className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-[3px_3px_0px_rgba(26,26,26,0.3)]"
              />
            </div>

            {/* Title & Subtitle */}
            <div className="min-w-0 flex-1">
              <h1
                className="text-2xl sm:text-4xl lg:text-5xl font-black leading-none tracking-tight mag-stroke"
                style={{ WebkitTextStroke: "3px #1a1a1a" }}
              >
                {t.siteTitle || "TRADING TAZOS GAME"}
              </h1>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className="text-lg sm:text-2xl lg:text-3xl font-black mag-stroke-red leading-none"
                  style={{ WebkitTextStroke: "2px #1a1a1a" }}
                >
                  {t.siteSubtitle || "COLLECT. TRADE. BATTLE."}
                </span>
                <span className="hidden sm:inline text-[10px] font-black text-[#1a1a1a] bg-white border-2 border-[#1a1a1a] px-1.5 py-0.5 shadow-[2px_2px_0px_#1a1a1a] uppercase tracking-wider">
                  {t.siteIssue || "ISSUE #001"}
                </span>
              </div>
            </div>

            {/* Issue info — right side */}
            <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
              <div className="speech-bubble text-[10px]">
                {t.siteTagline || "Throw your tazos, flip your rival's, and conquer the arena!"}
              </div>
              <span className="text-[9px] font-bold text-[#1a1a1a]/60">
                Issue #001 — 2025 Edition
              </span>
            </div>
          </div>
        </div>

        {/* ===== TAB BAR ===== */}
        <nav className="max-w-7xl mx-auto px-4 pb-0" role="tablist" aria-label="Game views">
          <div className="flex gap-1 sm:gap-2">
            {NAV_ITEMS.map(({ id, labelKey, fallbackLabel, icon: Icon, href }) => {
              const isActive = currentTab === id
              const label = (labelKey ? (t as any)[labelKey] : null) || fallbackLabel

              return (
                <Link
                  key={id}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 font-black text-[11px] sm:text-xs tracking-wider uppercase transition-all duration-150 ${
                    isActive
                      ? "mag-tab mag-tab-active bg-[#FFCC00] text-[#1a1a1a] rounded-t-lg -mb-[1px]"
                      : "mag-tab bg-white/80 text-[#1a1a1a]/60 rounded-t-lg border-2 border-b-0 border-[#1a1a1a]/20 hover:bg-white hover:text-[#1a1a1a] hover:border-[#1a1a1a]/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1">
        {children}
      </main>

      {/* ===== FOOTER ===== */}
      {showFooter && (
        <footer className="bg-[#E3350D] border-t-4 border-[#1a1a1a] mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex justify-center gap-2 mb-2">
              {["#FFCC00", "#3B4CCA", "#FF6B00", "#78C850", "#00A1E9"].map((color, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full border border-[#1a1a1a]/30"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1">
              <p className="text-[10px] sm:text-xs font-bold text-white tracking-wide">
                {t.siteTitle || "TRADING TAZOS GAME"} &copy; {new Date().getFullYear()} — {t.siteFooterTribute || "Fan-made collector experience"}
              </p>
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-white/60">
                <a href="https://github.com/smouj/Trading-Tazos-Game/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-white underline underline-offset-2">
                  License
                </a>
                <span>|</span>
                <a href="mailto:support@medaclawarena.com" className="hover:text-white underline underline-offset-2">
                  support@medaclawarena.com
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
