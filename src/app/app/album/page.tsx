"use client"

// Album view — served at /app/album
// MagazinePageShell provided by /app/layout.tsx

import { useCallback, useState } from "react"
import AlbumView from "@/components/game/album-view"

export default function AlbumPage() {
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)

  const handleStatsUpdate = useCallback(() => {
    setStatsRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
      <AlbumView onStatsUpdate={handleStatsUpdate} />
      {/* Hidden StatsPanel key trigger — stats page reads this via URL */}
      {statsRefreshKey > 0 && <span data-stats-key={statsRefreshKey} hidden />}
    </div>
  )
}
