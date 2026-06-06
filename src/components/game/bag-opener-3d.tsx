// ============================================================
// Trading Tazos Game — BagOpener3D (Interactive Tear v2)
// Uses realistic PotatoChipBag3D model with front/back textures.
// User drags across to tear the bag open dynamically.
// ============================================================
"use client"

import { useRef, useState, useMemo, useCallback, Suspense } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import * as THREE from "three"
import PotatoChipBag3D, { BAG_W, BAG_H, TOP_CRIMP, BOT_CRIMP } from "./3d/potato-chip-bag-3d"
import { pickBagVariant } from "@/lib/bag-variants"
import { playSFX } from "@/lib/audio/sfx-engine"

// ── Particle burst ──
function Particles({ active, color }: { active: boolean; color: string }) {
  const count = 40
  const ref = useRef<THREE.Points>(null!)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i*3] = (Math.random()-0.5)*2
      arr[i*3+1] = (Math.random()-0.5)*2.5
      arr[i*3+2] = (Math.random()-0.5)*1.2
    }
    return arr
  }, [])
  const velocities = useMemo(() => Array.from({length: count}, () => ({
    vx: (Math.random()-0.5)*0.03,
    vy: 0.01+Math.random()*0.04,
    vz: (Math.random()-0.5)*0.02,
  })), [])
  const frame = useRef(0)
  useThree(({ clock }) => {
    if (!ref.current || !active) return
    frame.current++
    const attr = ref.current.geometry.attributes.position
    for (let i=0; i<count; i++) {
      attr.array[i*3] += velocities[i].vx
      attr.array[i*3+1] += velocities[i].vy
      attr.array[i*3+2] += velocities[i].vz
    }
    attr.needsUpdate = true
    const material = ref.current.material
    if (!Array.isArray(material)) {
      material.opacity = Math.max(0, material.opacity - 0.008)
    }
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.04} transparent opacity={0.9} depthWrite={false} />
    </points>
  )
}

// ── Types ──
export interface BagData {
  id: string
  bagType?: string
  preview?: { franchise?: { slug?: string } } | null
}

interface Props {
  bag: BagData | null
  opening: boolean
  progress: number
  onOpen: () => void
  onSkip: () => void
}

// ── Main ──
export default function BagOpener3D({ bag, opening, progress, onOpen, onSkip }: Props) {
  const { frontUrl, backUrl, franchise } = useMemo(() => {
    const slug = bag?.preview?.franchise?.slug
    return pickBagVariant(slug)
  }, [bag])

  const [revealed, setRevealed] = useState(false)
  const [tearProgress, setTearProgress] = useState(0)
  const tearing = useRef(false)
  const tearPaths = useRef<{x:number; y:number}[]>([])
  const tearDone = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const franchiseColor = useMemo(() => {
    const colors: Record<string, string> = { minimon: "#22C55E", cybermon: "#3B82F6", dracobell: "#F97316" }
    return colors[franchise] || "#FFCC00"
  }, [franchise])

  // Pointer tracking for interactive tear
  const handlePointerDown = useCallback(() => {
    if (tearDone.current || revealed) return
    tearing.current = true
    tearPaths.current = []
    playSFX('bag_tear', { volume: 0.3 })
  }, [revealed])

  const handlePointerMove = useCallback((e: THREE.Event) => {
    if (!tearing.current || tearDone.current || revealed) return
    const uv = (e as any).uv
    if (!uv) return
    // Map UV to bag space (x is width, y is height)
    tearPaths.current.push({ x: (uv.x - 0.5) * BAG_W, y: (uv.y - 0.5) * BAG_H })
    const pts = tearPaths.current
    if (pts.length > 2) {
      const xspan = Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x))
      const p = Math.min(1, xspan * 1.8 + pts.length * 0.005)
      setTearProgress(p)
      if (p >= 1 && !tearDone.current) {
        tearDone.current = true
        tearing.current = false
        playSFX('bag_open', { volume: 0.5 })
        setTimeout(() => {
          setRevealed(true)
          onOpen()
        }, 350)
      }
    }
  }, [onOpen, revealed])

  const handlePointerUp = useCallback(() => {
    tearing.current = false
    if (tearPaths.current.length > 0 && !tearDone.current && !revealed) {
      // Not enough — reset
      setTearProgress(0)
      tearPaths.current = []
    }
  }, [revealed])

  const bagInteractive = !revealed

  return (
    <div ref={containerRef} className="relative w-full h-[420px] sm:h-[500px] select-none touch-none"
      style={{ background: "radial-gradient(ellipse at center, #1a1810 0%, #0a0805 100%)" }}>
      <Canvas
        camera={{ position: [0, 0.05, 1.75], fov: 42 }}
        gl={{ antialias: true, alpha: false, premultipliedAlpha: false }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <color attach="background" args={[0x000000]} />
        <ambientLight intensity={0.6} />
        <spotLight position={[3, 2, 4]} intensity={2.5} angle={0.4} penumbra={0.5} color="#fffef5" />
        <spotLight position={[-2, 1.5, -3]} intensity={1.2} angle={0.35} penumbra={0.6} color="#fffef5" />
        <pointLight position={[0, -1.5, 3]} intensity={0.5} color="#FFCC00" />

        <Suspense fallback={null}>
          <PotatoChipBag3D
            frontUrl={frontUrl}
            backUrl={backUrl}
            autoRotate={!revealed}
            rotationSpeed={0.35}
            scale={1.3}
            interactive={bagInteractive}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
        </Suspense>

        <Particles active={revealed} color={franchiseColor} />
      </Canvas>

      {/* Bottom UI controls */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 z-10">
        {tearProgress < 0.02 && !revealed && (
          <div className="flex flex-col items-center gap-1.5">
            <button
              className="px-8 py-3 font-black text-sm uppercase tracking-wider border-3 animate-pulse cursor-pointer"
              style={{
                backgroundColor: franchiseColor,
                color: "#fff",
                borderColor: "#1a1a1a",
                boxShadow: "4px 4px 0px #1a1a1a",
              }}
              // Just visual hint — actual tear is drag-based
            >
              DRAG ACROSS BAG TO TEAR!
            </button>
            <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.25em]">
              hold &amp; drag horizontally
            </span>
          </div>
        )}

        {tearProgress > 0.02 && tearProgress < 1 && (
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-[180px]">
              <div className="h-2.5 bg-black/70 rounded-full overflow-hidden border border-white/20">
                <div className="h-full rounded-full transition-all duration-100"
                  style={{ width: `${Math.round(tearProgress*100)}%`, backgroundColor: franchiseColor }} />
              </div>
            </div>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.15em]">
              {Math.round(tearProgress*100)}%
            </span>
            <button onClick={() => {
              tearDone.current = true; tearing.current = false
              setRevealed(true); playSFX('bag_open', { volume: 0.5 })
              setTimeout(() => onOpen(), 300)
            }} className="px-3 py-1.5 bg-black/60 border border-white/20 text-white/70 text-[10px] font-black uppercase hover:bg-black/80">
              Skip
            </button>
          </div>
        )}

        {revealed && (
          <div className="px-6 py-2 bg-[#FFCC00] border-3 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]">
            <span className="font-black text-sm text-[#1a1a1a] uppercase tracking-wider">Tazo Revealed!</span>
          </div>
        )}
      </div>
    </div>
  )
}
