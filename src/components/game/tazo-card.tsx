'use client'

import { Tazo, RARITY_CONFIG, CONDITION_CONFIG, TazoCondition, Rarity } from '@/lib/game/types'
import { Lock, Star } from 'lucide-react'

interface TazoCardProps {
  tazo: Tazo
  onClick?: (tazo: Tazo) => void
}

const FRANCHISE_COLORS: Record<string, { from: string; to: string; text: string; strip: string }> = {
  pokemon: { from: '#FFCB05', to: '#FF8C00', text: '#7C2D12', strip: '#FFCB05' },
  digimon: { from: '#00A1E9', to: '#0057B7', text: '#1E3A5F', strip: '#00A1E9' },
  dbz: { from: '#FF6B00', to: '#CC4400', text: '#7C2D12', strip: '#FF6B00' },
}

const FRANCHISE_STRIP_TEXT: Record<string, string> = {
  pokemon: '#92400E',
  digimon: '#FFFFFF',
  dbz: '#FFFFFF',
}

const STAT_CONFIG = [
  { key: 'attack' as const, label: 'ATK', color: '#EF4444' },
  { key: 'defense' as const, label: 'DEF', color: '#3B82F6' },
  { key: 'resistance' as const, label: 'RES', color: '#6366F1' },
  { key: 'weight' as const, label: 'WGT', color: '#F59E0B' },
  { key: 'stability' as const, label: 'STA', color: '#14B8A6' },
  { key: 'spin' as const, label: 'SPN', color: '#10B981' },
  { key: 'control' as const, label: 'CTR', color: '#EC4899' },
  { key: 'bounce' as const, label: 'BNC', color: '#F97316' },
  { key: 'precision' as const, label: 'PRC', color: '#06B6D4' },
]

const RARITY_ORDER: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  ultra: 4,
  legendary: 5,
}

const RARITY_STICKER: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: '#D1D5DB', border: '#6B7280', text: '#1F2937' },
  uncommon: { bg: '#4ADE80', border: '#16A34A', text: '#052E16' },
  rare: { bg: '#60A5FA', border: '#2563EB', text: '#FFFFFF' },
  ultra: { bg: '#C084FC', border: '#9333EA', text: '#FFFFFF' },
  legendary: { bg: '#FBBF24', border: '#B45309', text: '#1F2937' },
}

function getRarityStars(rarity: Rarity): string {
  return '★'.repeat(RARITY_ORDER[rarity])
}

