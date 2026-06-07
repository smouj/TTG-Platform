import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Tazo Catalog — Browse All 349 Tazos",
  description: "Browse the complete Trading Tazos Game catalog. 349 tazos with 9 combat stats, rarity tiers, and franchise filters. Search by name, number, or collection.",
  path: "/tazos",
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
