'use client'

import { useState, useCallback } from 'react'
import { useI18n } from '@/lib/i18n'
import { GameView } from '@/lib/game/types'
import AlbumView from '@/components/game/album-view'
import BattleView from '@/components/game/battle-view'
import { ScannerView } from '@/components/game/scanner-view'
import StatsPanel from '@/components/game/stats-panel'
import LanguageSwitcher from '@/components/ui/language-switcher'
import { BookOpen, Swords, Scan, BarChart3, Disc3 } from 'lucide-react'

export default function Home() {
  const { t } = useI18n()
  const [activeView, setActiveView] = useState<GameView>('album')
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)

  const handleStatsUpdate = useCallback(() => {
    setStatsRefreshKey(prev => prev + 1)
  }, [])

  const TABS: { id: GameView; label: string; icon: typeof BookOpen }[] = [
    { id: 'album', label: t.tabAlbum, icon: BookOpen },
    { id: 'battle', label: t.tabBattle, icon: Swords },
    { id: 'scanner', label: t.tabScanner, icon: Scan },
    { id: 'stats', label: t.tabStats, icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen flex flex-col mag-bg">
      {/* ===== MAGAZINE MASTHEAD ===== */}
      <header className="sticky top-0 z-40 bg-[#FFCC00] border-b-4 border-[#1a1a1a] mag-stripes">
        {/* Top bar with exclusive badge */}
        <div className="bg-[#1a1a1a] text-white text-center py-1 px-4 flex items-center justify-between">
          <div className="flex-1" />
          <span className="text-[10px] sm:text-xs font-black tracking-[3px] uppercase text-[#FFCC00]">
            ★ {t.siteMastheadBadge} ★
          </span>
          <div className="flex-1 flex justify-end">
            <LanguageSwitcher />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          {/* Title Row - Magazine Masthead */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Spinning Tazo Disc Icon */}
            <div className="relative shrink-0">
              <div
                className="mag-spinner w-11 h-11 sm:w-14 sm:h-14 rounded-full border-[3px] border-[#1a1a1a] flex items-center justify-center"
                style={{
                  background: 'conic-gradient(from 0deg, #FFCC00, #E3350D, #3B4CCA, #FF6B00, #00A1E9, #78C850, #FFCC00)',
                  boxShadow: '3px 3px 0px #1a1a1a',
                }}
              >
                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white border-2 border-[#1a1a1a] flex items-center justify-center">
                  <Disc3 className="w-3 h-3 sm:w-4 sm:h-4 text-[#1a1a1a]" />
                </div>
              </div>
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
                  className="text-lg sm:text-2xl lg:text-3xl font-black italic mag-stroke-red leading-none"
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
              <span className="text-[9px] font-bold text-[#1a1a1a]/60 italic">
                Issue #001 — 2025 Edition
              </span>
            </div>
          </div>
        </div>

        {/* ===== MAGAZINE SECTION TABS ===== */}
        <nav className="max-w-7xl mx-auto px-4 pb-0" role="tablist" aria-label="Game views">
          <div className="flex gap-1 sm:gap-2">
            {TABS.map(({ id, label, icon: Icon }) => {
              const isActive = activeView === id
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveView(id)}
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
                      ★
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </nav>
      </header>

      {/* ===== MAIN CONTENT - Magazine Pages ===== */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
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
            <p className="text-[9px] sm:text-[10px] text-white/60 italic text-center sm:text-right">
              {t.siteFooterTrademark}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