export default function TazoCard({ tazo, onClick }: TazoCardProps) {
  const franchiseSlug = tazo.franchise?.slug || 'pokemon'
  const franchiseColors = FRANCHISE_COLORS[franchiseSlug] || FRANCHISE_COLORS.pokemon
  const franchiseStripText = FRANCHISE_STRIP_TEXT[franchiseSlug] || '#1F2937'
  const rarityConfig = RARITY_CONFIG[tazo.rarity as Rarity]
  const conditionConfig = CONDITION_CONFIG[tazo.condition as TazoCondition]
  const raritySticker = RARITY_STICKER[tazo.rarity as string] || RARITY_STICKER.common

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
        tazo-card-hover mag-card relative cursor-pointer rounded-lg
        p-3 flex flex-col items-center gap-2
        transition-all duration-300 select-none
        ${isNotOwned ? 'grayscale-[60%] opacity-75' : ''}
      `}
      onClick={() => onClick?.(tazo)}
      role="button"
      tabIndex={0}
      aria-label={`${tazo.displayName || tazo.name || "..."} tazo card`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.(tazo)
        }
      }}
    >
      {/* Exclusive badge for legendary */}
      {isLegendary && !isNotOwned && (
        <div className="exclusive-badge">EXCLUSIVE</div>
      )}

      {/* Not owned overlay */}
      {isNotOwned && (
        <div className="absolute inset-0 z-20 rounded-lg bg-white/40 flex items-center justify-center">
          <Lock
            className="w-10 h-10 text-zinc-400"
            style={{ animation: 'lock-pulse 2s ease-in-out infinite' }}
          />
        </div>
      )}

      {/* Circular Tazo Disc */}
      <div
        className={`
          relative w-[100px] h-[100px] sm:w-[112px] sm:h-[112px]
          rounded-full flex items-center justify-center
          shrink-0
          ${circleBorderClass}
        `}
        style={{
          border: isHolo ? undefined : '3px solid #1a1a1a',
          background: isHolo
            ? undefined
            : `linear-gradient(135deg, ${franchiseColors.from}, ${franchiseColors.to})`,
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
            background: `linear-gradient(135deg, ${franchiseColors.from}80, ${franchiseColors.to}CC, ${franchiseColors.from}60)`,
          }}
        >
          {tazo.imageUrl ? (
            <img
              src={tazo.imageUrl}
              alt={tazo.displayName || tazo.name || "..."}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <>
              <span
                className="text-3xl sm:text-4xl font-black leading-none mag-stroke-sm"
                style={{
                  color: '#FFFFFF',
                  WebkitTextStroke: '2px #1a1a1a',
                  paintOrder: 'stroke fill',
                }}
              >
                {tazo.displayName || tazo.name || "...".charAt(0)}
              </span>
              {tazo.number && (
                <span
                  className="text-[8px] sm:text-[9px] font-black mt-0.5 px-1.5 rounded-sm leading-tight"
                  style={{
                    color: '#1a1a1a',
                    background: 'rgba(255,255,255,0.85)',
                    border: '1px solid #1a1a1a',
                  }}
                >
                  #{tazo.number}
                </span>
              )}
            </>
          )}

          {/* Not owned lock inside circle */}
          {isNotOwned && (
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
              <Lock className="w-6 h-6 text-white/70" style={{ animation: 'lock-pulse 2s ease-in-out infinite' }} />
            </div>
          )}
        </div>

        {/* Legendary star sticker in corner */}
        {isLegendary && !isNotOwned && (
          <div
            className="absolute -top-1 -left-1 z-10 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full"
            style={{
              background: '#FFCC00',
              border: '2px solid #1a1a1a',
              boxShadow: '1px 1px 0px #1a1a1a',
            }}
          >
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-900 fill-yellow-900" />
          </div>
        )}
      </div>

      {/* Name section */}
      <div className="text-center w-full min-h-[40px]">
        <p
          className="font-black text-sm sm:text-base leading-tight truncate"
          style={{ color: '#1a1a1a' }}
        >
          {tazo.displayName || tazo.name || "..."}
        </p>
        {/* Franchise name on colored strip */}
        <div
          className="mt-0.5 px-2 py-0.5 border-2 border-black inline-block"
          style={{
            background: franchiseColors.strip,
            color: franchiseStripText,
          }}
        >
          <span className="text-[10px] font-black uppercase tracking-wide">
            {tazo.franchise?.name || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Rarity & Condition - Magazine sticker style */}
      <div className="flex gap-1.5 flex-wrap justify-center items-center">
        {/* Rarity sticker */}
        <div
          className="px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider"
          style={{
            background: raritySticker.bg,
            color: raritySticker.text,
            border: `2px solid ${raritySticker.border}`,
            boxShadow: '1px 1px 0px #1a1a1a',
          }}
        >
          {getRarityStars(tazo.rarity as Rarity)} {rarityConfig?.label}
        </div>
        {/* Condition badge */}
        <div
          className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold"
          style={{
            background: '#FFFFFF',
            color: '#1a1a1a',
            border: '2px solid #1a1a1a',
            boxShadow: '1px 1px 0px #1a1a1a',
          }}
        >
          {conditionConfig?.icon} {conditionConfig?.label}
        </div>
      </div>

      {/* Stat Bars - Magazine style */}
      <div className="w-full grid grid-cols-2 gap-x-2 gap-y-1 mt-0.5">
        {STAT_CONFIG.map((stat) => (
          <div key={stat.key} className="flex items-center gap-1">
            <span
              className="text-[8px] sm:text-[9px] font-black w-6 text-right"
              style={{ color: '#1a1a1a' }}
            >
              {stat.label}
            </span>
            <div
              className="flex-1 h-2.5 overflow-hidden"
              style={{
                background: '#F3F4F6',
                border: '1px solid #1a1a1a',
              }}
            >
              <div
                className="h-full stat-bar-fill"
                style={{
                  width: `${tazo[stat.key]}%`,
                  backgroundColor: stat.color,
                }}
              />
            </div>
            <span
              className="text-[8px] sm:text-[9px] font-black w-5 text-center"
              style={{ color: '#1a1a1a' }}
            >
              {tazo[stat.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
