import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Leaderboard — Top Players & Rankings",
  description: "Top players and rankings in Trading Tazos Game. Compete to be the best tazo collector.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
