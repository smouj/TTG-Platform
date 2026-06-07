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

// ─── Impact spark ring (expands on slam) ───
function ImpactSpark({ trigger, pos }: { trigger: number; pos: [number, number, number] }) {
  const ringRef = useRef<THREE.Mesh>(null!)
  const timeRef = useRef(0)
  
  useEffect(() => {
    if (trigger > 0) {
      timeRef.current = 1.0
      if (ringRef.current) {
        ringRef.current.visible = true
        ringRef.current.scale.setScalar(0.2)
      }
    }
  }, [trigger])
  
  useFrame((_, delta) => {
    if (!ringRef.current || timeRef.current <= 0) return
    timeRef.current -= delta * 3
    const s = 0.2 + (1 - timeRef.current) * 2.5
    ringRef.current.scale.setScalar(Math.min(s, 3.0))
    const mat = ringRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = Math.max(0, timeRef.current * 0.7)
    if (timeRef.current <= 0) ringRef.current.visible = false
  })

  return (
    <mesh ref={ringRef} position={[pos[0], 0.04, pos[2]]} rotation={[-Math.PI/2, 0, 0]} visible={false}>
      <ringGeometry args={[0.15, 0.2, 32]} />
      <meshBasicMaterial color="#FFCC00" transparent opacity={0.8} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

// ─── Floor (arena surface with center circle) ───
function Floor({ config }: { config: Arena3DConfig }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 1024; c.height = 1024
    const ctx = c.getContext("2d")!
    // Fondo de madera cálida con gradiente radial
    const g = ctx.createRadialGradient(512, 512, 20, 512, 512, 550)
    g.addColorStop(0, "#fffaf0"); g.addColorStop(0.45, "#f5ead0")
    g.addColorStop(0.75, "#e0d4b8"); g.addColorStop(0.92, "#c8b898")
    g.addColorStop(1, "#a09070")
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 1024)
    // Grain texture
    ctx.fillStyle = "rgba(0,0,0,0.02)"
    for (let i = 0; i < 600; i++) {
      ctx.fillRect(Math.random()*1024, Math.random()*1024, 2, 2)
    }
    // Outer circle (ammonite)
    ctx.strokeStyle = "#b8a888"; ctx.lineWidth = 20
    ctx.beginPath(); ctx.arc(512, 512, config.radius * 48, 0, Math.PI * 2); ctx.stroke()
    // Inner gold ring
    ctx.strokeStyle = "#FFCC00"; ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(512, 512, config.radius * 48 - 10, 0, Math.PI * 2); ctx.stroke()
    // Dark outline
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(512, 512, config.radius * 48 + 10, 0, Math.PI * 2); ctx.stroke()
    // Concentric guide rings (faint)
    ctx.strokeStyle = "rgba(0,0,0,0.03)"; ctx.lineWidth = 1.5
    for (let r = 80; r < config.radius * 42; r += 80) {
      ctx.beginPath(); ctx.arc(512, 512, r, 0, Math.PI * 2); ctx.stroke()
    }
    // Center dot
    ctx.fillStyle = "rgba(255,204,0,0.40)"; ctx.beginPath()
    ctx.arc(512, 512, 18, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = "rgba(0,0,0,0.15)"; ctx.beginPath()
    ctx.arc(512, 512, 6, 0, Math.PI * 2); ctx.fill()
    // Stake position marks
    ctx.fillStyle = "rgba(41,173,255,0.25)"; ctx.beginPath()
    ctx.arc(512 - config.radius * 26, 512, 10, 0, Math.PI*2); ctx.fill()
    ctx.fillStyle = "rgba(255,0,77,0.25)"; ctx.beginPath()
    ctx.arc(512 + config.radius * 26, 512, 8, 0, Math.PI*2); ctx.fill()
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter
    return t
  }, [config.radius])
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[config.radius * 2.6, config.radius * 2.6]} />
      <meshStandardMaterial map={tex} roughness={0.55} metalness={0.03} />
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

