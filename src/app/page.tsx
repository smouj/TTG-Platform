import type { Metadata } from "next"
import LauncherView from "@/components/game/launcher-view"

export const metadata: Metadata = {
  title: "Collect, Trade & Battle 319 Classic Tazos",
  description:
    "Trading Tazos Game is a skill-based tazo battle game. Aim, throw, flip, and capture in a 3D match arena. Build your collection of 319 tazos across Minimon, Dracobell, and Cybermon.",
  openGraph: {
    title: "Trading Tazos Game — Aim. Throw. Flip. Capture.",
    description:
      "319 classic tazos. 9 combat stats. 2D collection views and a skill-based 3D battle arena.",
    images: [{ url: "/logo/social-preview.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trading Tazos Game — Aim. Throw. Flip. Capture.",
    description: "319 classic tazos. 9 combat stats. Skill-based 3D battle arena.",
    images: ["/logo/social-preview.png"],
  },
}

export default function HomePage() {
  return <LauncherView />
}
