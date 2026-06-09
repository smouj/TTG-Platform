// ============================================================
// Trading Tazos Game — BagOpener3D v9
//
// Cinematic bag opening experience.
// - Dynamic camera: idle zoom → tear pullback → opening dolly → reveal zoom
// - Smooth stage transitions with lerp, no abrupt cuts
// - Dramatic burst particles at pop moment
// - Adaptive scale & canvas to viewport
// - Polished reveal: camera zooms into tazo before transition
// ============================================================
"use client"

import { useRef, useState, useMemo, useCallback, useEffect, Suspense } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Line } from "@react-three/drei"
import * as THREE from "three"
import PotatoChipBag3D, {
  BAG_W_TOP, BAG_H, BAG_D, TOP_CRIMP, BOT_CRIMP, BODY_H,
} from "./3d/potato-chip-bag-3d"
import { pickBagVariant } from "@/lib/bag-variants"
import { playSFX } from "@/lib/audio/sfx-engine"

const bodyY = (TOP_CRIMP - BOT_CRIMP) / 2

// ══════════════════════════════════════════════════════════
// CAMERA ANIMATOR — dynamic stage-based camera
// ══════════════════════════════════════════════════════════
function CameraAnimator({ stage, tearProgress, tazoRising }: {
  stage: string; tearProgress: number; tazoRising: boolean
}) {
  const { camera } = useThree()
  const shakeRef = useRef(0)
  const targetRef = useRef({ z: 1.9, y: 0.02 })
  const shakeStart = useRef(0)

  useFrame((_, delta) => {
    // Target per stage
    if (stage === "idle") {
      targetRef.current = { z: 1.9, y: 0.02 }
    } else if (stage === "tearing") {
      // Slight pullback as user tears
      targetRef.current = { z: 1.9 + tearProgress * 0.2, y: 0.02 }
    } else if (stage === "opening") {
      // Zoom in for drama
      targetRef.current = { z: 1.7, y: 0.05 }
      // Camera shake on pop
      if (shakeRef.current > 0) {
        camera.position.x = Math.sin(Date.now() * 0.04) * shakeRef.current * 0.03
        camera.position.y += Math.cos(Date.now() * 0.05) * shakeRef.current * 0.02
        shakeRef.current = Math.max(0, shakeRef.current - delta * 6)
      }
    } else if (stage === "reveal") {
      // Zoom into tazo
      targetRef.current = { z: 1.5, y: 0.07 }
    }

    if (tazoRising && shakeStart.current === 0) {
      shakeRef.current = 1.0
      shakeStart.current = Date.now()
    }

    // Smooth lerp to target
    const speed = stage === "opening" ? 2.0 : 1.5
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetRef.current.z, speed * delta)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetRef.current.y, speed * delta)
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 3 * delta)
  })

  return null
}

