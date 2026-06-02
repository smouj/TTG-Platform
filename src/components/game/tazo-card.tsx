'use client'

import { useState } from 'react'
import { Tazo, RARITY_CONFIG, CONDITION_CONFIG, TazoCondition, Rarity } from '@/lib/game/types'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-react'

interface TazoCardProps {
  tazo: Tazo
  onClick?: (tazo: Tazo) => void
}

const FRANCHISE_COLORS: Record<string, { from: string; to: string; text: string; border: string }> = {
  pokemon: { from: '#FFCB05', to: '#FF8C00', text: '#92400E', border: '#FFCB05' },
  digimon: { from: '#00A1E9', to: '#0057B7', text: '#1E3A5F', border: '#00A1E9' },
  dbz: { from: '#FF6B00', to: '#CC4400', text: '#7C2D12', border: '#FF6B00' },
}

const STAT_CONFIG = [
  { key: 'attack' as const, label: 'ATK', color: '#EF4444' },
  { key: 'defense' as const, label: 'DEF', color: '#3B82F6' },
  { key: 'spin' as const, label: 'SPN', color: '#10B981' },
  { key: 'weight' as const, label: 'WGT', color: '#F59E0B' },
  { key: 'aura' as const, label: 'AUR', color: '#8B5CF6' },
  { key: 'control' as const, label: 'CTR', color: '#EC4899' },
]

const RARITY_ORDER: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  ultra: 4,
  legendary: 5,
}

function getRarityStars(rarity: Rarity): string {
  return '★'.repeat(RARITY_ORDER[rarity])
}

