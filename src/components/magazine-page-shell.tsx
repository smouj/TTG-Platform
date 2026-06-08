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
  BookOpen, Swords, BarChart3, ShoppingBag, Disc3,
  Target, Layers, LogOut, Home, Settings, Shield, Coins,
} from "lucide-react"

type TabId = "battle" | "stats" | "shop" | "quests" | "collection" | "decks" | "settings"

const NAV_ITEMS: { id: TabId; label: string; icon: typeof BookOpen; href: string }[] = [
  { id: "collection", label: "Collection", icon: Disc3, href: "/app/collection" },
  { id: "battle", label: "Battle!", icon: Swords, href: "/app/battle" },
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
          <span className="text-[#1a1a1a]/40">{tazoCount != null ? `${tazoCount}/349` : ""} TAZOS</span>
          <span className="text-[#1a1a1a]/25 text-[7px] sm:text-[8px] tracking-[0.15em]">v0.4.0</span>
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
            {!loading && user && user.email === "dev@tradingtazosgame.com" && (
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
              <div className="flex items-center gap-2">
                <p className="text-[10px] sm:text-xs font-bold text-zinc-400 tracking-wide">
                  {t.siteTitle || "TRADING TAZOS GAME"} &copy; {new Date().getFullYear()} — {t.siteFooterTribute || "Fan-made collector experience"}
                </p>
                {/* Social */}
                <a href="https://x.com/tazosgame" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter" className="text-zinc-500 hover:text-[#FFCC00] transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="https://www.reddit.com/r/tradingtazosgame/" target="_blank" rel="noopener noreferrer" aria-label="Reddit" className="text-zinc-500 hover:text-[#FFCC00] transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.6 12.6c0 .663-.537 1.2-1.2 1.2-.315 0-.603-.12-.816-.318A5.952 5.952 0 0 1 12 15.6a5.952 5.952 0 0 1-4.584-2.118A1.19 1.19 0 0 1 6.6 13.8c-.663 0-1.2-.537-1.2-1.2s.537-1.2 1.2-1.2c.315 0 .603.12.816.318a5.956 5.956 0 0 1 3.384-1.788l.72-3.384 2.94.624c.039-.327.312-.582.648-.582.363 0 .66.297.66.66s-.297.66-.66.66c-.234 0-.438-.123-.552-.306l-2.496-.528-.576 2.706a5.96 5.96 0 0 1 3.492 1.794c.213-.198.501-.318.816-.318.663 0 1.2.537 1.2 1.2zM9.6 13.2c-.48 0-.84.36-.84.84 0 .48.36.84.84.84s.84-.36.84-.84c0-.48-.36-.84-.84-.84zm4.8 0c-.48 0-.84.36-.84.84 0 .48.36.84.84.84s.84-.36.84-.84c0-.48-.36-.84-.84-.84zm-2.88 3.54c.48 0 .96.12 1.44.36.48-.24.96-.36 1.44-.36.18 0 .36-.18.36-.36s-.18-.36-.36-.36c-.66 0-1.26.18-1.74.48-.3-.18-.66-.3-1.14-.3s-.84.12-1.14.3c-.48-.3-1.08-.48-1.74-.48-.18 0-.36.18-.36.36s.18.36.36.36z" /></svg>
                </a>
                <a href="https://t.me/tradingtazosgame" target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="text-zinc-500 hover:text-[#FFCC00] transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.96 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.696.064-1.225-.46-1.9-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.24-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.1-.002.321.023.465.14.121.099.155.233.171.328.016.095.036.31.02.482z" /></svg>
                </a>
                <a href="https://discord.gg/4mUhnc2REb" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="text-zinc-500 hover:text-[#5865F2] transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                </a>
                <a href="https://www.instagram.com/tradingtazosgame/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-zinc-500 hover:text-[#E4405F] transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>
              <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-zinc-500">
                <a href="https://github.com/smouj/Trading-Tazos-Game/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFCC00] underline">License</a>
                <span>|</span>
                <a href="mailto:support@tradingtazosgame.com" className="hover:text-[#FFCC00] underline">support@tradingtazosgame.com</a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
