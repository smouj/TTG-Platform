// ============================================================
// Trading Tazos Game — Battle Arena 3D v2
// Full-page 3D arena with:
//  - Real disc physics (velocity, friction, collisions)
//  - User-controllable camera (OrbitControls)
//  - Proper front/back tazo discs (not interleaved perpendicular)
//  - Launch controls overlaid inside the 3D viewport
//  - No auto-movement — only physics + launches
// ============================================================
"use client"

import { Suspense, useRef, useMemo, useEffect, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import type { DiscPhysics, Arena3DConfig, TazoCard } from "@/lib/battle/game-loop"
import TazoDisc3D from "../3d/tazo-disc-3d"

// ─── Arena Floor ───
function Floor({ config }: { config: Arena3DConfig }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 1024; c.height = 1024
    const ctx = c.getContext("2d")!
    const g = ctx.createRadialGradient(512, 512, 30, 512, 512, 540)
    g.addColorStop(0, "#fdf9f0"); g.addColorStop(0.55, "#f0e8d8")
    g.addColorStop(0.88, "#d4c8b0"); g.addColorStop(1, "#a89880")
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 1024)
    ctx.strokeStyle = "#FFCC00"; ctx.lineWidth = 26
    ctx.beginPath(); ctx.arc(512, 512, config.radius * 52, 0, Math.PI*2); ctx.stroke()
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(512, 512, config.radius * 52, 0, Math.PI*2); ctx.stroke()
    ctx.strokeStyle = "rgba(0,0,0,0.06)"; ctx.lineWidth = 2
    for (let r = 70; r < config.radius * 50; r += 75) {
      ctx.beginPath(); ctx.arc(512, 512, r, 0, Math.PI*2); ctx.stroke()
    }
    ctx.fillStyle = "rgba(255,204,0,0.3)"; ctx.beginPath()
    ctx.arc(512, 512, 14, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.beginPath()
    ctx.arc(512, 512, 5, 0, Math.PI*2); ctx.fill()
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter
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
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color="#FF8800" emissive="#FF8800" emissiveIntensity={0.4} roughness={0.15} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// ─── Physics Disc (in-scene, driven by real velocity) ───
interface PhysicsDiscState {
  position: THREE.Vector3
  velocity: THREE.Vector3
  angularVel: number
  facingFront: boolean
  captured: boolean
}

function PhysicsDisc({
  disc, config,
}: {
  disc: DiscPhysics
  config: Arena3DConfig
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const physRef = useRef<PhysicsDiscState>({
    position: new THREE.Vector3(disc.position[0], 0.08, disc.position[2]),
    velocity: new THREE.Vector3(disc.velocity[0], 0, disc.velocity[2]),
    angularVel: 0,
    facingFront: disc.facing === "front",
    captured: disc.state === "captured",
  })
  const lastDiscPos = useRef([disc.position[0], disc.position[2]])
  const lastDiscVel = useRef([disc.velocity[0], disc.velocity[2]])

  // Update physics state when disc data changes from parent
  useEffect(() => {
    const p = physRef.current
    const old = lastDiscPos.current
    const newPos: [number, number] = [disc.position[0], disc.position[2]]
    const newVel: [number, number] = [disc.velocity[0], disc.velocity[2]]

    // If position jumped (new throw or collision), apply velocity
    if (Math.abs(newPos[0] - old[0]) > 0.01 || Math.abs(newPos[1] - old[1]) > 0.01) {
      p.velocity.set(newVel[0] || (newPos[0] - old[0]) * 10, 0, newVel[1] || (newPos[1] - old[1]) * 10)
    }
    p.position.set(newPos[0], 0.08, newPos[1])
    p.captured = disc.state === "captured"
    p.facingFront = disc.facing === "front"
    lastDiscPos.current = [newPos[0], newPos[1]]
    lastDiscVel.current = [newVel[0], newVel[1]]
  }, [disc.position, disc.velocity, disc.state, disc.facing])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const p = physRef.current
    const dt = Math.min(delta, 0.05) // cap delta for stability

    if (p.captured) {
      // Float up and shrink
      groupRef.current.position.lerp(
        new THREE.Vector3(p.position.x, 3, p.position.z), 0.06
      )
      groupRef.current.scale.lerp(new THREE.Vector3(0.01, 0.01, 0.01), 0.05)
      return
    }

    // Apply physics: velocity + friction
    const friction = config.surfaceFriction || 0.94
    p.velocity.multiplyScalar(Math.pow(friction, dt * 60))
    p.position.add(p.velocity.clone().multiplyScalar(dt * 4))

    // Ring boundary
    const dist = Math.sqrt(p.position.x**2 + p.position.z**2)
    if (dist > config.radius * 0.95) {
      const nx = p.position.x / dist, nz = p.position.z / dist
      p.position.x = nx * config.radius * 0.92
      p.position.z = nz * config.radius * 0.92
      p.velocity.x *= -0.3; p.velocity.z *= -0.3
    }

    // Apply to group
    groupRef.current.position.copy(p.position)
    groupRef.current.position.y = 0.08

    // Rotation: spin based on velocity magnitude
    const speed = p.velocity.length()
    if (speed > 0.01) {
      p.angularVel += speed * 0.3
      if (p.angularVel > 8) p.angularVel = 8
    }
    p.angularVel *= 0.97
    groupRef.current.rotation.z += p.angularVel * dt
    groupRef.current.rotation.y += p.angularVel * dt * 0.4

    // Flip: always face up toward camera-ish direction
    // Show front face by default, flip to back when facing is "back"
    groupRef.current.rotation.x = p.facingFront ? 0 : Math.PI
  })

  // Don't render captured discs
  if (physRef.current.captured) return null

  return (
    <group ref={groupRef} position={[disc.position[0], 0.08, disc.position[2]]}>
      <TazoDisc3D
        name={disc.tazoName}
        franchise={disc.franchise}
        imageUrl={disc.imageUrl}
        backImageUrl={disc.backImageUrl}
        size={0.38}
        autoRotate={false}
      />
    </group>
  )
}

// ─── Camera ─── (OrbitControls-based, no auto-movement) ───
function ArenaCamera() {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 9, 7)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.08}
      minDistance={4}
      maxDistance={18}
      maxPolarAngle={Math.PI / 2.2}
      minPolarAngle={0.3}
      target={[0, 0, 0]}
      enablePan={true}
      panSpeed={0.6}
      rotateSpeed={0.5}
      mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE }}
    />
  )
}