// ══════════════════════════════════════════════════════════
// TAZO DISC — cinematic rise with spin + glow
// ══════════════════════════════════════════════════════════
function TazoDisc({ active, color, onRise, onComplete }: {
  active: boolean; color: string; onRise?: () => void; onComplete?: () => void
}) {
  const ref = useRef<THREE.Mesh>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const trailRef = useRef<THREE.Mesh>(null!)
  const activeSince = useRef(0)
  const riseDone = useRef(false)
  const completed = useRef(false)

  useFrame((_, delta) => {
    if (!active) { activeSince.current = 0; riseDone.current = false; completed.current = false; return }
    if (activeSince.current === 0) activeSince.current = Date.now()
    const elapsed = (Date.now() - activeSince.current) / 1000
    const rawT = Math.max(0, Math.min(1, (elapsed - 0.25) / 0.8))
    const eased = elasticOut(rawT)

    if (ref.current) {
      if (rawT > 0.001) {
        ref.current.visible = true
        ref.current.position.y = bodyY + eased * 0.85
        ref.current.position.z = -BAG_D * 0.02 + eased * 0.7
        ref.current.scale.setScalar(0.05 + eased * 1.2)
        ref.current.rotation.y += delta * (0.8 + eased * 3.5)
        ref.current.rotation.z = Math.sin(Date.now() * 0.004) * 0.06
        ref.current.rotation.x = Math.PI / 2 + Math.sin(Date.now() * 0.003) * 0.15
      } else { ref.current.visible = false }
    }
    if (glowRef.current) {
      if (ref.current?.visible) glowRef.current.position.copy(ref.current.position)
      glowRef.current.scale.setScalar((0.1 + eased * 1.2) * (1.5 + Math.sin(Date.now() * 0.006) * 0.5))
      if (!Array.isArray(glowRef.current.material)) {
        glowRef.current.material.opacity = 0.12 + eased * 0.6 + Math.sin(Date.now() * 0.007) * 0.1
      }
      glowRef.current.visible = eased > 0.02
    }
    if (trailRef.current) {
      trailRef.current.position.copy(ref.current?.position || new THREE.Vector3(0, bodyY, 0))
      trailRef.current.position.z += 0.02
      trailRef.current.scale.setScalar(0.8 + eased * 0.4 + Math.sin(Date.now() * 0.008) * 0.15)
      if (!Array.isArray(trailRef.current.material)) {
        trailRef.current.material.opacity = Math.max(0, 0.08 - eased * 0.05)
      }
      trailRef.current.visible = eased > 0.15 && eased < 0.9
    }
    if (rawT >= 0.5 && !riseDone.current) { riseDone.current = true; onRise?.() }
    if (eased >= 0.98 && !completed.current) { completed.current = true; setTimeout(() => onComplete?.(), 350) }
  })

  return (
    <group>
      <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <cylinderGeometry args={[0.14, 0.14, 0.045, 48]} />
        <meshStandardMaterial color={color} roughness={0.06} metalness={0.9} emissive={color} emissiveIntensity={0.8} />
      </mesh>
      <mesh ref={glowRef} visible={false}>
        <ringGeometry args={[0.06, 0.22, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh ref={trailRef} visible={false}>
        <ringGeometry args={[0.04, 0.12, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return t
  return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1
}

// ══════════════════════════════════════════════════════════
// BURST PARTICLES — dramatic pop burst
// ══════════════════════════════════════════════════════════
function BurstParticles({ active, color, stage }: { active: boolean; color: string; stage: string }) {
  const ref = useRef<THREE.Points>(null!)
  const startRef = useRef(0)
  const count = 120

  const velocities = useMemo(() => Array.from({ length: count }, () => ({
    vx: (Math.random() - 0.5) * 0.09,
    vy: 0.03 + Math.random() * 0.1,
    vz: (Math.random() - 0.5) * 0.07,
    life: 0.8 + Math.random() * 1.5,
  })), [])

  useFrame((_, delta) => {
    if (!ref.current) return
    const attr = ref.current.geometry.attributes.position
    const mat = ref.current.material

    if (active) {
      if (startRef.current === 0) {
        startRef.current = Date.now()
        for (let i = 0; i < count; i++) {
          attr.array[i * 3] = (Math.random() - 0.5) * 0.3
          attr.array[i * 3 + 1] = bodyY
          attr.array[i * 3 + 2] = (Math.random() - 0.5) * 0.2
        }
      }
      const elapsed = (Date.now() - startRef.current) / 1000
      for (let i = 0; i < count; i++) {
        attr.array[i * 3] += velocities[i].vx * delta * 3
        attr.array[i * 3 + 1] += velocities[i].vy * delta * 3
        attr.array[i * 3 + 2] += velocities[i].vz * delta * 3
      }
      if (!Array.isArray(mat)) {
        const lifeFactor = Math.max(0, 1 - elapsed / 2.5)
        ;(mat as THREE.PointsMaterial).opacity = Math.min(0.85, ((mat as THREE.PointsMaterial).opacity || 0) + 0.04) * lifeFactor
        ;(mat as THREE.PointsMaterial).size = 0.03 + elapsed * 0.01
      }
    } else {
      startRef.current = 0
      if (!Array.isArray(mat)) {
        ;(mat as THREE.PointsMaterial).opacity = Math.max(0, ((mat as THREE.PointsMaterial).opacity || 0) - 0.06)
      }
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array(count * 3), 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color} size={0.04} transparent opacity={0}
        depthWrite={false} blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

// ══════════════════════════════════════════════════════════
// CUT GUIDE — pulsing dashed line on the seal
// ══════════════════════════════════════════════════════════
function CutGuide({ color, visible }: { color: string; visible: boolean }) {
  const phase = useRef(0)
  useFrame((_, delta) => { phase.current = (phase.current + delta * 2) % (Math.PI * 2) })

  if (!visible) return null
  const hw = BAG_W_TOP * 0.44
  const segs = 20
  const ySeal = bodyY + BODY_H / 2 + TOP_CRIMP * 0.45
  const alpha = 0.5 + Math.sin(phase.current) * 0.3

  const pts = useMemo(() => {
    const arr: THREE.Vector3[] = []
    for (let i = 0; i <= segs; i++) arr.push(new THREE.Vector3(-hw + (2 * hw * i) / segs, ySeal, BAG_D / 2 + 0.025))
    return arr
  }, [ySeal])

  return (
    <group>
      <Line points={pts} color={color} lineWidth={3} transparent opacity={alpha} dashed dashSize={0.05} gapSize={0.035} depthTest={false} />
      <Line points={pts.map(p => p.clone().add(new THREE.Vector3(0, 0, -0.002)))} color="#ffffff" lineWidth={1} transparent opacity={alpha * 0.3} dashed dashSize={0.05} gapSize={0.035} depthTest={false} />
      <mesh position={[-hw, ySeal, BAG_D / 2 + 0.028]}>
        <sphereGeometry args={[0.025, 12, 12]} /><meshBasicMaterial color={color} transparent opacity={alpha + 0.2} />
      </mesh>
      <mesh position={[hw, ySeal, BAG_D / 2 + 0.028]}>
        <sphereGeometry args={[0.025, 12, 12]} /><meshBasicMaterial color={color} transparent opacity={alpha + 0.2} />
      </mesh>
    </group>
  )
}

// ══════════════════════════════════════════════════════════
// TEAR INDICATOR — vivid cut path on bag surface
// ══════════════════════════════════════════════════════════
function TearIndicator({ points, color }: { points: { x: number; y: number }[]; color: string }) {
  const pts3D = useMemo(() => {
    if (points.length < 2) return []
    return points.map(p => new THREE.Vector3(p.x, bodyY + p.y + BODY_H / 2, BAG_D / 2 + 0.022))
  }, [points])

  if (pts3D.length < 2) return null

  return (
    <group>
      <Line points={pts3D} color={color} lineWidth={5} transparent opacity={0.9} depthTest={false} />
      <Line points={pts3D.map(p => p.clone().add(new THREE.Vector3(0, 0, 0.005)))} color="#ffffff" lineWidth={2} transparent opacity={0.75} depthTest={false} />
      <Line points={pts3D.map(p => p.clone().add(new THREE.Vector3(0, 0, -0.008)))} color={color} lineWidth={7} transparent opacity={0.25} depthTest={false} />
      {pts3D.map((p, i) => i % 3 === 0 ? (
        <mesh key={i} position={p.clone().add(new THREE.Vector3(0, 0, 0.018))}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
      ) : null)}
    </group>
  )
}

// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════
export interface BagData { id: string; bagType?: string; preview?: { franchise?: { slug?: string } } | null }

export default function BagOpener3D({ bag, onOpen, onSkip }: { bag: BagData | null; onOpen: () => void; onSkip: () => void }) {
  const { frontUrl, backUrl, franchise } = useMemo(() => {
    const slug = bag?.preview?.franchise?.slug
    return pickBagVariant(slug)
  }, [bag])

  const [stage, setStage] = useState<"idle" | "tearing" | "opening" | "reveal">("idle")
  const [tearProgress, setTearProgress] = useState(0)
  const [flashActive, setFlashActive] = useState(false)
  const [tazoRising, setTazoRising] = useState(false)
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
      const maxH = Math.min(vh * 0.55, 580)
      const h = Math.min(maxH, Math.max(420, w * 0.92))
      setCanvasH(h)
      setBagScale(Math.min(1.3, Math.max(0.95, h / 460)))
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
    const x = (uv.x - 0.5) * BAG_W_TOP, y = (uv.y - 0.5) * BAG_H
    tearPaths.current.push({ x, y })
    const pts = tearPaths.current
    if (pts.length >= 4) {
      const xspan = Math.max(...pts.map(p => p.x)) - Math.min(...pts.map(p => p.x))
      const yspan = Math.max(...pts.map(p => p.y)) - Math.min(...pts.map(p => p.y))
      const p = Math.min(1, xspan * 2.6 + yspan * 0.35)
      setTearProgress(p)
      if (p >= 0.9) {
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

  const handleTazoRise = useCallback(() => {
    setTazoRising(true)
    setFlashActive(true)
    setTimeout(() => setFlashActive(false), 400)
  }, [])

  const handleTazoComplete = useCallback(() => {
    playSFX('reveal', { volume: 0.6 })
    setStage("reveal")
    // Smooth delay before transitioning to card view
    setTimeout(() => onOpen(), 600)
  }, [onOpen])

  const isOpening = stage === "opening" || stage === "reveal"

  return (
    <div ref={containerRef} className="relative w-full select-none touch-none" style={{ height: canvasH }}>
      {/* Screen flash overlay — more dramatic radial effect */}
      <div
        className="absolute inset-0 z-20 pointer-events-none transition-opacity"
        style={{
          opacity: flashActive ? 1 : 0,
          transitionDuration: flashActive ? "0ms" : "350ms",
          background: `radial-gradient(ellipse at 50% 50%, ${franchiseColor}50 0%, ${franchiseColor}15 40%, transparent 75%)`,
        }}
      />

      <Canvas
        camera={{ position: [0, 0.02, 1.9], fov: 38 }}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }}
      >
        <CameraAnimator stage={stage} tearProgress={tearProgress} tazoRising={tazoRising} />

        {/* Cinematic 3-point lighting */}
        <ambientLight intensity={0.9} />
        <spotLight position={[3, 3, 5]} intensity={3.5} angle={0.38} penumbra={0.45} color="#fffef8" />
        <spotLight position={[-2.5, 2.5, -4]} intensity={2.0} angle={0.35} penumbra={0.5} color="#fffef5" />
        <pointLight position={[0, -2, 3]} intensity={0.55} color="#ffddbb" />
        <pointLight position={[-1.5, 0, 2.5]} intensity={0.4} color="#ccddff" />

        <Suspense fallback={null}>
          <PotatoChipBag3D
            frontUrl={frontUrl} backUrl={backUrl} scale={bagScale}
            interactive={stage === "idle" || stage === "tearing"} opening={isOpening}
            onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
          />
          <TazoDisc active={isOpening} color={franchiseColor} onRise={handleTazoRise} onComplete={handleTazoComplete} />
        </Suspense>

        <CutGuide color={franchiseColor} visible={stage === "idle"} />
        {stage === "tearing" && tearPaths.current.length > 1 && (
          <TearIndicator points={tearPaths.current} color={franchiseColor} />
        )}
        <BurstParticles active={isOpening} color={franchiseColor} stage={stage} />
      </Canvas>

      {/* ═══ UI OVERLAY ═══ */}
      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3 z-10 px-4">
        {stage === "idle" && (
          <div className="flex flex-col items-center gap-1.5">
            <div
              className="px-7 py-2.5 font-black text-xs sm:text-sm uppercase tracking-[0.12em] border-[3px] cursor-pointer active:scale-95 transition-transform"
              style={{ backgroundColor: franchiseColor, color: "#1a1a1a", borderColor: "#1a1a1a", boxShadow: "4px 4px 0px #1a1a1a" }}
            >
              ✂ DRAG TO OPEN!
            </div>
            <span className="text-[8px] font-bold text-black/20 uppercase tracking-[0.2em]">slide across top seal</span>
          </div>
        )}
        {stage === "tearing" && (
          <div className="flex items-center gap-2.5 w-full max-w-[320px]">
            <div className="flex-1">
              <div className="h-2.5 bg-black/8 border border-black/8 overflow-hidden rounded-full">
                <div className="h-full transition-all duration-100 rounded-full"
                  style={{ width: `${Math.round(tearProgress * 100)}%`, background: `linear-gradient(90deg, ${franchiseColor}cc, ${franchiseColor})`, boxShadow: `0 0 10px ${franchiseColor}50` }} />
              </div>
            </div>
            <span className="text-[10px] font-black text-black/35 tabular-nums w-7 text-right">{Math.round(tearProgress * 100)}</span>
            <button onClick={handleSkip}
              className="px-2.5 py-1 bg-black/5 border border-black/10 text-black/35 text-[9px] font-black uppercase hover:bg-black/10 hover:text-black/50 rounded-full transition-all">
              Skip
            </button>
          </div>
        )}
        {stage === "opening" && (
          <div className="px-5 py-2 border-[3px] border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a]"
            style={{ backgroundColor: `${franchiseColor}f0` }}>
            <span className="font-black text-[11px] text-[#1a1a1a] uppercase tracking-[0.2em] animate-pulse">Opening…</span>
          </div>
        )}
        {stage === "reveal" && <div className="h-7" />}
      </div>
    </div>
  )
}
