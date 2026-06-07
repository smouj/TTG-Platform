// ============================================================
// Trading Tazos Game — Battle Arena 3D v3 (Vertical Slam)
//
// CORRECT MECHANIC:
//  - Staked tazos sit face-down on the arena center
//  - Launcher tazo hangs in the AIR above the circle
//  - Falls vertically on release — impacts face-down tazos
//  - Impact solves flip, wobble, or miss
//  - Camera: top-down aiming → side charging → cinematic slam
// ============================================================
"use client"

import { Suspense, useRef, useMemo, useEffect, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import type { Arena3DConfig, StakedTazo, AirborneTazo } from "@/lib/battle/game-loop"
import TazoDisc3D from "../3d/tazo-disc-3d"

// ─── Floor (arena surface with center circle) ───
function Floor({ config }: { config: Arena3DConfig }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 1024; c.height = 1024
    const ctx = c.getContext("2d")!
    // Radial gradient — light center, darker edges
    const g = ctx.createRadialGradient(512, 512, 30, 512, 512, 540)
    g.addColorStop(0, "#fdf9f0"); g.addColorStop(0.55, "#f0e8d8")
    g.addColorStop(0.88, "#d4c8b0"); g.addColorStop(1, "#a89880")
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 1024)
    // Yellow circle border
    ctx.strokeStyle = "#FFCC00"; ctx.lineWidth = 26
    ctx.beginPath(); ctx.arc(512, 512, config.radius * 48, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(512, 512, config.radius * 48, 0, Math.PI * 2); ctx.stroke()
    // Concentric guide rings
    ctx.strokeStyle = "rgba(0,0,0,0.04)"; ctx.lineWidth = 2
    for (let r = 65; r < config.radius * 45; r += 70) {
      ctx.beginPath(); ctx.arc(512, 512, r, 0, Math.PI * 2); ctx.stroke()
    }
    // Center dot
    ctx.fillStyle = "rgba(255,204,0,0.3)"; ctx.beginPath()
    ctx.arc(512, 512, 14, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.beginPath()
    ctx.arc(512, 512, 5, 0, Math.PI * 2); ctx.fill()
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter
    return t
  }, [config.radius])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[config.radius * 2.6, config.radius * 2.6]} />
      <meshStandardMaterial map={tex} roughness={0.7} metalness={0.02} />
    </mesh>
  )
}

// ─── Pillars (arena boundary decoration) ───
function Pillars({ config }: { config: Arena3DConfig }) {
  const pts = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2
      return { x: Math.cos(a) * config.radius * 1.2, z: Math.sin(a) * config.radius * 1.2 }
    })
  }, [config.radius])
  return (
    <>
      {pts.map((p, i) => (
        <group key={i} position={[p.x, 0.7, p.z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.16, 1.4, 8]} />
            <meshStandardMaterial color="#d0c8b8" roughness={0.6} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.10, 12, 12]} />
            <meshStandardMaterial color="#FF8800" emissive="#FF8800" emissiveIntensity={0.4} roughness={0.15} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// ─── Reticle ring (target indicator) ───
function Reticle({
  position, visible,
}: {
  position: [number, number, number]
  visible: boolean
}) {
  if (!visible) return null
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.46, 32]} />
        <meshBasicMaterial color="#FFCC00" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.38, 0.40, 24]} />
        <meshBasicMaterial color="#FFCC00" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      {/* Crosshair lines */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.04, 0.01, 0.8]} />
        <meshStandardMaterial color="#FFCC00" emissive="#FFCC00" emissiveIntensity={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.01, 0.04]} />
        <meshStandardMaterial color="#FFCC00" emissive="#FFCC00" emissiveIntensity={0.6} roughness={0.2} />
      </mesh>
    </group>
  )
}

