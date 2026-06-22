// ============================================================
// Trading Tazos Game — Arena Floor
// Canvas-rendered wood surface with center circle and guide rings.
// ============================================================
"use client"

import { useMemo } from "react"
import * as THREE from "three"
import type { Arena3DConfig } from "@/lib/battle/game-loop"
import { THEME_COLORS } from "./ArenaTheme"

export function ArenaFloor({ config }: { config: Arena3DConfig }) {
  const theme = THEME_COLORS[config.theme || "default"] || THEME_COLORS.default
  const tex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 1024; c.height = 1024
    const ctx = c.getContext("2d")!
    // Warm wood radial gradient
    const g = ctx.createRadialGradient(512, 512, 20, 512, 512, 550)
    g.addColorStop(0, theme.floor[0]); g.addColorStop(0.45, theme.floor[1])
    g.addColorStop(0.75, theme.floor[2]); g.addColorStop(0.92, theme.floor[3])
    g.addColorStop(1, theme.floor[4])
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 1024)
    // Grain texture
    ctx.fillStyle = "rgba(0,0,0,0.02)"
    for (let i = 0; i < 600; i++) {
      ctx.fillRect(Math.random()*1024, Math.random()*1024, 2, 2)
    }
    // Outer circle (ammonite)
    ctx.strokeStyle = theme.pillar; ctx.lineWidth = 20
    ctx.beginPath(); ctx.arc(512, 512, config.radius * 48, 0, Math.PI * 2); ctx.stroke()
    // Inner gold ring
    ctx.strokeStyle = theme.accent; ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(512, 512, config.radius * 48 - 10, 0, Math.PI * 2); ctx.stroke()
    // Dark outline
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(512, 512, config.radius * 48 + 10, 0, Math.PI * 2); ctx.stroke()
    // Concentric guide rings (faint)
    ctx.strokeStyle = "rgba(0,0,0,0.03)"; ctx.lineWidth = 1.5
    for (let r = 80; r < config.radius * 42; r += 80) {
      ctx.beginPath(); ctx.arc(512, 512, r, 0, Math.PI * 2); ctx.stroke()
    }
    // Center dot
    ctx.fillStyle = theme.accent + "66"; ctx.beginPath()
    ctx.arc(512, 512, 18, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.beginPath()
    ctx.arc(512, 512, 6, 0, Math.PI * 2); ctx.fill()
    // Stake position marks
    ctx.fillStyle = theme.accent + "44"; ctx.beginPath()
    ctx.arc(512 - config.radius * 26, 512, 10, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = theme.accent + "44"; ctx.beginPath()
    ctx.arc(512 + config.radius * 26, 512, 8, 0, Math.PI*2); ctx.fill()
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter
    return t
  }, [config.radius, config.theme])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[config.radius * 2.6, config.radius * 2.6]} />
      <meshStandardMaterial map={tex} roughness={0.55} metalness={0.03} />
    </mesh>
  )
}
