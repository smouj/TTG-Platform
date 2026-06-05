"use client"

// Stats view — served at /app/stats
// MagazinePageShell provided by /app/layout.tsx

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import StatsPanel from "@/components/game/stats-panel"

function StatsContent() {
  const searchParams = useSearchParams()
  const refreshKey = Number(searchParams.get("refresh") || 0)

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6">
      <StatsPanel refreshKey={refreshKey} />
    </div>
  )
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 animate-pulse"><div className="h-64 bg-zinc-800/50 rounded-xl border-2 border-zinc-700" /></div>}>
      <StatsContent />
    </Suspense>
  )
}
