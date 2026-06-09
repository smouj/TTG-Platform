import Link from "next/link"
import { Home, Search } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "404 - Page Not Found | Trading Tazos Game",
  description: "The page you're looking for doesn't exist. Return home to collect and battle tazos.",
  robots: { index: false, follow: false },
}

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3e0]" style={{
      backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,204,0,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(0,161,233,0.04) 0%, transparent 50%)",
    }}>
      {/* Simple public header */}
      <header className="border-b-[5px] border-[#1a1a1a] bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo/logo-icon-black.webp" alt="TTG" className="w-8 h-8" />
            <span className="text-sm font-black text-[#1a1a1a] uppercase tracking-tight hidden sm:inline">Trading Tazos Game</span>
          </Link>
        </div>
      </header>

      {/* 404 Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          {/* Tazo disc with "?" */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full mx-auto mb-6 border-4 border-[#1a1a1a] flex items-center justify-center"
            style={{
              boxShadow: "6px 6px 0px #1a1a1a, inset 0 0 40px rgba(255,204,0,0.15)",
              background: "linear-gradient(135deg, #FFCC00 0%, #FFE566 50%, #FFCC00 100%)",
            }}>
            <span className="text-5xl sm:text-6xl font-black text-[#1a1a1a] mag-stroke-sm">?</span>
          </div>

          {/* 404 message */}
          <h1 className="text-4xl sm:text-5xl font-black text-[#1a1a1a] uppercase tracking-tight mb-2">
            404
          </h1>
          <p className="text-lg font-black text-[#1a1a1a]/50 uppercase tracking-wider mb-1">
            Tazo Not Found
          </p>
          <p className="text-sm font-bold text-[#1a1a1a]/35 mb-8 max-w-sm mx-auto">
            This tazo slipped out of the collection. It might have been traded, lost in battle, or never existed.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/"
              className="inline-flex items-center gap-2 px-6 py-3 border-3 border-[#1a1a1a] bg-[#FFCC00] text-sm font-black text-[#1a1a1a] uppercase tracking-wider hover:bg-[#FFE566] transition-colors"
              style={{ boxShadow: "3px 3px 0px #1a1a1a" }}>
              <Home className="w-4 h-4" />
              Back Home
            </Link>
            <Link href="/?page=tazos"
              className="inline-flex items-center gap-2 px-6 py-3 border-3 border-[#1a1a1a] bg-white text-sm font-black text-[#1a1a1a] uppercase tracking-wider hover:bg-[#FFCC00]/10 transition-colors"
              style={{ boxShadow: "3px 3px 0px #1a1a1a" }}>
              <Search className="w-4 h-4" />
              Browse Tazos
            </Link>
          </div>
        </div>
      </main>

      {/* Simple footer */}
      <footer className="border-t-[5px] border-[#1a1a1a] bg-[#1a1a1a] py-4">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">© 2026 Trading Tazos Game</p>
        </div>
      </footer>
    </div>
  )
}
