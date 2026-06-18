// ============================================================
// Trading Tazos Game — BagOpener3D v11
//
// Drag-to-tear over the TOP SEAL (not the whole bag).
// Tear progress passes to PotatoChipBag3D for visual animation.
// Clean opening experience: tear → glow → reveal.
// ============================================================
"use client"

import { useRef, useState, useMemo, useCallback, useEffect, Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import PotatoChipBag3D, { BAG_H } from "./3d/potato-chip-bag-3d"
import { pickBagVariant } from "@/lib/bag-variants"
import { playSFX } from "@/lib/audio/sfx-engine"

// ══════════════════════════════════════════════════════════
// CAMERA — gentle auto-orbit when idle
// ══════════════════════════════════════════════════════════
function BagCamera({ interacting, opening }: { interacting: boolean; opening: boolean }) {
  const { camera } = useThree()
  const targetRef = useRef({ z: 1.85, y: 0.0, shake: 0 })
  const shakeRef = useRef(0)

  useFrame((state, delta) => {
    if (opening) {
      // Cinematic zoom-in + screen shake during opening
      shakeRef.current = Math.max(0, shakeRef.current - delta * 4)
      const s = shakeRef.current * 0.018
      targetRef.current = { z: 1.48, y: 0.08, shake: 0 }
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, Math.sin(state.clock.elapsedTime * 30) * s, 5 * delta)
    } else if (interacting) {
      targetRef.current = { z: 2.0, y: 0.0, shake: 0 }
    } else {
      const t = state.clock.elapsedTime
      targetRef.current = {
        z: 1.85 + Math.sin(t * 0.3) * 0.06,
        y: Math.cos(t * 0.25) * 0.03,
        shake: 0,
      }
    }

    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetRef.current.z, 2.5 * delta)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetRef.current.y, 2.5 * delta)
    if (!opening) {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 3 * delta)
    }
    camera.lookAt(0, 0, 0)
  })

  return null
}


