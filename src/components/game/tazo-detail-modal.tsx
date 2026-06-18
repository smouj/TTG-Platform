'use client'

import { Tazo, RARITY_CONFIG, CONDITION_CONFIG, Rarity, TazoCondition, MINIMON_TYPES, CYBERMON_TYPES, DRACOBELL_TYPES } from '@/lib/game/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Lock, Unlock, Swords, X, ChevronLeft, ChevronRight, ArrowUpCircle, ArrowRight, Shield, Scale, RotateCw, Zap, BarChart3, Flame, Sparkles, Diamond, Square, Target, FlipHorizontal, View } from 'lucide-react'
import { getTazoBackgroundConfig, getTazoBackgroundClasses, FRANCHISE_MAX } from '@/lib/tazoBackgrounds'
import TazoDiscImage from '@/components/game/tazo-disc-image'
import { TGASlabLabel } from '@/components/game/tga-slab-label'
import type { TazoFinish, TazoCreatureVariant } from '@/lib/battle/game-loop'
import { useState } from 'react'

interface TazoDetailModalProps {
  tazo: Tazo | null
  open: boolean
  onClose: () => void
  onToggleOwned?: (tazo: Tazo) => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

const FRANCHISE_COLORS: Record<string, { from: string; to: string; text: string; border: string; banner: string }> = {
  minimon: { from: 'var(--ttg-minimon)', to: 'var(--ttg-minimon-dark)', text: '#92400E', border: 'var(--ttg-minimon)', banner: 'linear-gradient(90deg, var(--ttg-minimon), #FF8C00)' },
  cybermon: { from: 'var(--ttg-cybermon)', to: '#0057B7', text: '#1E3A5F', border: 'var(--ttg-cybermon)', banner: 'linear-gradient(90deg, var(--ttg-cybermon), #0057B7)' },
  dracobell: { from: 'var(--ttg-dracobell)', to: 'var(--ttg-dracobell-dark)', text: '#7C2D12', border: 'var(--ttg-dracobell)', banner: 'linear-gradient(90deg, var(--ttg-dracobell), #CC4400)' },
}

const STAT_CONFIG = [
  { key: 'attack' as const, label: 'ATK', color: 'var(--ttg-red)', bgColor: '#E3350D15' },
  { key: 'defense' as const, label: 'DEF', color: 'var(--ttg-blue)', bgColor: '#3B4CCA15' },
  { key: 'resistance' as const, label: 'RESIST', color: '#6366F1', bgColor: '#6366F115' },
  { key: 'weight' as const, label: 'WEIGHT', color: 'var(--ttg-yellow)', bgColor: '#FFCC0015' },
  { key: 'stability' as const, label: 'STABLE', color: '#14B8A6', bgColor: '#14B8A615' },
  { key: 'spin' as const, label: 'SPIN', color: '#78C850', bgColor: '#78C85015' },
  { key: 'control' as const, label: 'CONTROL', color: '#EC4899', bgColor: '#EC489915' },
  { key: 'bounce' as const, label: 'BOUNCE', color: 'var(--ttg-dracobell)', bgColor: '#FF6B0015' },
  { key: 'precision' as const, label: 'PRECISE', color: 'var(--ttg-cybermon)', bgColor: '#00A1E915' },
]

const RARITY_STARS: Record<Rarity, string> = {
  common: 'S',
  uncommon: 'SS',
  rare: 'SSS',
  ultra: 'SSSS',
  legendary: 'SSSSS',
}

const RARITY_HEX: Record<Rarity, string> = {
  common: 'var(--ttg-rarity-common)',
  uncommon: 'var(--ttg-success)',
  rare: 'var(--ttg-rarity-rare)',
  ultra: 'var(--ttg-purple)',
  legendary: 'var(--ttg-warning)',
}

const CONDITION_HEX: Record<TazoCondition, string> = {
  mint: '#10B981',
  good: 'var(--ttg-success)',
  used: '#EAB308',
  worn: 'var(--ttg-dracobell)',
  holo: 'var(--ttg-cybermon)',
  metallic: '#94A3B8',
}

// Minimon type advantage table
const MINIMON_ADVANTAGES: Record<string, string[]> = {
  fire: ['grass'],
  water: ['fire'],
  grass: ['water'],
  electric: ['water'],
  psychic: ['ghost'],
  ghost: ['normal'],
  dragon: ['dragon'],
  normal: [],
}

// Fun flavor quotes for each franchise
const FLAVOR_QUOTES: Record<string, string[]> = {
  minimon: [
    "Gotta spin 'em all!",
    "This one's a real spinner!",
    "Watch out for that type advantage!",
    "A champion in the making!",
    "Pocket power, maximum spin!",
  ],
  cybermon: [
    "Digivolve and spin!",
    "Digital power unleashed!",
    "This Cybermon means business!",
    "Spin force: OVER 9000... wait, wrong franchise!",
    "Data never spins this hard!",
  ],
  dracobell: [
    "It's OVER 9000 RPM!",
    "Power level: MAXIMUM SPIN!",
    "This tazo unleashes its peak aura!",
    "Kamehameha spin incoming!",
    "The strongest in the universe!",
  ],
}

function getFlavorQuote(franchise: string, tazoName: string): string {
  const quotes = FLAVOR_QUOTES[franchise] || FLAVOR_QUOTES.minimon
  // Simple hash based on name for consistent quotes
  const hash = tazoName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return quotes[hash % quotes.length]
}

export default function TazoDetailModal({ tazo, open, onClose, onToggleOwned, onPrev, onNext, hasPrev, hasNext }: TazoDetailModalProps) {
  const [viewMode, setViewMode] = useState<'front' | 'back' | '3d'>('front')

  if (!tazo) return null

  const franchiseSlug = tazo.franchise || tazo.franchiseSlug || 'minimon'
  const bgConfig = getTazoBackgroundConfig(tazo, FRANCHISE_MAX[franchiseSlug] || 150)
  const bgClasses = getTazoBackgroundClasses(bgConfig)
  const franchiseColors = FRANCHISE_COLORS[franchiseSlug] || FRANCHISE_COLORS.minimon
  const rarityConfig = RARITY_CONFIG[tazo.rarity as Rarity]
  const conditionConfig = CONDITION_CONFIG[tazo.condition as TazoCondition]

  const isLegendary = tazo.rarity === 'legendary'
  const isWorn = tazo.condition === 'worn'
  const totalBattles = tazo.battleWins + tazo.battleLosses
  const winRate = totalBattles > 0 ? Math.round((tazo.battleWins / totalBattles) * 100) : 0
  const totalStats =
    tazo.attack +
    tazo.defense +
    tazo.resistance +
    tazo.weight +
    tazo.stability +
    tazo.spin +
    tazo.control +
    tazo.bounce +
    tazo.precision

  const rarityHex = RARITY_HEX[tazo.rarity as Rarity] || 'var(--ttg-rarity-common)'
  const conditionHex = CONDITION_HEX[tazo.condition as TazoCondition] || '#94A3B8'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="mag-detail-modal max-w-lg max-h-[92vh] overflow-y-auto custom-scrollbar p-0 gap-0 border-0"
        showCloseButton={false}
        style={{
          background: 'white',
          border: '4px solid var(--ttg-black)',
          boxShadow: '8px 8px 0px var(--ttg-black)',
          borderRadius: '0',
        }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{tazo.displayName || tazo.name || "?"}</DialogTitle>
        </DialogHeader>

        {/* ===== MAGAZINE CENTERFOLD LAYOUT ===== */}

        {/* TOP BANNER STRIP - franchise colored with name in huge stroke text */}
        <div
          className="relative px-4 py-3 sm:px-6 sm:py-4"
          style={{
            background: franchiseColors.banner,
            borderBottom: '4px solid var(--ttg-black)',
          }}
        >
          {/* Halftone overlay on banner */}
          <div className="absolute inset-0 mag-halftone opacity-30 pointer-events-none" />

          {/* Close button - magazine style */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-red-500 hover:text-white transition-colors font-black text-sm"
            style={{ boxShadow: '2px 2px 0px var(--ttg-black)' }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev/Next navigation */}
          {(onPrev || onNext) && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 flex items-center gap-1.5">
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className="w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-ttg-yellow disabled:opacity-25 disabled:cursor-not-allowed transition-colors font-black text-sm"
                style={{ boxShadow: '2px 2px 0px var(--ttg-black)' }}
                aria-label="Previous tazo"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className="w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-ttg-yellow disabled:opacity-25 disabled:cursor-not-allowed transition-colors font-black text-sm"
                style={{ boxShadow: '2px 2px 0px var(--ttg-black)' }}
                aria-label="Next tazo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Collection tag */}
          <div className="relative z-10 mb-1">
            <span
              className="inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-white border-2 border-black"
              style={{ boxShadow: '2px 2px 0px var(--ttg-black)' }}
            >
              {tazo.franchiseName || 'Unknown'}
              {tazo.collectionYear ? ` · ${tazo.collectionYear}` : ''}
            </span>
          </div>

          {/* HUGE NAME */}
          <h2
            className="relative z-10 text-3xl sm:text-4xl font-black leading-none mag-stroke-white uppercase tracking-tight"
            style={{
              paintOrder: 'stroke fill',
              WebkitTextStroke: '2.5px var(--ttg-black)',
              color: 'white',
            }}
          >
            {tazo.displayName || tazo.name || "?"}
          </h2>

          {/* Rarity stars row */}
          <div className="relative z-10 flex items-center gap-2 mt-1.5">
            <span
              className="text-sm font-black"
              style={{
                color: rarityHex,
                textShadow: '0 0 8px ' + rarityHex + '60',
              }}
            >
              {RARITY_STARS[tazo.rarity as Rarity]}
            </span>
            <span
              className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 border-2 border-black"
              style={{
                background: rarityHex + '30',
                color: rarityHex,
              }}
            >
              {rarityConfig?.label}
            </span>
            <span
              className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 border-2 border-black"
              style={{
                background: conditionHex + '30',
                color: conditionHex,
              }}
            >
              {conditionConfig?.icon} {conditionConfig?.label}
            </span>
            {isLegendary && (
              <span className="exclusive-badge" style={{ position: 'relative', top: 0, right: 0, transform: 'rotate(0deg)' }}>
                LEGENDARY
              </span>
            )}
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="px-4 sm:px-6 py-4 space-y-4 mag-dots" style={{ background: '#fffef0' }}>

          {/* ===== LARGE TAZO DISC + SPEECH BUBBLE ===== */}
          <div className="flex flex-col items-center">
            {/* The Big Disc */}
            <div
              className={`ttg-bg-disc relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] rounded-full flex items-center justify-center overflow-hidden ${bgClasses}`}
            >
              {!tazo.isOwned ? (
                /* Unowned — show BACK face (hidden until discovered) */
                <div className="w-full h-full rounded-full overflow-hidden bg-white relative">
                  <TazoDiscImage
                    src={tazo.backImageUrl || `/tazos-artgen/backs/${franchiseSlug}-back.png`}
                    alt="Undiscovered"
                    size="100%"
                    borderWidth={0}
                    isBack
                    number={null}
                    franchiseSlug={franchiseSlug}
                  />
                  {/* Lock badge — top-right corner, not blocking center */}
                  <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-ttg-black/85 flex items-center justify-center border-2 border-ttg-yellow/60 shadow-[0_0_8px_rgba(0,0,0,0.5)]">
                    <Lock className="w-4 h-4 text-ttg-yellow" />
                  </div>
                  {/* "Undiscovered" label */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-ttg-black/80 border border-white/10">
                    <span className="text-[8px] font-black text-white/50 uppercase tracking-wider">Undiscovered</span>
                  </div>
                </div>
              ) : viewMode === 'back' ? (
                /* Back face — franchise back art */
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  <TazoDiscImage
                    src={tazo.backImageUrl || `/tazos-artgen/backs/${franchiseSlug}-back.png`}
                    alt="Back"
                    size="100%"
                    borderWidth={0}
                    isBack
                    number={tazo.number}
                    franchiseSlug={franchiseSlug}
                  />
                </div>
              ) : viewMode === '3d' ? (
                /* 3D rotating view */
                <div className="w-full h-full relative" style={{
                  perspective: '600px',
                  animation: 'tazo-3d-spin 8s linear infinite',
                }}>
                  <TazoDiscImage
                    src={tazo.imageUrl}
                    alt={tazo.displayName || tazo.name || "?"}
                    size="100%"
                    borderWidth={0}
                    franchiseSlug={franchiseSlug}
                    finish={tazo.finish as TazoFinish || "normal"}
                    creatureVariant={tazo.creatureVariant as TazoCreatureVariant || "standard"}
                    shinyImageUrl={tazo.shinyImageUrl}
                    wear={tazo.wear || 0}
                    number={!tazo.isOwned ? null : tazo.number}
                  />
                </div>
              ) : (
                /* Front face — normal view */
                <TazoDiscImage
                  src={tazo.imageUrl}
                  alt={tazo.displayName || tazo.name || "?"}
                  size="100%"
                  borderWidth={0}
                  franchiseSlug={franchiseSlug}
                  finish={tazo.finish as TazoFinish || "normal"}
                  creatureVariant={tazo.creatureVariant as TazoCreatureVariant || "standard"}
                  shinyImageUrl={tazo.shinyImageUrl}
                  wear={tazo.wear || 0}
                  number={tazo.number}
                />
              )}
            </div>

            {/* View mode toggles */}
            {tazo.isOwned && (
              <div className="flex items-center gap-1 mt-2">
                <button
                  onClick={() => setViewMode('front')}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black transition-colors"
                  style={{
                    background: viewMode === 'front' ? 'var(--ttg-yellow)' : 'white',
                    color: 'var(--ttg-black)',
                    boxShadow: viewMode === 'front' ? '2px 2px 0px var(--ttg-black)' : 'none',
                  }}
                >
                  <View className="w-3 h-3" /> Front
                </button>
                <button
                  onClick={() => setViewMode('back')}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black transition-colors"
                  style={{
                    background: viewMode === 'back' ? 'var(--ttg-yellow)' : 'white',
                    color: 'var(--ttg-black)',
                    boxShadow: viewMode === 'back' ? '2px 2px 0px var(--ttg-black)' : 'none',
                  }}
                >
                  <FlipHorizontal className="w-3 h-3" /> Back
                </button>
                <button
                  onClick={() => setViewMode('3d')}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-ttg-black transition-colors"
                  style={{
                    background: viewMode === '3d' ? 'var(--ttg-yellow)' : 'white',
                    color: 'var(--ttg-black)',
                    boxShadow: viewMode === '3d' ? '2px 2px 0px var(--ttg-black)' : 'none',
                  }}
                >
                  <RotateCw className="w-3 h-3" /> 3D
                </button>
              </div>
            )}

            {/* Speech Bubble with flavor quote */}
            <div className="mt-3 speech-bubble text-center max-w-[260px]">
              <span className="mag-stroke-sm" style={{ color: franchiseColors.text, WebkitTextStroke: '0.5px var(--ttg-black)' }}>
                &ldquo;{getFlavorQuote(franchiseSlug, tazo.displayName || tazo.name || "?")}&rdquo;
              </span>
            </div>
          </div>

          {/* ===== STATS SECTION - Magazine Infographic ===== */}
          <div
            style={{
              border: '3px solid var(--ttg-black)',
              boxShadow: '4px 4px 0px var(--ttg-black)',
              background: 'white',
            }}
          >
            {/* Stats header */}
            <div
              className="px-3 py-1.5 text-center font-black text-xs uppercase tracking-widest"
              style={{
                background: 'var(--ttg-black)',
                color: 'var(--ttg-yellow)',
                borderBottom: '3px solid var(--ttg-black)',
                letterSpacing: '2px',
              }}
            >
              <Zap className="w-3.5 h-3.5 inline text-ttg-yellow" /> Power Stats <Zap className="w-3.5 h-3.5 inline text-ttg-yellow" />
            </div>

            <div className="p-3 space-y-2">
              {STAT_CONFIG.map((stat) => (
                <div
                  key={stat.key}
                  className="flex items-center gap-2"
                  style={{
                    background: stat.bgColor,
                    padding: '4px 8px',
                    borderRadius: '2px',
                    border: '1px solid ' + stat.color + '30',
                  }}
                >
                  <span
                    className="w-5 h-5 flex items-center justify-center text-[9px] font-black"
                    style={{ background: stat.color + '30', color: stat.color, border: '1px solid ' + stat.color + '40' }}
                  >
                    {stat.label.slice(0, 2)}
                  </span>
                  <span
                    className="text-[10px] font-black uppercase tracking-wider w-[52px]"
                    style={{ color: stat.color }}
                  >
                    {stat.label}
                  </span>
                  <div className="flex-1 h-5 bg-white border-2 border-black overflow-hidden relative">
                    <div
                      className="h-full stat-bar-fill"
                      style={{
                        width: `${tazo[stat.key]}%`,
                        background: `linear-gradient(90deg, ${stat.color}, ${stat.color}CC)`,
                      }}
                    />
                    {/* Halftone texture on bar */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)`,
                      }}
                    />
                  </div>
                  <span
                    className="text-sm font-black w-8 text-right"
                    style={{ color: stat.color }}
                  >
                    {tazo[stat.key]}
                  </span>
                </div>
              ))}

              {/* Total */}
              <div
                className="flex items-center justify-between mt-1 pt-2"
                style={{ borderTop: '3px dashed #1a1a1a20' }}
              >
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--ttg-black)' }}>
                  <BarChart3 className="w-3.5 h-3.5 inline mr-1" /> Total Power
                </span>
                <span
                  className="text-lg font-black px-2 py-0.5 border-2 border-black"
                  style={{
                    background: 'var(--ttg-yellow)',
                    color: 'var(--ttg-black)',
                    boxShadow: '2px 2px 0px var(--ttg-black)',
                  }}
                >
                  {totalStats}
                </span>
              </div>
            </div>
          </div>

          {/* ===== TGA GRADE SLAB — owned tazos only ===== */}
          {tazo.isOwned && (tazo as any).tgaGrade != null && (
            <div className="overflow-hidden"
              style={{
                border: '3px solid var(--ttg-black)',
                boxShadow: '4px 4px 0px var(--ttg-black)',
              }}
            >
              <TGASlabLabel
                tazoName={tazo.displayName || tazo.name || 'Unknown'}
                setName="TRADING TAZOS"
                setYear="2026"
                franchiseName={franchiseSlug}
                tgaGrade={(tazo as any).tgaGrade}
                tgaTier={(tazo as any).tgaTier}
                tgaSurface={(tazo as any).tgaSurface}
                tgaBorders={(tazo as any).tgaBorders}
                tgaCertNumber={(tazo as any).tgaCertNumber}
              />
            </div>
          )}

          {/* ===== SKILL SECTION - Yellow Strip ===== */}
          {tazo.skill && (
            <div
              className="mag-card-yellow p-3"
              style={{
                background: 'var(--ttg-yellow)',
                border: '3px solid var(--ttg-black)',
                boxShadow: '4px 4px 0px var(--ttg-black)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg inline-flex"><Zap className="w-5 h-5" style={{ color: 'var(--ttg-red)' }} /></span>
                <span
                  className="font-black text-base uppercase tracking-wide mag-stroke"
                  style={{
                    paintOrder: 'stroke fill',
                    WebkitTextStroke: '1.5px var(--ttg-black)',
                    color: 'var(--ttg-red)',
                  }}
                >
                  {tazo.skill}
                </span>
              </div>
              {tazo.skillDesc && (
                <p
                  className="text-xs font-bold pl-7"
                  style={{ color: '#1a1a1aCC' }}
                >
                  {tazo.skillDesc}
                </p>
              )}
            </div>
          )}

          {/* ===== EVOLUTION / TRANSFORM SECTION ===== */}
          {franchiseSlug === 'cybermon' && (tazo.evolutionFrom || tazo.evolutionTo) && (
            <div
              className="p-3"
              style={{
                background: 'white',
                border: '3px solid var(--ttg-black)',
                boxShadow: '4px 4px 0px var(--ttg-black)',
              }}
            >
              <div
                className="text-center font-black text-[10px] uppercase tracking-widest mb-2 py-1"
                style={{
                  background: 'var(--ttg-cybermon)',
                  color: 'white',
                  border: '2px solid var(--ttg-black)',
                }}
              >
                <Flame className="w-4 h-4 inline mr-1" /> DIGIEVOLUTION <Flame className="w-4 h-4 inline mr-1" />
              </div>
              <div className="flex items-center justify-center gap-2">
                {tazo.evolutionFrom && (
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center border-3 border-black text-lg font-black"
                      style={{
                        background: 'linear-gradient(135deg, #00A1E940, #0057B740)',
                        border: '3px solid var(--ttg-black)',
                      }}
                    >
                      {tazo.evolutionFrom.charAt(0)}
                    </div>
                    <span className="text-[9px] font-black uppercase" style={{ color: 'var(--ttg-cybermon)' }}>
                      {tazo.evolutionFrom}
                    </span>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <ArrowRight className="w-6 h-6" style={{ color: 'var(--ttg-black)' }} />
                  <span className="text-[8px] font-black uppercase" style={{ color: 'var(--ttg-red)' }}>POWER UP!</span>
                </div>
                {/* Current tazo silhouette */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black star-burst"
                    style={{
                      background: `linear-gradient(135deg, ${franchiseColors.from}, ${franchiseColors.to})`,
                      border: '3px solid var(--ttg-black)',
                      boxShadow: '3px 3px 0px var(--ttg-black)',
                      color: 'white',
                      textShadow: '1px 1px 0px var(--ttg-black)',
                    }}
                  >
                    {tazo.displayName || tazo.name || "?".charAt(0)}
                  </div>
                  <span className="text-[9px] font-black uppercase" style={{ color: franchiseColors.text }}>
                    {tazo.displayName || tazo.name || "?"}
                  </span>
                </div>
                {tazo.evolutionTo && (
                  <>
                    <div className="flex flex-col items-center">
                      <ArrowRight className="w-6 h-6" style={{ color: 'var(--ttg-black)' }} />
                      <span className="text-[8px] font-black uppercase" style={{ color: 'var(--ttg-red)' }}>POWER UP!</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center border-3 border-black text-lg font-black"
                        style={{
                          background: 'linear-gradient(135deg, #00A1E940, #0057B740)',
                          border: '3px solid var(--ttg-black)',
                        }}
                      >
                        {tazo.evolutionTo.charAt(0)}
                      </div>
                      <span className="text-[9px] font-black uppercase" style={{ color: 'var(--ttg-cybermon)' }}>
                        {tazo.evolutionTo}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {franchiseSlug === 'dracobell' && (tazo.transformStage || tazo.transformOf) && (
            <div
              className="p-3"
              style={{
                background: 'white',
                border: '3px solid var(--ttg-black)',
                boxShadow: '4px 4px 0px var(--ttg-black)',
              }}
            >
              <div
                className="text-center font-black text-[10px] uppercase tracking-widest mb-2 py-1"
                style={{
                  background: 'var(--ttg-dracobell)',
                  color: 'white',
                  border: '2px solid var(--ttg-black)',
                }}
              >
                <Sparkles className="w-4 h-4 inline mr-1" /> TRANSFORMATION <Sparkles className="w-4 h-4 inline mr-1" />
              </div>
              <div className="flex items-center justify-center gap-3">
                {tazo.transformOf && (
                  <>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black"
                        style={{
                          background: 'linear-gradient(135deg, #FF6B0040, #CC440040)',
                          border: '3px solid var(--ttg-black)',
                        }}
                      >
                        {tazo.transformOf.charAt(0)}
                      </div>
                      <span className="text-[9px] font-black uppercase" style={{ color: 'var(--ttg-dracobell)' }}>
                        {tazo.transformOf}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <ArrowRight className="w-6 h-6" style={{ color: 'var(--ttg-black)' }} />
                      <span className="text-[8px] font-black uppercase" style={{ color: 'var(--ttg-red)' }}>POWER UP!</span>
                    </div>
                  </>
                )}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black star-burst"
                    style={{
                      background: `linear-gradient(135deg, ${franchiseColors.from}, ${franchiseColors.to})`,
                      border: '3px solid var(--ttg-black)',
                      boxShadow: '3px 3px 0px var(--ttg-black)',
                      color: 'white',
                      textShadow: '1px 1px 0px var(--ttg-black)',
                    }}
                  >
                    {tazo.displayName || tazo.name || "?".charAt(0)}
                  </div>
                  {tazo.transformStage && (
                    <span
                      className="text-[9px] font-black uppercase px-1.5 py-0.5 border border-black"
                      style={{ background: '#FF6B0030', color: 'var(--ttg-dracobell)' }}
                    >
                      {tazo.transformStage}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== MINIMON TYPE ADVANTAGE ===== */}
          {franchiseSlug === 'minimon' && tazo.combatType && (
            <div
              className="p-3"
              style={{
                background: 'white',
                border: '3px solid var(--ttg-black)',
                boxShadow: '4px 4px 0px var(--ttg-black)',
              }}
            >
              <div
                className="text-center font-black text-[10px] uppercase tracking-widest mb-2 py-1"
                style={{
                  background: 'var(--ttg-minimon)',
                  color: 'var(--ttg-black)',
                  border: '2px solid var(--ttg-black)',
                }}
              >
                <Zap className="w-3.5 h-3.5 inline mr-1" style={{ color: 'var(--ttg-minimon)' }} /> TYPE ADVANTAGES <Zap className="w-3.5 h-3.5 inline ml-1" style={{ color: 'var(--ttg-minimon)' }} />
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {(MINIMON_ADVANTAGES[tazo.combatType] || []).length > 0 ? (
                  (MINIMON_ADVANTAGES[tazo.combatType] || []).map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase border-2 border-black"
                      style={{
                        background: '#78C85030',
                        color: '#78C850',
                        boxShadow: '2px 2px 0px var(--ttg-black)',
                      }}
                    >
                      <ArrowUpCircle className="w-3 h-3" /> vs {type}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] font-bold" style={{ color: 'var(--ttg-rarity-common)' }}>
                    No type advantages
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ===== CONDITION EFFECT ===== */}
          {conditionConfig && (
            <div
              className="px-3 py-2 mag-stripes"
              style={{
                background: conditionHex + '15',
                border: '2px solid ' + conditionHex + '40',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{conditionConfig.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: conditionHex }}>
                  Condition Effect:
                </span>
                <span className="text-xs font-bold" style={{ color: 'var(--ttg-black)' }}>
                  {conditionConfig.effect}
                </span>
              </div>
            </div>
          )}

          {/* ===== BATTLE RECORD - Magazine Score Boxes ===== */}
          <div
            className="p-3"
            style={{
              background: 'white',
              border: '3px solid var(--ttg-black)',
              boxShadow: '4px 4px 0px var(--ttg-black)',
            }}
          >
            <div
              className="text-center font-black text-[10px] uppercase tracking-widest mb-2 py-1"
              style={{
                background: 'var(--ttg-black)',
                color: 'var(--ttg-yellow)',
                border: '2px solid var(--ttg-black)',
              }}
            >
              <Swords className="w-3 h-3 inline mr-1" />
              Battle Record
              <Swords className="w-3 h-3 inline ml-1" />
            </div>

            <div className="flex items-stretch justify-center gap-3">
              {/* Wins Box */}
              <div
                className="flex-1 text-center py-2 px-3"
                style={{
                  background: 'var(--ttg-success)',
                  border: '3px solid var(--ttg-black)',
                  boxShadow: '3px 3px 0px var(--ttg-black)',
                }}
              >
                <div className="text-xs font-black uppercase" style={{ color: '#1a1a1a90' }}>Wins</div>
                <div
                  className="text-3xl font-black leading-none"
                  style={{
                    color: 'white',
                    textShadow: '2px 2px 0px#1a1a1a40',
                  }}
                >
                  {tazo.battleWins}
                </div>
              </div>

              {/* Losses Box */}
              <div
                className="flex-1 text-center py-2 px-3"
                style={{
                  background: 'var(--ttg-red)',
                  border: '3px solid var(--ttg-black)',
                  boxShadow: '3px 3px 0px var(--ttg-black)',
                }}
              >
                <div className="text-xs font-black uppercase" style={{ color: '#ffffff90' }}>Losses</div>
                <div
                  className="text-3xl font-black leading-none"
                  style={{
                    color: 'white',
                    textShadow: '2px 2px 0px#1a1a1a40',
                  }}
                >
                  {tazo.battleLosses}
                </div>
              </div>

              {/* Win Rate */}
              <div
                className="flex-1 text-center py-2 px-3 flex flex-col items-center justify-center"
                style={{
                  background: 'var(--ttg-yellow)',
                  border: '3px solid var(--ttg-black)',
                  boxShadow: '3px 3px 0px var(--ttg-black)',
                }}
              >
                <div className="text-xs font-black uppercase" style={{ color: '#1a1a1a90' }}>Win %</div>
                <div
                  className="text-2xl font-black leading-none"
                  style={{
                    color: 'var(--ttg-black)',
                  }}
                >
                  {winRate}%
                </div>
              </div>
            </div>
          </div>

          {/* ===== CLOSE BUTTON ===== */}
          <div className="flex justify-center pt-1">
            <button
              onClick={onClose}
              className="mag-btn py-3 px-10 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider"
              style={{
                background: 'var(--ttg-black)',
                color: 'var(--ttg-yellow)',
                border: '3px solid var(--ttg-black)',
                boxShadow: '3px 3px 0px var(--ttg-black)',
              }}
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
