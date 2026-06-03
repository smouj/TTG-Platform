// ============================================================
// Trading Tazos Game — Magazine Page Shell
// Wraps standalone pages with consistent 90s magazine aesthetic.
// Every new standalone page MUST use this wrapper.
// ============================================================
"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import {
  BookOpen, Swords, Scan, BarChart3, User, LogOut,
  ShoppingBag, Download, Target, Trophy,
  Package, Layers, Disc3,
} from "lucide-react"

export default function MagazinePageShell({
  children,
  showMasthead = true,
  showFooter = true,
  currentTab,
}: {
  children: React.ReactNode
  showMasthead?: boolean
  showFooter?: boolean
  currentTab?: string
}) {
  const { t } = useI18n()
  const { user, logout } = useAuth()

  const NAV_ITEMS = [
    { id: "album", label: t.tabAlbum, icon: BookOpen, href: "/" },
    { id: "battle", label: t.tabBattle, icon: Swords, href: "/?tab=battle" },
    { id: "scanner", label: t.tabScanner, icon: Scan, href: "/?tab=scanner" },
    { id: "stats", label: t.tabStats, icon: BarChart3, href: "/?tab=stats" },
    { id: "shop", label: "Shop", icon: ShoppingBag, href: "/shop" },
    { id: "quests", label: "Quests", icon: Target, href: "/quests" },
    { id: "leaderboard", label: "Ranks", icon: Trophy, href: "/leaderboard" },
    { id: "download", label: "Desktop", icon: Download, href: "/download" },
  ]

  return (
    <div className="min-h-screen flex flex-col mag-bg">
      {/* ===== MASTHEAD ===== */}
      {showMasthead && (
        <header className="sticky top-0 z-40 bg-[#FFCC00] border-b-4 border-[#1a1a1a] mag-stripes">
          {/* Top bar */}
          <div className="bg-[#1a1a1a] text-white text-center py-1 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!user ? (
                <>
                  <Link href="/login" className="text-[10px] sm:text-xs font-bold text-zinc-400 hover:text-[#FFCC00] transition-colors tracking-wider uppercase">
                    {t.auth_login}
                  </Link>
                  <span className="text-zinc-600">|</span>
                  <Link href="/register" className="text-[10px] sm:text-xs font-bold text-zinc-400 hover:text-[#FFCC00] transition-colors tracking-wider uppercase">
                    {t.auth_register}
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/" className="text-[10px] sm:text-xs font-bold text-zinc-400 hover:text-[#FFCC00] transition-colors tracking-wider uppercase">
                    <BookOpen className="w-3 h-3 inline mr-0.5" /> Home
                  </Link>
                </>
              )}
            </div>
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    const menu = document.getElementById("mag-user-menu")
                    if (menu) menu.classList.toggle("hidden")
                  }}
                  className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-zinc-400 hover:text-[#FFCC00] transition-colors tracking-wider uppercase"
                >
                  <User className="w-3 h-3" />
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                </button>
                <div
                  id="mag-user-menu"
                  className="hidden absolute right-0 top-full mt-1 bg-[#1a1a1a] border-2 border-[#FFCC00] shadow-[4px_4px_0px_#1a1a1a] min-w-[140px] z-50"
                >
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-[#E3350D] hover:bg-[#E3350D]/10 transition-colors"
                  >
                    <LogOut className="w-3 h-3" /> {t.auth_logout}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Title row */}
          <div className="text-center py-3 px-4 flex items-center justify-center gap-3">
            <Disc3 className="w-8 h-8 text-[#1a1a1a] hidden sm:block" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-[#1a1a1a] mag-stroke-sm leading-none">
                {t.siteTitle || "TRADING TAZOS GAME"}
              </h1>
              <p className="text-[10px] sm:text-xs font-bold text-[#1a1a1a]/60 uppercase tracking-widest mt-0.5">
                {t.battle_tagline || "Collect. Trade. Battle."}
              </p>
            </div>
            <Disc3 className="w-8 h-8 text-[#1a1a1a] hidden sm:block" />
          </div>

          {/* Tab bar */}
          <div className="flex items-center justify-center gap-1 px-2 pb-2">
            {NAV_ITEMS.map((item) => {
              const isActive = currentTab === item.id
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all border-2 border-transparent ${
                    isActive
                      ? "bg-[#1a1a1a] text-[#FFCC00] border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
                      : "text-[#1a1a1a]/70 hover:text-[#1a1a1a] hover:bg-[#1a1a1a]/5 hover:border-[#1a1a1a]/20"
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </header>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1">
        {children}
      </main>

      {/* ===== FOOTER ===== */}
      {showFooter && (
        <footer className="bg-[#1a1a1a] border-t-4 border-[#FFCC00] py-6 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-3">
            {/* Color dots row */}
            <div className="flex items-center justify-center gap-2">
              {["#FFCC00", "#E3350D", "#3B4CCA", "#22C55E", "#F59E0B"].map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              &copy; {new Date().getFullYear()} MedaClaw Arena.{" "}
              <Link href="/LICENSE" className="text-[#FFCC00] hover:text-white">License</Link>{" "}
              |{" "}
              <a href="mailto:support@medaclawarena.com" className="text-[#FFCC00] hover:text-white">
                support@medaclawarena.com
              </a>
            </p>
            <p className="text-[9px] text-zinc-600 tracking-wider">
              Pokemon, Digimon, and Dragon Ball Z are trademarks of their respective owners.
              Tazos are fan-sourced from verified Spanish collections.
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}
