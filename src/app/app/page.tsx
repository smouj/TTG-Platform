"use client"

import { useState, useCallback, useEffect } from "react"
import { useI18n } from "@/lib/i18n"
import { GameView } from "@/lib/game/types"
import AlbumView from "@/components/game/album-view"
import BattleView from "@/components/game/battle-view"
import { ScannerView } from "@/components/game/scanner-view"
import StatsPanel from "@/components/game/stats-panel"
import MagazinePageShell from "@/components/magazine-page-shell"

const GAME_TABS = ["album", "battle", "scanner", "stats"] as const

function getInitialTab(): GameView {
  if (typeof window === "undefined") return "album"
  const params = new URLSearchParams(window.location.search)
  const tab = params.get("tab")
  return tab && (GAME_TABS as readonly string[]).includes(tab) ? (tab as GameView) : "album"
}

export default function Home() {
  const { t } = useI18n()
  const [activeView, setActiveView] = useState<GameView>(getInitialTab)
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)

  // Sync tab from URL on browser back/forward
  useEffect(() => {
    const handlePopState = () => setActiveView(getInitialTab())
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const handleTabChange = useCallback((view: string) => {
    if ((GAME_TABS as readonly string[]).includes(view)) {
      setActiveView(view as GameView)
      const url = view === "album" ? "/" : `/?tab=${view}`
      window.history.pushState(null, "", url)
    }
  }, [])

  const handleStatsUpdate = useCallback(() => {
    setStatsRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <MagazinePageShell currentTab={activeView} onTabChange={handleTabChange}>
      <div
        className={`max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 ${
          activeView === "battle" ? "min-h-0 overflow-hidden flex" : ""
        }`}
      >
        {activeView === "album" && <AlbumView onStatsUpdate={handleStatsUpdate} />}
        {activeView === "battle" && <BattleView />}
        {activeView === "scanner" && <ScannerView />}
        {activeView === "stats" && <StatsPanel refreshKey={statsRefreshKey} />}
      </div>
    </MagazinePageShell>
  )
}
