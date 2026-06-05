"use client"

import { useEffect, useRef, useCallback } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  opacity: number
  shape: "square" | "circle" | "star"
}

const COLORS = [
  "#FFCC00", "#E3350D", "#3B4CCA", "#22C55E", "#F59E0B",
  "#A855F7", "#EC4899", "#00A4EF", "#1a1a1a",
]

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export default function ConfettiBurst({ active = false }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const frameRef = useRef<number>(0)
  const activeRef = useRef(active)

  // Keep ref in sync without triggering re-render
  useEffect(() => { activeRef.current = active }, [active])

  const createParticles = useCallback(() => {
    const w = window.innerWidth
    const h = window.innerHeight
    const cx = w / 2
    const cy = h * 0.35
    const count = 80

    const particles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const angle = randomBetween(0, Math.PI * 2)
      const speed = randomBetween(3, 10)
      particles.push({
        x: cx + randomBetween(-40, 40),
        y: cy + randomBetween(-20, 20),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randomBetween(2, 6),
        size: randomBetween(3, 8),
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: randomBetween(0, 360),
        rotationSpeed: randomBetween(-8, 8),
        opacity: 1,
        shape: (["square", "circle", "star"] as const)[Math.floor(Math.random() * 3)],
      })
    }
    return particles
  }, [])

  useEffect(() => {
    if (!active) {
      particlesRef.current = []
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    // Initialize particles
    particlesRef.current = createParticles()
    let startTime = performance.now()

    const drawStar = (cx: number, cy: number, r: number) => {
      const spikes = 5
      const outerR = r
      const innerR = r * 0.4
      let rot = (Math.PI / 2) * 3
      const step = Math.PI / spikes

      ctx.beginPath()
      for (let i = 0; i < spikes; i++) {
        const x1 = cx + Math.cos(rot) * outerR
        const y1 = cy + Math.sin(rot) * outerR
        ctx.lineTo(x1, y1)
        rot += step

        const x2 = cx + Math.cos(rot) * innerR
        const y2 = cy + Math.sin(rot) * innerR
        ctx.lineTo(x2, y2)
        rot += step
      }
      ctx.closePath()
    }

    const animate = () => {
      const elapsed = performance.now() - startTime
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      let alive = false
      for (const p of particlesRef.current) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15 // gravity
        p.vx *= 0.99 // air resistance
        p.rotation += p.rotationSpeed
        p.opacity = Math.max(0, 1 - elapsed / 2500)

        if (p.opacity > 0.01) {
          alive = true
          ctx.save()
          ctx.globalAlpha = p.opacity
          ctx.translate(p.x, p.y)
          ctx.rotate((p.rotation * Math.PI) / 180)
          ctx.fillStyle = p.color

          if (p.shape === "circle") {
            ctx.beginPath()
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
            ctx.fill()
          } else if (p.shape === "star") {
            drawStar(0, 0, p.size / 2)
            ctx.fill()
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
          }

          ctx.restore()
        }
      }

      if (alive && activeRef.current) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener("resize", resize)
    }
  }, [active, createParticles])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      aria-hidden="true"
    />
  )
}
