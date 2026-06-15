"use client"

import { usePathname } from "next/navigation"
import MagazinePageShell from "@/components/magazine-page-shell"
import ErrorBoundary from "@/components/ui/error-boundary"

const PATH_TO_TAB: Record<string, string> = {
  "/app/battle": "battle",
  "/app/stats": "stats",
  "/app/shop": "shop",
  "/app/quests": "quests",
  "/app/collection": "collection",
  "/app/decks": "decks",
  "/app/settings": "settings",
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  let tab = "collection"
  for (const [path, t] of Object.entries(PATH_TO_TAB)) {
    if (pathname === path || pathname.startsWith(path + "?")) {
      tab = t; break
    }
  }

  // Battle play routes get fullBleed (no max-w/padding) and no footer
  const isBattlePlay = pathname?.startsWith("/app/battle/play")
  const fullBleed = isBattlePlay
  const showFooter = !isBattlePlay

  return (
    <ErrorBoundary>
      <MagazinePageShell currentTab={tab as any} fullBleed={fullBleed} showFooter={showFooter}>
        {children}
      </MagazinePageShell>
    </ErrorBoundary>
  )
}
