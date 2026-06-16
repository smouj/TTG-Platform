import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Practice Arena — Battle Tazos Free | Trading Tazos Game",
  description:
    "Jump into the 3D battle arena instantly — no account needed. Practice against AI with adjustable difficulty using the demo deck. Create a free account to save progress, open bags, and build your collection.",
  alternates: {
    canonical: "https://tradingtazosgame.com/battle/practice",
  },
  openGraph: {
    title: "Practice Arena — Free Tazo Battles | Trading Tazos Game",
    description:
      "Instant guest battles against AI. No download, no login — just pick your difficulty and start slamming tazos in the 3D arena.",
  },
}

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
