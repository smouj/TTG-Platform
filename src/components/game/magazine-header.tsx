"use client"
import Image from "next/image"

// ============================================================
// Magazine Header — shared across all pages.
// Dark var(--ttg-black) bar with TRADINGTAZOSGAME logo, "Official TTG
// Beta" subtitle, desktop nav tabs, mobile nav strip, and auth.
//
// variant="landing" (default) → full landing nav tabs
// variant="app" → logo + identity only (app has its own tab strip)
//
// Design tokens: all colors reference --ttg-* CSS custom properties
// via Tailwind bg-ttg-* / text-ttg-* utility classes.
// ============================================================

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Shield } from "lucide-react"

const NAV_ITEMS: [string, string][] = [
  ["home", "Home"],
  ["how-to-play", "How to Play"],
  ["collections", "Collections"],
  ["tazos", "Tazos"],
  ["leaderboard", "Rankings"],
  ["download", "Download"],
  ["faq", "FAQ"],
  ["shop", "Shop"],
  ["wiki", "Wiki"],
  ["contact", "Contact"],
]

export default function MagazineHeader({
  variant = "landing",
}: {
  variant?: "landing" | "app"
}) {
  const { user, logout } = useAuth()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const isApp = variant === "app"

  return (
    <header className="sticky top-0 z-40 bg-ttg-black border-b-[5px] border-ttg-black">
      {/* Top row: logo + brand + nav + auth */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
        {/* Left: Logo + Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 cursor-pointer no-underline group"
        >
          <Image
            src="/logo/logo-tg-yellow.png"
            alt="TTG"
            width={32}
            height={32}
            className="w-7 h-7 sm:w-8 sm:h-8"
            priority
          />
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-[0.08em] leading-none">
              TRADING<span className="text-ttg-yellow">TAZOS</span>
              <span className="text-white/80">GAME</span>
            </h2>
            <p className="text-[8px] font-bold uppercase tracking-[0.3em] leading-none mt-0.5"
               style={{ color: "var(--ttg-yellow)", opacity: 0.7 }}>
              Collect · Trade · Battle
            </p>
          </div>
        </Link>

        {/* Desktop nav — only on landing variant */}
        {!isApp && (
          <nav
            className="hidden sm:flex items-center gap-1"
            role="navigation"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map(([page, label]) => (
              <a
                key={page}
                href={page === "home" ? "/" : `/?page=${page}`}
                className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-colors no-underline text-white/50 hover:text-ttg-yellow"
              >
                {label}
              </a>
            ))}
          </nav>
        )}

        {/* Right: Auth buttons */}
        <div className="flex items-center gap-2">
          {mounted && user ? (
            <>
              {user.email === "dev@tradingtazosgame.com" && (
                <a
                  href="/admin"
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-black uppercase tracking-wider transition-colors no-underline border-2"
                  style={{ color: "var(--ttg-red)", borderColor: "color-mix(in srgb, var(--ttg-red) 20%, transparent)" }}
                >
                  <Shield className="w-3 h-3" /> Admin
                </a>
              )}
              {!isApp && (
                <a
                  href="/app"
                  className="px-3 py-1 text-[10px] font-black text-ttg-black bg-ttg-yellow uppercase tracking-wider border-2 border-white/20 hover:bg-ttg-yellow-hover transition-colors no-underline"
                >
                  Dashboard
                </a>
              )}
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
                className="px-3 py-1 text-[10px] font-black text-white/40 uppercase tracking-wider border-2 border-white/10 hover:border-ttg-red hover:text-ttg-red transition-colors bg-transparent cursor-pointer"
              >
                Log Out
              </button>
            </>
          ) : mounted ? (
            <a
              href="/login"
              className="px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider border-2 border-white/30 hover:border-ttg-yellow hover:text-ttg-yellow transition-colors no-underline"
            >
              Sign In
            </a>
          ) : null}
        </div>
      </div>

      {/* Mobile nav — only on landing variant */}
      {!isApp && (
        <nav className="sm:hidden flex items-center justify-center gap-0 px-2 pb-2 overflow-x-auto">
          {NAV_ITEMS.map(([page, label]) => (
            <a
              key={page}
              href={page === "home" ? "/" : `/?page=${page}`}
              className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-colors no-underline text-white/40 hover:text-ttg-yellow"
            >
              {label}
            </a>
          ))}
        </nav>
      )}
    </header>
  )
}