export default function TazoCard({ tazo, onClick }: TazoCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const franchiseSlug = tazo.franchise?.slug || 'pokemon'
  const franchiseColors = FRANCHISE_COLORS[franchiseSlug] || FRANCHISE_COLORS.pokemon
  const rarityConfig = RARITY_CONFIG[tazo.rarity as Rarity]
  const conditionConfig = CONDITION_CONFIG[tazo.condition as TazoCondition]

  const isHolo = tazo.condition === 'holo'
  const isMetallic = tazo.condition === 'metallic'
  const isLegendary = tazo.rarity === 'legendary'
  const isWorn = tazo.condition === 'worn'
  const isNotOwned = !tazo.isOwned

  // Build circle border class
  let circleBorderClass = ''
  if (isHolo) {
    circleBorderClass = 'holo-border'
  } else if (isLegendary) {
    circleBorderClass = 'legendary-glow'
  }

  return (
    <div
      className={`
        tazo-card-hover relative cursor-pointer rounded-xl
        bg-[#1e1e36] border border-white/10
        p-3 flex flex-col items-center gap-2
        transition-all duration-300
        ${isNotOwned ? 'opacity-60' : ''}
        ${isHovered ? 'ring-1 ring-white/20' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(tazo)}
      role="button"
      tabIndex={0}
      aria-label={`${tazo.name} tazo card`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(tazo)
        }
      }}
    >
      {/* Circular Tazo */}
      <div
        className={`
          relative w-[100px] h-[100px] sm:w-[110px] sm:h-[110px]
          rounded-full flex items-center justify-center
          shrink-0
          ${circleBorderClass}
        `}
        style={{
          border: isHolo ? undefined : isLegendary ? '3px solid #FBBF24' : `3px solid ${franchiseColors.border}60`,
          background: `linear-gradient(135deg, ${franchiseColors.from}40, ${franchiseColors.to}60)`,
          padding: '3px',
        }}
      >
        <div
          className={`
            w-full h-full rounded-full flex flex-col items-center justify-center
            relative overflow-hidden
            ${isMetallic ? 'metallic-effect' : ''}
            ${isWorn ? 'worn-overlay' : ''}
          `}
          style={{
            background: `linear-gradient(135deg, ${franchiseColors.from}30, ${franchiseColors.to}50, ${franchiseColors.from}20)`,
          }}
        >
          {tazo.imageUrl ? (
            <img
              src={tazo.imageUrl}
              alt={tazo.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <>
              <span
                className="text-2xl sm:text-3xl font-black leading-none"
                style={{ color: franchiseColors.from, textShadow: `0 0 10px ${franchiseColors.from}40` }}
              >
                {tazo.name.charAt(0)}
              </span>
              <span
                className="text-[8px] sm:text-[9px] font-semibold mt-0.5 opacity-80"
                style={{ color: franchiseColors.from }}
              >
                {tazo.printedNumber ? `#${tazo.printedNumber}` : ''}
              </span>
            </>
          )}

          {/* Not owned lock overlay */}
          {isNotOwned && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white/60" style={{ animation: 'lock-pulse 2s ease-in-out infinite' }} />
            </div>
          )}
        </div>
      </div>

      {/* Name and Franchise */}
      <div className="text-center w-full min-h-[36px]">
        <p className="text-white font-bold text-xs sm:text-sm leading-tight truncate">
          {tazo.name}
        </p>
        <p className="text-[10px] text-white/50 leading-tight truncate">
          {tazo.franchise?.name || 'Unknown'}
        </p>
      </div>

      {/* Rarity & Condition Badges */}
      <div className="flex gap-1 flex-wrap justify-center">
        <Badge
          variant="outline"
          className="text-[9px] px-1.5 py-0 h-4 border-current"
          style={{
            color: rarityConfig?.color === 'text-gray-600' ? '#9CA3AF' :
                   rarityConfig?.color === 'text-green-600' ? '#22C55E' :
                   rarityConfig?.color === 'text-blue-600' ? '#3B82F6' :
                   rarityConfig?.color === 'text-purple-600' ? '#A855F7' :
                   rarityConfig?.color === 'text-amber-600' ? '#F59E0B' : '#9CA3AF',
            borderColor: rarityConfig?.color === 'text-gray-600' ? '#9CA3AF40' :
                         rarityConfig?.color === 'text-green-600' ? '#22C55E40' :
                         rarityConfig?.color === 'text-blue-600' ? '#3B82F640' :
                         rarityConfig?.color === 'text-purple-600' ? '#A855F740' :
                         rarityConfig?.color === 'text-amber-600' ? '#F59E0B40' : '#9CA3AF40',
          }}
        >
          {getRarityStars(tazo.rarity as Rarity)}
        </Badge>
        <Badge
          variant="outline"
          className="text-[9px] px-1.5 py-0 h-4"
          style={{
            color: conditionConfig?.color === 'text-emerald-600' ? '#10B981' :
                   conditionConfig?.color === 'text-green-600' ? '#22C55E' :
                   conditionConfig?.color === 'text-yellow-600' ? '#EAB308' :
                   conditionConfig?.color === 'text-orange-600' ? '#F97316' :
                   conditionConfig?.color === 'text-cyan-600' ? '#06B6D4' :
                   conditionConfig?.color === 'text-slate-600' ? '#94A3B8' : '#9CA3AF',
            borderColor: 'currentColor',
            borderOpacity: 0.3,
          }}
        >
          {conditionConfig?.icon} {conditionConfig?.label}
        </Badge>
      </div>

      {/* Mini Stat Bars */}
      <div className="w-full grid grid-cols-2 gap-x-2 gap-y-0.5 mt-0.5">
        {STAT_CONFIG.map((stat) => (
          <div key={stat.key} className="flex items-center gap-1">
            <span className="text-[8px] text-white/40 w-5 text-right font-mono">{stat.label}</span>
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full stat-bar-fill"
                style={{
                  width: `${tazo[stat.key]}%`,
                  backgroundColor: stat.color,
                  opacity: 0.8,
                }}
              />
            </div>
            <span className="text-[8px] text-white/30 w-4 font-mono">{tazo[stat.key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
