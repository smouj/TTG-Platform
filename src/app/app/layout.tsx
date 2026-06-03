"use client"

import { usePathname } from "next/navigation"
import MagazinePageShell from "@/components/magazine-page-shell"

const PATH_TO_TAB: Record<string, string> = {
  "/app/album": "album",
  "/app/battle": "battle",
  "/app/scanner": "scanner",
  "/app/stats": "stats",
  "/app/shop": "shop",
  "/app/quests": "quests",
  "/app/collection": "collection",
  "/app/decks": "decks",
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Determine active tab from path
  let tab = "album" // default
  for (const [path, t] of Object.entries(PATH_TO_TAB)) {
    if (pathname === path || pathname.startsWith(path + "?")) {
      tab = t
      break
    }
  }

  return <MagazinePageShell currentTab={tab as any}>{children}</MagazinePageShell>
}