// ══════════════════════════════════════════════════════════
// PARTICLE BURST — cinematic opening effect
// ══════════════════════════════════════════════════════════
function ParticleBurst({ color, active }: { color: string; active: boolean }) {
  const particles = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const angle = (i / 28) * Math.PI * 2
      const dist = 60 + Math.random() * 120
      const size = 3 + Math.random() * 5
      const delay = Math.random() * 0.15
      return { id: i, angle, dist, size, delay }
    })
  }, [])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      <AnimatePresence>
        {active && particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size, height: p.size,
              left: "50%", top: "50%",
              backgroundColor: `${color}d0`,
              boxShadow: `0 0 ${p.size * 2}px ${color}80`,
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(p.angle) * p.dist,
              y: Math.sin(p.angle) * p.dist - 30,
              opacity: 0,
              scale: 0.2,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, delay: p.delay, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════
export interface BagData { id: string; bagType?: string; preview?: { franchise?: { slug?: string } } | null }

export default function BagOpener3D({ bag, frontUrl: propFrontUrl, backUrl: propBackUrl, bagColor: propBagColor, onOpen }: {
  bag: BagData | null
  frontUrl?: string
  backUrl?: string
  bagColor?: string
  onOpen: () => void
}) {
  const { frontUrl: variantFront, backUrl: variantBack, franchise } = useMemo(() => {
    const slug = bag?.preview?.franchise?.slug
    return pickBagVariant(slug)
  }, [bag])
  const frontUrl = propFrontUrl || variantFront
  const backUrl = propBackUrl || variantBack

  const [stage, setStage] = useState<"idle" | "tearing" | "opening" | "reveal">("idle")
  const [tearProgress, setTearProgress] = useState(0)
  const [particlesActive, setParticlesActive] = useState(false)
  const tearPaths = useRef<{ x: number; y: number }[]>([])
  const tearing = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasH, setCanvasH] = useState(500)
  const [bagScale, setBagScale] = useState(1.15)

  // Adaptive canvas + scale
  useEffect(() => {
    const update = () => {
      const w = containerRef.current?.clientWidth || 500
      const vh = window.innerHeight
      const maxH = Math.min(vh * 0.5, 540)
      const h = Math.min(maxH, Math.max(400, w * 0.88))
      setCanvasH(h)
      setBagScale(Math.min(1.25, Math.max(0.95, h / 440)))
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const franchiseColor = useMemo(() => {
    const c: Record<string, string> = { minimon: "var(--ttg-yellow)", cybermon: "var(--ttg-rarity-rare)", dracobell: "var(--ttg-dracobell)" }
    return c[franchise] || "var(--ttg-yellow)"
  }, [franchise])

  // ═══ Tear constraint: only top 25% of bag (the seal area) ═══
  const isSealArea = useCallback((uv: { x: number; y: number }): boolean => {
    // UV.y goes from 0 (bottom) to 1 (top) in the BAG_H space
    // Top seal is approximately the top ~15% of the bag
    return uv.y > 0.78
  }, [])

  // ── Tear handlers ──
  const handlePointerDown = useCallback(() => {
    if (stage === "opening" || stage === "reveal") return
    tearing.current = true; tearPaths.current = []
    setStage("tearing"); setTearProgress(0)
    playSFX('bag_tear', { volume: 0.35 })
  }, [stage])

  const handlePointerMove = useCallback((e: THREE.Event) => {
    if (!tearing.current || stage !== "tearing") return
    const uv = (e as any).uv; if (!uv) return

    // Only count seal-area movements
    if (!isSealArea(uv)) return

    const x = (uv.x - 0.5) * BAG_H
    const y = (uv.y - 0.5) * BAG_H
    tearPaths.current.push({ x, y })
    const pts = tearPaths.current
    if (pts.length >= 4) {
      const xspan = Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x))
      const yspan = Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y))
      const p = Math.min(1, xspan * 3.0 + yspan * 0.3)
      setTearProgress(p)
      if (p >= 0.92) {
        tearing.current = false; setTearProgress(1)
        playSFX('bag_open', { volume: 0.65 })
        setTimeout(() => setStage("opening"), 150)
      }
    }
  }, [stage, isSealArea])

  const handlePointerUp = useCallback(() => {
    tearing.current = false
    if (tearPaths.current.length < 4 && stage === "tearing") {
      setTearProgress(0); setStage("idle")
    }
  }, [stage])

  const handleSkip = useCallback(() => {
    tearing.current = false; setTearProgress(1)
    playSFX('bag_open', { volume: 0.55 })
    setStage("opening")
  }, [])

  const isOpening = stage === "opening" || stage === "reveal"

  // Auto-open after animation completes
  // ⚠️ Two separate effects to prevent race condition:
  //    Effect A: visual transition (opening → reveal after 800ms)
  //    Effect B: API call trigger (reveal → onOpen after 100ms)
  //    Keeping them separate prevents the outer effect's cleanup
  //    from killing the inner timer, which was the root cause of
  //    the "freeze on opening" bug.
  useEffect(() => {
    if (stage === "opening") {
      const t = setTimeout(() => {
        setStage("reveal")
        setParticlesActive(true)
        setTimeout(() => setParticlesActive(false), 900)
        playSFX('reveal', { volume: 0.6 })
      }, 800)
      return () => clearTimeout(t)
    }
  }, [stage])

  useEffect(() => {
    if (stage === "reveal") {
      const t = setTimeout(() => onOpen(), 100)
      return () => clearTimeout(t)
    }
  }, [stage, onOpen])



  return (
    <div ref={containerRef} className="relative w-full select-none touch-none" style={{ height: canvasH }}>
      {/* Particle burst */}
      <ParticleBurst color={franchiseColor} active={particlesActive} />

      {/* Seal area glow indicator — shows where to drag, fades when interacting */}
      {stage === 'idle' && (
        <div className="absolute top-[18%] left-[15%] right-[15%] z-15 pointer-events-none">
          <div className="h-0.5 rounded-full animate-pulse"
            style={{
              background: `linear-gradient(90deg, transparent, ${franchiseColor}60, ${franchiseColor}c0, ${franchiseColor}60, transparent)`,
              boxShadow: `0 0 12px ${franchiseColor}40`,
            }} />
        </div>
      )}

      {/* Flash overlay on open */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          opacity: stage === "opening" || stage === "reveal" ? 1 : 0,
          transition: "opacity 400ms ease-out",
          background: `radial-gradient(ellipse at 50% 45%, ${franchiseColor}80 0%, ${franchiseColor}30 35%, transparent 75%)`,
        }}
      />

      <Canvas
        camera={{ position: [0, 0, 1.85], fov: 36 }}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }}
      >
        <BagCamera interacting={stage === "tearing"} opening={isOpening} />

        {/* ═══ 3-point lighting ═══ */}
        {/* Key — main front-upper spot */}
        <spotLight position={[2.5, 3.5, 4]} intensity={3.5} angle={0.35} penumbra={0.4} color="#fffef8" />
        {/* Fill — softer lower-front */}
        <pointLight position={[0, 0.5, 2.5]} intensity={0.85} color="#fff5e8" />
        {/* Rim — subtle back edge light for depth */}
        <directionalLight position={[-1.5, 0.5, -3]} intensity={0.55} color="#e8d5c0" />
        {/* Ambient */}
        <ambientLight intensity={0.82} color="#fffaf5" />

        <Suspense fallback={null}>
          <PotatoChipBag3D
            frontUrl={frontUrl} backUrl={backUrl} bagColor={propBagColor} scale={bagScale}
            interactive={stage === "idle" || stage === "tearing"} opening={isOpening}
            tearProgress={tearProgress}
            onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
          />
        </Suspense>
      </Canvas>

      {/* ═══ UI OVERLAY ═══ */}
      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3 z-10 px-4">
        {stage === "idle" && (
          <div className="flex flex-col items-center gap-3">
            <div
              className="px-6 py-2 font-black text-[10px] sm:text-xs uppercase tracking-[0.1em] border-[3px] cursor-pointer active:scale-95 transition-transform"
              style={{ backgroundColor: franchiseColor, color: "var(--ttg-black)", borderColor: "var(--ttg-black)", boxShadow: "3px 3px 0px var(--ttg-black)" }}
            >
              ✂ DRAG ACROSS TOP SEAL TO OPEN
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleSkip() }}
              className="px-4 py-1.5 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.1em] border-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
              style={{
                background: "var(--ttg-black)",
                color: franchiseColor,
                borderColor: franchiseColor,
                boxShadow: `0 0 12px ${franchiseColor}40`,
              }}
            >
              ⚡ OPEN NOW
            </button>
          </div>
        )}
        {stage === "tearing" && (
          <div className="flex items-center gap-2.5 w-full max-w-[280px]">
            <div className="flex-1">
              <div className="h-2.5 bg-ttg-black/8 border border-ttg-black/8 overflow-hidden rounded-full">
                <div className="h-full transition-all duration-100 rounded-full"
                  style={{ width: `${Math.round(tearProgress * 100)}%`, background: `linear-gradient(90deg, ${franchiseColor}cc, ${franchiseColor})` }} />
              </div>
            </div>
            <span className="text-[10px] font-black text-ttg-black/35 tabular-nums w-7 text-right">{Math.round(tearProgress * 100)}</span>
            <button onClick={handleSkip}
              className="px-2.5 py-1 bg-ttg-black/5 border border-ttg-black/10 text-ttg-black/35 text-[9px] font-black uppercase hover:bg-ttg-black/10 hover:text-ttg-black/50 rounded-full transition-all">
              Skip
            </button>
          </div>
        )}
        {isOpening && (
          <div className="flex flex-col items-center gap-2">
            <div className="px-5 py-2.5 border-[3px] border-ttg-black shadow-[3px_3px_0px_var(--ttg-black)] animate-pulse"
              style={{ backgroundColor: `${franchiseColor}f0` }}>
              <span className="font-black text-[11px] text-ttg-black uppercase tracking-[0.15em]">Opening…</span>
            </div>
            {/* Particle burst rings */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute inset-0 animate-ping opacity-20"
                style={{
                  border: `3px solid ${franchiseColor}`,
                  borderRadius: "50%",
                  width: "60%",
                  height: "40%",
                  left: "20%",
                  top: "30%",
                  animationDuration: "1.5s",
                }}
              />
              <div className="absolute inset-0 animate-ping opacity-15"
                style={{
                  border: `2px solid ${franchiseColor}`,
                  borderRadius: "50%",
                  width: "40%",
                  height: "25%",
                  left: "30%",
                  top: "37%",
                  animationDuration: "1s",
                  animationDelay: "0.3s",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
