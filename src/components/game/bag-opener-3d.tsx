// ============================================================
// Trading Tazos Game — BagOpener3D v6
//
// Professional bag opening — game quality.
//
// Flow: bag faces front → user tears → POP → bag peels open
// → interior glows → tazo rises with bounce → flash → reveal.
//
// Features:
// - Camera dolly animation during reveal
// - Screen flash overlay on tazo emergence
// - Interior glow light synced to bag opening
// - Tazo rises with elastic bounce for weight
// - Particles burst from bag center outward
// - Professional UI with timed prompts
// ============================================================
"use client"

import { useRef, useState, useMemo, useCallback, useEffect, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Line } from "@react-three/drei"
import * as THREE from "three"
import PotatoChipBag3D, {
  BAG_W_TOP, BAG_H, BAG_D, BODY_H, TOP_CRIMP, BOT_CRIMP,
} from "./3d/potato-chip-bag-3d"
import { pickBagVariant } from "@/lib/bag-variants"
import { playSFX } from "@/lib/audio/sfx-engine"

// ══════════════════════════════════════════════════════════
// CAMERA ANIMATOR — subtle dolly during reveal
// ══════════════════════════════════════════════════════════
function CameraAnimator({ active }: { active: boolean }) {
  const { camera } = useThree()
  const baseZ = 2.0
  const targetZ = 1.65
  const ref = useRef(0)

  useFrame((_, delta) => {
    ref.current = THREE.MathUtils.lerp(ref.current, active ? 1 : 0, 2.5 * delta)
    camera.position.z = baseZ + (targetZ - baseZ) * ref.current
    // Slight vertical follow
    camera.position.y = 0.02 + ref.current * 0.08
  })

  return null
}

