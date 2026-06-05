"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "@/lib/auth-context"
import LanguageSwitcher from "@/components/ui/language-switcher"

const navItems = [
  { href: "/how-to-play", fallback: "How to Play" },
  { href: "/collections", fallback: "Collections" },
  { href: "/tazos", fallback: "Tazos" },
  { href: "/leaderboard", fallback: "Leaderboard" },
  { href: "/download", fallback: "Download" },
  { href: "/faq", fallback: "FAQ" },
]

// Safe accessor: language detection may fail during SSR first paint
function safeLabel(t: Record<string, unknown>, key: string, fallback: string): string {
  const val = t[key]
  return typeof val === "string" && val.length > 0 ? val : fallback
}

function HeaderContent() {
  const { t } = useI18n()
  const tt = t as unknown as Record<string, unknown>
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-[#FFCC00] border-b-4 border-[#1a1a1a] mag-stripes">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 min-w-0 shrink-0" onClick={() => setOpen(false)}>
            <img src="/logo/logo-icon-black.webp" alt="Trading Tazos Game" className="w-12 h-12 drop-shadow-[3px_3px_0px_rgba(26,26,26,0.3)]" />
            <div className="min-w-0 hidden sm:block">
              <p className="text-xl sm:text-2xl font-black leading-none uppercase text-[#1a1a1a] truncate">
                {safeLabel(tt, "siteTitle", "TRADING TAZOS GAME")}
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E3350D]">
                {safeLabel(tt, "siteMastheadBadge", "COLLECTOR'S EDITION")}
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#1a1a1a] hover:bg-white border-2 border-transparent hover:border-[#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] transition-all"
              >
                {item.fallback}
              </Link>
            ))}
          </nav>

          {/* Auth buttons — auth-aware: logged-in → Dashboard, logged-out → Sign In */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto lg:ml-3 shrink-0">
            <LanguageSwitcher />
            {!loading && user ? (
              <>
                <span className="hidden lg:inline text-[11px] font-black uppercase tracking-wider text-[#1a1a1a]/70 truncate max-w-[120px]">
                  {user.displayName || user.name}
                </span>
                <Link
                  href="/app"
                  className="bg-[#E3350D] text-white px-2.5 sm:px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all shrink-0"
                >
                  <LayoutDashboard className="w-3 h-3 sm:w-3.5 sm:h-3.5 inline mr-1" />
                  {safeLabel(tt, "nav_play_now", "Play")}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="bg-white text-[#1a1a1a] px-2 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all hidden sm:inline-flex items-center shrink-0"
                  title="Log out"
                >
                  <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="bg-white text-[#1a1a1a] px-2.5 sm:px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all shrink-0"
                >
                  {safeLabel(tt, "auth_login", "Sign In")}
                </Link>
                <Link
                  href="/register"
                  className="bg-[#E3350D] text-white px-2.5 sm:px-4 py-2 text-[10px] sm:text-[11px] font-black uppercase tracking-wider whitespace-nowrap border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all hidden sm:inline-flex shrink-0"
                >
                  {safeLabel(tt, "auth_register", "Register")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="lg:hidden border-3 border-[#1a1a1a] bg-white p-2 shadow-[2px_2px_0px_#1a1a1a] shrink-0"
            aria-label="Open menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {open && (
          <div className="lg:hidden mt-3 border-3 border-[#1a1a1a] bg-white shadow-[4px_4px_0px_#1a1a1a] p-3">
            <nav className="grid gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 text-sm font-black uppercase text-[#1a1a1a] hover:bg-[#FFCC00]"
                >
                  {item.fallback}
                </Link>
              ))}
            </nav>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {!loading && user ? (
                <>
                  <Link
                    href="/app"
                    onClick={() => setOpen(false)}
                    className="mag-btn bg-[#E3350D] text-white px-3 py-2.5 text-sm font-black uppercase text-center flex items-center justify-center gap-1.5"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {safeLabel(tt, "nav_play_now", "Play Now")}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mag-btn bg-white text-[#1a1a1a] px-3 py-2.5 text-sm font-black uppercase text-center flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="mag-btn bg-white text-[#1a1a1a] px-3 py-2.5 text-sm font-black uppercase text-center"
                  >
                    {safeLabel(tt, "auth_login", "Sign In")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="mag-btn bg-[#E3350D] text-white px-3 py-2.5 text-sm font-black uppercase text-center"
                  >
                    {safeLabel(tt, "auth_register", "Register")}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 bg-[#FFCC00] border-b-4 border-[#1a1a1a] mag-stripes">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="w-12 h-12 bg-[#1a1a1a]/10 rounded" />
        <div className="hidden sm:block">
          <div className="h-6 w-48 bg-[#1a1a1a]/10 rounded mb-1" />
          <div className="h-3 w-32 bg-[#1a1a1a]/10 rounded" />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="h-8 w-14 bg-[#1a1a1a]/10 rounded" />
          <div className="h-8 w-20 bg-[#1a1a1a]/10 rounded" />
        </div>
      </div>
    </header>
  )
}

export default function PublicHeader() {
  return (
    <Suspense fallback={<HeaderSkeleton />}>
      <HeaderContent />
    </Suspense>
  )
}