// ─── Scene ───
interface SceneProps {
  config: Arena3DConfig
  playerDiscs: DiscPhysics[]
  opponentDiscs: DiscPhysics[]
  gamePhase: string
}

function Scene({ config, playerDiscs, opponentDiscs }: SceneProps) {
  const all = useMemo(
    () => [...playerDiscs, ...opponentDiscs],
    [playerDiscs, opponentDiscs]
  )
  return (
    <>
      {/* Base lighting */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 14, 3]} intensity={0.75} />
      <directionalLight position={[-4, 8, -5]} intensity={0.2} />
      <spotLight position={[0, 14, 0]} angle={0.5} penumbra={0.5} intensity={3} color="#FFF8E0" />

      <Floor config={config} />
      <Pillars config={config} />

      {/* Directional player/opponent markers */}
      <mesh position={[0, 0.03, config.radius * 0.85]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[2, 0.6]} />
        <meshBasicMaterial color="#29ADFF" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.03, -config.radius * 0.85]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[2, 0.6]} />
        <meshBasicMaterial color="#FF004D" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {all.map((d, i) => (
        <PhysicsDisc key={d.id || `d-${i}`} disc={d} config={config} />
      ))}

      <ArenaCamera />
    </>
  )
}

// ─── Main Export ───
interface Props {
  config: Arena3DConfig
  playerDiscs: DiscPhysics[]
  opponentDiscs: DiscPhysics[]
  gamePhase: string
  children?: React.ReactNode  // overlay (launch controls, HUD)
}

export default function BattleArena3D({ config, playerDiscs, opponentDiscs, gamePhase, children }: Props) {
  return (
    <div className="w-full h-full relative" style={{ background: "#1a1a1a" }}>
      <Canvas
        camera={{ position: [0, 9, 7], fov: 40, near: 0.5, far: 60 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        dpr={[1, 2]}
        style={{ position: "absolute", inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene config={config} playerDiscs={playerDiscs} opponentDiscs={opponentDiscs} gamePhase={gamePhase} />
        </Suspense>
      </Canvas>

      {/* Overlay content (launch controls, HUD, etc.) */}
      {children && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="pointer-events-auto">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
