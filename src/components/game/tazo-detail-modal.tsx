'use client'

import { Tazo, RARITY_CONFIG, CONDITION_CONFIG, Rarity, TazoCondition, MINIMON_TYPES, CYBERMON_TYPES, DRACOBELL_TYPES } from '@/lib/game/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Lock, Unlock, Swords, X, ArrowUpCircle, ArrowRight, Shield, Scale, RotateCw, Zap, BarChart3, Flame, Sparkles, Diamond, Square, Target } from 'lucide-react'
import { getTazoBackgroundConfig, getTazoBackgroundClasses, FRANCHISE_MAX } from '@/lib/tazoBackgrounds'

interface TazoDetailModalProps {
  tazo: Tazo | null
  open: boolean
  onClose: () => void
  onToggleOwned?: (tazo: Tazo) => void
}

const FRANCHISE_COLORS: Record<string, { from: string; to: string; text: string; border: string; banner: string }> = {
  minimon: { from: '#FFCB05', to: '#FF8C00', text: '#92400E', border: '#FFCB05', banner: 'linear-gradient(90deg, #FFCB05, #FF8C00)' },
  cybermon: { from: '#00A1E9', to: '#0057B7', text: '#1E3A5F', border: '#00A1E9', banner: 'linear-gradient(90deg, #00A1E9, #0057B7)' },
  dracobell: { from: '#FF6B00', to: '#CC4400', text: '#7C2D12', border: '#FF6B00', banner: 'linear-gradient(90deg, #FF6B00, #CC4400)' },
}

const STAT_CONFIG = [
  { key: 'attack' as const, label: 'ATK', color: '#E3350D', bgColor: '#E3350D15' },
  { key: 'defense' as const, label: 'DEF', color: '#3B4CCA', bgColor: '#3B4CCA15' },
  { key: 'resistance' as const, label: 'RESIST', color: '#6366F1', bgColor: '#6366F115' },
  { key: 'weight' as const, label: 'WEIGHT', color: '#FFCC00', bgColor: '#FFCC0015' },
  { key: 'stability' as const, label: 'STABLE', color: '#14B8A6', bgColor: '#14B8A615' },
  { key: 'spin' as const, label: 'SPIN', color: '#78C850', bgColor: '#78C85015' },
  { key: 'control' as const, label: 'CONTROL', color: '#EC4899', bgColor: '#EC489915' },
  { key: 'bounce' as const, label: 'BOUNCE', color: '#F97316', bgColor: '#F9731615' },
  { key: 'precision' as const, label: 'PRECISE', color: '#06B6D4', bgColor: '#06B6D415' },
]

const RARITY_STARS: Record<Rarity, string> = {
  common: 'S',
  uncommon: 'SS',
  rare: 'SSS',
  ultra: 'SSSS',
  legendary: 'SSSSS',
}

const RARITY_HEX: Record<Rarity, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  ultra: '#A855F7',
  legendary: '#F59E0B',
}

