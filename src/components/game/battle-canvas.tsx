'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { BattleEvent, BattleTazo } from '@/lib/game/types'

// ─── Types ───────────────────────────────────────────────────────────
interface CanvasTazo {
  id: string
  name: string
  franchiseSlug: string
  franchiseColor: string
  combatType: string | null
  side: 'player' | 'opponent'
  x: number
  y: number
  baseX: number
  baseY: number
  radius: number
  rotation: number
  spinSpeed: number
  hp: number
  maxHp: number
  spin: number
  maxSpin: number
  ki: number
  attack: number
  defense: number
  weight: number
  aura: number
  control: number
  isEvolved: boolean
  isTransformed: boolean
  isAlive: boolean
  transformStage: string | null
  skill: string | null
  // Animation state
  shakeTimer: number
  glowTimer: number
  glowColor: string
  ringOutAnim: number // 0 = in ring, >0 = flying out
  knockoutAnim: number
  // Movement
  targetX: number
  targetY: number
  movingToCenter: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
  type: 'spark' | 'glow' | 'ring' | 'explosion' | 'trail' | 'ki' | 'star'
}

interface BattleCanvasProps {
  playerTazos: BattleTazo[]
  opponentTazos: BattleTazo[]
  events: BattleEvent[]
  isPlaying: boolean
  speed: number
  currentEventIndex: number
  onEventComplete: () => void
  onAllEventsComplete: () => void
}

// ─── Constants ───────────────────────────────────────────────────────
const FRANCHISE_COLORS: Record<string, string> = {
  pokemon: '#FFCB05',
  digimon: '#00A1E9',
  dbz: '#FF6B00',
}

const COMBAT_TYPE_COLORS: Record<string, string> = {
  fire: '#F08030', water: '#6890F0', grass: '#78C850', electric: '#F8D030',
  psychic: '#F85888', ghost: '#705898', dragon: '#7038F8', normal: '#A8A878',
  vaccine: '#4FC3F7', virus: '#E040FB', data: '#66BB6A',
  saiyan: '#FFD700', namekian: '#4CAF50', android: '#78909C', majin: '#E91E63', frieza: '#9C27B0',
}

const ARENA_PADDING = 0.1 // 10% padding around arena

// ─── Helper ──────────────────────────────────────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 128, g: 128, b: 128 }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function createCanvasTazo(
  tazo: BattleTazo,
  side: 'player' | 'opponent',
  index: number,
  centerX: number,
  centerY: number,
  arenaRadius: number
): CanvasTazo {
  const count = 3
  const spacing = arenaRadius * 0.3
  const offsetX = side === 'player' ? -arenaRadius * 0.45 : arenaRadius * 0.45
  const startY = -(count - 1) * spacing / 2
  const baseX = centerX + offsetX
  const baseY = centerY + startY + index * spacing

  const weightFactor = 0.7 + (tazo.weight / 100) * 0.6
  const baseRadius = arenaRadius * 0.09
  const radius = baseRadius * weightFactor

  return {
    id: tazo.id,
    name: tazo.name,
    franchiseSlug: tazo.franchise?.slug || '',
    franchiseColor: FRANCHISE_COLORS[tazo.franchise?.slug || ''] || '#888',
    combatType: tazo.combatType,
    side,
    x: baseX,
    y: baseY,
    baseX,
    baseY,
    radius,
    rotation: Math.random() * Math.PI * 2,
    spinSpeed: (tazo.currentSpin / tazo.maxSpin) * 0.15 + 0.02,
    hp: tazo.currentHp,
    maxHp: tazo.maxHp,
    spin: tazo.currentSpin,
    maxSpin: tazo.maxSpin,
    ki: tazo.ki || 0,
    attack: tazo.attack,
    defense: tazo.defense,
    weight: tazo.weight,
    aura: tazo.aura,
    control: tazo.control,
    isEvolved: tazo.isEvolved || false,
    isTransformed: tazo.isTransformed || false,
    isAlive: true,
    transformStage: tazo.transformStage,
    skill: tazo.skill || null,
    shakeTimer: 0,
    glowTimer: 0,
    glowColor: '#fff',
    ringOutAnim: 0,
    knockoutAnim: 0,
    targetX: baseX,
    targetY: baseY,
    movingToCenter: false,
  }
}

