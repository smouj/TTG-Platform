// ============================================================
// Trading Tazos Game — BagOpener3D v10
//
// Clean bag opening experience.
// Only the bag model — no extra props, no guide lines, no particles.
// Reference: same polished look as TubeCylinder3D.
// ============================================================
"use client"

import { useRef, useState, useMemo, useCallback, useEffect, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import PotatoChipBag3D, { BAG_H, BAG_D } from "./3d/potato-chip-bag-3d"
import { pickBagVariant } from "@/lib/bag-variants"
import { playSFX } from "@/lib/audio/sfx-engine"

// ══════════════════════════════════════════════════════════
// CAMERA — gentle auto-orbit when idle, steady during interaction
// ══════════════════════════════════════════════════════════
function BagCamera({ interacting, opening }: { interacting: boolean; opening: boolean }) {
  const { camera } = useThree()
  const targetRef = useRef({ z: 1.85, y: 0.0 })

  useFrame((state, delta) => {
    if (opening) {
      targetRef.current = { z: 1.65, y: 0.04 }
    } else if (interacting) {
      targetRef.current = { z: 2.0, y: 0.0 }
    } else {
      // Gentle auto-rotate when idle
      const t = state.clock.elapsedTime
      targetRef.current = {
        z: 1.85 + Math.sin(t * 0.3) * 0.06,
        y: Math.cos(t * 0.25) * 0.03,
      }
    }

    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetRef.current.z, 2.5 * delta)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetRef.current.y, 2.5 * delta)
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 3 * delta)
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════
export interface BagData { id: string; bagType?: string; preview?: { franchise?: { slug?: string } } | null }

export default function BagOpener3D({ bag, frontUrl: propFrontUrl, backUrl: propBackUrl, bagColor: propBagColor, onOpen, onSkip }: {
  bag: BagData | null
  frontUrl?: string
  backUrl?: string
  bagColor?: string
  onOpen: () => void
  onSkip: () => void
}) {
  const { frontUrl: variantFront, backUrl: variantBack, franchise } = useMemo(() => {
    const slug = bag?.preview?.franchise?.slug
    return pickBagVariant(slug)
  }, [bag])
  const frontUrl = propFrontUrl || variantFront
  const backUrl = propBackUrl || variantBack

  const [stage, setStage] = useState<"idle" | "tearing" | "opening" | "reveal">("idle")
  const [tearProgress, setTearProgress] = useState(0)
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
    const c: Record<string, string> = { minimon: "#FFCC00", cybermon: "#3B82F6", dracobell: "#F97316" }
    return c[franchise] || "#FFCC00"
  }, [franchise])

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
    const x = (uv.x - 0.5) * BAG_H, y = (uv.y - 0.5) * BAG_H
    tearPaths.current.push({ x, y })
    const pts = tearPaths.current
    if (pts.length >= 4) {
      const xspan = Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x))
      const yspan = Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y))
      const p = Math.min(1, xspan * 2.8 + yspan * 0.4)
      setTearProgress(p)
      if (p >= 0.92) {
        tearing.current = false; setTearProgress(1)
        playSFX('bag_open', { volume: 0.65 })
        setTimeout(() => setStage("opening"), 150)
      }
    }
  }, [stage])

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
  useEffect(() => {
    if (stage === "opening") {
      const t = setTimeout(() => {
        setStage("reveal")
        playSFX('reveal', { volume: 0.6 })
        setTimeout(() => onOpen(), 500)
      }, 1200)
      return () => clearTimeout(t)
    }
  }, [stage, onOpen])

  return (
    <div ref={containerRef} className="relative w-full select-none touch-none" style={{ height: canvasH }}>
      {/* Flash overlay on open */}
      <div
        className="absolute inset-0 z-20 pointer-events-none"
        style={{
          opacity: stage === "opening" ? 1 : 0,
          transition: "opacity 300ms ease-out",
          background: `radial-gradient(ellipse at 50% 50%, ${franchiseColor}60 0%, ${franchiseColor}20 40%, transparent 70%)`,
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

        {/* Soft, clean lighting — same approach as tube */}
        <ambientLight intensity={1.0} />
        <spotLight position={[2.5, 3.5, 4]} intensity={3.0} angle={0.35} penumbra={0.4} color="#fffef8" />
        <spotLight position={[-2, 3, -3]} intensity={2.0} angle={0.35} penumbra={0.5} color="#fffef5" />
        <pointLight position={[0, -1.5, 3]} intensity={0.6} color="#ffddbb" />

        <Suspense fallback={null}>
          <PotatoChipBag3D
            frontUrl={frontUrl} backUrl={backUrl} bagColor={propBagColor} scale={bagScale}
            interactive={stage === "idle" || stage === "tearing"} opening={isOpening}
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
              style={{ backgroundColor: franchiseColor, color: "#1a1a1a", borderColor: "#1a1a1a", boxShadow: "3px 3px 0px #1a1a1a" }}
            >
              ✂ DRAG ACROSS TO OPEN
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleSkip() }}
              className="px-4 py-1.5 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.1em] border-2 cursor-pointer transition-all hover:scale-105 active:scale-95"
              style={{
                background: "#1a1a1a",
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
              <div className="h-2.5 bg-[#1a1a1a]/8 border border-[#1a1a1a]/8 overflow-hidden rounded-full">
                <div className="h-full transition-all duration-100 rounded-full"
                  style={{ width: `${Math.round(tearProgress * 100)}%`, background: `linear-gradient(90deg, ${franchiseColor}cc, ${franchiseColor})` }} />
              </div>
            </div>
            <span className="text-[10px] font-black text-[#1a1a1a]/35 tabular-nums w-7 text-right">{Math.round(tearProgress * 100)}</span>
            <button onClick={handleSkip}
              className="px-2.5 py-1 bg-[#1a1a1a]/5 border border-[#1a1a1a]/10 text-[#1a1a1a]/35 text-[9px] font-black uppercase hover:bg-[#1a1a1a]/10 hover:text-[#1a1a1a]/50 rounded-full transition-all">
              Skip
            </button>
          </div>
        )}
        {isOpening && (
          <div className="flex flex-col items-center gap-2">
            <div className="px-5 py-2.5 border-[3px] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] animate-pulse"
              style={{ backgroundColor: `${franchiseColor}f0` }}>
              <span className="font-black text-[11px] text-[#1a1a1a] uppercase tracking-[0.15em]">Opening…</span>
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
