// ============================================================
// Trading Tazos Game — Battle Arena Canvas 2D
// Renders the battle arena, tazos, throw trajectory, and impacts.
// ============================================================
"use client"

import { useRef, useEffect, useCallback } from "react"
import type { BattleState, BattleFieldTazo, ArenaConfig } from "@/lib/battle"

interface Props {
  state: BattleState
  highlightId?: string | null
  onArenaClick?: (x: number, y: number) => void
  interactive?: boolean
}

const COLORS: Record<string, { fill: string; stroke: string }> = {
  pokemon: { fill: "#FFCB05", stroke: "#E3350D" },
  digimon: { fill: "#00A1E9", stroke: "#0057B7" },
  dbz: { fill: "#FF6B00", stroke: "#CC4400" },
  default: { fill: "#6366F1", stroke: "#4338CA" },
}

export default function BattleArenaCanvas({ state, highlightId, onArenaClick, interactive = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = rect.height
    const arena = state.arena
    const scaleX = W / 600
    const scaleY = H / 600
    const scale = Math.min(scaleX, scaleY)
    const offsetX = (W - 600 * scale) / 2
    const offsetY = (H - 600 * scale) / 2

    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = "#1a1a2e"
    ctx.fillRect(0, 0, W, H)

    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)

    // Arena outer ring
    ctx.beginPath()
    ctx.arc(arena.centerX, arena.centerY, arena.radius + 8, 0, Math.PI * 2)
    ctx.fillStyle = "#2d2d44"
    ctx.fill()

    // Arena circle
    ctx.beginPath()
    ctx.arc(arena.centerX, arena.centerY, arena.radius, 0, Math.PI * 2)
    ctx.fillStyle = "#16213e"
    ctx.fill()
    ctx.strokeStyle = "#3d3d5c"
    ctx.lineWidth = 3
    ctx.stroke()

    // Center crosshair
    ctx.beginPath()
    ctx.moveTo(arena.centerX - 15, arena.centerY)
    ctx.lineTo(arena.centerX + 15, arena.centerY)
    ctx.moveTo(arena.centerX, arena.centerY - 15)
    ctx.lineTo(arena.centerX, arena.centerY + 15)
    ctx.strokeStyle = "#ffffff22"
    ctx.lineWidth = 1
    ctx.stroke()

    // Inner ring
    ctx.beginPath()
    ctx.arc(arena.centerX, arena.centerY, arena.radius * 0.3, 0, Math.PI * 2)
    ctx.strokeStyle = "#ffffff11"
    ctx.lineWidth = 1
    ctx.setLineDash([4, 8])
    ctx.stroke()
    ctx.setLineDash([])

    // Draw field tazos
    const allFieldTazos = [
      ...state.player.field.filter(t => t.state === "on_field"),
      ...state.opponent.field.filter(t => t.state === "on_field"),
      ...state.player.hand.filter(t => t.state !== "in_hand" && t.state !== "captured"),
      ...state.opponent.hand.filter(t => t.state !== "in_hand" && t.state !== "captured"),
    ]

    for (const tazo of allFieldTazos) {
      drawTazoOnField(ctx, tazo, highlightId, arena)
    }

    // Draw throw trajectory if there's a recent throw
    const lastTurn = state.turns[state.turns.length - 1]
    if (lastTurn?.throwResult && lastTurn.selectedTazoId) {
      const thrower = allFieldTazos.find(t => t.id === lastTurn.selectedTazoId)
        ?? state.player.hand.find(t => t.id === lastTurn.selectedTazoId)
        ?? state.opponent.hand.find(t => t.id === lastTurn.selectedTazoId)

      if (thrower) {
        const startX = lastTurn.playerId === "player" ? arena.centerX - arena.radius - 30 : arena.centerX + arena.radius + 30
        const startY = arena.centerY

        // Trajectory line
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.quadraticCurveTo(
          (startX + lastTurn.throwResult.finalX) / 2,
          startY - 80,
          lastTurn.throwResult.finalX,
          lastTurn.throwResult.finalY,
        )
        ctx.strokeStyle = lastTurn.playerId === "player" ? "#FFCB0588" : "#E3350D88"
        ctx.lineWidth = 3
        ctx.setLineDash([8, 4])
        ctx.stroke()
        ctx.setLineDash([])

        // Impact points
        for (const collision of lastTurn.collisionEvents) {
          const target = allFieldTazos.find(t => t.id === collision.targetTazoId)
          if (target) {
            ctx.beginPath()
            ctx.arc(target.physics.x, target.physics.y, target.physics.radius + 6, 0, Math.PI * 2)
            ctx.strokeStyle = collision.outcome === "flip" ? "#22C55E" :
              collision.outcome === "ring_out" ? "#E3350D" : "#F59E0B"
            ctx.lineWidth = 2
            ctx.stroke()

            if (collision.outcome === "flip") {
              ctx.fillStyle = "#22C55E44"
              ctx.fill()
            }
          }
        }
      }
    }

    // Penalty placement indicator (reads lang from DOM attribute)
    if (state.phase === "opponent_place_penalty" && state.pendingPlacementTazoId) {
      const lang = document.documentElement.lang || "en"
      ctx.save()
      ctx.fillStyle = "#F59E0B88"
      ctx.fillRect(0, 0, 600, 600)
      ctx.fillStyle = "#F59E0B"
      ctx.font = "bold 16px Arial Black, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(lang === "es" ? "COLOCAR TAZO" : lang === "pt" ? "COLOCAR TAZO" : lang === "de" ? "TAZO PLATZIEREN" : lang === "fr" ? "PLACER TAZO" : lang === "it" ? "PIAZZA TAZO" : lang === "ja" ? "タゾスを配置" : lang === "ko" ? "타조스 배치" : lang === "zh" ? "放置塔佐斯" : lang === "ru" ? "РАЗМЕСТИТЬ" : "PLACE TAZO", arena.centerX, arena.centerY - 20)
      ctx.font = "12px Arial, sans-serif"
      ctx.fillText(lang === "es" ? "Haz clic dentro de la arena" : lang === "pt" ? "Clique dentro da arena" : lang === "de" ? "Klicke in die Arena" : lang === "fr" ? "Clique dans l'arene" : lang === "it" ? "Clicca dentro l'arena" : lang === "ja" ? "アリーナ内をクリック" : lang === "ko" ? "아레나 내부 클릭" : lang === "zh" ? "点击竞技场内" : lang === "ru" ? "Нажми внутрь арены" : "Click inside the arena", arena.centerX, arena.centerY + 10)
      ctx.restore()
    }

    ctx.restore()
  }, [state, highlightId])

  useEffect(() => {
    draw()
    animRef.current = requestAnimationFrame(() => draw())
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !onArenaClick || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const W = rect.width
    const H = rect.height
    const scale = Math.min(W / 600, H / 600)
    const offsetX = (W - 600 * scale) / 2
    const offsetY = (H - 600 * scale) / 2

    const arenaX = (e.clientX - rect.left - offsetX) / scale
    const arenaY = (e.clientY - rect.top - offsetY) / scale

    onArenaClick(arenaX, arenaY)
  }, [interactive, onArenaClick])

  return (
    <canvas
      ref={canvasRef}
      className="w-full aspect-square rounded-lg border-2 border-[#1a1a1a]"
      style={{ boxShadow: "4px 4px 0px #1a1a1a", cursor: interactive ? "crosshair" : "default" }}
      onClick={handleClick}
    />
  )
}

