'use client'

import React, { useState, useMemo } from "react"
import { Tazo, RARITY_CONFIG, CONDITION_CONFIG, TazoCondition, Rarity, SOURCE_STATUS_CONFIG, SourceStatus, OBTAINED_FROM_CONFIG, ObtainedFrom } from '@/lib/game/types'
import { Lock, Star, ShieldCheck, ScanEye, AlertTriangle, RotateCw, ShoppingBag, Gift, Camera } from 'lucide-react'
import { getTazoBackgroundConfig, getTazoBackgroundClasses, FRANCHISE_MAX } from '@/lib/tazoBackgrounds'
import TazoDiscImage from './tazo-disc-image'
import type { TazoFinish, TazoCreatureVariant } from '@/lib/battle/game-loop'

interface TazoCardProps {
  tazo: Tazo
  onClick?: (tazo: Tazo) => void
  forceFlipped?: boolean
}

const FRANCHISE_COLORS: Record<string, { from: string; to: string; text: string; strip: string }> = {
  minimon: { from: 'var(--ttg-minimon)', to: 'var(--ttg-minimon-dark)', text: 'var(--ttg-dracobell-text)', strip: 'var(--ttg-minimon)' },
  cybermon: { from: 'var(--ttg-cybermon)', to: 'var(--ttg-cybermon-dark)', text: 'var(--ttg-cybermon-text)', strip: 'var(--ttg-cybermon)' },
  dracobell: { from: 'var(--ttg-dracobell)', to: 'var(--ttg-dracobell-dark)', text: 'var(--ttg-dracobell-text)', strip: 'var(--ttg-dracobell)' },
}

const FRANCHISE_STRIP_TEXT: Record<string, string> = {
  minimon: '#92400E',
  cybermon: '#fff',
  dracobell: '#fff',
}

// Back art for each franchise
const FRANCHISE_BACK: Record<string, string> = {
  minimon: '/tazos-artgen/backs/minimon-back.png',
  cybermon: '/tazos-artgen/backs/cybermon-back.png',
  dracobell: '/tazos-artgen/backs/dracobell-back.png',
}

const STAT_CONFIG = [
  { key: 'attack' as const, label: 'ATK', color: '#EF4444' },
  { key: 'defense' as const, label: 'DEF', color: 'var(--ttg-rarity-rare)' },
  { key: 'resistance' as const, label: 'RES', color: '#6366F1' },
  { key: 'weight' as const, label: 'WGT', color: 'var(--ttg-warning)' },
  { key: 'stability' as const, label: 'STA', color: '#14B8A6' },
  { key: 'spin' as const, label: 'SPN', color: '#10B981' },
  { key: 'control' as const, label: 'CTR', color: '#EC4899' },
  { key: 'bounce' as const, label: 'BNC', color: 'var(--ttg-dracobell)' },
  { key: 'precision' as const, label: 'PRC', color: 'var(--ttg-cybermon)' },
]

const RARITY_ORDER: Record<Rarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  ultra: 4,
  legendary: 5,
}

const RARITY_STICKER: Record<string, { bg: string; border: string; text: string }> = {
  common: { bg: 'var(--ttg-rarity-common)', border: 'var(--ttg-rarity-common-border)', text: 'var(--ttg-black)' },
  uncommon: { bg: '#4ADE80', border: 'var(--ttg-success)', text: '#052E16' },
  rare: { bg: 'var(--ttg-rarity-rare)', border: 'var(--ttg-rarity-rare-dark)', text: '#fff' },
  ultra: { bg: 'var(--ttg-rarity-ultra)', border: 'var(--ttg-rarity-ultra-dark)', text: '#fff' },
  legendary: { bg: 'var(--ttg-warning)', border: 'var(--ttg-minimon-dark)', text: 'var(--ttg-black)' },
}

function getRarityStars(rarity: Rarity): string {
  return '★'.repeat(RARITY_ORDER[rarity])
}

