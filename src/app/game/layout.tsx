// Game layout — fullscreen GameShell, no magazine masthead
// Used by all /game/* routes
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Battle Arena — Trading Tazos Game",
  description: "Enter the arena with your tazos. Practice battles are fully playable, with ranked and friend PvP lobbies connected through WebSocket matchmaking.",
  robots: { index: false, follow: false },
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  // No MagazinePageShell here — GameShell is applied per-page
  return <>{children}</>
}
