"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import { GameView } from "@/lib/game/types"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import AlbumView from "@/components/game/album-view"
import BattleView from "@/components/game/battle-view"
import { ScannerView } from "@/components/game/scanner-view"
import StatsPanel from "@/components/game/stats-panel"
import Link from "next/link"
import { Loader2, ShoppingBag, Target, Package, Layers } from "lucide-react"

// Lazy-load standalone pages as tab views
const ShopView = dynamic(() => import("@/app/shop/page"), {
  ssr: false,
  loading: () => <TabLoader icon={<ShoppingBag />} label="Shop" />,
})

const QuestsView = dynamic(() => import("@/app/quests/page"), {
  ssr: false,
  loading: () => <TabLoader icon={<Target />} label="Quests" />,
})

const CollectionView = dynamic(() => import("@/app/collection/page"), {
  ssr: false,
  loading: () => <TabLoader icon={<Package />} label="Collection" />,
})

const DecksView = dynamic(() => import("@/app/decks/page"), {
  ssr: false,
  loading: () => <TabLoader icon={<Layers />} label="Decks" />,
})

function TabLoader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      <span className="text-sm font-black text-zinc-500 uppercase tracking-wider">{label}</span>
    </div>
  )
}

const ALL_TABS = ["album", "battle", "scanner", "stats", "shop", "quests", "collection", "decks"] as const

function getInitialTab(): string {
  if (typeof window === "undefined") return "album"
  const params = new URLSearchParams(window.location.search)
  const tab = params.get("tab")
  return tab && (ALL_TABS as readonly string[]).includes(tab) ? tab : "album"
}

function DashboardContent() {
  const { t } = useI18n()
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeView, setActiveView] = useState<string>(getInitialTab)
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)

  // Sync tab from URL on browser back/forward
  useEffect(() => {
    const handlePopState = () => setActiveView(getInitialTab())
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user === null) {
      const current = new URLSearchParams(window.location.search).get("tab")
      const redirect = current ? `/app?tab=${current}` : "/app"
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`)
    }
  }, [user, router])

  const handleTabChange = (view: string) => {
    if ((ALL_TABS as readonly string[]).includes(view)) {
      setActiveView(view)
      const url = view === "album" ? "/app" : `/app?tab=${view}`
      window.history.pushState(null, "", url)
    }
  }

  const handleStatsUpdate = () => setStatsRefreshKey((prev) => prev + 1)

  // Loading state while checking auth
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" />
      </div>
    )
  }

  // Not logged in — redirecting
  if (user === null) return null

  // Album, Battle, Scanner, Stats — direct component rendering
  const gameContent = (
    <div className={`max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 ${activeView === "battle" ? "min-h-0 overflow-hidden flex" : ""}`}>
      {activeView === "album" && <AlbumView onStatsUpdate={handleStatsUpdate} />}
      {activeView === "battle" && <BattleView />}
      {activeView === "scanner" && <ScannerView />}
      {activeView === "stats" && <StatsPanel refreshKey={statsRefreshKey} />}
    </div>
  )

  if (activeView === "album" || activeView === "battle" || activeView === "scanner" || activeView === "stats") {
    return gameContent
  }

  // Shop, Quests, Collection, Decks — lazy-loaded standalone pages
  return (
    <>
      {activeView === "shop" && <ShopView />}
      {activeView === "quests" && <QuestsView />}
      {activeView === "collection" && <CollectionView />}
      {activeView === "decks" && <DecksView />}
    </>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