// ─── Staked Tazo (face-down on arena) ───
function StakedTazoMesh({ staked }: { staked: StakedTazo }) {
  const groupRef = useRef<THREE.Group>(null!)
  const wobbleRef = useRef({ intensity: 0, time: 0 })

  // Sync wobble intensity from props
  useEffect(() => {
    wobbleRef.current.intensity = staked.wobbleIntensity
    wobbleRef.current.time = 0
  }, [staked.wobbleIntensity])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const w = wobbleRef.current

    // Wobble animation
    if (w.intensity > 0.01 && staked.state === "wobbling") {
      w.time += delta * 25
      w.intensity *= 0.92  // Decay
      const wobX = Math.sin(w.time * 2.3) * w.intensity * 0.06
      const wobZ = Math.cos(w.time * 1.7) * w.intensity * 0.06
      groupRef.current.rotation.set(wobX, 0, wobZ)
      groupRef.current.position.y = 0.06 + Math.abs(Math.sin(w.time * 3)) * w.intensity * 0.03
    } else if (staked.state === "wobbling") {
      // Settling
      groupRef.current.rotation.set(0, 0, 0)
      groupRef.current.position.y = 0.06
    }

    // Half-flip: rotate toward face-up
    if (staked.state === "half_flip") {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x, Math.PI * 0.5, 0.08
      )
    }

    // Face-up / secured / captured
    if (staked.state === "face_up" || staked.state === "secured" || staked.state === "captured") {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x, Math.PI, 0.15
      )
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y, 0.06, 0.15
      )
    }

    // Ring-out: slide away and fade
    if (staked.state === "out_of_circle") {
      groupRef.current.position.x += (staked.position[0] * 1.5 - groupRef.current.position.x) * 0.05
      groupRef.current.position.z += (staked.position[2] * 1.5 - groupRef.current.position.z) * 0.05
      groupRef.current.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.03)
    }
  })

  if (staked.state === "out_of_circle") {
    const isGone = Math.abs(groupRef.current?.position.x || 0) > 6
    if (isGone) return null
  }

  // Color tint for secured/captured
  const getGlow = () => {
    if (staked.state === "secured") return "#22C55E"  // Green
    if (staked.state === "captured") return "#FF004D"  // Red
    return undefined
  }

  return (
    <group
      ref={groupRef}
      position={[staked.position[0], 0.06, staked.position[2]]}
      rotation={[Math.PI, 0, 0]}  // Face-down default
    >
      <TazoDisc3D
        name={staked.tazoName}
        franchise={staked.franchise}
        imageUrl={staked.imageUrl}
        backImageUrl={staked.backImageUrl}
        size={0.38}
        autoRotate={false}
      />
      {/* Glow ring for secured/captured */}
      {getGlow() && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[0.38, 0.42, 32]} />
          <meshBasicMaterial color={getGlow()} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

// ─── Airborne Launcher Tazo ───
function AirborneTazoMesh({
  airborne, isPlayer,
}: {
  airborne: AirborneTazo
  isPlayer: boolean
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const physRef = useRef({
    pos: new THREE.Vector3(...airborne.position),
    vel: new THREE.Vector3(0, 0, 0),
    falling: false,
    impactTime: 0,
  })

  useEffect(() => {
    const p = physRef.current
    p.pos.set(...airborne.position)
    if (airborne.state === "falling") {
      p.falling = true
      p.impactTime = 0
    }
    if (airborne.state === "aiming" || airborne.state === "charging") {
      p.falling = false
    }
  }, [airborne.position, airborne.state])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const p = physRef.current
    const dt = Math.min(delta, 0.05)

    if (p.falling) {
      // Gravity fall
      p.vel.y -= 22 * dt
      p.pos.add(p.vel.clone().multiplyScalar(dt))

      // Hit table
      if (p.pos.y < 0.06) {
        p.pos.y = 0.06
        p.falling = false
        p.vel.set(0, 0, 0)
        p.impactTime = 1.0
      }
    } else if (p.impactTime > 0) {
      p.impactTime = Math.max(0, p.impactTime - dt * 4)
    }

    groupRef.current.position.copy(p.pos)

    // Apply tilt from airborne data
    groupRef.current.rotation.set(
      airborne.tilt[0],
      airborne.tilt[1],
      airborne.tilt[2]
    )

    // Impact flash
    if (p.impactTime > 0) {
      const s = 1 + p.impactTime * 0.4
      groupRef.current.scale.setScalar(s)
    } else {
      groupRef.current.scale.setScalar(1)
    }
  })

  if (airborne.state === "idle") return null

  return (
    <group ref={groupRef} position={airborne.position}>
      {/* Charge glow ring */}
      {airborne.state === "charging" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}>
          <ringGeometry args={[0.44, 0.46, 32]} />
          <meshBasicMaterial
            color="#FFCC00"
            transparent
            opacity={0.3 + airborne.charge * 0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {/* Drop shadow on table */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[
          airborne.position[0] - (airborne.position[1] > 1 ? airborne.position[0] * 0.3 : 0),
          0.02,
          airborne.position[2] - (airborne.position[1] > 1 ? airborne.position[2] * 0.3 : 0),
        ]}
        scale={[0.4 + Math.max(0, 1 - airborne.position[1] / 5) * 0.1, 1, 0.4]}
      >
        <planeGeometry args={[0.4, 0.4]} />
        <meshBasicMaterial color="#000" transparent opacity={0.15} depthWrite={false} />
      </mesh>
      <TazoDisc3D
        name={airborne.tazoName}
        franchise={airborne.franchise}
        imageUrl={airborne.imageUrl}
        backImageUrl={airborne.backImageUrl}
        finish={airborne.finish}
        size={0.38}
        autoRotate={false}
      />
      {/* Impact ring flash */}
      {physRef.current.impactTime > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.2 * (2 - physRef.current.impactTime), 0.6 * (2 - physRef.current.impactTime), 32]} />
          <meshBasicMaterial
            color="#FFCC00"
            transparent
            opacity={physRef.current.impactTime * 0.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}

// ─── Camera (adaptive to game phase) ───
function ArenaCamera({ gamePhase }: { gamePhase: string }) {
  const { camera } = useThree()
  const targetRef = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(() => {
    if (gamePhase === "player_aim" || gamePhase === "placing_stakes") {
      // Top-down view for aiming
      const target = new THREE.Vector3(0, 0, 0)
      const pos = new THREE.Vector3(0, 12, 0.5)
      targetRef.current.lerp(target, 0.05)
      camera.position.lerp(pos, 0.04)
      camera.lookAt(targetRef.current)
    } else if (gamePhase === "player_charge" || gamePhase === "player_tilt") {
      // Side-angled view to see height & tilt
      const target = new THREE.Vector3(0, 2, 0)
      const pos = new THREE.Vector3(6, 7, 6)
      targetRef.current.lerp(target, 0.06)
      camera.position.lerp(pos, 0.05)
      camera.lookAt(targetRef.current)
    } else if (gamePhase === "slamming" || gamePhase === "impact" || gamePhase === "resolve_impact") {
      // Low cinematic angle to see the impact
      const target = new THREE.Vector3(0, 0.3, 0)
      const pos = new THREE.Vector3(3, 3.5, 4)
      targetRef.current.lerp(target, 0.08)
      camera.position.lerp(pos, 0.06)
      camera.lookAt(targetRef.current)
    } else {
      // Default: orbit-friendly position
      const target = new THREE.Vector3(0, 0.5, 0)
      const pos = new THREE.Vector3(4, 8, 5)
      targetRef.current.lerp(target, 0.03)
      camera.position.lerp(pos, 0.03)
      camera.lookAt(targetRef.current)
    }
  })

  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.08}
      minDistance={3}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2.2}
      minPolarAngle={0.2}
      target={[0, 0.3, 0]}
      enablePan={true}
      panSpeed={0.6}
      rotateSpeed={0.4}
      enabled={gamePhase !== "slamming" && gamePhase !== "impact"}
      mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE }}
    />
  )
}