// ─── Main Component ──────────────────────────────────────────────────
export function BattleCanvas({
  playerTazos,
  opponentTazos,
  events,
  isPlaying,
  speed,
  currentEventIndex,
  onEventComplete,
  onAllEventsComplete,
}: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const canvasTazosRef = useRef<CanvasTazo[]>([])
  const particlesRef = useRef<Particle[]>([])
  const eventTimerRef = useRef<number>(0)
  const eventDurationRef = useRef<number>(1500) // ms per event
  const lastTimeRef = useRef<number>(0)
  const processedEventsRef = useRef<number>(0)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Size observer
  useEffect(() => {
    const container = canvasRef.current?.parentElement
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        setDimensions({ width: Math.floor(width), height: Math.floor(height) })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Initialize canvas tazos when props change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const w = dimensions.width
    const h = dimensions.height
    const centerX = w / 2
    const centerY = h / 2
    const arenaRadius = Math.min(w, h) * (0.5 - ARENA_PADDING)

    canvasTazosRef.current = [
      ...playerTazos.map((t, i) => createCanvasTazo(t, 'player', i, centerX, centerY, arenaRadius)),
      ...opponentTazos.map((t, i) => createCanvasTazo(t, 'opponent', i, centerX, centerY, arenaRadius)),
    ]
    processedEventsRef.current = 0
    particlesRef.current = []
    eventTimerRef.current = 0
  }, [playerTazos, opponentTazos, dimensions])

  // Process events
  const processEvent = useCallback((event: BattleEvent, canvasTazos: CanvasTazo[]) => {
    const findTazo = (id?: string) => {
      if (id) return canvasTazos.find(t => t.id === id)
      return undefined
    }
    const findAliveBySide = (side: 'player' | 'opponent') => canvasTazos.filter(t => t.side === side && t.isAlive)
    const findAnyBySide = (side: 'player' | 'opponent') => canvasTazos.find(t => t.side === side)

    // Helper: find tazo from event, with fallbacks
    const resolveActor = (): CanvasTazo | undefined => {
      const byId = findTazo(event.actorId)
      if (byId) return byId
      // Try matching name from description
      for (const t of canvasTazos) {
        if (event.description.includes(t.name) && t.isAlive) return t
      }
      // Fallback: first alive player tazo
      return findAliveBySide('player')[0] || findAnyBySide('player')
    }
    const resolveTarget = (actorSide: 'player' | 'opponent'): CanvasTazo | undefined => {
      const byId = findTazo(event.targetId)
      if (byId) return byId
      // Try matching name from description (exclude actor)
      const actor = resolveActor()
      for (const t of canvasTazos) {
        if (event.description.includes(t.name) && t.id !== actor?.id && t.isAlive) return t
      }
      // Fallback: first alive tazo from opposite side
      const oppSide = actorSide === 'player' ? 'opponent' : 'player'
      return findAliveBySide(oppSide)[0] || findAnyBySide(oppSide)
    }

    switch (event.type) {
      case 'collision':
      case 'attack': {
        const actor = resolveActor()
        const target = actor ? resolveTarget(actor.side) : undefined
        if (actor && target) {
          // Move actor toward target
          actor.movingToCenter = true
          actor.targetX = target.x
          actor.targetY = target.y
          actor.shakeTimer = 300
          target.shakeTimer = 500

          // Spawn collision sparks
          const sparkCount = 12
          for (let i = 0; i < sparkCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkCount + Math.random() * 0.5
            const spd = 2 + Math.random() * 4
            particlesRef.current.push({
              x: target.x,
              y: target.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              life: 600,
              maxLife: 600,
              color: actor.franchiseColor,
              size: 2 + Math.random() * 3,
              type: 'spark',
            })
          }

          // Update target HP
          if (event.damage) {
            target.hp = Math.max(0, target.hp - event.damage)
            target.glowTimer = 400
            target.glowColor = '#ff4444'
          }

          // Return actor to base after delay
          setTimeout(() => {
            actor.movingToCenter = false
            actor.targetX = actor.baseX
            actor.targetY = actor.baseY
          }, 400)
        }
        break
      }

      case 'spin_decay': {
        // Try to find the tazo by name in description, or apply to all alive tazos
        const found = canvasTazos.find(t => event.description.includes(t.name) && t.isAlive)
        if (found) {
          const match = event.description.match(/Spin: (\d+)/)
          if (match) {
            found.spin = parseInt(match[1])
            found.spinSpeed = (found.spin / found.maxSpin) * 0.15 + 0.01
          }
        } else {
          // Apply to all alive tazos that match
          for (const t of canvasTazos) {
            if (t.isAlive && event.description.includes(t.name)) {
              const match = event.description.match(/Spin: (\d+)/)
              if (match) {
                t.spin = parseInt(match[1])
                t.spinSpeed = (t.spin / t.maxSpin) * 0.15 + 0.01
              }
            }
          }
        }
        break
      }

      case 'ring_out': {
        const target = findTazo(event.targetId || event.actorId)
          || canvasTazos.find(t => event.description.includes(t.name) && t.isAlive)
        if (target) {
          target.isAlive = false
          target.ringOutAnim = 1
          target.hp = 0

          // Ring-out trail particles
          for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2
            particlesRef.current.push({
              x: target.x + Math.cos(angle) * 10,
              y: target.y + Math.sin(angle) * 10,
              vx: Math.cos(angle) * 3,
              vy: Math.sin(angle) * 3,
              life: 800,
              maxLife: 800,
              color: target.franchiseColor,
              size: 3 + Math.random() * 4,
              type: 'trail',
            })
          }
        }
        break
      }

      case 'knockout': {
        const target = findTazo(event.targetId || event.actorId)
          || canvasTazos.find(t => event.description.includes(t.name) && t.isAlive)
        if (target) {
          target.isAlive = false
          target.knockoutAnim = 1
          target.hp = 0

          // Knockout explosion
          for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2
            const spd = 1 + Math.random() * 6
            particlesRef.current.push({
              x: target.x,
              y: target.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              life: 1000,
              maxLife: 1000,
              color: i % 2 === 0 ? '#FFD700' : target.franchiseColor,
              size: 3 + Math.random() * 5,
              type: 'explosion',
            })
          }
        }
        break
      }

      case 'type_advantage': {
        const actor = findTazo(event.actorId)
          || canvasTazos.find(t => event.description.includes(t.name) && t.isAlive)
        if (actor) {
          const typeColor = COMBAT_TYPE_COLORS[actor.combatType || ''] || '#fff'
          actor.glowTimer = 800
          actor.glowColor = typeColor

          // Type advantage flash
          for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2
            particlesRef.current.push({
              x: actor.x,
              y: actor.y,
              vx: Math.cos(angle) * 2,
              vy: Math.sin(angle) * 2,
              life: 600,
              maxLife: 600,
              color: typeColor,
              size: 2 + Math.random() * 3,
              type: 'glow',
            })
          }
        }
        break
      }

      case 'evolution': {
        const actor = findTazo(event.actorId)
          || canvasTazos.find(t => event.description.includes(t.name) && t.isAlive)
        if (actor) {
          actor.isEvolved = true
          actor.glowTimer = 1200
          actor.glowColor = '#00FF88'
          actor.radius *= 1.15

          // Evolution glow-up particles
          for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2
            const dist = actor.radius * 0.5 + Math.random() * actor.radius
            particlesRef.current.push({
              x: actor.x + Math.cos(angle) * dist,
              y: actor.y + Math.sin(angle) * dist,
              vx: Math.cos(angle) * 1,
              vy: Math.sin(angle) * 1 - 0.5,
              life: 1000,
              maxLife: 1000,
              color: '#00FF88',
              size: 2 + Math.random() * 4,
              type: 'star',
            })
          }
        }
        break
      }

      case 'transform': {
        const actor = findTazo(event.actorId)
          || canvasTazos.find(t => event.description.includes(t.name) && t.isAlive)
        if (actor) {
          actor.isTransformed = true
          actor.glowTimer = 1500
          actor.glowColor = '#FFD700'
          actor.radius *= 1.1
          actor.attack += 20

          // DBZ ki aura explosion
          for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2
            const spd = 2 + Math.random() * 5
            particlesRef.current.push({
              x: actor.x,
              y: actor.y,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              life: 1200,
              maxLife: 1200,
              color: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FF6B00' : '#FFEB3B',
              size: 3 + Math.random() * 6,
              type: 'ki',
            })
          }
        }
        break
      }

      case 'skill': {
        const actor = findTazo(event.actorId)
          || canvasTazos.find(t => event.description.includes(t.name) && t.isAlive)
        if (actor) {
          actor.glowTimer = 600
          actor.glowColor = '#fff'

          // Skill flash
          for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2
            particlesRef.current.push({
              x: actor.x,
              y: actor.y,
              vx: Math.cos(angle) * 3,
              vy: Math.sin(angle) * 3,
              life: 500,
              maxLife: 500,
              color: '#ffffff',
              size: 2 + Math.random() * 3,
              type: 'spark',
            })
          }
        }
        break
      }

      case 'combo': {
        // Big combo effect
        const cx = dimensions.width / 2
        const cy = dimensions.height / 2
        for (let i = 0; i < 50; i++) {
          const angle = Math.random() * Math.PI * 2
          const spd = 1 + Math.random() * 5
          particlesRef.current.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            life: 1200,
            maxLife: 1200,
            color: ['#FFD700', '#FF6B00', '#00FF88', '#FF4444', '#6890F0'][i % 5],
            size: 3 + Math.random() * 6,
            type: 'star',
          })
        }
        break
      }
    }
  }, [dimensions])

  // ─── Render Loop ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    ctx.scale(dpr, dpr)

    let running = true
    lastTimeRef.current = performance.now()

    const render = (now: number) => {
      if (!running) return

      const rawDt = now - lastTimeRef.current
      const dt = Math.min(rawDt, 50) // cap delta
      lastTimeRef.current = now
      const speedMult = speed

      const w = dimensions.width
      const h = dimensions.height
      const cx = w / 2
      const cy = h / 2
      const arenaRadius = Math.min(w, h) * (0.5 - ARENA_PADDING)

      // ── Process pending events ──
      if (isPlaying && currentEventIndex < events.length && currentEventIndex >= processedEventsRef.current) {
        const event = events[currentEventIndex]
        if (processedEventsRef.current < currentEventIndex + 1) {
          processEvent(event, canvasTazosRef.current)
          processedEventsRef.current = currentEventIndex + 1
          eventTimerRef.current = 0
        }

        eventTimerRef.current += dt * speedMult
        if (eventTimerRef.current >= eventDurationRef.current) {
          eventTimerRef.current = 0
          onEventComplete()
          if (currentEventIndex + 1 >= events.length) {
            onAllEventsComplete()
          }
        }
      }

      // ── Clear ──
      ctx.clearRect(0, 0, w, h)

      // ── Background ──
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h))
      bgGrad.addColorStop(0, '#1a1a2e')
      bgGrad.addColorStop(0.5, '#16213e')
      bgGrad.addColorStop(1, '#0f0f1a')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      // ── Arena floor ──
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, arenaRadius, 0, Math.PI * 2)
      ctx.clip()

      // Floor gradient
      const floorGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, arenaRadius)
      floorGrad.addColorStop(0, '#2a2a3e')
      floorGrad.addColorStop(0.7, '#1e1e30')
      floorGrad.addColorStop(1, '#14142a')
      ctx.fillStyle = floorGrad
      ctx.fillRect(cx - arenaRadius, cy - arenaRadius, arenaRadius * 2, arenaRadius * 2)

      // Floor texture - concentric circles
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.lineWidth = 1
      for (let r = 20; r < arenaRadius; r += 20) {
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Center cross
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(cx - arenaRadius * 0.8, cy)
      ctx.lineTo(cx + arenaRadius * 0.8, cy)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx, cy - arenaRadius * 0.8)
      ctx.lineTo(cx, cy + arenaRadius * 0.8)
      ctx.stroke()

      ctx.restore()

      // ── Arena border ──
      ctx.strokeStyle = '#4a4a6a'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.arc(cx, cy, arenaRadius, 0, Math.PI * 2)
      ctx.stroke()

      // Glow on border
      ctx.strokeStyle = 'rgba(100, 100, 200, 0.3)'
      ctx.lineWidth = 12
      ctx.beginPath()
      ctx.arc(cx, cy, arenaRadius, 0, Math.PI * 2)
      ctx.stroke()

      // ── Side labels ──
      ctx.font = `bold ${Math.max(10, arenaRadius * 0.06)}px sans-serif`
      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(100, 200, 255, 0.5)'
      ctx.fillText('PLAYER', cx - arenaRadius * 0.45, cy - arenaRadius * 0.75)
      ctx.fillStyle = 'rgba(255, 100, 100, 0.5)'
      ctx.fillText('OPPONENT', cx + arenaRadius * 0.45, cy - arenaRadius * 0.75)

      // ── Update & Draw Tazos ──
      for (const tazo of canvasTazosRef.current) {
        // Update rotation
        if (tazo.isAlive) {
          tazo.rotation += tazo.spinSpeed * speedMult * (dt / 16)
        }

        // Smooth movement
        const moveSpeed = 0.05 * speedMult
        tazo.x = lerp(tazo.x, tazo.targetX, moveSpeed * (dt / 16))
        tazo.y = lerp(tazo.y, tazo.targetY, moveSpeed * (dt / 16))

        // Shake decay
        if (tazo.shakeTimer > 0) tazo.shakeTimer = Math.max(0, tazo.shakeTimer - dt * speedMult)
        // Glow decay
        if (tazo.glowTimer > 0) tazo.glowTimer = Math.max(0, tazo.glowTimer - dt * speedMult)

        // Ring-out animation
        if (tazo.ringOutAnim > 0) {
          const dir = tazo.side === 'player' ? -1 : 1
          tazo.x += dir * 3 * speedMult * (dt / 16)
          tazo.y += (Math.random() - 0.5) * 2
          tazo.rotation += 0.3 * speedMult * (dt / 16)
          tazo.ringOutAnim += dt * speedMult / 1000
        }

        // Knockout animation - fade + shrink
        if (tazo.knockoutAnim > 0 && tazo.knockoutAnim < 3) {
          tazo.knockoutAnim += dt * speedMult / 1000
        }

        // Draw
        const shakeX = tazo.shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0
        const shakeY = tazo.shakeTimer > 0 ? (Math.random() - 0.5) * 6 : 0
        const drawX = tazo.x + shakeX
        const drawY = tazo.y + shakeY
        const drawRadius = tazo.knockoutAnim > 0
          ? tazo.radius * Math.max(0, 1 - tazo.knockoutAnim / 3)
          : tazo.radius
        const drawAlpha = tazo.knockoutAnim > 0
          ? Math.max(0, 1 - tazo.knockoutAnim / 3)
          : tazo.ringOutAnim > 1.5
          ? Math.max(0, 1 - (tazo.ringOutAnim - 1.5))
          : 1

        if (drawAlpha <= 0 || drawRadius <= 0) continue

        ctx.save()
        ctx.globalAlpha = drawAlpha

        // Glow effect
        if (tazo.glowTimer > 0) {
          const glowAlpha = (tazo.glowTimer / 800) * 0.6
          const rgb = hexToRgb(tazo.glowColor)
          ctx.shadowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowAlpha})`
          ctx.shadowBlur = 30
        }

        // DBZ ki aura
        if (tazo.isTransformed && tazo.isAlive) {
          const auraPhase = now / 200
          for (let ring = 0; ring < 3; ring++) {
            const auraR = drawRadius + 8 + ring * 6 + Math.sin(auraPhase + ring) * 3
            const alpha = 0.15 - ring * 0.04
            ctx.beginPath()
            ctx.arc(drawX, drawY, auraR, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`
            ctx.lineWidth = 3 - ring
            ctx.stroke()
          }
        }

        // Evolution glow
        if (tazo.isEvolved && tazo.isAlive) {
          const evoPhase = now / 300
          const evoR = drawRadius + 6 + Math.sin(evoPhase) * 2
          ctx.beginPath()
          ctx.arc(drawX, drawY, evoR, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(0, 255, 136, 0.25)'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // Disc body
        ctx.beginPath()
        ctx.arc(drawX, drawY, drawRadius, 0, Math.PI * 2)

        // Gradient fill based on franchise
        const grad = ctx.createRadialGradient(
          drawX - drawRadius * 0.3,
          drawY - drawRadius * 0.3,
          drawRadius * 0.1,
          drawX,
          drawY,
          drawRadius
        )
        const fRgb = hexToRgb(tazo.franchiseColor)
        grad.addColorStop(0, `rgba(${Math.min(255, fRgb.r + 80)}, ${Math.min(255, fRgb.g + 80)}, ${Math.min(255, fRgb.b + 80)}, 1)`)
        grad.addColorStop(0.5, tazo.franchiseColor)
        grad.addColorStop(1, `rgba(${Math.max(0, fRgb.r - 60)}, ${Math.max(0, fRgb.g - 60)}, ${Math.max(0, fRgb.b - 60)}, 1)`)
        ctx.fillStyle = grad
        ctx.fill()

        // Disc border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.lineWidth = 2
        ctx.stroke()

        // Spinning pattern (rotating lines)
        ctx.save()
        ctx.translate(drawX, drawY)
        ctx.rotate(tazo.rotation)
        ctx.beginPath()
        ctx.arc(0, 0, drawRadius * 0.85, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Cross pattern
        for (let a = 0; a < 4; a++) {
          const angle = (a * Math.PI) / 2
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(Math.cos(angle) * drawRadius * 0.85, Math.sin(angle) * drawRadius * 0.85)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Center circle
        ctx.beginPath()
        ctx.arc(0, 0, drawRadius * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.restore()

        // Character initial
        const fontSize = Math.max(10, drawRadius * 0.5)
        ctx.font = `bold ${fontSize}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 3
        ctx.fillText(tazo.name.charAt(0).toUpperCase(), drawX, drawY)
        ctx.shadowBlur = 0

        // Name below disc
        const nameFontSize = Math.max(8, drawRadius * 0.28)
        ctx.font = `bold ${nameFontSize}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = tazo.side === 'player' ? 'rgba(100, 200, 255, 0.8)' : 'rgba(255, 120, 120, 0.8)'
        ctx.fillText(tazo.name, drawX, drawY + drawRadius + 4)

        // Health bar
        if (tazo.isAlive) {
          const barW = drawRadius * 2
          const barH = 4
          const barX = drawX - drawRadius
          const barY = drawY + drawRadius + nameFontSize + 6
          const hpPct = Math.max(0, tazo.hp / tazo.maxHp)

          // Background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
          ctx.fillRect(barX, barY, barW, barH)

          // HP fill
          const hpColor = hpPct > 0.5 ? '#4CAF50' : hpPct > 0.25 ? '#FF9800' : '#F44336'
          ctx.fillStyle = hpColor
          ctx.fillRect(barX, barY, barW * hpPct, barH)

          // Border
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
          ctx.lineWidth = 0.5
          ctx.strokeRect(barX, barY, barW, barH)
        }

        ctx.restore()
      }

      // ── Update & Draw Particles ──
      const newParticles: Particle[] = []
      for (const p of particlesRef.current) {
        p.life -= dt * speedMult
        if (p.life <= 0) continue

        p.x += p.vx * speedMult * (dt / 16)
        p.y += p.vy * speedMult * (dt / 16)
        p.vy += 0.05 * speedMult * (dt / 16) // gravity
        p.vx *= 0.98 // friction

        const lifeRatio = p.life / p.maxLife
        const alpha = lifeRatio
        const rgb = hexToRgb(p.color)

        ctx.save()
        ctx.globalAlpha = alpha

        switch (p.type) {
          case 'spark':
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
            break

          case 'glow':
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.5})`
            ctx.fill()
            break

          case 'ring': {
            const ringRadius = p.size * (1 - lifeRatio) * 20
            ctx.beginPath()
            ctx.arc(p.x, p.y, ringRadius, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.5})`
            ctx.lineWidth = 2
            ctx.stroke()
            break
          }

          case 'explosion':
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2)
            ctx.fill()
            break

          case 'trail':
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.6})`
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2)
            ctx.fill()
            break

          case 'ki':
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.7})`
            ctx.shadowColor = p.color
            ctx.shadowBlur = 8
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size * lifeRatio, 0, Math.PI * 2)
            ctx.fill()
            ctx.shadowBlur = 0
            break

          case 'star': {
            ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.8})`
            ctx.translate(p.x, p.y)
            ctx.rotate(p.life / 200)
            const s = p.size * lifeRatio
            ctx.fillRect(-s / 2, -s / 2, s, s)
            break
          }
        }

        ctx.restore()
        newParticles.push(p)
      }
      particlesRef.current = newParticles

      // ── Arena center pulse ──
      if (isPlaying) {
        const pulse = Math.sin(now / 500) * 0.15 + 0.15
        ctx.beginPath()
        ctx.arc(cx, cy, arenaRadius * 0.05, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`
        ctx.fill()
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    animFrameRef.current = requestAnimationFrame(render)

    return () => {
      running = false
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [dimensions, isPlaying, speed, currentEventIndex, events, processEvent, onEventComplete, onAllEventsComplete])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  )
}
