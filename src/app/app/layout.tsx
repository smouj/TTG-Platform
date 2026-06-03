"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import MagazinePageShell from "@/components/magazine-page-shell"
import { Loader2 } from "lucide-react"

const ALL_TABS = ["album", "battle", "scanner", "stats", "shop", "quests", "collection", "decks"] as const

function TabDetector({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab")

  const activeTab = tab && (ALL_TABS as readonly string[]).includes(tab) ? tab : "album"

  return <MagazinePageShell currentTab={activeTab as any}>{children}</MagazinePageShell>
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFCC00]" />
      </div>
    }>
      <TabDetector>{children}</TabDetector>
    </Suspense>
  )
}
