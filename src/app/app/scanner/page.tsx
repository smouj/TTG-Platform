"use client"

// Scanner view — served at /app/scanner
// MagazinePageShell provided by /app/layout.tsx

import { ScannerView } from "@/components/game/scanner-view"

export default function ScannerPage() {
  return (
    <div className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
      <ScannerView />
    </div>
  )
}
