// ============================================================
// Trading Tazos Game — Dashboard Root
// Redirects based on ?tab= query parameter.
// Default: /app/collection
// ============================================================
import { redirect } from "next/navigation"

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function AppRoot({ searchParams }: Props) {
  const params = await searchParams
  const tab = params.tab

  if (tab === "battle") redirect("/app/battle")
  if (tab === "shop") redirect("/app/shop")
  if (tab === "decks") redirect("/app/decks")
  if (tab === "stats") redirect("/app/stats")
  if (tab === "settings") redirect("/app/settings")
  // Default: collection
  redirect("/app/collection")
}
