'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BattleSelectCard } from './battle-select-card'
import { BattleCanvas } from './battle-canvas'
import type { Tazo, BattleResult, BattleEvent, BattleTazo } from '@/lib/game/types'
import { RARITY_CONFIG } from '@/lib/game/types'
import {
  Swords,
  Zap,
  Shield,
  RotateCcw,
  Trophy,
  ArrowLeft,
  Play,
  Pause,
  FastForward,
  Shuffle,
  Crown,
  Target,
  Flame,
  CircleDot,
  Star,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────
type BattlePhase = 'select' | 'battle' | 'result'
type Difficulty = 'easy' | 'medium' | 'hard'

interface BattleViewProps {
  onBackToAlbum?: () => void
}

// ─── Constants ───────────────────────────────────────────────────────
const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; bgClass: string; desc: string }> = {
  easy: { label: 'Easy', color: 'text-green-600', bgClass: 'bg-green-100 border-green-300', desc: 'Weaker opponents' },
  medium: { label: 'Medium', color: 'text-yellow-600', bgClass: 'bg-yellow-100 border-yellow-300', desc: 'Balanced match' },
  hard: { label: 'Hard', color: 'text-red-600', bgClass: 'bg-red-100 border-red-300', desc: 'Strong opponents' },
}

// ─── Component ───────────────────────────────────────────────────────
export function BattleView({ onBackToAlbum }: BattleViewProps) {
  // Phase
  const [phase, setPhase] = useState<BattlePhase>('select')

  // Select phase
  const [ownedTazos, setOwnedTazos] = useState<Tazo[]>([])
  const [allTazos, setAllTazos] = useState<Tazo[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [loadingTazos, setLoadingTazos] = useState(true)

  // Battle phase
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [battleComplete, setBattleComplete] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  // ── Fetch tazos ──
  useEffect(() => {
    async function fetchTazos() {
      try {
        const [ownedRes, allRes] = await Promise.all([
          fetch('/api/tazos?owned=true'),
          fetch('/api/tazos'),
        ])
        const ownedData = await ownedRes.json()
        const allData = await allRes.json()
        setOwnedTazos(ownedData.tazos || [])
        setAllTazos(allData.tazos || [])
      } catch (err) {
        console.error('Failed to fetch tazos:', err)
      } finally {
        setLoadingTazos(false)
      }
    }
    fetchTazos()
  }, [])

  // ── Selection handlers ──
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id)
      }
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }, [])

  const randomTeam = useCallback(() => {
    const shuffled = [...ownedTazos].sort(() => Math.random() - 0.5)
    setSelectedIds(shuffled.slice(0, 3).map(t => t.id))
  }, [ownedTazos])

  // ── Generate opponent team ──
  const generateOpponent = useCallback((): string[] => {
    const unowned = allTazos.filter(t => !t.isOwned)
    const candidates = unowned.length >= 3 ? unowned : allTazos.filter(t => !selectedIds.includes(t.id))

    const sorted = [...candidates].sort((a, b) => {
      const powerA = a.attack + a.defense + a.spin + a.aura
      const powerB = b.attack + b.defense + b.spin + b.aura
      return powerA - powerB
    })

    let pool: Tazo[]
    switch (difficulty) {
      case 'easy': {
        // Pick from bottom 40%
        const cutoff = Math.max(3, Math.ceil(sorted.length * 0.4))
        pool = sorted.slice(0, cutoff)
        break
      }
      case 'hard': {
        // Pick from top 40%
        const cutoff = Math.max(3, Math.ceil(sorted.length * 0.4))
        pool = sorted.slice(-cutoff)
        break
      }
      default: {
        // Medium: pick from middle 60%
        const start = Math.floor(sorted.length * 0.2)
        const end = Math.max(start + 3, Math.ceil(sorted.length * 0.8))
        pool = sorted.slice(start, end)
        break
      }
    }

    const shuffled = pool.sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3).map(t => t.id)
  }, [allTazos, difficulty, selectedIds])

  // ── Start battle ──
  const startBattle = useCallback(async () => {
    if (selectedIds.length !== 3) return
    setIsSubmitting(true)

    const opponentIds = generateOpponent()

    try {
      const res = await fetch('/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerTazoIds: selectedIds, opponentTazoIds: opponentIds }),
      })
      const data = await res.json()

      // Transform API response into BattleResult format
      const mappedPlayerTazos: BattleTazo[] = (data.playerTazos || []).map(mapBattleTazo)
      const mappedOpponentTazos: BattleTazo[] = (data.opponentTazos || []).map(mapBattleTazo)
      const nameToId = new Map<string, string>()
      for (const t of [...mappedPlayerTazos, ...mappedOpponentTazos]) {
        nameToId.set(t.name, t.id)
      }

      const result: BattleResult = {
        winner: data.winner,
        victoryType: data.victoryType,
        rounds: data.rounds,
        battleLog: (data.battleLog || []).map((e: Record<string, unknown>) => {
          const desc = e.description as string
          const actor = e.actor as 'player' | 'opponent' | undefined
          const mappedType = mapEventType(e.type as string) as BattleEvent['type']
          const { actorId, targetId } = extractIdsFromDescription(
            desc,
            actor,
            mappedType,
            nameToId,
            mappedPlayerTazos,
            mappedOpponentTazos
          )
          // Extract damage from description like "for 42 damage"
          const damageMatch = desc.match(/for (\d+) damage/)
          return {
            round: e.round as number,
            type: mappedType,
            description: desc,
            actorId,
            targetId,
            damage: damageMatch ? parseInt(damageMatch[1]) : (e.damage as number | undefined),
          }
        }),
        playerTazos: mappedPlayerTazos,
        opponentTazos: mappedOpponentTazos,
      }

      setBattleResult(result)
      setPhase('battle')
      setIsPlaying(true)
      setCurrentEventIndex(0)
      setBattleLog([])
      setBattleComplete(false)
    } catch (err) {
      console.error('Battle failed:', err)
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedIds, generateOpponent])

  // ── Battle event handlers ──
  const handleEventComplete = useCallback(() => {
    if (!battleResult) return
    const event = battleResult.battleLog[currentEventIndex]
    if (event) {
      setBattleLog(prev => [...prev, `[R${event.round}] ${event.description}`])
    }
    setCurrentEventIndex(prev => prev + 1)
  }, [battleResult, currentEventIndex])

  const handleAllEventsComplete = useCallback(() => {
    setBattleComplete(true)
    setIsPlaying(false)
  }, [])

  // Auto-advance to result
  useEffect(() => {
    if (battleComplete && phase === 'battle') {
      const timer = setTimeout(() => setPhase('result'), 2000)
      return () => clearTimeout(timer)
    }
  }, [battleComplete, phase])

  // Scroll log to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [battleLog])

  // ── Speed control ──
  const cycleSpeed = useCallback(() => {
    setSpeed(prev => prev === 1 ? 2 : prev === 2 ? 4 : 1)
  }, [])

  // ── Battle again ──
  const battleAgain = useCallback(() => {
    setPhase('select')
    setBattleResult(null)
    setSelectedIds([])
    setCurrentEventIndex(0)
    setBattleLog([])
    setBattleComplete(false)
    setIsPlaying(false)
    setSpeed(1)
  }, [])

  // ── Helpers ──
  const selectedTazos = ownedTazos.filter(t => selectedIds.includes(t.id))

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* ── SELECT PHASE ── */}
      {phase === 'select' && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-xl shadow-lg shadow-orange-500/30">
                <Swords className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Battle Arena</h1>
                <p className="text-sm text-gray-400">Choose your team and fight!</p>
              </div>
            </div>
            {onBackToAlbum && (
              <Button variant="ghost" onClick={onBackToAlbum} className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-1" /> Album
              </Button>
            )}
          </div>

          {/* Selected team */}
          <div className="mb-6 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="font-bold text-sm">Your Team ({selectedIds.length}/3)</span>
            </div>
            <div className="flex gap-3 min-h-[80px]">
              {selectedTazos.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-500 text-sm border border-dashed border-gray-700 rounded-lg">
                  Click tazos below to select your team
                </div>
              )}
              {selectedTazos.map(tazo => (
                <div
                  key={tazo.id}
                  className="flex-1 p-3 rounded-lg bg-gray-700/50 border border-gray-600 flex flex-col items-center gap-1"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white shadow-md"
                    style={{ backgroundColor: tazo.franchise?.color || '#666' }}
                  >
                    {tazo.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold truncate w-full text-center">{tazo.name}</span>
                  <div className="flex gap-1 w-full">
                    <span className="text-[9px] text-red-400 flex items-center gap-0.5"><Target className="w-2.5 h-2.5" />{tazo.attack}</span>
                    <span className="text-[9px] text-blue-400 flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" />{tazo.defense}</span>
                    <span className="text-[9px] text-green-400 flex items-center gap-0.5"><RotateCcw className="w-2.5 h-2.5" />{tazo.spin}</span>
                  </div>
                </div>
              ))}
              {/* Empty slots */}
              {Array.from({ length: Math.max(0, 3 - selectedTazos.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex-1 p-3 rounded-lg border border-dashed border-gray-700 flex items-center justify-center"
                >
                  <span className="text-gray-600 text-2xl">+</span>
                </div>
              ))}
            </div>
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {/* Difficulty */}
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-medium text-gray-300">Difficulty:</span>
              {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-bold border transition-all',
                    difficulty === d
                      ? DIFFICULTY_CONFIG[d].bgClass + ' ' + DIFFICULTY_CONFIG[d].color + ' ring-2 ring-offset-1 ring-offset-gray-900'
                      : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500'
                  )}
                >
                  {DIFFICULTY_CONFIG[d].label}
                </button>
              ))}
            </div>

            <div className="flex-1" />

            {/* Random + Start */}
            <Button variant="outline" onClick={randomTeam} className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Shuffle className="w-4 h-4 mr-1" /> Random Team
            </Button>
            <Button
              onClick={startBattle}
              disabled={selectedIds.length !== 3 || isSubmitting}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg shadow-orange-500/30"
            >
              {isSubmitting ? (
                <span className="animate-pulse">Starting...</span>
              ) : (
                <>
                  <Swords className="w-4 h-4 mr-1" /> Start Battle!
                </>
              )}
            </Button>
          </div>

          {/* Tazo grid */}
          {loadingTazos ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
            </div>
          ) : ownedTazos.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No owned tazos yet. Collect some first!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {ownedTazos.map(tazo => (
                <BattleSelectCard
                  key={tazo.id}
                  tazo={tazo}
                  selected={selectedIds.includes(tazo.id)}
                  onSelect={toggleSelect}
                  disabled={selectedIds.length >= 3 && !selectedIds.includes(tazo.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BATTLE PHASE ── */}
      {phase === 'battle' && battleResult && (
        <div className="h-screen flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-1.5 rounded-lg">
                <Swords className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm">Round {currentEventIndex > 0 ? battleResult.battleLog[Math.min(currentEventIndex, battleResult.battleLog.length - 1)]?.round || 1 : 1}</span>
                <span className="text-gray-500 text-xs ml-2">/ {battleResult.rounds}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPlaying(prev => !prev)}
                className="text-gray-300 hover:text-white hover:bg-gray-800"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              {/* Speed */}
              <Button
                variant="ghost"
                size="sm"
                onClick={cycleSpeed}
                className="text-gray-300 hover:text-white hover:bg-gray-800 font-mono"
              >
                <FastForward className="w-3 h-3 mr-1" /> {speed}x
              </Button>
              {/* Skip to result */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Fast forward: show all events in log and go to result
                  const remaining = battleResult.battleLog.slice(currentEventIndex)
                  setBattleLog(prev => [...prev, ...remaining.map(e => `[R${e.round}] ${e.description}`)])
                  setCurrentEventIndex(battleResult.battleLog.length)
                  setBattleComplete(true)
                  setIsPlaying(false)
                }}
                className="text-gray-400 hover:text-white hover:bg-gray-800 text-xs"
              >
                Skip <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Main area: Canvas + Log */}
          <div className="flex-1 flex min-h-0">
            {/* Canvas */}
            <div className="flex-1 relative">
              <BattleCanvas
                playerTazos={battleResult.playerTazos}
                opponentTazos={battleResult.opponentTazos}
                events={battleResult.battleLog}
                isPlaying={isPlaying}
                speed={speed}
                currentEventIndex={currentEventIndex}
                onEventComplete={handleEventComplete}
                onAllEventsComplete={handleAllEventsComplete}
              />

              {/* Battle complete overlay */}
              {battleComplete && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 animate-in fade-in duration-500">
                  <div className="text-center">
                    <div className="text-5xl font-black mb-2 animate-bounce">
                      {battleResult.winner === 'player' ? '🏆' : battleResult.winner === 'opponent' ? '💀' : '🤝'}
                    </div>
                    <h2 className="text-3xl font-black">
                      {battleResult.winner === 'player' ? 'VICTORY!' : battleResult.winner === 'opponent' ? 'DEFEAT!' : 'DRAW!'}
                    </h2>
                    {battleResult.victoryType && (
                      <Badge className="mt-2 text-sm" variant="outline">
                        {battleResult.victoryType.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Battle log */}
            <div className="w-64 lg:w-80 bg-gray-900/90 border-l border-gray-800 flex flex-col">
              <div className="px-3 py-2 border-b border-gray-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="font-bold text-sm">Battle Log</span>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-1">
                  {battleLog.length === 0 && (
                    <p className="text-gray-600 text-xs text-center py-4">Waiting for battle to begin...</p>
                  )}
                  {battleLog.map((msg, i) => (
                    <div
                      key={i}
                      className={cn(
                        'text-[11px] leading-snug py-1 px-2 rounded transition-all',
                        msg.includes('knocked out') || msg.includes('Ring-out')
                          ? 'bg-red-900/30 text-red-300 font-bold'
                          : msg.includes('super effective')
                          ? 'bg-yellow-900/30 text-yellow-300 font-medium'
                          : msg.includes('evolution')
                          ? 'bg-green-900/30 text-green-300 font-medium'
                          : msg.includes('transform')
                          ? 'bg-orange-900/30 text-orange-300 font-medium'
                          : msg.includes('slams') || msg.includes('damage')
                          ? 'bg-gray-800/50 text-gray-300'
                          : 'text-gray-500'
                      )}
                    >
                      {msg}
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              </ScrollArea>

              {/* Team status */}
              <div className="border-t border-gray-800 p-3">
                <div className="text-[10px] font-bold text-gray-400 mb-1">PLAYER</div>
                {battleResult.playerTazos.map(t => (
                  <TazoStatus key={t.id} tazo={t} side="player" />
                ))}
                <div className="text-[10px] font-bold text-gray-400 mb-1 mt-2">OPPONENT</div>
                {battleResult.opponentTazos.map(t => (
                  <TazoStatus key={t.id} tazo={t} side="opponent" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULT PHASE ── */}
      {phase === 'result' && battleResult && (
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Winner banner */}
          <div className={cn(
            'text-center mb-8 p-8 rounded-2xl border-2',
            battleResult.winner === 'player'
              ? 'bg-gradient-to-b from-yellow-900/30 to-transparent border-yellow-600/50'
              : battleResult.winner === 'opponent'
              ? 'bg-gradient-to-b from-red-900/30 to-transparent border-red-600/50'
              : 'bg-gradient-to-b from-gray-800/30 to-transparent border-gray-600/50'
          )}>
            <div className="text-6xl mb-4 animate-bounce">
              {battleResult.winner === 'player' ? '🏆' : battleResult.winner === 'opponent' ? '💀' : '🤝'}
            </div>
            <h1 className={cn(
              'text-4xl font-black mb-2',
              battleResult.winner === 'player' ? 'text-yellow-400' : battleResult.winner === 'opponent' ? 'text-red-400' : 'text-gray-400'
            )}>
              {battleResult.winner === 'player' ? 'VICTORY!' : battleResult.winner === 'opponent' ? 'DEFEAT!' : 'DRAW!'}
            </h1>
            {battleResult.victoryType && (
              <div className="flex items-center justify-center gap-2 mt-2">
                {battleResult.victoryType === 'knockout' && <Flame className="w-5 h-5 text-red-400" />}
                {battleResult.victoryType === 'ring-out' && <CircleDot className="w-5 h-5 text-blue-400" />}
                {battleResult.victoryType === 'spin-out' && <RotateCcw className="w-5 h-5 text-green-400" />}
                {battleResult.victoryType === 'combo' && <Sparkles className="w-5 h-5 text-purple-400" />}
                <Badge variant="outline" className="text-sm px-3 py-1">
                  {battleResult.victoryType.replace('-', ' ').toUpperCase()}
                </Badge>
              </div>
            )}
            <p className="text-gray-400 text-sm mt-2">Battle lasted {battleResult.rounds} rounds</p>
          </div>

          {/* Battle Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Player team */}
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <h3 className="font-bold text-sm text-blue-400 mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4" /> Your Team
              </h3>
              {battleResult.playerTazos.map(t => (
                <ResultTazo key={t.id} tazo={t} isWinner={battleResult!.winner === 'player'} />
              ))}
            </div>

            {/* Opponent team */}
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700">
              <h3 className="font-bold text-sm text-red-400 mb-3 flex items-center gap-2">
                <Swords className="w-4 h-4" /> Opponent
              </h3>
              {battleResult.opponentTazos.map(t => (
                <ResultTazo key={t.id} tazo={t} isWinner={battleResult!.winner === 'opponent'} />
              ))}
            </div>
          </div>

          {/* Battle log summary */}
          <div className="mb-8 p-4 rounded-xl bg-gray-800/50 border border-gray-700">
            <h3 className="font-bold text-sm text-gray-300 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" /> Battle Highlights
            </h3>
            <ScrollArea className="max-h-48">
              <div className="space-y-1">
                {battleResult.battleLog
                  .filter(e =>
                    e.type === 'knockout' || e.type === 'ring_out' ||
                    e.type === 'type_advantage' || e.type === 'evolution' ||
                    e.type === 'transform' || e.type === 'skill' ||
                    e.type === 'combo'
                  )
                  .map((e, i) => (
                    <div key={i} className={cn(
                      'text-xs py-1 px-2 rounded',
                      e.type === 'knockout' || e.type === 'ring_out'
                        ? 'bg-red-900/30 text-red-300 font-bold'
                        : e.type === 'type_advantage'
                        ? 'bg-yellow-900/30 text-yellow-300'
                        : e.type === 'evolution'
                        ? 'bg-green-900/30 text-green-300'
                        : e.type === 'transform'
                        ? 'bg-orange-900/30 text-orange-300'
                        : 'bg-gray-800/50 text-gray-400'
                    )}>
                      [R{e.round}] {e.description}
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={battleAgain}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold shadow-lg shadow-orange-500/30"
            >
              <Swords className="w-4 h-4 mr-1" /> Battle Again
            </Button>
            {onBackToAlbum && (
              <Button variant="outline" onClick={onBackToAlbum} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Album
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────

function TazoStatus({ tazo, side }: { tazo: BattleTazo; side: 'player' | 'opponent' }) {
  const hpPct = Math.max(0, tazo.currentHp / tazo.maxHp) * 100
  const isDead = tazo.currentHp <= 0

  return (
    <div className={cn('flex items-center gap-2 py-1', isDead && 'opacity-40')}>
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
        style={{ backgroundColor: tazo.franchise?.color || '#666' }}
      >
        {tazo.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-medium truncate">{tazo.name}</div>
        <div className="flex items-center gap-1">
          <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', hpPct > 50 ? 'bg-green-500' : hpPct > 25 ? 'bg-yellow-500' : 'bg-red-500')}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <span className="text-[8px] text-gray-500 w-8 text-right">{Math.max(0, tazo.currentHp)}</span>
        </div>
      </div>
    </div>
  )
}

function ResultTazo({ tazo, isWinner }: { tazo: BattleTazo; isWinner: boolean }) {
  const hpPct = Math.max(0, tazo.currentHp / tazo.maxHp) * 100
  const isDead = tazo.currentHp <= 0
  const rarity = RARITY_CONFIG[tazo.rarity as keyof typeof RARITY_CONFIG]

  return (
    <div className={cn(
      'flex items-center gap-3 p-2 rounded-lg mb-2 transition-all',
      isDead ? 'bg-gray-800/30 opacity-50' : 'bg-gray-800/60',
      isWinner && !isDead && 'ring-1 ring-yellow-500/30'
    )}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-md"
        style={{ backgroundColor: tazo.franchise?.color || '#666' }}
      >
        {tazo.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm truncate">{tazo.name}</span>
          {rarity && (
            <Badge variant="outline" className={cn('text-[8px] px-1 py-0 h-4', rarity.color, rarity.bgColor, rarity.borderColor)}>
              {rarity.label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', hpPct > 50 ? 'bg-green-500' : hpPct > 25 ? 'bg-yellow-500' : 'bg-red-500')}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{Math.max(0, tazo.currentHp)}/{tazo.maxHp}</span>
        </div>
        {isDead && <span className="text-[10px] text-red-400 font-bold">KO</span>}
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────

function mapEventType(type: string): string {
  const map: Record<string, string> = {
    attack: 'collision',
    defense: 'skill',
    ki_charge: 'skill',
    evolution_boost: 'evolution',
    ring_out_check: 'spin_decay',
  }
  return map[type] || type
}

function extractIdsFromDescription(
  desc: string,
  actor: 'player' | 'opponent' | undefined,
  _type: BattleEvent['type'],
  nameToId: Map<string, string>,
  playerTazos: BattleTazo[],
  opponentTazos: BattleTazo[]
): { actorId: string | undefined; targetId: string | undefined } {
  // Try to find tazo names in the description and match to IDs
  let actorId: string | undefined
  let targetId: string | undefined

  // Find the first name that matches (usually the actor)
  const allNames = [...playerTazos.map(t => t.name), ...opponentTazos.map(t => t.name)]
    .sort((a, b) => b.length - a.length) // Try longer names first to avoid partial matches

  const foundNames: string[] = []
  for (const name of allNames) {
    if (desc.includes(name)) {
      foundNames.push(name)
    }
  }

  if (foundNames.length >= 1) {
    const firstName = foundNames[0]
    actorId = nameToId.get(firstName)
  }
  if (foundNames.length >= 2) {
    const secondName = foundNames[1]
    targetId = nameToId.get(secondName)
  }

  // Fallback: if we couldn't find names, pick based on actor side
  if (!actorId && actor) {
    const sideTazos = actor === 'player' ? playerTazos : opponentTazos
    const otherSideTazos = actor === 'player' ? opponentTazos : playerTazos
    // Pick the first alive tazo from the actor's side
    actorId = sideTazos.find(t => t.currentHp > 0)?.id || sideTazos[0]?.id
    targetId = otherSideTazos.find(t => t.currentHp > 0)?.id || otherSideTazos[0]?.id
  }

  // Final fallback for ring-out events where the tazo is being knocked out
  if (desc.includes('Ring-out') || desc.includes('knocked out')) {
    // The name in the description is the one being knocked out
    for (const name of foundNames) {
      const id = nameToId.get(name)
      if (id) {
        // This is the target (the one being knocked out)
        if (!targetId) targetId = id
      }
    }
  }

  return { actorId, targetId }
}

function mapBattleTazo(raw: Record<string, unknown>): BattleTazo {
  const franchise = raw.franchise as { name: string; slug: string; mechanic?: string | null } | undefined
  return {
    id: raw.id as string,
    name: raw.name as string,
    slug: '',
    franchiseId: '',
    collectionId: '',
    printedNumber: null,
    condition: 'good',
    physicalType: 'cardboard',
    combatType: (raw.combatType as string) || null,
    rarity: 'common',
    imageUrl: null,
    skill: null,
    skillDesc: null,
    evolutionFrom: null,
    evolutionTo: null,
    transformStage: null,
    transformOf: null,
    attack: (raw.attack as number) || 50,
    defense: (raw.defense as number) || 50,
    spin: (raw.spin as number) || 50,
    weight: (raw.weight as number) || 50,
    aura: (raw.aura as number) || 50,
    control: (raw.control as number) || 50,
    isOwned: false,
    battleWins: 0,
    battleLosses: 0,
    franchise: franchise ? { id: '', name: franchise.name, slug: franchise.slug, color: '', mechanic: franchise.mechanic } : undefined,
    collection: undefined,
    createdAt: '',
    updatedAt: '',
    currentHp: (raw.hp as number) || 0,
    maxHp: 100 + ((raw.defense as number) || 50),
    currentSpin: (raw.currentSpin as number) || 0,
    maxSpin: (raw.spin as number) || 50,
    kiCharge: (raw.ki as number) || undefined,
    isEvolved: false,
    isTransformed: false,
  }
}