// ─── Reticle ring (target indicator) with impact ghost ───
function Reticle({
  position, visible, gamePhase,
}: {
  position: [number, number, number]
  visible: boolean
  gamePhase: string
}) {
  if (!visible) return null
  const isCharging = gamePhase === "player_charge" || gamePhase === "player_tilt"
  return (
    <group position={position}>
      {/* Impact ghost — grows as player charges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.44, 0.50, 32]} />
        <meshBasicMaterial
          color={isCharging ? "#FFCC00" : "#FFFFFF"}
          transparent opacity={isCharging ? 0.6 : 0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.38, 0.42, 24]} />
        <meshBasicMaterial color="#FFCC00" transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Crosshair lines */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.03, 0.005, 0.75]} />
        <meshBasicMaterial color="#FFCC00" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.75, 0.005, 0.03]} />
        <meshBasicMaterial color="#FFCC00" transparent opacity={0.5} />
      </mesh>
      {/* Center dot */}
      <mesh position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#FFCC00" />
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
      groupRef.current.rotation.set(Math.PI + wobX, 0, wobZ)
      groupRef.current.position.y = 0.06 + Math.abs(Math.sin(w.time * 3)) * w.intensity * 0.03
    } else if (staked.state === "wobbling") {
      // Settling back to face-down
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x, Math.PI, 0.08
      )
      groupRef.current.position.y = 0.06
    }

    // Half-flip: partially lifted
    if (staked.state === "half_flip") {
      const targetXR = Math.PI / 2
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x, targetXR, 0.08
      )
      // Lift slightly during half-flip
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y, 0.12, 0.1
      )
    }

    // Face-up / secured / captured — flip to show front face
    // Face-down = Math.PI, Face-up = 0 (shortest rotation path through PI/2)
    if (staked.state === "face_up" || staked.state === "secured" || staked.state === "captured") {
      const targetXR = 0  // Face-up (front art visible from above)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x, targetXR, 0.12
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
      {/* Glow ring for secured/captured — at top of tazo disc */}
      {getGlow() && (
        <mesh position={[0, 0.02, 0]}>
          <ringGeometry args={[0.40, 0.44, 32]} />
          <meshBasicMaterial color={getGlow()} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
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
      // Gravity fall — visible dramatic descent
      p.vel.y -= 22 * dt
      p.pos.add(p.vel.clone().multiplyScalar(dt))

      // Hit table
      if (p.pos.y < 0.06) {
        p.pos.y = 0.06
        p.falling = false
        p.vel.set(0, 0, 0)
        p.impactTime = 1.0
        // Flash the impact light on hit
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

    // Scale up during falling for dramatic effect
    if (p.falling) {
      const hFactor = 1 + (p.pos.y / 7) * 0.25 // Larger when higher, normal at table
      groupRef.current.scale.setScalar(hFactor)
    } else if (p.impactTime > 0) {
      const s = 1 + p.impactTime * 0.45
      groupRef.current.scale.setScalar(s)
    } else {
      groupRef.current.scale.setScalar(1)
    }
  })

  if (airborne.state === "idle") {
    // Show tazo floating but without effects — it's on the bench waiting
    return (
      <group ref={groupRef} position={airborne.position}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.3, 0.33, 32]} />
          <meshBasicMaterial color={isPlayer ? "#29ADFF" : "#FF004D"} transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <TazoDisc3D
          name={airborne.tazoName}
          franchise={airborne.franchise}
          imageUrl={airborne.imageUrl}
          backImageUrl={airborne.backImageUrl}
          finish={airborne.finish}
          size={0.38}
          autoRotate={true}
        />
      </group>
    )
  }

  return (
    <group ref={groupRef} position={airborne.position}>
      {/* Motion trail during falling — vertical streak */}
      {airborne.state === "falling" && (
        <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, physRef.current.pos.y * 1.5]} />
          <meshBasicMaterial
            color={isPlayer ? "#29ADFF" : "#FF004D"}
            transparent
            opacity={0.15}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* Charge glow ring — horizontal on table */}
      {airborne.state === "charging" && (
        <mesh position={[0, 0.03, 0]}>
          <ringGeometry args={[0.44, 0.46, 32]} />
          <meshBasicMaterial
            color="#FFCC00"
            transparent
            opacity={0.25 + airborne.charge * 0.5}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* Drop shadow on table — stays at table level, tracks launcher in XZ */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[airborne.position[0], 0.03, airborne.position[2]]}
        scale={[0.35, 1, 0.35]}
      >
        <planeGeometry args={[0.4, 0.4]} />
        <meshBasicMaterial color="#000" transparent opacity={0.12} depthWrite={false} />
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
      {/* Impact ring flash — horizontal on table */}
      {physRef.current.impactTime > 0 && (
        <mesh position={[0, 0.03, 0]}>
          <ringGeometry args={[0.15 * (2 - physRef.current.impactTime), 0.55 * (2 - physRef.current.impactTime), 32]} />
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

// ─── Impact flash light (momentary bright light on slam impact) ───
function ImpactLight({ impactPhase }: { impactPhase: string }) {
  const lightRef = useRef<THREE.PointLight>(null!)
  useFrame((_, delta) => {
    if (!lightRef.current) return
    if (impactPhase === "impact" || impactPhase === "slamming") {
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 8, 0.3)
    } else {
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0, 0.15)
    }
  })
  return (
    <pointLight ref={lightRef} position={[0, 0.8, 0]} intensity={0} color="#FFF8E0" distance={8} decay={2} />
  )
}

// ─── Camera (adaptive to game phase) with screen shake on impact ───
function ArenaCamera({ gamePhase }: { gamePhase: string }) {
  const { camera } = useThree()
  const targetRef = useRef(new THREE.Vector3(0, 0, 0))
  const shakeRef = useRef({ intensity: 0, time: 0 })

  // Trigger shake on impact
  useEffect(() => {
    if (gamePhase === "impact" || gamePhase === "slamming") {
      shakeRef.current.intensity = 1
      shakeRef.current.time = 0
    }
  }, [gamePhase])

  useFrame(() => {
    // Screen shake
    const sh = shakeRef.current
    if (sh.intensity > 0.01) {
      sh.time += 0.16
      sh.intensity *= 0.88
      const sx = Math.sin(sh.time * 31) * sh.intensity * 0.15
      const sy = Math.cos(sh.time * 37) * sh.intensity * 0.08
      const sz = Math.sin(sh.time * 29) * sh.intensity * 0.1
      camera.position.x += sx; camera.position.y += sy; camera.position.z += sz
    }

    if (gamePhase === "player_aim" || gamePhase === "placing_stakes") {
      // Bird's-eye for aiming — see the full circle
      const target = new THREE.Vector3(0, 0, 0)
      const pos = new THREE.Vector3(0, 14, 1)
      targetRef.current.lerp(target, 0.06)
      camera.position.lerp(pos, 0.05)
      camera.lookAt(targetRef.current)
    } else if (gamePhase === "player_charge" || gamePhase === "player_tilt") {
      // Angled view showing height + tilt — pull back slightly
      const target = new THREE.Vector3(0, 2, 0)
      const pos = new THREE.Vector3(7, 8, 7)
      targetRef.current.lerp(target, 0.06)
      camera.position.lerp(pos, 0.05)
      camera.lookAt(targetRef.current)
    } else if (gamePhase === "slamming" || gamePhase === "impact" || gamePhase === "resolve_impact") {
      // Low cinematic angle to see the impact — tighter on the action
      const target = new THREE.Vector3(0, 0.2, 0)
      const pos = new THREE.Vector3(4, 3, 5)
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
  const [impactCount, setImpactCount] = useState(0)
  const prevPhase = useRef(gamePhase)
  
  // Trigger spark on impact
  useEffect(() => {
    if (gamePhase === "impact" && prevPhase.current !== "impact") {
      setImpactCount(c => c + 1)
    }
    prevPhase.current = gamePhase
  }, [gamePhase])

  // Impact position: use the airborne tazo's target or center
  const impactPos = useMemo(() => {
    if (airborneTazo) {
      return [airborneTazo.position[0], 0.04, airborneTazo.position[2]] as [number, number, number]
    }
    return [0, 0.04, 0] as [number, number, number]
  }, [airborneTazo?.position])
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 14, 3]} intensity={0.7} />
      <directionalLight position={[-4, 8, -5]} intensity={0.15} />
      <spotLight position={[0, 12, 0]} angle={0.7} penumbra={0.6} intensity={2.5} color="#FFF5E0" />

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
        gamePhase={gamePhase}
      />

      <ArenaCamera gamePhase={gamePhase} />

      {/* Impact flash light */}
      <ImpactLight impactPhase={gamePhase} />

      {/* Impact spark burst */}
      <ImpactSpark trigger={impactCount} pos={impactPos} />
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
    <div className="w-full h-full relative" style={{ background: "radial-gradient(ellipse at center, #2a2a2a 0%, #1a1a1a 55%, #0a0a0a 100%)" }}>
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
