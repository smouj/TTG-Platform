"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Home, RefreshCw } from "lucide-react"
import type { Metadata } from "next"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f3e0]" style={{
      backgroundImage: "radial-gradient(circle at 20% 30%, rgba(227,53,13,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,204,0,0.04) 0%, transparent 50%)",
    }}>
      {/* Header */}
      <header className="border-b-[5px] border-[#1a1a1a] bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo/logo-icon-black.webp" alt="TTG" className="w-8 h-8" />
            <span className="text-sm font-black text-[#1a1a1a] uppercase tracking-tight hidden sm:inline">Trading Tazos Game</span>
          </Link>
          <span className="ml-auto text-[10px] font-black text-[#E3350D] uppercase tracking-wider">System Error</span>
        </div>
      </header>

      {/* 500 Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          {/* Broken tazo disc */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full mx-auto mb-6 border-4 border-[#E3350D] flex items-center justify-center relative"
            style={{
              boxShadow: "6px 6px 0px #1a1a1a, inset 0 0 40px rgba(227,53,13,0.15)",
              background: "linear-gradient(135deg, #2a2a2a 0%, #3a3a3a 30%, #2a2a2a 60%, #1a1a1a 100%)",
            }}>
            {/* Crack effect */}
            <div className="absolute inset-0 rounded-full overflow-hidden opacity-40"
              style={{
                background: "linear-gradient(45deg, transparent 40%, rgba(227,53,13,0.3) 41%, rgba(227,53,13,0.3) 42%, transparent 43%, transparent 55%, rgba(227,53,13,0.2) 56%, rgba(227,53,13,0.2) 57%, transparent 58%)",
              }} />
            <span className="text-4xl sm:text-5xl font-black text-[#E3350D] mag-stroke-sm relative z-10">!</span>
          </div>

          {/* 500 message */}
          <h1 className="text-4xl sm:text-5xl font-black text-[#1a1a1a] uppercase tracking-tight mb-2">
            500
          </h1>
          <p className="text-lg font-black text-[#E3350D]/70 uppercase tracking-wider mb-1">
            Battle Arena Crash
          </p>
          <p className="text-sm font-bold text-[#1a1a1a]/35 mb-2 max-w-sm mx-auto">
            Something went wrong in the arena. The tazos are scattered everywhere.
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-[10px] font-mono text-[#E3350D]/40 mb-6 max-w-md mx-auto break-all">
              {error.message || "Unknown error"}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 border-3 border-[#1a1a1a] bg-[#E3350D] text-sm font-black text-white uppercase tracking-wider hover:bg-[#C42D0B] transition-colors"
              style={{ boxShadow: "3px 3px 0px #1a1a1a" }}>
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link href="/"
              className="inline-flex items-center gap-2 px-6 py-3 border-3 border-[#1a1a1a] bg-white text-sm font-black text-[#1a1a1a] uppercase tracking-wider hover:bg-[#FFCC00]/10 transition-colors"
              style={{ boxShadow: "3px 3px 0px #1a1a1a" }}>
              <Home className="w-4 h-4" />
              Back Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-[5px] border-[#1a1a1a] bg-[#1a1a1a] py-4">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">© 2026 Trading Tazos Game</p>
        </div>
      </footer>
    </div>
  )
}