export default function TazoCard({ tazo, onClick, forceFlipped }: TazoCardProps) {
  const [flipped, setFlipped] = useState(false)
  const showBack = forceFlipped !== undefined ? forceFlipped : flipped
  const franchiseSlug = tazo.franchise || tazo.franchiseSlug || 'minimon'
  const franchiseColors = FRANCHISE_COLORS[franchiseSlug] || FRANCHISE_COLORS.minimon
  const franchiseStripText = FRANCHISE_STRIP_TEXT[franchiseSlug] || 'var(--ttg-black)'
  const rarityConfig = RARITY_CONFIG[tazo.rarity as Rarity]
  const conditionConfig = CONDITION_CONFIG[tazo.condition as TazoCondition]
  const raritySticker = RARITY_STICKER[tazo.rarity as string] || RARITY_STICKER.common
  const backArt = FRANCHISE_BACK[franchiseSlug] || FRANCHISE_BACK.minimon

  // Background system
  const bgConfig = useMemo(() => {
    const maxF = FRANCHISE_MAX[franchiseSlug] || 150
    return getTazoBackgroundConfig(tazo, maxF)
  }, [tazo, franchiseSlug])
  const bgClasses = getTazoBackgroundClasses(bgConfig)

  const isLegendary = tazo.rarity === 'legendary'
  const isNotOwned = !tazo.isOwned
  const sourceConfig = SOURCE_STATUS_CONFIG[tazo.sourceStatus as SourceStatus]
  const sourceIcon = tazo.sourceStatus === 'verified' ? ShieldCheck : tazo.sourceStatus === 'partial' ? ScanEye : AlertTriangle
  const obtainedFromConfig = tazo.obtainedFrom ? OBTAINED_FROM_CONFIG[tazo.obtainedFrom as ObtainedFrom] : null
  const obtainedIcon = tazo.obtainedFrom === 'bag' ? ShoppingBag : tazo.obtainedFrom === 'starter' ? Gift : Camera

  return (
    <div
      className={`
        tazo-card-hover mag-card relative cursor-pointer
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
        <div className="absolute inset-0 z-20 bg-white/40 flex items-center justify-center">
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
          setFlipped(!showBack)
        }}
        title="Click to flip"
      >
        <div
          className={`tazo-flip-inner ${showBack ? 'flipped' : ''}`}
          style={{ transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {/* ===== FRONT FACE ===== */}
          <div className="tazo-flip-front">
            <div
              className={`ttg-bg-disc relative w-full h-full rounded-full flex items-center justify-center shrink-0 overflow-hidden ${bgClasses}`}
            >
              <TazoDiscImage
                src={tazo.imageUrl}
                alt={tazo.displayName || tazo.name || "?"}
                size="100%"
                borderWidth={0}
                scale={0.88}
                franchiseSlug={franchiseSlug}
                finish={tazo.finish as TazoFinish || "normal"}
                creatureVariant={tazo.creatureVariant as TazoCreatureVariant || "standard"}
                shinyImageUrl={tazo.shinyImageUrl}
                wear={tazo.wear || 0}
                number={isNotOwned ? null : tazo.number}
                overlay={isNotOwned ? (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-white/70" style={{ animation: 'lock-pulse 2s ease-in-out infinite' }} />
                  </div>
                ) : undefined}
              />
              {isLegendary && !isNotOwned && (
                <div
                  className="absolute -top-1 -left-1 z-10 w-7 h-7 flex items-center justify-center rounded-full"
                  style={{
                    background: 'var(--ttg-yellow)',
                    border: '2px solid var(--ttg-black)',
                    boxShadow: '1px 1px 0px var(--ttg-black)',
                  }}
                >
                  <Star className="w-4 h-4 text-yellow-900 fill-yellow-900" />
                </div>
              )}
            </div>
          </div>

          {/* ===== BACK FACE ===== */}
          <div className="tazo-flip-back">
            <div className="w-full h-full rounded-full overflow-hidden">
              <TazoDiscImage
                src={backArt}
                alt={`${franchiseSlug} series back`}
                size="100%"
                borderWidth={0}
                scale={1.0}
                isBack
                finish="normal"
                number={tazo.number}
                overlay={
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
                      {tazo.franchiseName || franchiseSlug}
                    </span>
                  </div>
                }
              />
            </div>
          </div>
        </div>

        {/* Flip hint */}
        <div className="absolute -bottom-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <RotateCw className="w-3.5 h-3.5 text-ttg-black/30" />
        </div>
      </div>

      {/* Name section */}
      <div className="text-center w-full min-h-[40px]">
        <p
          className="font-black text-sm sm:text-base leading-tight truncate"
          style={{ color: 'var(--ttg-black)' }}
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
            {tazo.franchiseName || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Source Status */}
      {tazo.sourceStatus && tazo.sourceStatus !== 'verified' && (
        <div
          className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5"
          style={{
            background: sourceConfig?.bg || '#F3F4F6',
            color: sourceConfig?.color?.replace('text-', '#') || 'var(--ttg-rarity-common-border)',
            border: '1.5px solid var(--ttg-black)',
          }}
          title={sourceConfig?.label || tazo.sourceStatus}
        >
          {React.createElement(sourceIcon, { className: "w-2.5 h-2.5" })}
          {sourceConfig?.label || tazo.sourceStatus}
        </div>
      )}

      {/* Obtained From Badge */}
      {obtainedFromConfig && !isNotOwned && (
        <div
          className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider flex items-center gap-0.5"
          style={{
            background: obtainedFromConfig.bg,
            color: obtainedFromConfig.color,
            border: '1.5px solid var(--ttg-black)',
          }}
          title={`Obtained from: ${obtainedFromConfig.label}`}
        >
          {React.createElement(obtainedIcon, { className: "w-2.5 h-2.5" })}
          {obtainedFromConfig.label}
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
            boxShadow: '1px 1px 0px var(--ttg-black)',
          }}
        >
          {getRarityStars(tazo.rarity as Rarity)} {rarityConfig?.label}
        </div>
        <div
          className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold"
          style={{
            background: '#fff',
            color: 'var(--ttg-black)',
            border: '2px solid var(--ttg-black)',
            boxShadow: '1px 1px 0px var(--ttg-black)',
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
              style={{ color: 'var(--ttg-black)' }}
            >
              {stat.label}
            </span>
            <div
              className="flex-1 h-2.5 overflow-hidden"
              style={{
                background: '#F3F4F6',
                border: '1px solid var(--ttg-black)',
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
              style={{ color: 'var(--ttg-black)' }}
            >
              {tazo[stat.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
