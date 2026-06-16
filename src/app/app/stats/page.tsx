"use client"

// Stats view — served at /app/stats
// MagazinePageShell provided by /app/layout.tsx

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import StatsPanel from "@/components/game/stats-panel"
import BattleHistory from "@/components/game/battle-history"
import { BarChart3 } from "lucide-react"
import { StatsPanelSkeleton, BattleHistorySkeleton } from "@/components/ui/loading-skeletons"
import { TOTAL_PLANNED } from "@/lib/franchise-config"

function StatsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto w-full py-4 sm:py-6 space-y-4 px-4">
      {/* Banner skeleton */}
      <div className="h-14 rounded bg-[#1a1a1a]/[0.04] animate-pulse" />
      <StatsPanelSkeleton />
      <BattleHistorySkeleton rows={4} />
    </div>
  )
}

function StatsContent() {
  const searchParams = useSearchParams()
  const refreshKey = Number(searchParams.get("refresh") || 0)

  return (
    <div className="max-w-7xl mx-auto w-full py-4 sm:py-6 space-y-4">
      {/* Magazine Banner Strip */}
      <div
        className="px-4 py-3 flex flex-wrap items-center gap-3 relative overflow-hidden"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.025) 6px, rgba(255,255,255,0.025) 12px), linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 100%)`,
          border: "3px solid #1a1a1a",
          boxShadow: "4px 4px 0px #FFCC00",
        }}
      >
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-5 h-5 text-[#FFCC00]" />
          <h1 className="text-sm sm:text-lg font-black text-white uppercase tracking-tight">GLOBAL STATS</h1>
        </div>
        <div className="w-px h-5 bg-white/15" />
        <span className="text-sm font-black text-[#3B4CCA] tracking-tight">{TOTAL_PLANNED} SEASON 1 TAZOS</span>
      </div>
      <StatsPanel refreshKey={refreshKey} />
      <BattleHistory />
    </div>
  )
}

export default function StatsPage() {
  return (
    <Suspense fallback={
      <StatsSkeleton />
    }>
      <StatsContent />
    </Suspense>
  )
}
