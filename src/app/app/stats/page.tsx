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
    <Suspense fallback={<div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-6 animate-pulse"><div className="h-64 bg-[#fffef0] border-3 border-[#1a1a1a]" /></div>}>
      <StatsContent />
    </Suspense>
  )
}