const CONDITION_HEX: Record<TazoCondition, string> = {
  mint: '#10B981',
  good: '#22C55E',
  used: '#EAB308',
  worn: '#F97316',
  holo: '#06B6D4',
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
    "This tazo goes Super Saiyan!",
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

export default function TazoDetailModal({ tazo, open, onClose, onToggleOwned }: TazoDetailModalProps) {
  if (!tazo) return null

  const franchiseSlug = tazo.franchise?.slug || 'minimon'
  const bgConfig = getTazoBackgroundConfig(tazo, FRANCHISE_MAX[franchiseSlug] || 150)
  const bgClasses = getTazoBackgroundClasses(bgConfig)
  const franchiseColors = FRANCHISE_COLORS[franchiseSlug] || FRANCHISE_COLORS.minimon
  const rarityConfig = RARITY_CONFIG[tazo.rarity as Rarity]
  const conditionConfig = CONDITION_CONFIG[tazo.condition as TazoCondition]

  const isHolo = tazo.condition === 'holo'
  const isMetallic = tazo.condition === 'metallic'
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

  let circleBorderClass = ''
  if (isHolo) circleBorderClass = 'holo-border'
  else if (isLegendary) circleBorderClass = 'legendary-glow'

  const rarityHex = RARITY_HEX[tazo.rarity as Rarity] || '#9CA3AF'
  const conditionHex = CONDITION_HEX[tazo.condition as TazoCondition] || '#94A3B8'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="mag-detail-modal max-w-lg max-h-[92vh] overflow-y-auto custom-scrollbar p-0 gap-0 border-0"
        showCloseButton={false}
        style={{
          background: 'white',
          border: '4px solid #1a1a1a',
          boxShadow: '8px 8px 0px #1a1a1a',
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
            borderBottom: '4px solid #1a1a1a',
          }}
        >
          {/* Halftone overlay on banner */}
          <div className="absolute inset-0 mag-halftone opacity-30 pointer-events-none" />

          {/* Close button - magazine style */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 w-8 h-8 flex items-center justify-center border-2 border-black bg-white hover:bg-red-500 hover:text-white transition-colors font-black text-sm"
            style={{ boxShadow: '2px 2px 0px #1a1a1a' }}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Collection tag */}
          <div className="relative z-10 mb-1">
            <span
              className="inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-white border-2 border-black"
              style={{ boxShadow: '2px 2px 0px #1a1a1a' }}
            >
              {tazo.franchise?.name || 'Unknown'}
              {tazo.collection?.year ? ` · ${tazo.collection.year}` : ''}
            </span>
          </div>

          {/* HUGE NAME */}
          <h2
            className="relative z-10 text-3xl sm:text-4xl font-black leading-none mag-stroke-white uppercase tracking-tight"
            style={{
              paintOrder: 'stroke fill',
              WebkitTextStroke: '2.5px #1a1a1a',
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
              className={`
                ttg-bg-disc relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px]
                rounded-full flex items-center justify-center overflow-hidden
                ${circleBorderClass} ${bgClasses}
              `}
              style={{
                border: isHolo ? undefined : isLegendary ? '5px solid #FBBF24' : '3px solid #1a1a1a',
                padding: '6px',
              }}
            >
              <div
                className={`
                  ttg-bg-disc-inner w-full h-full rounded-full flex flex-col items-center justify-center
                  relative overflow-hidden
                  ${isMetallic ? 'metallic-effect' : ''}
                  ${isWorn ? 'worn-overlay' : ''}
                `}
                style={{
                  border: '3px solid #1a1a1a',
                }}
              >
                {tazo.imageUrl ? (
                  <div className="w-full h-full rounded-full overflow-hidden" style={{ transform: "scale(1.16)", transformOrigin: "center center" }}>
                    <img
                      src={tazo.imageUrl}
                      alt={tazo.displayName || tazo.name || "?"}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                ) : (
                  <>
                    <img
                      src={`/tazos-artgen/backs/${franchiseSlug}-back.png`}
                      alt={`${franchiseSlug} back`}
                      className="w-full h-full object-cover rounded-full"
                    />
                    {tazo.number && (
                      <span
                        className="absolute bottom-1 text-xs font-black px-2 py-0.5 rounded-full"
                        style={{ color: 'white', background: 'rgba(0,0,0,0.5)' }}
                      >
                        #{tazo.number}
                      </span>
                    )}
                  </>
                )}

                {/* Lock overlay */}
                {!tazo.isOwned && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <Lock className="w-12 h-12 text-white/70" />
                  </div>
                )}
              </div>
            </div>

            {/* Speech Bubble with flavor quote */}
            <div className="mt-3 speech-bubble text-center max-w-[260px]">
              <span className="mag-stroke-sm" style={{ color: franchiseColors.text, WebkitTextStroke: '0.5px #1a1a1a' }}>
                &ldquo;{getFlavorQuote(franchiseSlug, tazo.displayName || tazo.name || "?")}&rdquo;
              </span>
            </div>
          </div>

          {/* ===== STATS SECTION - Magazine Infographic ===== */}
          <div
            style={{
              border: '3px solid #1a1a1a',
              boxShadow: '4px 4px 0px #1a1a1a',
              background: 'white',
            }}
          >
            {/* Stats header */}
            <div
              className="px-3 py-1.5 text-center font-black text-xs uppercase tracking-widest"
              style={{
                background: '#1a1a1a',
                color: '#FFCC00',
                borderBottom: '3px solid #1a1a1a',
                letterSpacing: '2px',
              }}
            >
              <Zap className="w-3.5 h-3.5 inline text-[#FFCC00]" /> Power Stats <Zap className="w-3.5 h-3.5 inline text-[#FFCC00]" />
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
                    className="w-5 h-5 flex items-center justify-center text-[9px] font-black rounded-sm"
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
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#1a1a1a' }}>
                  <BarChart3 className="w-3.5 h-3.5 inline mr-1" /> Total Power
                </span>
                <span
                  className="text-lg font-black px-2 py-0.5 border-2 border-black"
                  style={{
                    background: '#FFCC00',
                    color: '#1a1a1a',
                    boxShadow: '2px 2px 0px #1a1a1a',
                  }}
                >
                  {totalStats}
                </span>
              </div>
            </div>
          </div>

          {/* ===== SKILL SECTION - Yellow Strip ===== */}
          {tazo.skill && (
            <div
              className="mag-card-yellow p-3"
              style={{
                background: '#FFCC00',
                border: '3px solid #1a1a1a',
                boxShadow: '4px 4px 0px #1a1a1a',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg inline-flex"><Zap className="w-5 h-5" style={{ color: '#E3350D' }} /></span>
                <span
                  className="font-black text-base uppercase tracking-wide mag-stroke"
                  style={{
                    paintOrder: 'stroke fill',
                    WebkitTextStroke: '1.5px #1a1a1a',
                    color: '#E3350D',
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
                border: '3px solid #1a1a1a',
                boxShadow: '4px 4px 0px #1a1a1a',
              }}
            >
              <div
                className="text-center font-black text-[10px] uppercase tracking-widest mb-2 py-1"
                style={{
                  background: '#00A1E9',
                  color: 'white',
                  border: '2px solid #1a1a1a',
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
                        border: '3px solid #1a1a1a',
                      }}
                    >
                      {tazo.evolutionFrom.charAt(0)}
                    </div>
                    <span className="text-[9px] font-black uppercase" style={{ color: '#00A1E9' }}>
                      {tazo.evolutionFrom}
                    </span>
                  </div>
                )}
                <div className="flex flex-col items-center">
                  <ArrowRight className="w-6 h-6" style={{ color: '#1a1a1a' }} />
                  <span className="text-[8px] font-black uppercase" style={{ color: '#E3350D' }}>POWER UP!</span>
                </div>
                {/* Current tazo silhouette */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black star-burst"
                    style={{
                      background: `linear-gradient(135deg, ${franchiseColors.from}, ${franchiseColors.to})`,
                      border: '3px solid #1a1a1a',
                      boxShadow: '3px 3px 0px #1a1a1a',
                      color: 'white',
                      textShadow: '1px 1px 0px #1a1a1a',
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
                      <ArrowRight className="w-6 h-6" style={{ color: '#1a1a1a' }} />
                      <span className="text-[8px] font-black uppercase" style={{ color: '#E3350D' }}>POWER UP!</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center border-3 border-black text-lg font-black"
                        style={{
                          background: 'linear-gradient(135deg, #00A1E940, #0057B740)',
                          border: '3px solid #1a1a1a',
                        }}
                      >
                        {tazo.evolutionTo.charAt(0)}
                      </div>
                      <span className="text-[9px] font-black uppercase" style={{ color: '#00A1E9' }}>
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
                border: '3px solid #1a1a1a',
                boxShadow: '4px 4px 0px #1a1a1a',
              }}
            >
              <div
                className="text-center font-black text-[10px] uppercase tracking-widest mb-2 py-1"
                style={{
                  background: '#FF6B00',
                  color: 'white',
                  border: '2px solid #1a1a1a',
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
                          border: '3px solid #1a1a1a',
                        }}
                      >
                        {tazo.transformOf.charAt(0)}
                      </div>
                      <span className="text-[9px] font-black uppercase" style={{ color: '#FF6B00' }}>
                        {tazo.transformOf}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <ArrowRight className="w-6 h-6" style={{ color: '#1a1a1a' }} />
                      <span className="text-[8px] font-black uppercase" style={{ color: '#E3350D' }}>POWER UP!</span>
                    </div>
                  </>
                )}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black star-burst"
                    style={{
                      background: `linear-gradient(135deg, ${franchiseColors.from}, ${franchiseColors.to})`,
                      border: '3px solid #1a1a1a',
                      boxShadow: '3px 3px 0px #1a1a1a',
                      color: 'white',
                      textShadow: '1px 1px 0px #1a1a1a',
                    }}
                  >
                    {tazo.displayName || tazo.name || "?".charAt(0)}
                  </div>
                  {tazo.transformStage && (
                    <span
                      className="text-[9px] font-black uppercase px-1.5 py-0.5 border border-black"
                      style={{ background: '#FF6B0030', color: '#FF6B00' }}
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
                border: '3px solid #1a1a1a',
                boxShadow: '4px 4px 0px #1a1a1a',
              }}
            >
              <div
                className="text-center font-black text-[10px] uppercase tracking-widest mb-2 py-1"
                style={{
                  background: '#FFCB05',
                  color: '#1a1a1a',
                  border: '2px solid #1a1a1a',
                }}
              >
                <Zap className="w-3.5 h-3.5 inline mr-1" style={{ color: '#FFCB05' }} /> TYPE ADVANTAGES <Zap className="w-3.5 h-3.5 inline ml-1" style={{ color: '#FFCB05' }} />
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
                        boxShadow: '2px 2px 0px #1a1a1a',
                      }}
                    >
                      <ArrowUpCircle className="w-3 h-3" /> vs {type}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] font-bold" style={{ color: '#9CA3AF' }}>
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
                <span className="text-xs font-bold" style={{ color: '#1a1a1a' }}>
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
              border: '3px solid #1a1a1a',
              boxShadow: '4px 4px 0px #1a1a1a',
            }}
          >
            <div
              className="text-center font-black text-[10px] uppercase tracking-widest mb-2 py-1"
              style={{
                background: '#1a1a1a',
                color: '#FFCC00',
                border: '2px solid #1a1a1a',
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
                  background: '#22C55E',
                  border: '3px solid #1a1a1a',
                  boxShadow: '3px 3px 0px #1a1a1a',
                }}
              >
                <div className="text-xs font-black uppercase" style={{ color: '#1a1a1a90' }}>Wins</div>
                <div
                  className="text-3xl font-black leading-none"
                  style={{
                    color: 'white',
                    textShadow: '2px 2px 0px #1a1a1a40',
                  }}
                >
                  {tazo.battleWins}
                </div>
              </div>

              {/* Losses Box */}
              <div
                className="flex-1 text-center py-2 px-3"
                style={{
                  background: '#E3350D',
                  border: '3px solid #1a1a1a',
                  boxShadow: '3px 3px 0px #1a1a1a',
                }}
              >
                <div className="text-xs font-black uppercase" style={{ color: '#ffffff90' }}>Losses</div>
                <div
                  className="text-3xl font-black leading-none"
                  style={{
                    color: 'white',
                    textShadow: '2px 2px 0px #1a1a1a40',
                  }}
                >
                  {tazo.battleLosses}
                </div>
              </div>

              {/* Win Rate */}
              <div
                className="flex-1 text-center py-2 px-3 flex flex-col items-center justify-center"
                style={{
                  background: '#FFCC00',
                  border: '3px solid #1a1a1a',
                  boxShadow: '3px 3px 0px #1a1a1a',
                }}
              >
                <div className="text-xs font-black uppercase" style={{ color: '#1a1a1a90' }}>Win %</div>
                <div
                  className="text-2xl font-black leading-none"
                  style={{
                    color: '#1a1a1a',
                  }}
                >
                  {winRate}%
                </div>
              </div>
            </div>
          </div>

          {/* ===== ACTION BUTTONS ===== */}
          <div className="flex gap-3 pt-1">
            {/* Toggle Owned - Yellow Magazine Button */}
            <button
              onClick={() => onToggleOwned?.(tazo)}
              className="mag-btn flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm"
              style={{
                background: tazo.isOwned ? '#FFCC00' : '#FFCC00',
                color: '#1a1a1a',
              }}
            >
              {tazo.isOwned ? (
                <>
                  <Unlock className="w-4 h-4" />
                  Mark as Missing
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Mark as Owned
                </>
              )}
            </button>

            {/* Close - Red Magazine Button */}
            <button
              onClick={onClose}
              className="mag-btn py-3 px-5 flex items-center justify-center gap-2 text-sm"
              style={{
                background: '#E3350D',
                color: 'white',
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
