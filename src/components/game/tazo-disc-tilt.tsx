"use client"

// ═══════════════════════════════════════════════════════════════
// TazoDiscTilt — Mouse-tracking 3D tilt for tazo discs
//
// Tracks mouse position over the disc container and applies
// rotateX/rotateY transforms + CSS variables (--tilt-lx, --tilt-ly,
// --tilt-intensity) for dynamic finish effects (holo, foil,
// prismatic, glossy) defined in tazo-finishes.css.
//
// Shared between /app/collection and /app/shop reveal stages.
// ═══════════════════════════════════════════════════════════════

import { useRef, useState, useCallback } from "react"

export default function TazoDiscTilt({
  children,
  isFlipped = false,
  wear = 0,
  maxDeg = 18,
  perspective = 700,
  className = "",
  background = "var(--ttg-cream)",
}: {
  children: React.ReactNode
  isFlipped?: boolean
  wear?: number
  maxDeg?: number
  perspective?: number
  className?: string
  background?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [angles, setAngles] = useState({ rx: 0, ry: 0, hovering: false, lx: 0.5, ly: 0.3 })

  const onMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const nx = (e.clientX - cx) / (rect.width / 2)
    const ny = (e.clientY - cy) / (rect.height / 2)
    setAngles({
      rx: -ny * maxDeg,
      ry: nx * maxDeg,
      hovering: true,
      lx: (nx + 1) / 2,
      ly: (ny + 1) / 2,
    })
  }, [maxDeg])

  const onLeave = useCallback(() => {
    setAngles({ rx: 0, ry: 0, hovering: false, lx: 0.5, ly: 0.3 })
  }, [])

  const fx = angles.rx.toFixed(2)
  const fy = angles.ry.toFixed(2)
  const isTransitioning = !angles.hovering

  // For damaged tazos, reduce tilt
  const tiltDampen = wear >= 70 ? 0.35 : wear >= 40 ? 0.65 : 1.0

  const cssVars = {
    "--tilt-lx": `${(angles.lx * 100).toFixed(0)}%`,
    "--tilt-ly": `${(angles.ly * 100).toFixed(0)}%`,
    "--tilt-intensity": angles.hovering ? "1" : "0",
  } as React.CSSProperties

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`flex items-center justify-center ${className}`}
      style={{
        aspectRatio: "1",
        perspective: `${perspective}px`,
        cursor: isFlipped ? "pointer" : "grab",
        background,
        ...cssVars,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: `perspective(${perspective}px) rotateX(${fx}deg) rotateY(${fy}deg) scale(${angles.hovering ? 1.04 : 1})`,
          transition: isTransitioning
            ? "transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)"
            : "transform 0.08s ease-out",
          filter: tiltDampen < 1 ? `brightness(${0.9 + tiltDampen * 0.1})` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}
