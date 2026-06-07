import type { Metadata } from "next"
import { Suspense } from "react"
import LauncherView from "@/components/game/launcher-view"

export const metadata: Metadata = {
  title: "Collect, Trade & Battle 349 Classic Tazos",
  description:
    "Trading Tazos Game is a free browser-based skill game where you collect 349 tazos, build decks of 5, and battle in a physics-driven 3D arena. Minimon, Dracobell & Cybermon collections.",
  openGraph: {
    title: "Trading Tazos Game — Aim. Throw. Flip. Capture.",
    description:
      "349 classic tazos across 3 collections. 9 combat stats. 2D collection views and a skill-based 3D battle arena. Free to play.",
    images: [{ url: "/logo/social-preview.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@medaclaw",
    creator: "@medaclaw",
    title: "Trading Tazos Game — Aim. Throw. Flip. Capture.",
    description: "349 classic tazos, 3 collections, 9 combat stats, skill-based 3D battle arena. Free to play.",
    images: ["/logo/social-preview.png"],
  },
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "#FFF9E6" }} />}>
      <LauncherView />
    </Suspense>
  )
}
