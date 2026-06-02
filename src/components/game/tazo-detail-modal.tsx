'use client'

import { Tazo, RARITY_CONFIG, CONDITION_CONFIG, Rarity, TazoCondition, POKEMON_TYPES, DIGIMON_TYPES, DBZ_TYPES } from '@/lib/game/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Lock, Unlock, Swords, Trophy, X, ChevronRight, Zap, ArrowUpCircle } from 'lucide-react'

interface TazoDetailModalProps {
  tazo: Tazo | null
  open: boolean
  onClose: () => void
  onToggleOwned?: (tazo: Tazo) => void
}

const FRANCHISE_COLORS: Record<string, { from: string; to: string; text: string; border: string }> = {
  pokemon: { from: '#FFCB05', to: '#FF8C00', text: '#92400E', border: '#FFCB05' },
  digimon: { from: '#00A1E9', to: '#0057B7', text: '#1E3A5F', border: '#00A1E9' },
  dbz: { from: '#FF6B00', to: '#CC4400', text: '#7C2D12', border: '#FF6B00' },
}

const STAT_CONFIG = [
  { key: 'attack' as const, label: 'ATK', color: '#EF4444', icon: '⚔️' },
  { key: 'defense' as const, label: 'DEF', color: '#3B82F6', icon: '🛡️' },
  { key: 'spin' as const, label: 'SPIN', color: '#10B981', icon: '🌀' },
  { key: 'weight' as const, label: 'WEIGHT', color: '#F59E0B', icon: '⚖️' },
  { key: 'aura' as const, label: 'AURA', color: '#8B5CF6', icon: '✨' },
  { key: 'control' as const, label: 'CONTROL', color: '#EC4899', icon: '🎯' },
]

const RARITY_STARS: Record<Rarity, string> = {
  common: '★',
  uncommon: '★★',
  rare: '★★★',
  ultra: '★★★★',
  legendary: '★★★★★',
}

// Pokémon type advantage table
const POKEMON_ADVANTAGES: Record<string, string[]> = {
  fire: ['grass'],
  water: ['fire'],
  grass: ['water'],
  electric: ['water'],
  psychic: ['ghost'],
  ghost: ['normal'],
  dragon: ['dragon'],
  normal: [],
}

