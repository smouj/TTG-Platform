'use client'

import React, { useState } from "react"
import { Tazo, RARITY_CONFIG, CONDITION_CONFIG, TazoCondition, Rarity, SOURCE_STATUS_CONFIG, SourceStatus } from '@/lib/game/types'
import { Lock, Star, ShieldCheck, ScanEye, AlertTriangle, RotateCw } from 'lucide-react'

interface TazoCardProps {
  tazo: Tazo
  onClick?: (tazo: Tazo) => void
}

const FRANCHISE_COLORS: Record<string, { from: string; to: string; text: string; strip: string }> = {
  minimon: { from: '#FFCB05', to: '#FF8C00', text: '#7C2D12', strip: '#FFCB05' },
  cybermon: { from: '#00A1E9', to: '#0057B7', text: '#1E3A5F', strip: '#00A1E9' },
  dracobell: { from: '#FF6B00', to: '#CC4400', text: '#7C2D12', strip: '#FF6B00' },
}

const FRANCHISE_STRIP_TEXT: Record<string, string> = {
  minimon: '#92400E',
  cybermon: '#FFFFFF',
  dracobell: '#FFFFFF',
}

// Back art for each franchise
const FRANCHISE_BACK: Record<string, string> = {
  minimon: '/tazos-artgen/backs/minimon-back.png',
  cybermon: '/tazos-artgen/backs/cybermon-back.png',
  dracobell: '/tazos-artgen/backs/dracobell-back.png',
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
  const [flipped, setFlipped] = useState(false)
  const franchiseSlug = tazo.franchise?.slug || 'minimon'
  const franchiseColors = FRANCHISE_COLORS[franchiseSlug] || FRANCHISE_COLORS.minimon
  const franchiseStripText = FRANCHISE_STRIP_TEXT[franchiseSlug] || '#1F2937'
  const rarityConfig = RARITY_CONFIG[tazo.rarity as Rarity]
  const conditionConfig = CONDITION_CONFIG[tazo.condition as TazoCondition]
  const raritySticker = RARITY_STICKER[tazo.rarity as string] || RARITY_STICKER.common
  const backArt = FRANCHISE_BACK[franchiseSlug] || FRANCHISE_BACK.minimon

  const isHolo = tazo.condition === 'holo'
  const isMetallic = tazo.condition === 'metallic'
  const isLegendary = tazo.rarity === 'legendary'
  const isWorn = tazo.condition === 'worn'
  const isNotOwned = !tazo.isOwned
  const sourceConfig = SOURCE_STATUS_CONFIG[tazo.sourceStatus as SourceStatus]
  const sourceIcon = tazo.sourceStatus === 'verified' ? ShieldCheck : tazo.sourceStatus === 'partial' ? ScanEye : AlertTriangle

  let circleBorderClass = ''
  if (isHolo) circleBorderClass = 'holo-border'
  else if (isLegendary) circleBorderClass = 'legendary-glow'

  const gradientBg = `linear-gradient(135deg, ${franchiseColors.from}, ${franchiseColors.to})`
  const innerGradient = `linear-gradient(135deg, ${franchiseColors.from}80, ${franchiseColors.to}CC, ${franchiseColors.from}60)`

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
      {/* Exclusive badge */}
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

      {/* ==================== FLIP CONTAINER ==================== */}
      <div
        className="tazo-flip-container relative"
        style={{ width: '112px', height: '112px' }}
        onClick={(e) => {
          e.stopPropagation() // Don't trigger card click
          setFlipped(!flipped)
        }}
        title="Click to flip"
      >
        <div
          className={`tazo-flip-inner ${flipped ? 'flipped' : ''}`}
          style={{ transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {/* ===== FRONT FACE ===== */}
          <div className="tazo-flip-front">
            <div
              className={`
                relative w-full h-full rounded-full flex items-center justify-center
                shrink-0 overflow-hidden
                ${circleBorderClass}
              `}
              style={{
                border: isHolo ? undefined : '3px solid #1a1a1a',
                background: isHolo ? undefined : gradientBg,
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
                style={{ background: innerGradient }}
              >
                {tazo.imageUrl ? (
                  <img
                    src={tazo.imageUrl}
                    alt={tazo.displayName || tazo.name || "..."}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  /* No front image — show tazo number on colored disc */
                  <>
                    <span
                      className="text-[48px] font-black leading-none opacity-20"
                      style={{ color: franchiseStripText }}
                    >
                      ?
                    </span>
                    {tazo.number && (
                      <span
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-black px-1.5 rounded-sm leading-tight"
                        style={{
                          color: '#1a1a1a',
                          background: 'rgba(255,255,255,0.9)',
                          border: '1px solid #1a1a1a',
                        }}
                      >
                        #{tazo.number}
                      </span>
                    )}
                  </>
                )}

                {isNotOwned && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white/70" style={{ animation: 'lock-pulse 2s ease-in-out infinite' }} />
                  </div>
                )}
              </div>

              {isLegendary && !isNotOwned && (
                <div
                  className="absolute -top-1 -left-1 z-10 w-7 h-7 flex items-center justify-center rounded-full"
                  style={{
                    background: '#FFCC00',
                    border: '2px solid #1a1a1a',
                    boxShadow: '1px 1px 0px #1a1a1a',
                  }}
                >
                  <Star className="w-4 h-4 text-yellow-900 fill-yellow-900" />
                </div>
              )}
            </div>
          </div>

          {/* ===== BACK FACE ===== */}
          <div className="tazo-flip-back">
            <div
              className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
              style={{
                border: '3px solid #1a1a1a',
                background: gradientBg,
                padding: '3px',
              }}
            >
              <div
                className="w-full h-full rounded-full relative overflow-hidden"
                style={{ background: innerGradient }}
              >
                <img
                  src={backArt}
                  alt={`${franchiseSlug} series back`}
                  className="w-full h-full object-cover rounded-full"
                />
                <div
                  className="absolute top-0 left-0 right-0 text-center py-1"
                  style={{
                    background: 'rgba(26,26,26,0.75)',
                    borderBottom: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <span
                    className="text-[7px] font-black uppercase tracking-[0.12em]"
                    style={{ color: franchiseColors.strip }}
                  >
                    {tazo.franchise?.name || franchiseSlug}
                  </span>
                </div>
                {tazo.number && (
                  <span
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-black px-1.5 rounded-sm leading-tight"
                    style={{
                      color: '#1a1a1a',
                      background: 'rgba(255,255,255,0.9)',
                      border: '1px solid #1a1a1a',
                    }}
                  >
                    #{tazo.number}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Flip hint */}
        <div className="absolute -bottom-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <RotateCw className="w-3.5 h-3.5 text-[#1a1a1a]/30" />
        </div>
      </div>

      {/* Name section */}
      <div className="text-center w-full min-h-[40px]">
        <p
          className="font-black text-sm sm:text-base leading-tight truncate"
          style={{ color: '#1a1a1a' }}
        >
          {tazo.displayName || tazo.name || "..."}
        </p>
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

      {/* Source Status */}
      {tazo.sourceStatus && tazo.sourceStatus !== 'verified' && (
        <div
          className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5"
          style={{
            background: sourceConfig?.bg || '#F3F4F6',
            color: sourceConfig?.color?.replace('text-', '#') || '#6B7280',
            border: '1.5px solid #1a1a1a',
          }}
          title={sourceConfig?.label || tazo.sourceStatus}
        >
          {React.createElement(sourceIcon, { className: "w-2.5 h-2.5" })}
          {sourceConfig?.label || tazo.sourceStatus}
        </div>
      )}

      {/* Rarity & Condition */}
      <div className="flex gap-1.5 flex-wrap justify-center items-center">
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

      {/* Stat Bars */}
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
