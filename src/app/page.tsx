'use client'

import { useState, useCallback } from 'react'
import { GameView } from '@/lib/game/types'
import AlbumView from '@/components/game/album-view'
import { BattleView } from '@/components/game/battle-view'
import { ScannerView } from '@/components/game/scanner-view'
import StatsPanel from '@/components/game/stats-panel'
import { BookOpen, Swords, Scan, BarChart3, Circle } from 'lucide-react'

const TABS: { id: GameView; label: string; icon: typeof BookOpen }[] = [
  { id: 'album', label: 'Album', icon: BookOpen },
  { id: 'battle', label: 'Battle', icon: Swords },
  { id: 'scanner', label: 'Scanner', icon: Scan },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
]

export default function Home() {
  const [activeView, setActiveView] = useState<GameView>('album')
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)

  const handleStatsUpdate = useCallback(() => {
    setStatsRefreshKey(prev => prev + 1)
  }, [])

  return (
    <div className="min-h-screen flex flex-col game-bg">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#12122a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Title Row */}
          <div className="flex items-center gap-3 mb-2">
            {/* Tazo Icon */}
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 shrink-0">
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FFCB05, #FF6B00, #00A1E9)',
                  boxShadow: '0 0 12px rgba(255, 203, 5, 0.3)',
                }}
              >
                <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-white/90" fill="white" fillOpacity={0.2} />
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent leading-tight">
                Tazos Legends Arena
              </h1>
              <p className="text-[10px] sm:text-xs text-white/40 leading-tight truncate">
                Escanea tus tazos antiguos, crea tu álbum digital y hazlos combatir en una arena física
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex gap-1" role="tablist" aria-label="Game views">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={activeView === id}
                onClick={() => setActiveView(id)}
                className={`
                  flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${activeView === id
                    ? 'bg-white/10 text-white shadow-sm tab-active-glow'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
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

      {/* Sticky Footer */}
      <footer className="border-t border-white/10 bg-[#12122a]/80 backdrop-blur-md mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1">
            <p className="text-[10px] text-white/25">
              Tazos Legends Arena &copy; {new Date().getFullYear()} — A nostalgic tribute to the golden age of tazos
            </p>
            <p className="text-[10px] text-white/15">
              Pokémon, Digimon & Dragon Ball Z are trademarks of their respective owners
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