function drawTazoOnField(
  ctx: CanvasRenderingContext2D,
  tazo: BattleFieldTazo,
  highlightId: string | null | undefined,
  arena: ArenaConfig,
) {
  const { x, y, radius, face, isStacked, stackLevel } = tazo.physics
  const colors = COLORS[tazo.franchise] || COLORS.default

  // Shadow
  ctx.beginPath()
  ctx.arc(x + 2, y + 2, radius, 0, Math.PI * 2)
  ctx.fillStyle = "#00000044"
  ctx.fill()

  // Disc body
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  const grad = ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius)
  grad.addColorStop(0, colors.fill + "FF")
  grad.addColorStop(1, colors.stroke + "CC")
  ctx.fillStyle = grad
  ctx.fill()

  // Ring
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.strokeStyle = face === "back" ? "#666" : colors.stroke
  ctx.lineWidth = 2.5
  ctx.stroke()

  // Inner ring
  ctx.beginPath()
  ctx.arc(x, y, radius - 4, 0, Math.PI * 2)
  ctx.strokeStyle = "#ffffff33"
  ctx.lineWidth = 1
  ctx.stroke()

  // Face indicator
  if (face === "back") {
    ctx.fillStyle = "#00000055"
    ctx.fill()
  }

  // Name initial
  ctx.fillStyle = "white"
  ctx.font = `bold ${Math.max(10, radius * 0.55)}px Arial Black, sans-serif`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(tazo.name.charAt(0), x, y)

  // Stack indicator
  if (isStacked && stackLevel > 0) {
    ctx.fillStyle = "#F59E0B"
    ctx.font = "bold 10px Arial, sans-serif"
    ctx.fillText(`x${stackLevel + 1}`, x + radius + 12, y)
  }

  // Highlight
  if (highlightId === tazo.id) {
    ctx.beginPath()
    ctx.arc(x, y, radius + 5, 0, Math.PI * 2)
    ctx.strokeStyle = "#FFCC00"
    ctx.lineWidth = 3
    ctx.setLineDash([4, 2])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Owner indicator
  if (tazo.owner === "player") {
    ctx.beginPath()
    ctx.arc(x + radius * 0.7, y - radius * 0.7, 6, 0, Math.PI * 2)
    ctx.fillStyle = "#3B82F6"
    ctx.fill()
    ctx.strokeStyle = "white"
    ctx.lineWidth = 1
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(x + radius * 0.7, y - radius * 0.7, 6, 0, Math.PI * 2)
    ctx.fillStyle = "#E3350D"
    ctx.fill()
    ctx.strokeStyle = "white"
    ctx.lineWidth = 1
    ctx.stroke()
  }
}
