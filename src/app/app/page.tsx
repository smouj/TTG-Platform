// ============================================================
// Trading Tazos Game — Dashboard Root
// Redirects to /app/album (default tab).
// ============================================================
import { redirect } from "next/navigation"

export default function AppRoot() {
  redirect("/app/album")
}
