// ============================================================
// Trading Tazos Game — Magazine Page Shell
// 90s gaming magazine aesthetic: cream paper, dark masthead,
// comic typography, halftone patterns.
// Uses MagazineHeader (variant="app") + MagazineFooter
// with app-specific tab strip in magazine style.
//
// For battle gameplay (fullscreen), see GameFullscreenShell.
// ============================================================
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { sfxEnsureUnlocked } from "@/lib/audio/sfx-engine"
import MagazineHeader from "@/components/game/magazine-header"
import MagazineFooter from "@/components/game/magazine-footer"
import { TOTAL_PLANNED } from "@/lib/franchise-config"
import { SITE_CONFIG } from "@/lib/site-config"
import {
  BookOpen, Swords, BarChart3, ShoppingBag, Disc3,
  Target, Layers, Settings, Coins,
} from "lucide-react"

type TabId = "battle" | "stats" | "shop" | "quests" | "collection" | "decks" | "settings"

const NAV_ITEMS: { id: TabId; label: string; icon: typeof BookOpen; href: string }[] = [
  { id: "collection", label: "My Collection", icon: Disc3, href: "/app/collection" },
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
    <div className="sticky bottom-0 z-40 bg-[#FFCC00] border-t-[3px] border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#1a1a1a]">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-[#1a1a1a]/50">{user.displayName || user.name}</span>
          <span className="flex items-center gap-1">
            <Coins className="w-3 h-3" /> {credits != null ? credits : "—"}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-[#1a1a1a]/40">{tazoCount != null ? `${tazoCount}/${TOTAL_PLANNED}` : ""} TAZOS</span>
          <span className="text-[#1a1a1a]/25 text-[7px] sm:text-[8px] tracking-[0.15em]">v{SITE_CONFIG.version}</span>
        </div>
      </div>
    </div>
  )
}

export default function MagazinePageShell({
  children,
  currentTab,
}: {
  children: React.ReactNode
  currentTab?: TabId
}) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [credits, setCredits] = useState<number>(0)

  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem("token")
    fetch("/api/credits", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.credits != null) setCredits(d.credits)
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    sfxEnsureUnlocked()
  }, [])

  // Magazine aesthetic — cream paper background
  const shellBg = "#FFF9E6"
  const tabBg = "bg-white"
  const tabText = "text-[#1a1a1a]/35 hover:text-[#1a1a1a]/70"
  const tabActive = "bg-[#FFCC00] text-[#1a1a1a] border-2 border-[#1a1a1a]"
  const tabHover = "border-transparent hover:text-[#1a1a1a]/70 hover:border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/3"

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: shellBg }}
    >
      {/* Halftone overlay */}
      <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" data-ttg-hide-on-battle />

      {/* ═══ MASTHEAD ═══ */}
      <div data-ttg-hide-on-battle>
        <MagazineHeader variant="app" />
      </div>

      {/* ═══ APP TAB STRIP ═══ (flush to header, no gap) */}
      <nav
        data-ttg-hide-on-battle
        className={`relative z-10 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2.5
          overflow-x-auto
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
          border-b-[3px] border-[#1a1a1a] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] ${tabBg}`}
        role="navigation"
        aria-label="App navigation"
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon, href }) => {
          const isActive = currentTab === id || pathname === href
          return (
            <Link
              key={id}
              href={href}
              className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                isActive ? tabActive : `${tabText} ${tabHover} border-2`
              }`}
              style={isActive ? { boxShadow: "3px 3px 0 #1a1a1a" } : undefined}
            >
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* ═══ PAGE CONTENT ═══ */}
      <main
        className="relative z-10 flex-1 w-full min-h-0 overflow-hidden"
        id="main-content"
        role="main"
        aria-label="Page content"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-12">
          {children}
        </div>
      </main>

      {/* ═══ GAME HUD (bottom status bar) ═══ */}
      <div data-ttg-hide-on-battle>
        <GameHUD credits={credits} tazoCount={user?.tazoCount} />
      </div>

      {/* ═══ MAGAZINE FOOTER ═══ */}
      <div data-ttg-hide-on-battle>
        <div className="relative z-10 h-2 mag-stripes opacity-30 pointer-events-none" />
        <MagazineFooter />
      </div>
    </div>
  )
}