// ─── Scene ───
interface SceneProps {
  config: Arena3DConfig
  stakedTazos: StakedTazo[]
  airborneTazo: AirborneTazo | null
  gamePhase: string
  showReticle: boolean
  reticleX: number
  reticleZ: number
}

function Scene({
  config, stakedTazos, airborneTazo,
  gamePhase, showReticle, reticleX, reticleZ,
}: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 14, 3]} intensity={0.75} />
      <directionalLight position={[-4, 8, -5]} intensity={0.2} />
      <spotLight position={[0, 14, 0]} angle={0.5} penumbra={0.5} intensity={3} color="#FFF8E0" />

      <Floor config={config} />
      <Pillars config={config} />

      {/* Player/opponent direction markers */}
      <mesh position={[0, 0.03, config.radius * 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 0.5]} />
        <meshBasicMaterial color="#29ADFF" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.03, -config.radius * 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.6, 0.5]} />
        <meshBasicMaterial color="#FF004D" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Staked tazos */}
      {stakedTazos.map(st => (
        <StakedTazoMesh key={st.id} staked={st} />
      ))}

      {/* Airborne launcher */}
      {airborneTazo && (
        <AirborneTazoMesh
          airborne={airborneTazo}
          isPlayer={airborneTazo.owner === "player"}
        />
      )}

      {/* Reticle */}
      <Reticle
        position={[reticleX, 0.06, reticleZ]}
        visible={showReticle}
      />

      <ArenaCamera gamePhase={gamePhase} />
    </>
  )
}

// ─── Main Export ───
interface Props {
  config: Arena3DConfig
  stakedTazos: StakedTazo[]
  airborneTazo: AirborneTazo | null
  gamePhase: string
  showReticle?: boolean
  reticleX?: number
  reticleZ?: number
  children?: React.ReactNode
}

export default function BattleArena3D({
  config, stakedTazos, airborneTazo, gamePhase,
  showReticle = false, reticleX = 0, reticleZ = 0,
  children,
}: Props) {
  return (
    <div className="w-full h-full relative" style={{ background: "#1a1a1a" }}>
      <Canvas
        camera={{ position: [0, 9, 7], fov: 40, near: 0.5, far: 80 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        dpr={[1, 2]}
        style={{ position: "absolute", inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene
            config={config}
            stakedTazos={stakedTazos}
            airborneTazo={airborneTazo}
            gamePhase={gamePhase}
            showReticle={showReticle}
            reticleX={reticleX}
            reticleZ={reticleZ}
          />
        </Suspense>
      </Canvas>

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
