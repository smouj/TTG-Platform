// ============================================================
// Trading Tazos Game — Magazine Page Shell
// Dashboard shell: masthead + tab bar + footer.
// Used ONLY by /app/* pages (dashboard). Public pages use PublicPageShell.
// ============================================================
"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import LanguageSwitcher from "@/components/ui/language-switcher"
import {
  BookOpen, Swords, Scan, BarChart3, ShoppingBag,
  Target, Disc3, Layers, LogOut, Home, Settings,
} from "lucide-react"

type TabId = "album" | "battle" | "scanner" | "stats" | "shop" | "quests" | "collection" | "decks" | "settings"

const NAV_ITEMS: { id: TabId; labelKey?: string; fallbackLabel: string; icon: typeof BookOpen; href: string }[] = [
  { id: "album", labelKey: "tabAlbum", fallbackLabel: "Album", icon: BookOpen, href: "/app/album" },
  { id: "battle", labelKey: "tabBattle", fallbackLabel: "Battle!", icon: Swords, href: "/app/battle" },
  { id: "scanner", labelKey: "tabScanner", fallbackLabel: "Scanner", icon: Scan, href: "/app/scanner" },
  { id: "stats", labelKey: "tabStats", fallbackLabel: "Stats", icon: BarChart3, href: "/app/stats" },
  { id: "shop", fallbackLabel: "Shop", icon: ShoppingBag, href: "/app/shop" },
  { id: "quests", fallbackLabel: "Quests", icon: Target, href: "/app/quests" },
  { id: "collection", fallbackLabel: "Collection", icon: Disc3, href: "/app/collection" },
  { id: "decks", fallbackLabel: "Decks", icon: Layers, href: "/app/decks" },
  { id: "settings", fallbackLabel: "Settings", icon: Settings, href: "/app/settings" },
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
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen flex flex-col mag-bg">
      {/* ===== DASHBOARD MASTHEAD ===== */}
      <header className="sticky top-0 z-40 bg-[#FFCC00] border-b-4 border-[#1a1a1a] mag-stripes">
        {/* Top bar — auth-aware */}
        <div className="bg-[#1a1a1a] text-white text-center py-1.5 px-4 flex items-center justify-between">
          {/* Left: Back to Home */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-zinc-400 hover:text-[#FFCC00] transition-colors tracking-wider uppercase"
          >
            <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">{t.nav_back_to_home || "Back to Home"}</span>
          </Link>

          {/* Center: badge */}
          <span className="text-[10px] sm:text-xs font-black tracking-[3px] uppercase text-[#FFCC00]">
            {t.siteMastheadBadge || "MAGAZINE"}
          </span>

          {/* Right: user area — always visible */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            {!loading && user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-black text-[#E3350D] bg-white/10 hover:bg-[#E3350D]/15 border border-[#E3350D]/30 hover:border-[#E3350D] rounded transition-colors tracking-wider uppercase"
              >
                <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{t.auth_logout || "Logout"}</span>
              </button>
            ) : (
              <span className="text-[10px] sm:text-xs font-bold text-zinc-500 tracking-wider uppercase">
                {t.siteMastheadBadge || "DASHBOARD"}
              </span>
            )}
          </div>
        </div>

        {/* Title Row */}
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Logo */}
            <Link href="/" className="relative shrink-0">
              <img
                src="/logo/logo-icon-black.webp"
                alt="Trading Tazos Game"
                className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-[3px_3px_0px_rgba(26,26,26,0.3)]"
              />
            </Link>

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

            {/* Right: speech bubble */}
            <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
              <div className="speech-bubble text-[10px]">
                {t.siteTagline || "Throw your tazos, flip your rival's, and conquer the arena!"}
              </div>
              <span className="text-[9px] font-bold text-[#1a1a1a]/60">
                Issue #001 — 2026 Edition
              </span>
            </div>
          </div>
        </div>

        {/* ===== TAB BAR (8 tabs, no scrollbar, wrap on tiny screens) ===== */}
        <nav className="max-w-7xl mx-auto px-2 sm:px-4 pb-0" role="tablist" aria-label="Game views">
          <div className="flex flex-wrap gap-0.5">
            {NAV_ITEMS.map(({ id, labelKey, fallbackLabel, icon: Icon, href }) => {
              const isActive = currentTab === id
              const label = (labelKey ? (t as any)[labelKey] : null) || fallbackLabel

              return (
                <Link
                  key={id}
                  href={href}
                  className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 font-black text-[9px] sm:text-[11px] tracking-wider uppercase transition-all duration-150 whitespace-nowrap rounded-t-lg ${
                    isActive
                      ? "bg-[#FFCC00] text-[#1a1a1a] -mb-[1px] border-2 border-b-0 border-[#1a1a1a]"
                      : "bg-white/70 text-[#1a1a1a]/50 border-2 border-b-0 border-[#1a1a1a]/15 hover:bg-white hover:text-[#1a1a1a] hover:border-[#1a1a1a]/30"
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 p-3 sm:p-4 lg:p-5">
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