export default function TazoDetailModal({ tazo, open, onClose, onToggleOwned }: TazoDetailModalProps) {
  if (!tazo) return null

  const franchiseSlug = tazo.franchise?.slug || 'pokemon'
  const franchiseColors = FRANCHISE_COLORS[franchiseSlug] || FRANCHISE_COLORS.pokemon
  const rarityConfig = RARITY_CONFIG[tazo.rarity as Rarity]
  const conditionConfig = CONDITION_CONFIG[tazo.condition as TazoCondition]

  const isHolo = tazo.condition === 'holo'
  const isMetallic = tazo.condition === 'metallic'
  const isLegendary = tazo.rarity === 'legendary'
  const isWorn = tazo.condition === 'worn'
  const totalBattles = tazo.battleWins + tazo.battleLosses
  const winRate = totalBattles > 0 ? Math.round((tazo.battleWins / totalBattles) * 100) : 0

  let circleBorderClass = ''
  if (isHolo) circleBorderClass = 'holo-border'
  else if (isLegendary) circleBorderClass = 'legendary-glow'

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#1a1a2e] border-white/10 text-white p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>{tazo.name}</DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Large Circular Tazo Display */}
          <div className="flex justify-center mb-4">
            <div
              className={`
                relative w-[160px] h-[160px] sm:w-[180px] sm:h-[180px]
                rounded-full flex items-center justify-center
                ${circleBorderClass}
              `}
              style={{
                border: isHolo ? undefined : isLegendary ? '4px solid #FBBF24' : `4px solid ${franchiseColors.border}80`,
                padding: '4px',
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
                      className="text-5xl sm:text-6xl font-black leading-none"
                      style={{ color: franchiseColors.from, textShadow: `0 0 20px ${franchiseColors.from}40` }}
                    >
                      {tazo.name.charAt(0)}
                    </span>
                    {tazo.printedNumber && (
                      <span
                        className="text-xs font-semibold mt-1 opacity-70"
                        style={{ color: franchiseColors.from }}
                      >
                        #{tazo.printedNumber}
                      </span>
                    )}
                  </>
                )}

                {!tazo.isOwned && (
                  <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                    <Lock className="w-10 h-10 text-white/60" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Name & Collection */}
          <div className="text-center mb-3">
            <h2 className="text-xl font-black">{tazo.name}</h2>
            <p className="text-sm text-white/50">
              {tazo.collection?.name || 'Unknown Collection'} {tazo.collection?.year ? `(${tazo.collection.year})` : ''}
            </p>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap gap-1.5 justify-center mb-4">
            <Badge
              style={{
                backgroundColor: franchiseColors.from + '25',
                color: franchiseColors.from,
                borderColor: franchiseColors.from + '40',
              }}
              variant="outline"
            >
              {tazo.franchise?.name}
            </Badge>
            <Badge
              variant="outline"
              style={{
                color: rarityConfig?.color === 'text-gray-600' ? '#9CA3AF' :
                       rarityConfig?.color === 'text-green-600' ? '#22C55E' :
                       rarityConfig?.color === 'text-blue-600' ? '#3B82F6' :
                       rarityConfig?.color === 'text-purple-600' ? '#A855F7' :
                       '#F59E0B',
                borderColor: rarityConfig?.color === 'text-gray-600' ? '#9CA3AF40' :
                             rarityConfig?.color === 'text-green-600' ? '#22C55E40' :
                             rarityConfig?.color === 'text-blue-600' ? '#3B82F640' :
                             rarityConfig?.color === 'text-purple-600' ? '#A855F740' :
                             '#F59E0B40',
              }}
            >
              {RARITY_STARS[tazo.rarity as Rarity]} {rarityConfig?.label}
            </Badge>
            <Badge
              variant="outline"
              style={{
                color: conditionConfig?.color === 'text-emerald-600' ? '#10B981' :
                       conditionConfig?.color === 'text-green-600' ? '#22C55E' :
                       conditionConfig?.color === 'text-yellow-600' ? '#EAB308' :
                       conditionConfig?.color === 'text-orange-600' ? '#F97316' :
                       conditionConfig?.color === 'text-cyan-600' ? '#06B6D4' :
                       '#94A3B8',
                borderColor: 'currentColor',
              }}
            >
              {conditionConfig?.icon} {conditionConfig?.label}
            </Badge>
            {tazo.combatType && (
              <Badge variant="outline" className="border-white/20 text-white/60">
                {tazo.combatType}
              </Badge>
            )}
          </div>

          {/* Skill */}
          {tazo.skill && (
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-sm text-yellow-400">{tazo.skill}</span>
              </div>
              {tazo.skillDesc && (
                <p className="text-xs text-white/60 leading-relaxed">{tazo.skillDesc}</p>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="space-y-2 mb-4">
            <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">Stats</h3>
            {STAT_CONFIG.map((stat) => (
              <div key={stat.key} className="flex items-center gap-2">
                <span className="text-xs w-4">{stat.icon}</span>
                <span className="text-xs font-mono text-white/50 w-16">{stat.label}</span>
                <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full stat-bar-fill"
                    style={{
                      width: `${tazo[stat.key]}%`,
                      backgroundColor: stat.color,
                    }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-white/80 w-8 text-right">{tazo[stat.key]}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-white/5">
              <span className="text-xs">📊</span>
              <span className="text-xs font-mono text-white/50 w-16">TOTAL</span>
              <span className="text-xs font-mono font-bold text-white/80 ml-auto">
                {tazo.attack + tazo.defense + tazo.spin + tazo.weight + tazo.aura + tazo.control}
              </span>
            </div>
          </div>

          <Separator className="bg-white/10 mb-4" />

          {/* Franchise-Specific Info */}
          {franchiseSlug === 'pokemon' && tazo.combatType && (
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <h4 className="text-xs font-bold text-yellow-400 mb-2 uppercase tracking-wider">Type Advantages</h4>
              <div className="flex flex-wrap gap-1.5">
                {(POKEMON_ADVANTAGES[tazo.combatType] || []).length > 0 ? (
                  (POKEMON_ADVANTAGES[tazo.combatType] || []).map((type) => (
                    <Badge key={type} variant="outline" className="text-[10px] border-green-500/40 text-green-400">
                      <ArrowUpCircle className="w-3 h-3 mr-0.5" /> vs {type}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-white/40">No type advantages</span>
                )}
              </div>
            </div>
          )}

          {franchiseSlug === 'digimon' && (tazo.evolutionFrom || tazo.evolutionTo) && (
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <h4 className="text-xs font-bold text-[#00A1E9] mb-2 uppercase tracking-wider">Digievolution</h4>
              <div className="flex items-center gap-2 text-xs text-white/70">
                {tazo.evolutionFrom && (
                  <Badge variant="outline" className="border-blue-400/40 text-blue-300 text-[10px]">
                    ← {tazo.evolutionFrom}
                  </Badge>
                )}
                {tazo.evolutionFrom && tazo.evolutionTo && <ChevronRight className="w-3 h-3 text-white/30" />}
                {tazo.evolutionTo && (
                  <Badge variant="outline" className="border-blue-400/40 text-blue-300 text-[10px]">
                    {tazo.evolutionTo} →
                  </Badge>
                )}
              </div>
            </div>
          )}

          {franchiseSlug === 'dbz' && (tazo.transformStage || tazo.transformOf) && (
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <h4 className="text-xs font-bold text-[#FF6B00] mb-2 uppercase tracking-wider">Transformation</h4>
              {tazo.transformStage && (
                <Badge variant="outline" className="border-orange-400/40 text-orange-300 text-[10px]">
                  {tazo.transformStage}
                </Badge>
              )}
              {tazo.transformOf && (
                <p className="text-[10px] text-white/40 mt-1">Transform of: {tazo.transformOf}</p>
              )}
            </div>
          )}

          {/* Condition Effect */}
          {conditionConfig && (
            <div className="bg-white/5 rounded-lg p-3 mb-4">
              <h4 className="text-xs font-bold text-white/60 mb-1 uppercase tracking-wider">Condition Effect</h4>
              <p className="text-xs text-white/50">{conditionConfig.effect}</p>
            </div>
          )}

          {/* Battle Record */}
          <div className="bg-white/5 rounded-lg p-3 mb-4">
            <h4 className="text-xs font-bold text-white/60 mb-2 uppercase tracking-wider flex items-center gap-1">
              <Swords className="w-3 h-3" /> Battle Record
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-green-400" />
                <span className="text-sm font-bold text-green-400">{tazo.battleWins}</span>
                <span className="text-xs text-white/40">W</span>
              </div>
              <div className="flex items-center gap-1.5">
                <X className="w-4 h-4 text-red-400" />
                <span className="text-sm font-bold text-red-400">{tazo.battleLosses}</span>
                <span className="text-xs text-white/40">L</span>
              </div>
              <div className="ml-auto">
                <span className="text-xs text-white/40">Win Rate: </span>
                <span className="text-sm font-bold text-white/80">{winRate}%</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              variant={tazo.isOwned ? 'destructive' : 'default'}
              onClick={() => onToggleOwned?.(tazo)}
            >
              {tazo.isOwned ? (
                <>
                  <Unlock className="w-4 h-4 mr-1.5" />
                  Mark as Missing
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-1.5" />
                  Mark as Owned
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
