'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useI18n } from '@/lib/i18n'
import { GameView } from '@/lib/game/types'
import AlbumView from '@/components/game/album-view'
import BattleView from '@/components/game/battle-view'
import { ScannerView } from '@/components/game/scanner-view'
import StatsPanel from '@/components/game/stats-panel'
import LanguageSwitcher from '@/components/ui/language-switcher'
import { BookOpen, Swords, Scan, BarChart3, User, LogOut, Package, Layers, Download, ShoppingBag, Target, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

const GAME_TABS = ['album', 'battle', 'scanner', 'stats'] as const

function getInitialTab(): GameView {
  if (typeof window === 'undefined') return 'album'
  const params = new URLSearchParams(window.location.search)
  const tab = params.get('tab')
  return (tab && (GAME_TABS as readonly string[]).includes(tab)) ? tab as GameView : 'album'
}

export default function Home() {
  const { t } = useI18n()
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [activeView, setActiveView] = useState<GameView>(getInitialTab)
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)

  // Sync tab from URL on browser back/forward
  useEffect(() => {
    const handlePopState = () => setActiveView(getInitialTab())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleTabChange = useCallback((view: GameView) => {
    setActiveView(view)
    const url = view === 'album' ? '/' : `/?tab=${view}`
    window.history.pushState(null, '', url)
  }, [])

  const handleStatsUpdate = useCallback(() => {
    setStatsRefreshKey(prev => prev + 1)
  }, [])

  const TABS: { id: GameView | string; label: string; icon: typeof BookOpen; href?: string; external?: boolean }[] = [
    { id: 'album', label: t.tabAlbum, icon: BookOpen },
    { id: 'battle', label: t.tabBattle, icon: Swords },
    { id: 'scanner', label: t.tabScanner, icon: Scan },
    { id: 'stats', label: t.tabStats, icon: BarChart3 },
    { id: 'shop', label: 'Shop', icon: ShoppingBag, href: '/shop', external: true },
    { id: 'quests', label: 'Quests', icon: Target, href: '/quests', external: true },
    { id: 'leaderboard', label: 'Ranks', icon: Trophy, href: '/leaderboard', external: true },
    { id: 'download', label: 'Desktop', icon: Download, href: '/download', external: true },
  ]

  return (
    <div className="min-h-screen flex flex-col mag-bg">
      {/* ===== MAGAZINE MASTHEAD ===== */}
      <header className="sticky top-0 z-40 bg-[#FFCC00] border-b-4 border-[#1a1a1a] mag-stripes">
        {/* Top bar with exclusive badge */}
        <div className="bg-[#1a1a1a] text-white text-center py-1 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="text-[10px] sm:text-xs font-bold text-zinc-400 hover:text-[#FFCC00] transition-colors tracking-wider uppercase"
                >
                  {t.auth_login}
                </Link>
                <span className="text-zinc-600">|</span>
                <Link
                  href="/register"
                  className="text-[10px] sm:text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors tracking-wider uppercase"
                >
                  {t.auth_register}
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-[#FFCC00] hover:text-white transition-colors tracking-wider uppercase"
                >
                  <User className="w-3 h-3" />
                  {user.name}
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute left-0 top-full mt-1 z-20 w-44 bg-zinc-900 border-2 border-zinc-700 rounded-lg shadow-xl overflow-hidden">
                      <button
                        onClick={() => { logout(); setShowUserMenu(false); }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#E3350D] hover:bg-red-500/10 transition-colors w-full text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        {t.auth_logout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <span className="text-[10px] sm:text-xs font-black tracking-[3px] uppercase text-[#FFCC00]">
            {t.siteMastheadBadge}
          </span>
          <div className="flex-1 flex justify-end">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          {/* Title Row - Magazine Masthead */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* TTG Logo */}
            <div className="relative shrink-0">
              <img
                src="/logo/logo-icon-black.png"
                alt="Trading Tazos Game"
                className="w-12 h-12 sm:w-16 sm:h-16 drop-shadow-[3px_3px_0px_rgba(26,26,26,0.3)]"
              />
            </div>

            {/* Title & Subtitle */}
            <div className="min-w-0 flex-1">
              <h1
                className="text-2xl sm:text-4xl lg:text-5xl font-black leading-none tracking-tight mag-stroke"
                style={{ WebkitTextStroke: '3px #1a1a1a' }}
              >
                {t.siteTitle}
              </h1>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className="text-lg sm:text-2xl lg:text-3xl font-black mag-stroke-red leading-none"
                  style={{ WebkitTextStroke: '2px #1a1a1a' }}
                >
                  {t.siteSubtitle}
                </span>
                <span className="hidden sm:inline text-[10px] font-black text-[#1a1a1a] bg-white border-2 border-[#1a1a1a] px-1.5 py-0.5 shadow-[2px_2px_0px_#1a1a1a] uppercase tracking-wider">
                  {t.siteIssue}
                </span>
              </div>
            </div>

            {/* Issue info - right side */}
            <div className="hidden md:flex flex-col items-end gap-1 shrink-0">
              <div className="speech-bubble text-[10px]">
                {t.siteTagline}
              </div>
              <span className="text-[9px] font-bold text-[#1a1a1a]/60">
                Issue #001 — 2025 Edition
              </span>
            </div>
          </div>
        </div>

        {/* ===== MAGAZINE SECTION TABS ===== */}
        <nav className="max-w-7xl mx-auto px-4 pb-0" role="tablist" aria-label="Game views">
          <div className="flex gap-1 sm:gap-2">
            {TABS.map(({ id, label, icon: Icon, href, external }) => {
              const isActive = activeView === id
              
              // External links (shop, quests, leaderboard, download) use Next Link
              if (external && href) {
                return (
                  <Link
                    key={id}
                    href={href}
                    className="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 font-black text-[11px] sm:text-xs tracking-wider uppercase transition-all duration-150 mag-tab bg-white/80 text-[#1a1a1a]/60 rounded-t-lg border-2 border-b-0 border-[#1a1a1a]/20 hover:bg-white hover:text-[#1a1a1a] hover:border-[#1a1a1a]/40"
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{label}</span>
                  </Link>
                )
              }
              
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleTabChange(id as GameView)}
                  className={`
                    flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 font-black text-[11px] sm:text-xs
                    tracking-wider uppercase transition-all duration-150
                    ${
                      isActive
                        ? 'mag-tab mag-tab-active bg-[#FFCC00] text-[#1a1a1a] rounded-t-lg -mb-[1px]'
                        : 'mag-tab bg-white/80 text-[#1a1a1a]/60 rounded-t-lg border-2 border-b-0 border-[#1a1a1a]/20 hover:bg-white hover:text-[#1a1a1a] hover:border-[#1a1a1a]/40'
                    }
                  `}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{label}</span>
                  {isActive && (
                    <span className="hidden sm:inline text-[8px] bg-[#E3350D] text-white rounded-full w-4 h-4 flex items-center justify-center border border-[#1a1a1a]">

                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      {/* ===== MAIN CONTENT - Magazine Pages ===== */}
      <main className={`flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 ${activeView === 'battle' ? 'min-h-0 overflow-hidden flex' : ''}`}>
        {activeView === 'album' && (
          <AlbumView onStatsUpdate={handleStatsUpdate} />
        )}
        {activeView === 'battle' && (
          <BattleView />
        )}
        {activeView === 'scanner' && (
          <ScannerView />
        )}
        {activeView === 'stats' && (
          <StatsPanel refreshKey={statsRefreshKey} />
        )}
      </main>

      {/* ===== MAGAZINE FOOTER BAR ===== */}
      <footer className="bg-[#E3350D] border-t-4 border-[#1a1a1a] mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Decorative top dots */}
          <div className="flex justify-center gap-2 mb-2">
            {['#FFCC00', '#3B4CCA', '#FF6B00', '#78C850', '#00A1E9'].map((color, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full border border-[#1a1a1a]/30"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1">
            <p className="text-[10px] sm:text-xs font-bold text-white tracking-wide">
              {t.siteTitle} &copy; {new Date().getFullYear()} — {t.siteFooterTribute}
            </p>
            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-white/60">
              <a href="https://github.com/smouj/Trading-Tazos-Game/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="hover:text-white underline underline-offset-2">
                License
              </a>
              <span>|</span>
              <a href="mailto:support@medaclawarena.com" className="hover:text-white underline underline-offset-2">
                support@medaclawarena.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
