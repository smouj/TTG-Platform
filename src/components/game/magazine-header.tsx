"use client"

// ============================================================
// Magazine Header — shared across standalone auth/legal pages.
// IDENTICAL to the launcher-view masthead: dark #1a1a1a bar with
// TRADINGTAZOSGAME logo, "Official TTG Beta" subtitle,
// desktop nav tabs, mobile nav strip, and auth buttons.
// Nav links go to /?page=xxx since this is used on standalone
// pages (not inside the launcher SPA).
// ============================================================

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

const NAV_ITEMS: [string, string][] = [
  ["home", "Home"],
  ["how-to-play", "How to Play"],
  ["collections", "Collections"],
  ["tazos", "Tazos"],
  ["leaderboard", "Rankings"],
  ["download", "Download"],
  ["faq", "FAQ"],
  ["shop", "Shop"],
]

export default function MagazineHeader() {
  const { user, logout } = useAuth()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <header
      className="sticky top-0 z-40 border-b-[5px] border-[#1a1a1a]"
      style={{ background: "#1a1a1a" }}
    >
      {/* Top row: logo + brand + nav + auth — identical to launcher */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
        {/* Left: Logo + Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 cursor-pointer no-underline group"
        >
          <img
            src="/favicon-192.png"
            alt="TTG"
            className="w-7 h-7 sm:w-8 sm:h-8"
          />
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-[0.08em] leading-none">
              TRADING<span className="text-[#FFCC00]">TAZOS</span>
              <span className="text-white/80">GAME</span>
            </h2>
            <p className="text-[8px] font-bold text-[#FFCC00]/70 uppercase tracking-[0.3em] leading-none mt-0.5">
              Official TTG Beta
            </p>
          </div>
        </Link>

        {/* Desktop nav — identical items to launcher */}
        <nav
          className="hidden sm:flex items-center gap-1"
          role="navigation"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map(([page, label]) => (
            <a
              key={page}
              href={page === "home" ? "/" : `/?page=${page}`}
              className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-colors no-underline text-white/50 hover:text-[#FFCC00]"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right: Auth buttons — identical to launcher */}
        <div className="flex items-center gap-2">
          {mounted && user ? (
            <>
              <a
                href="/app"
                className="px-3 py-1 text-[10px] font-black text-[#1a1a1a] bg-[#FFCC00] uppercase tracking-wider border-2 border-white/20 hover:bg-[#FFE566] transition-colors no-underline"
              >
                Dashboard
              </a>
              <button
                onClick={() => {
                  localStorage.removeItem("ttg-token")
                  document.cookie =
                    "auth_token=; Max-Age=0; path=/"
                  document.cookie =
                    "ttg_session=; Max-Age=0; path=/"
                  logout()
                  window.location.href = "/"
                }}
                className="px-3 py-1 text-[10px] font-black text-white/40 uppercase tracking-wider border-2 border-white/10 hover:border-[#E3350D] hover:text-[#E3350D] transition-colors bg-transparent cursor-pointer"
              >
                Log Out
              </button>
            </>
          ) : mounted ? (
            <a
              href="/login"
              className="px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider border-2 border-white/30 hover:border-[#FFCC00] hover:text-[#FFCC00] transition-colors no-underline"
            >
              Sign In
            </a>
          ) : null}
        </div>
      </div>

      {/* Mobile nav — identical to launcher */}
      <nav className="sm:hidden flex items-center justify-center gap-0 px-2 pb-2 overflow-x-auto">
        {NAV_ITEMS.map(([page, label]) => (
          <a
            key={page}
            href={page === "home" ? "/" : `/?page=${page}`}
            className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-colors no-underline text-white/40 hover:text-[#FFCC00]"
          >
            {label}
          </a>
        ))}
      </nav>
    </header>
  )
}