// ══════════════════════════════════════════════════════════
// TAZO DISC — rises from inside with elastic bounce
// ══════════════════════════════════════════════════════════
function TazoDisc({
  active, color, onRise, onComplete,
}: {
  active: boolean; color: string; onRise?: () => void; onComplete?: () => void
}) {
  const ref = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const activeSince = useRef(0)
  const riseDone = useRef(false)
  const completed = useRef(false)

  useFrame((_, delta) => {
    if (!active) {
      activeSince.current = 0
      riseDone.current = false
      completed.current = false
      return
    }

    if (activeSince.current === 0) activeSince.current = Date.now()

    const elapsed = (Date.now() - activeSince.current) / 1000
    const delay = 0.38
    const duration = 0.7
    const rawT = Math.max(0, Math.min(1, (elapsed - delay) / duration))

    // Elastic-out for weighty feel
    const eased = elasticOut(rawT)

    const bodyY = (TOP_CRIMP - BOT_CRIMP) / 2
    const startY = bodyY - BODY_H * 0.05
    const endY = bodyY + BODY_H * 0.48

    if (ref.current) {
      if (rawT > 0.001) {
        ref.current.visible = true
        ref.current.position.y = startY + (endY - startY) * eased
        ref.current.position.z = -BAG_D * 0.02 + eased * 0.6
        const s = 0.08 + eased * 1.12
        ref.current.scale.setScalar(s)
        ref.current.rotation.y += delta * (0.6 + eased * 2.8)
        ref.current.rotation.z = Math.sin(Date.now() * 0.003) * 0.08
      } else {
        ref.current.visible = false
      }
    }

    // Glow ring
    if (glowRef.current) {
      if (ref.current?.visible) {
        glowRef.current.position.copy(ref.current.position)
        glowRef.current.position.z += 0.03
      }
      const glowS = 1.4 + Math.sin(Date.now() * 0.005) * 0.4
      glowRef.current.scale.setScalar(glowS * (0.1 + eased * 1.1))
      if (!Array.isArray(glowRef.current.material)) {
        glowRef.current.material.opacity = 0.15 + eased * 0.5 + Math.sin(Date.now() * 0.006) * 0.08
      }
      glowRef.current.visible = eased > 0.03
    }

    // onRise callback (for triggering flash)
    if (rawT >= 0.55 && !riseDone.current) {
      riseDone.current = true
      onRise?.()
    }

    // onComplete
    if (eased >= 0.97 && !completed.current) {
      completed.current = true
      setTimeout(() => onComplete?.(), 300)
    }
  })

  return (
    <group>
      <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 48]} />
        <meshStandardMaterial
          color={color}
          roughness={0.08}
          metalness={0.85}
          emissive={color}
          emissiveIntensity={0.7}
        />
      </mesh>
      <mesh ref={glowRef} visible={false}>
        <ringGeometry args={[0.07, 0.21, 48]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// ── Elastic-out easing ──
function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

// ══════════════════════════════════════════════════════════
// PARTICLES — burst from bag center
// ══════════════════════════════════════════════════════════
function Particles({ active, color }: { active: boolean; color: string }) {
  const count = 72
  const ref = useRef<THREE.Points>(null!)
  const started = useRef(false)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 1.2
      arr[i * 3 + 1] = (Math.random() - 0.5) * 2.0
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.8
    }
    return arr
  }, [])
  const velocities = useMemo(() => Array.from({ length: count }, () => ({
    vx: (Math.random() - 0.5) * 0.055,
    vy: 0.025 + Math.random() * 0.07,
    vz: (Math.random() - 0.5) * 0.045,
  })), [])

  useFrame(() => {
    if (!ref.current) return
    const attr = ref.current.geometry.attributes.position
    const mat = ref.current.material

    if (active) {
      if (!started.current) {
        for (let i = 0; i < count; i++) {
          attr.array[i * 3] = (Math.random() - 0.5) * 1.2
          attr.array[i * 3 + 1] = (Math.random() - 0.5) * 2.0
          attr.array[i * 3 + 2] = (Math.random() - 0.5) * 0.8
        }
        started.current = true
      }
      for (let i = 0; i < count; i++) {
        attr.array[i * 3] += velocities[i].vx
        attr.array[i * 3 + 1] += velocities[i].vy
        attr.array[i * 3 + 2] += velocities[i].vz
      }
      if (!Array.isArray(mat)) {
        mat.opacity = Math.min(0.9, (mat.opacity || 0) + 0.03)
      }
    } else {
      started.current = false
      if (!Array.isArray(mat)) {
        mat.opacity = Math.max(0, (mat.opacity || 0) - 0.05)
      }
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.05}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ══════════════════════════════════════════════════════════
// TEAR INDICATOR
// ══════════════════════════════════════════════════════════
function TearIndicator({
  points, color, bagBodyY,
}: {
  points: { x: number; y: number }[]; color: string; bagBodyY: number
}) {
  const pts3D = useMemo(() => {
    if (points.length < 2) return []
    return points.map(p =>
      new THREE.Vector3(p.x, bagBodyY + p.y + BODY_H / 2, BAG_D / 2 + 0.016)
    )
  }, [points, bagBodyY])

  if (pts3D.length < 2) return null

  return (
    <Line points={pts3D} color={color} lineWidth={2.5} transparent opacity={0.9} depthTest />
  )
}

// ══════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════
export interface BagData {
  id: string
  bagType?: string
  preview?: { franchise?: { slug?: string } } | null
}

interface Props {
  bag: BagData | null
  onOpen: () => void
  onSkip: () => void
}

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════

export default function BagOpener3D({ bag, onOpen }: Props) {
  const { frontUrl, backUrl, franchise } = useMemo(() => {
    const slug = bag?.preview?.franchise?.slug
    return pickBagVariant(slug)
  }, [bag])

  const [stage, setStage] = useState<"idle" | "tearing" | "opening" | "reveal">("idle")
  const [tearProgress, setTearProgress] = useState(0)
  const [flashActive, setFlashActive] = useState(false)
  const tearPaths = useRef<{ x: number; y: number }[]>([])
  const tearing = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasHeight, setCanvasHeight] = useState(480)

  useEffect(() => {
    const update = () => {
      const w = containerRef.current?.clientWidth || 500
      setCanvasHeight(Math.min(580, Math.max(420, w * 0.9)))
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  const franchiseColor = useMemo(() => {
    const colors: Record<string, string> = { minimon: "#FFCC00", cybermon: "#3B82F6", dracobell: "#F97316" }
    return colors[franchise] || "#FFCC00"
  }, [franchise])

  const bodyY = (TOP_CRIMP - BOT_CRIMP) / 2

  // ── Tear handlers ──
  const handlePointerDown = useCallback(() => {
    if (stage === "opening" || stage === "reveal") return
    tearing.current = true
    tearPaths.current = []
    setStage("tearing")
    setTearProgress(0)
    playSFX('bag_tear', { volume: 0.35 })
  }, [stage])

  const handlePointerMove = useCallback((e: THREE.Event) => {
    if (!tearing.current || stage !== "tearing") return
    const uv = (e as any).uv
    if (!uv) return
    tearPaths.current.push({ x: (uv.x - 0.5) * BAG_W_TOP, y: (uv.y - 0.5) * BAG_H })

    const pts = tearPaths.current
    if (pts.length >= 4) {
      const xspan = Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x))
      const yspan = Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y))
      const coverage = xspan * 2.6 + yspan * 0.35
      const p = Math.min(1, coverage)
      setTearProgress(p)

      if (p >= 0.9) {
        tearing.current = false
        setTearProgress(1)
        playSFX('bag_open', { volume: 0.6 })
        // Brief pause for the "pop" before opening
        setTimeout(() => setStage("opening"), 80)
      }
    }
  }, [stage])

  const handlePointerUp = useCallback(() => {
    tearing.current = false
    if (tearPaths.current.length < 4 && stage === "tearing") {
      setTearProgress(0)
      setStage("idle")
    }
  }, [stage])

  // ── Skip ──
  const handleSkip = useCallback(() => {
    tearing.current = false
    setTearProgress(1)
    playSFX('bag_open', { volume: 0.55 })
    setStage("opening")
  }, [])

  // ── Tazo mid-rise → flash screen ──
  const handleTazoRise = useCallback(() => {
    setFlashActive(true)
    setTimeout(() => setFlashActive(false), 350)
  }, [])

  // ── Tazo reveal complete ──
  const handleTazoComplete = useCallback(() => {
    playSFX('reveal', { volume: 0.55 })
    setStage("reveal")
    setTimeout(() => onOpen(), 500)
  }, [onOpen])

  const isOpening = stage === "opening" || stage === "reveal"

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none touch-none overflow-hidden"
      style={{ height: canvasHeight, background: "#080604" }}
    >
      {/* ═══ SCREEN FLASH OVERLAY ═══ */}
      <div
        className="absolute inset-0 z-20 pointer-events-none transition-opacity duration-200"
        style={{
          opacity: flashActive ? 1 : 0,
          background: `radial-gradient(ellipse at 50% 50%, ${franchiseColor}40 0%, transparent 70%)`,
        }}
      />

      <Canvas
        camera={{ position: [0, 0.02, 2.0], fov: 36 }}
        gl={{
          antialias: true,
          alpha: true,
          premultipliedAlpha: false,
        }}
        style={{ background: "#080604" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x080604, 0)
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }}
      >
        {/* ── Lighting ── */}
        <ambientLight intensity={0.6} />
        <spotLight position={[4.5, 3.5, 5.5]} intensity={4.0} angle={0.38} penumbra={0.45} color="#fffef5" />
        <spotLight position={[-3.5, 2.5, -4.5]} intensity={2.2} angle={0.32} penumbra={0.55} color="#fffef5" />
        <pointLight position={[0, -1.5, 3.5]} intensity={0.8} color="#FFCC00" />
        {/* Rim/fill lights */}
        <pointLight position={[0, 2, -2.5]} intensity={0.4} color="#8899cc" />
        <pointLight position={[-2, 0, 2]} intensity={0.3} color="#ffaa44" />

        <CameraAnimator active={isOpening} />

        <Suspense fallback={null}>
          <PotatoChipBag3D
            frontUrl={frontUrl}
            backUrl={backUrl}
            scale={1.2}
            interactive={stage === "idle" || stage === "tearing"}
            opening={isOpening}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />

          <TazoDisc
            active={isOpening}
            color={franchiseColor}
            onRise={handleTazoRise}
            onComplete={handleTazoComplete}
          />
        </Suspense>

        {stage === "tearing" && tearPaths.current.length > 1 && (
          <TearIndicator points={tearPaths.current} color={franchiseColor} bagBodyY={bodyY} />
        )}

        <Particles active={isOpening} color={franchiseColor} />
      </Canvas>

      {/* ═══════════════════════════════════════════
          UI OVERLAY
          ═══════════════════════════════════════════ */}
      <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-3 z-10 px-4">

        {/* ── IDLE ── */}
        {stage === "idle" && (
          <div className="flex flex-col items-center gap-2.5">
            <div
              className="px-9 py-3.5 font-black text-sm uppercase tracking-[0.15em] border-[3px]
                         cursor-pointer hover:scale-105 active:scale-95 transition-all duration-150"
              style={{
                backgroundColor: franchiseColor,
                color: "#1a1a1a",
                borderColor: "#1a1a1a",
                boxShadow: "5px 5px 0px #1a1a1a",
              }}
            >
              DRAG TO OPEN!
            </div>
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-[0.25em]">
              swipe across the top seal
            </span>
          </div>
        )}

        {/* ── TEARING ── */}
        {stage === "tearing" && (
          <div className="flex items-center gap-3 w-full max-w-[340px]">
            <div className="flex-1">
              <div className="h-3.5 bg-black/80 border border-white/10 overflow-hidden">
                <div
                  className="h-full transition-all duration-75"
                  style={{
                    width: `${Math.round(tearProgress * 100)}%`,
                    background: `linear-gradient(90deg, ${franchiseColor}cc, ${franchiseColor})`,
                    boxShadow: `0 0 16px ${franchiseColor}60, inset 0 0 4px ${franchiseColor}40`,
                  }}
                />
              </div>
            </div>
            <span className="text-xs font-black text-white/50 tabular-nums w-10 text-right">
              {Math.round(tearProgress * 100)}%
            </span>
            <button
              onClick={handleSkip}
              className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-white/40
                         text-[10px] font-black uppercase hover:bg-white/10 hover:text-white/70
                         transition-all duration-150"
            >
              Skip
            </button>
          </div>
        )}

        {/* ── OPENING ── */}
        {stage === "opening" && (
          <div
            className="px-6 py-2.5 border-[3px] border-[#1a1a1a] shadow-[4px_4px_0px_#1a1a1a]"
            style={{ backgroundColor: `${franchiseColor}f0` }}
          >
            <span className="font-black text-xs text-[#1a1a1a] uppercase tracking-[0.2em] animate-pulse">
              Opening...
            </span>
          </div>
        )}

        {/* ── REVEAL ── */}
        {stage === "reveal" && (
          <div className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">
            &nbsp;
          </div>
        )}
      </div>
    </div>
  )
}
