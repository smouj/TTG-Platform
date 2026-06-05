// ============================================================
// Trading Tazos Game — Magazine Page Shell (Game Enhanced)
// Magazine aesthetic preserved: yellow banners, halftone,
// bold comic typography, black borders. Game enhancements:
// subtle dark backing, particle ambience, HUD status bar.
// ============================================================
"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
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

// ── Game ambience — subtle animated particles behind magazine content ──
function MagazineAmbient() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Rich dark backing — like a premium gaming magazine */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 40%, #0f0f1a 100%)",
      }} />
      {/* Subtle magazine paper texture */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      }} />
      {/* Floating halftone particles */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="absolute w-1 h-1 rounded-full bg-[#FFCC00]/15"
          style={{ left: `${5 + Math.random() * 90}%`, top: `${5 + Math.random() * 90}%`,
            animation: `float-particle ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s` }} />
      ))}
    </div>
  )
}

// ── Game HUD status bar (bottom) — magazine-style ──
function GameHUD({ credits, tazoCount }: { credits?: number; tazoCount?: number }) {
  const { user } = useAuth()
  if (!user) return null
  return (
    <div className="sticky bottom-0 z-40 bg-[#1a1a1a] border-t-3 border-[#FFCC00]">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-[10px] font-black">
        <div className="flex items-center gap-4">
          <span className="text-white/40 uppercase tracking-wider">{user.displayName || user.name}</span>
          <span className="flex items-center gap-1.5 text-[#FFCC00]">
            <Coins className="w-3 h-3" /> {credits != null ? credits : "—"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/20">{tazoCount != null ? `${tazoCount}/319` : ""} TAZOS</span>
          <span className="text-white/10 text-[8px] tracking-[0.2em]">v0.3.2</span>
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
  const [credits, setCredits] = useState<number | undefined>(undefined)

  // Fetch credits for HUD
  useEffect(() => {
    if (!user) { setCredits(undefined); return }
    const token = localStorage.getItem("token")
    fetch("/api/credits", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.json()).then(d => { if (d.credits != null) setCredits(d.credits) }).catch(() => {})
  }, [user])

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Ambient background */}
      <MagazineAmbient />

      {/* ═══════════════════════════════════════ */}
      {/* MAGAZINE MASTHEAD                        */}
      {/* ═══════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-[#FFCC00] border-b-4 border-[#1a1a1a] mag-stripes">
        {/* Top bar */}
        <div className="bg-[#1a1a1a] text-white text-center py-1.5 px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black text-zinc-400 hover:text-[#FFCC00] transition-colors tracking-wider uppercase">
            <Home className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">{t.nav_back_to_home || "Back to Home"}</span>
          </Link>
          <span className="text-[10px] sm:text-xs font-black tracking-[3px] uppercase text-[#FFCC00]">
            {t.siteMastheadBadge || "MAGAZINE"}
          </span>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            {!loading && user && user.email === "dev.viewer@medaclawarena.com" && (
              <Link href="/admin" className="text-[10px] font-black text-[#E3350D] hover:text-white tracking-wider uppercase"><Shield className="w-3 h-3 inline mr-1" /><span className="hidden sm:inline">Admin</span></Link>
            )}
            {!loading && user ? (
              <button onClick={() => { logout(); router.push("/") }} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] font-black text-[#E3350D] bg-white/10 hover:bg-[#E3350D]/15 border border-[#E3350D]/30 hover:border-[#E3350D] transition-colors tracking-wider uppercase">
                <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span>{t.auth_logout || "Logout"}</span>
              </button>
            ) : (
              <span className="text-[10px] sm:text-xs font-bold text-zinc-500 tracking-wider uppercase">{t.siteMastheadBadge || "DASHBOARD"}</span>
            )}
          </div>
        </div>

        {/* Title Row */}
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" className="relative shrink-0">
              <img src="/logo/logo-icon-black.webp" alt="TTG" className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-[3px_3px_0px_rgba(26,26,26,0.3)]" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-none tracking-tight mag-stroke" style={{ WebkitTextStroke: "3px #1a1a1a" }}>
                {t.siteTitle || "TRADING TAZOS GAME"}
              </h1>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-lg sm:text-2xl lg:text-3xl font-black mag-stroke-red leading-none" style={{ WebkitTextStroke: "2px #1a1a1a" }}>
                  {t.siteSubtitle || "COLLECT. TRADE. BATTLE."}
                </span>
                <span className="hidden sm:inline text-[10px] font-black text-[#1a1a1a] bg-white border-2 border-[#1a1a1a] px-1.5 py-0.5 shadow-[2px_2px_0px_#1a1a1a] uppercase tracking-wider">
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
      {/* GAME CONTENT                             */}
      {/* ═══════════════════════════════════════ */}
      <main className="relative z-10 flex-1">
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
        <footer className="bg-[#E3350D] border-t-4 border-[#1a1a1a]">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex justify-center gap-2 mb-2">
              {["#FFCC00", "#3B4CCA", "#FF6B00", "#78C850", "#00A1E9"].map((color, i) => (
                <div key={i} className="w-2 h-2 rounded-full border border-[#1a1a1a]/30" style={{ backgroundColor: color }} />
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1">
              <p className="text-[10px] sm:text-xs font-bold text-white tracking-wide">
                {t.siteTitle || "TRADING TAZOS GAME"} &copy; {new Date().getFullYear()} — {t.siteFooterTribute || "Fan-made collector experience"}
              </p>
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-white/60">
                <a href="https://github.com/smouj/Trading-Tazos-Game/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-white underline">License</a>
                <span>|</span>
                <a href="mailto:support@medaclawarena.com" className="hover:text-white underline">support@medaclawarena.com</a>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Particle animation keyframes */}
      <style jsx global>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0; }
          50% { transform: translateY(-16px) scale(1.3); opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
