// ============================================================
// Trading Tazos Game — Battle Arena 3D (Clean Magazine Edition)
// Polished arena: wooden floor, combat ring, clean pillars,
// smooth disc animations, fixed camera for gameplay.
// ============================================================
"use client"

import { Suspense, useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { DiscPhysics, Arena3DConfig } from "@/lib/battle/game-loop"
import TazoDisc3D from "../3d/tazo-disc-3d"

// ─── Arena Floor ───
function Floor({ config }: { config: Arena3DConfig }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 1024; c.height = 1024
    const ctx = c.getContext("2d")!
    // Warm tabletop color
    const g = ctx.createRadialGradient(512, 512, 30, 512, 512, 540)
    g.addColorStop(0, "#fdf9f0"); g.addColorStop(0.55, "#f0e8d8")
    g.addColorStop(0.88, "#d4c8b0"); g.addColorStop(1, "#a89880")
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 1024)

    // Outer ring — yellow combat boundary
    ctx.strokeStyle = "#FFCC00"; ctx.lineWidth = 26
    ctx.beginPath(); ctx.arc(512, 512, config.radius * 52, 0, Math.PI*2); ctx.stroke()
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(512, 512, config.radius * 52, 0, Math.PI*2); ctx.stroke()

    // Inner guide rings
    ctx.strokeStyle = "rgba(0,0,0,0.06)"; ctx.lineWidth = 2
    for (let r = 70; r < config.radius * 50; r += 75) {
      ctx.beginPath(); ctx.arc(512, 512, r, 0, Math.PI*2); ctx.stroke()
    }
    // Center dot
    ctx.fillStyle = "rgba(255,204,0,0.3)"; ctx.beginPath()
    ctx.arc(512, 512, 14, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.beginPath()
    ctx.arc(512, 512, 5, 0, Math.PI*2); ctx.fill()

    // Subtle wood grain noise
    ctx.fillStyle = "rgba(139,119,80,0.04)"
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * 1024
      const y = Math.random() * 1024
      ctx.beginPath(); ctx.arc(x, y, 1 + Math.random()*3, 0, Math.PI*2); ctx.fill()
    }

    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearMipmapLinearFilter
    t.magFilter = THREE.LinearFilter
    return t
  }, [config.radius])

  return (
    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[config.radius * 2.6, config.radius * 2.6]} />
      <meshStandardMaterial map={tex} roughness={0.7} metalness={0.02} />
    </mesh>
  )
}

// ─── Pillars ───
function Pillars({ config }: { config: Arena3DConfig }) {
  const pts = useMemo(() => {
    const r: { x: number; z: number }[] = []
    for (let i = 0; i < 8; i++) {
      const a = (i/8)*Math.PI*2
      r.push({ x: Math.cos(a)*config.radius*1.25, z: Math.sin(a)*config.radius*1.25 })
    }
    return r
  }, [config.radius])
  return (
    <>
      {pts.map((p, i) => (
        <group key={i} position={[p.x, 0.8, p.z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.14, 0.18, 1.6, 8]} />
            <meshStandardMaterial color="#d0c8b8" roughness={0.6} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#FF8800" emissive="#FF8800" emissiveIntensity={0.4} roughness={0.15} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// ─── Single Disc ───
function ADisc({ disc }: { disc: DiscPhysics }) {
  const g = useRef<THREE.Group>(null!)
  const target = useRef(new THREE.Vector3(disc.position[0], 0, disc.position[2]))
  const isCaptured = disc.state === "captured"

  // Update target position when disc.position changes
  useEffect(() => {
    target.current.set(disc.position[0], 0, disc.position[2])
  }, [disc.position[0], disc.position[2]])

  useFrame((_, delta) => {
    if (!g.current) return
    // Smooth lerp to target position
    g.current.position.lerp(target.current, 0.3)
    // Slow rotation when sliding
    if (disc.state === "sliding" || disc.state === "spinning") {
      g.current.rotation.z += delta * 1.5
    }
    // Captured discs shrink and float up
    if (isCaptured) {
      g.current.position.y += (3 - g.current.position.y) * 0.05
      g.current.scale.lerp(new THREE.Vector3(0.01, 0.01, 0.01), 0.04)
    } else {
      g.current.position.y = 0.08
      g.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.08)
    }
  })

  if (isCaptured) return null

  return (
    <group ref={g} position={[disc.position[0], 0.08, disc.position[2]]}>
      <TazoDisc3D
        name={disc.tazoName}
        franchise={disc.franchise}
        imageUrl={disc.imageUrl}
        backImageUrl={disc.backImageUrl}
        size={0.38}
        autoRotate
      />
    </group>
  )
}

// ─── Camera ───
function Cam({ phase }: { phase: string }) {
  useFrame(({ camera }) => {
    const target = new THREE.Vector3(
      Math.sin(Date.now()*0.0001) * 0.5,
      9.5,
      7 - Math.cos(Date.now()*0.00015) * 0.5
    )
    camera.position.lerp(target, 0.02)
    camera.lookAt(0, 0, 0)
  })
  return null
}

// ─── Scene ───
interface SceneProps {
  config: Arena3DConfig
  playerDiscs: DiscPhysics[]
  opponentDiscs: DiscPhysics[]
  gamePhase: string
}

function Scene({ config, playerDiscs, opponentDiscs, gamePhase }: SceneProps) {
  const all = useMemo(
    () => [...playerDiscs, ...opponentDiscs],
    [playerDiscs, opponentDiscs]
  )
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 14, 3]} intensity={0.75} castShadow />
      <directionalLight position={[-4, 8, -5]} intensity={0.2} />
      <spotLight position={[0, 14, 0]} angle={0.5} penumbra={0.5} intensity={3} color="#FFF8E0" />
      <Floor config={config} />
      <Pillars config={config} />
      {all.map((d, i) => (
        <ADisc key={d.id || `disc-${i}`} disc={d} />
      ))}
      <Cam phase={gamePhase} />
    </>
  )
}

// ─── Main Export ───
interface Props {
  config: Arena3DConfig
  playerDiscs: DiscPhysics[]
  opponentDiscs: DiscPhysics[]
  gamePhase: string
  compact?: boolean
}

export default function BattleArena3D(props: Props) {
  return (
    <div
      className="w-full flex-1 min-h-0"
      style={{
        background: "radial-gradient(ellipse at 50% 50%, #f5f0e0, #d8cdb8)",
        overflow: "hidden",
        border: "3px solid #1a1a1a",
        boxShadow: "inset 0 0 80px rgba(0,0,0,0.08), 4px 4px 0px #1a1a1a",
      }}>
      <Canvas
        camera={{ position: [0, 9.5, 7], fov: 36, near: 0.5, far: 60 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
    </div>
  )
}
