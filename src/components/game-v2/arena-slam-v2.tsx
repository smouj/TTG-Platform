// ============================================================
// Arena Slam v2 — Jump Mechanics (v3)
// OrbitControls · Camera presets · Grid · Particles · Wall
// ============================================================
"use client"

import { useRef, useState, useCallback, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import {
  ARENA_RADIUS, DISC_RADIUS,
  MIN_LAUNCH_SPEED,
  calculateLaunchVelocity, calculateTrajectoryPreview,
  simulateStep, allStopped, createDemoDisc, spreadDiscs,
  type DiscState, type DragState,
  type ImpactEvent, type ImpactType, type TrajectoryPoint,
} from "@/lib/battle-v2/physics"
import TazoDisc3D from "@/components/game/3d/tazo-disc-3d"

// ─── Camera presets ───
type CamPreset = "default" | "top" | "side" | "player"

const CAM_PRESETS: Record<CamPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  default: { pos: [0, 9, 15], target: [0, 0, 0] },
  top:     { pos: [0, 18, 0.1], target: [0, 0, 0] },
  side:    { pos: [0, 5, 18], target: [0, 0, -1] },
  player:  { pos: [0, 3, 6], target: [0, 0, -3] },
}

// ─── Camera controller (preset + OrbitControls) ───
function CameraController({ preset, orbitEnabled }: { preset: CamPreset; orbitEnabled: boolean }) {
  const { camera } = useThree()
  const targetRef = useRef(new THREE.Vector3(0, 0, 0))
  const posRef = useRef(new THREE.Vector3())

  useEffect(() => {
    const p = CAM_PRESETS[preset]
    posRef.current.set(...p.pos)
    targetRef.current.set(...p.target)
  }, [preset])

  useFrame((_, delta) => {
    if (orbitEnabled) return // OrbitControls handles camera
    // Smooth transition to preset
    camera.position.lerp(posRef.current, delta * 3)
    camera.lookAt(targetRef.current)
  })

  return orbitEnabled ? (
    <OrbitControls
      enableDamping
      dampingFactor={0.08}
      minDistance={6}
      maxDistance={25}
      maxPolarAngle={Math.PI * 0.48}
      minPolarAngle={0.1}
      target={[0, 0, 0]}
    />
  ) : null
}

// ─── Force color ───
function forceColor(ratio: number): string {
  if (ratio < 0.18) return "#44FF66"
  if (ratio < 0.38) return "#FFCC00"
  if (ratio < 0.58) return "#FF8800"
  if (ratio < 0.78) return "#FF4444"
  return "#FF2222"
}

// ═══ 3D ELEMENTS ═══

// ─── Arena Floor with Grid ───
function ArenaFloorV3() {
  const tex = useMemo(() => {
    const sz = 1024
    const c = document.createElement("canvas")
    c.width = sz; c.height = sz
    const ctx = c.getContext("2d")!
    const mid = sz / 2
    const px = (v: number) => mid + v * (mid / ARENA_RADIUS)

    // Base gradient
    const g = ctx.createRadialGradient(mid, mid, 40, mid, mid, mid)
    g.addColorStop(0, "#1c1c32")
    g.addColorStop(0.3, "#141428")
    g.addColorStop(0.6, "#0e0e1c")
    g.addColorStop(0.9, "#080812")
    g.addColorStop(1, "#040408")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, sz, sz)

    // Grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.025)"
    ctx.lineWidth = 1
    for (let i = -ARENA_RADIUS; i <= ARENA_RADIUS; i += 1) {
      const p = px(i)
      ctx.beginPath(); ctx.moveTo(p, px(-ARENA_RADIUS)); ctx.lineTo(p, px(ARENA_RADIUS)); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(px(-ARENA_RADIUS), p); ctx.lineTo(px(ARENA_RADIUS), p); ctx.stroke()
    }

    // Concentric rings
    for (let r = 1; r <= ARENA_RADIUS; r += 1) {
      ctx.strokeStyle = `rgba(255, 204, 0, ${0.04 + r * 0.008})`
      ctx.lineWidth = r === Math.floor(ARENA_RADIUS) ? 2 : 0.8
      ctx.beginPath(); ctx.arc(mid, mid, px(r) - mid, 0, Math.PI * 2); ctx.stroke()
    }

    // Center mark
    ctx.fillStyle = "rgba(255, 204, 0, 0.12)"
    ctx.beginPath(); ctx.arc(mid, mid, 15, 0, Math.PI * 2); ctx.fill()

    // Half-line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)"
    ctx.lineWidth = 1.5
    ctx.setLineDash([8, 16])
    ctx.beginPath(); ctx.moveTo(px(-ARENA_RADIUS), mid); ctx.lineTo(px(ARENA_RADIUS), mid); ctx.stroke()
    ctx.setLineDash([])

    // Zone labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)"
    ctx.font = "bold 20px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("YOUR ZONE", mid, px(1.8))
    ctx.fillText("RIVAL ZONE", mid, px(-2.0))

    return new THREE.CanvasTexture(c)
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <circleGeometry args={[ARENA_RADIUS + 0.6, 64]} />
      <meshStandardMaterial map={tex} roughness={0.5} metalness={0.03} />
    </mesh>
  )
}

// ─── Arena 3D Wall ───
function ArenaWallV3() {
  return (
    <group>
      {/* Outer wall ring — horizontal on ground */}
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[ARENA_RADIUS, 0.15, 12, 72]} />
        <meshStandardMaterial color="#FFCC00" roughness={0.2} metalness={0.7} emissive="#FFCC00" emissiveIntensity={0.15} />
      </mesh>
      {/* Inner glow ring — horizontal */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ARENA_RADIUS - 0.05, 0.03, 8, 72]} />
        <meshBasicMaterial color="#FFCC00" transparent opacity={0.35} />
      </mesh>
    </group>
  )
}

// ─── Tazo Disc with Shadow + Glow ───
function TazoDiscV3({ disc, isSelected, isDragging, dragRatio }: {
  disc: DiscState
  isSelected: boolean
  isDragging: boolean
  dragRatio: number
}) {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return

    g.position.lerp(new THREE.Vector3(disc.x, Math.max(disc.y, 0.02), disc.z), Math.min(1, delta * 20))

    // Flip flatten
    if (disc.flipped) {
      g.scale.y = THREE.MathUtils.lerp(g.scale.y, 0.04, 0.09)
    } else {
      g.scale.y = THREE.MathUtils.lerp(g.scale.y, 1, 0.12)
    }

    // Selection pulse
    if (isSelected && !disc.moving && !disc.flying) {
      const p = 1 + Math.sin(Date.now() * 0.0035) * 0.06
      g.scale.x = THREE.MathUtils.lerp(g.scale.x, p, 0.3)
      g.scale.z = THREE.MathUtils.lerp(g.scale.z, p, 0.3)
    } else if (!isDragging) {
      g.scale.x = THREE.MathUtils.lerp(g.scale.x, 1, 0.2)
      g.scale.z = THREE.MathUtils.lerp(g.scale.z, 1, 0.2)
    }
  })

  const franchise = disc.franchise || "minimon"
  const baseY = disc.flipped ? 0.015 : Math.max(disc.y, 0.02)

  return (
    <group ref={groupRef} position={[disc.x, baseY, disc.z]}>
      {/* Selection ring */}
      {isSelected && !disc.moving && !disc.flying && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[DISC_RADIUS + 0.03, DISC_RADIUS + 0.14, 40]} />
          <meshBasicMaterial color={forceColor(dragRatio)} transparent opacity={0.35} side={2} depthWrite={false} />
        </mesh>
      )}

      {/* Flip indicator */}
      {disc.flipped && (
        <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[DISC_RADIUS - 0.03, DISC_RADIUS + 0.06, 20]} />
          <meshBasicMaterial color="#FF3333" transparent opacity={0.45} side={2} depthWrite={false} />
        </mesh>
      )}

      {/* Flying shadow */}
      {disc.flying && disc.y > 0.5 && (
        <mesh position={[0, -disc.y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[DISC_RADIUS * 0.75, 16]} />
          <meshBasicMaterial color="#000" transparent opacity={Math.max(0, 0.35 - disc.y * 0.025)} depthWrite={false} />
        </mesh>
      )}

      <TazoDisc3D
        name={disc.name}
        franchise={franchise}
        imageUrl={disc.flipped ? disc.imageUrl : (disc.backImageUrl || disc.imageUrl)}
        backImageUrl={disc.flipped ? (disc.backImageUrl || disc.imageUrl) : disc.imageUrl}
        size={DISC_RADIUS * 1.05}
        autoRotate={disc.flying}
        finish={disc.finish}
      />
    </group>
  )
}

// ─── Trajectory Arc (tube geometry for visibility) ───
function TrajectoryArcV3({ points, dragRatio }: { points: TrajectoryPoint[]; dragRatio: number }) {
  const meshRef = useRef<THREE.Mesh>(null!)

  useEffect(() => {
    if (!meshRef.current || points.length < 2) return
    const curve = new THREE.CatmullRomCurve3(
      points.map(p => new THREE.Vector3(p.x, Math.max(p.y, 0.02), p.z)),
      false, "catmullrom", 0.5
    )
    const tubeGeom = new THREE.TubeGeometry(curve, Math.min(points.length * 2, 64), 0.04, 8, false)
    meshRef.current.geometry.dispose()
    meshRef.current.geometry = tubeGeom
  }, [points])

  if (points.length < 2) return null

  return (
    <mesh ref={meshRef}>
      <meshBasicMaterial
        color={forceColor(dragRatio)}
        transparent opacity={0.5}
        depthTest={true}
        depthWrite={false}
      />
    </mesh>
  )
}

// ─── Landing Zone ───
function LandingZoneV3({ x, z, dragRatio }: { x: number; z: number; dragRatio: number }) {
  return (
    <mesh position={[x, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[DISC_RADIUS * 0.85, DISC_RADIUS * 1.2, 36]} />
      <meshBasicMaterial color={forceColor(dragRatio)} transparent opacity={0.35} side={2} depthWrite={false} />
    </mesh>
  )
}

// ─── Impact Particles ───
function ImpactParticles({ impacts }: { impacts: ImpactEvent[] }) {
  const count = 12
  const refs = useRef<Map<string, {
    positions: Float32Array
    velocities: Float32Array
    life: number
    worldPos: THREE.Vector3
    meshes: THREE.Points[]
  }>>(new Map())

  const colors: Record<string, THREE.Color> = {
    capture: new THREE.Color("#44FF44"),
    deflect: new THREE.Color("#4488FF"),
    flip_hit: new THREE.Color("#FFAA00"),
    flip_miss: new THREE.Color("#FF8844"),
    ringout: new THREE.Color("#FF3333"),
    land: new THREE.Color("#CCCCCC"),
  }

  // Create points for new impacts
  impacts.forEach((impact, i) => {
    const key = `${impact.x}-${impact.z}-${impact.type}-${i}`
    if (refs.current.has(key)) return

    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let j = 0; j < count; j++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * impact.intensity * 0.5
      const up = 2 + Math.random() * impact.intensity * 0.6
      pos[j * 3] = impact.x
      pos[j * 3 + 1] = 0.05
      pos[j * 3 + 2] = impact.z
      vel[j * 3] = Math.cos(angle) * speed
      vel[j * 3 + 1] = up
      vel[j * 3 + 2] = Math.sin(angle) * speed
    }

    refs.current.set(key, {
      positions: pos, velocities: vel, life: 1.0,
      worldPos: new THREE.Vector3(impact.x, 0.05, impact.z),
      meshes: [],
    })
  })

  // Animate existing
  useFrame((_, delta) => {
    refs.current.forEach((data, key) => {
      data.life -= delta * 2.5
      if (data.life <= 0) {
        data.meshes.forEach(m => m.visible = false)
        refs.current.delete(key)
        return
      }
      for (let j = 0; j < count; j++) {
        data.velocities[j * 3 + 1] -= 15 * delta
        data.positions[j * 3] += data.velocities[j * 3] * delta
        data.positions[j * 3 + 1] += data.velocities[j * 3 + 1] * delta
        data.positions[j * 3 + 2] += data.velocities[j * 3 + 2] * delta
      }
    })
  })

  return (
    <>
      {Array.from(refs.current.entries()).map(([key, data]) => (
        <points key={key}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[data.positions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            color={colors[key.split("-")[2]] || "#FFFFFF"}
            size={0.06}
            transparent
            opacity={data.life * 0.8}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      ))}
    </>
  )
}

// ─── Camera Shake (self-resetting) ───
function CameraShakeV3({ intensity, duration }: { intensity: number; duration: number }) {
  const { camera } = useThree()
  const basePos = useRef(new THREE.Vector3())
  const timeRef = useRef(0)
  const activeRef = useRef(false)

  useEffect(() => {
    if (intensity > 0) {
      basePos.current.copy(camera.position)
      activeRef.current = true
      timeRef.current = duration
    }
  }, [intensity, duration])

  useFrame((_, delta) => {
    if (!activeRef.current) return
    timeRef.current -= delta
    if (timeRef.current <= 0) {
      activeRef.current = false
      // Reset to base position
      camera.position.copy(basePos.current)
      return
    }
    const f = timeRef.current / duration
    const offsetX = (Math.random() - 0.5) * intensity * f * 0.25
    const offsetY = (Math.random() - 0.5) * intensity * f * 0.1
    const offsetZ = (Math.random() - 0.5) * intensity * f * 0.25
    camera.position.set(
      basePos.current.x + offsetX,
      basePos.current.y + offsetY,
      basePos.current.z + offsetZ,
    )
  })

  return null
}

// ═══ HUD ═══

function ScoreHUD({ playerScore, opponentScore }: { playerScore: number; opponentScore: number }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="flex items-center gap-4 bg-black/50 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10">
        <span className="text-yellow-400 font-black text-2xl">{playerScore}</span>
        <span className="text-white/15 font-black text-xs tracking-widest">VS</span>
        <span className="text-red-400 font-black text-2xl">{opponentScore}</span>
      </div>
    </div>
  )
}

function TurnIndicator({ phase }: { phase: string }) {
  const msgs: Record<string, string> = {
    select: "Choose your tazo",
    aim: "Drag back · Release to jump!",
    resolving: "In flight...",
    opponent: "Opponent's turn",
  }
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="px-4 py-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-sm text-[10px] font-black uppercase tracking-[0.15em] text-white/50">
        {msgs[phase] || phase}
      </div>
    </div>
  )
}

function HandDisplay({ discs, selectedId, onSelect, phase }: {
  discs: DiscState[]
  selectedId: string | null
  onSelect: (id: string) => void
  phase: string
}) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-2.5 z-20">
      {discs.filter(d => !d.flipped && !d.ringOut).map(d => (
        <button
          key={d.id}
          onClick={() => phase !== "resolving" && onSelect(d.id)}
          disabled={phase === "resolving"}
          className={`relative w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-150 ${
            selectedId === d.id
              ? "border-yellow-400 bg-yellow-400/20 scale-115 shadow-lg shadow-yellow-400/25 z-10"
              : "border-white/10 bg-black/60 hover:border-white/25 hover:bg-white/5"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
            background: d.archetype === "heavy" ? "radial-gradient(circle at 30% 30%, #CD853F, #5C2E00)"
              : d.archetype === "technical" ? "radial-gradient(circle at 30% 30%, #66AAEE, #2244AA)"
              : d.archetype === "spinner" ? "radial-gradient(circle at 30% 30%, #BB55FF, #4400BB)"
              : d.archetype === "bouncer" ? "radial-gradient(circle at 30% 30%, #55CC55, #227722)"
              : d.archetype === "defender" ? "radial-gradient(circle at 30% 30%, #7788AA, #334466)"
              : "radial-gradient(circle at 30% 30%, #FFD700, #CC7700)",
            border: `2px solid ${d.owner === "player" ? "#FFCC00" : "#FF4444"}`,
          }}>
            <span className="text-[9px] font-black text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {d.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="text-[7px] font-bold text-white/35 mt-0.5 uppercase leading-none">
            {d.archetype.slice(0, 4)}
          </span>
          {/* Attack bar */}
          <div className="absolute -bottom-1.5 left-2 right-2 h-[3px] bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{
              width: `${d.stats.attack}%`,
              background: d.stats.attack >= 65 ? "#44FF44" : d.stats.attack >= 45 ? "#FFCC00" : "#FF8844",
            }} />
          </div>
        </button>
      ))}
    </div>
  )
}

function SlamTexts({ events }: { events: Array<{ text: string; x: number; z: number; color: string; id: number }> }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
      {events.map(ev => (
        <div key={ev.id} className="absolute text-center font-black uppercase animate-slam-fly"
          style={{
            left: `${50 + (ev.x / ARENA_RADIUS) * 42}%`,
            top: `${50 - (ev.z / ARENA_RADIUS) * 42}%`,
            color: ev.color,
            fontSize: "15px",
            textShadow: `0 0 15px ${ev.color}80, 0 2px 4px rgba(0,0,0,0.8)`,
          }}>
          {ev.text}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function ArenaSlamV2({ 
  initialPlayerDiscs, 
  initialOpponentDiscs 
}: {
  initialPlayerDiscs?: DiscState[]
  initialOpponentDiscs?: DiscState[]
} = {}) {
  // State
  const [discs, setDiscs] = useState<DiscState[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [phase, setPhase] = useState<"select" | "aim" | "resolving" | "opponent" | "result">("select")
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [impacts, setImpacts] = useState<ImpactEvent[]>([])
  const [playerHand, setPlayerHand] = useState<DiscState[]>([])
  const [dragState, setDragState] = useState<DragState>({ startX: 0, startZ: 0, currentX: 0, currentZ: 0, active: false })
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([])
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const [slamTexts, setSlamTexts] = useState<Array<{ text: string; x: number; z: number; color: string; id: number }>>([])
  const [textId, setTextId] = useState(0)

  // Camera
  const [camPreset, setCamPreset] = useState<CamPreset>("default")
  const [orbitMode, setOrbitMode] = useState(false)

  const arenaRef = useRef<HTMLDivElement>(null)
  const simulatingRef = useRef(false)
  const animRef = useRef(0)
  const scoreRef = useRef({ player: 0, opponent: 0 })
  const dragRef = useRef<DragState>({ startX: 0, startZ: 0, currentX: 0, currentZ: 0, active: false })
  const turnRef = useRef<"player" | "opponent">("player")

  useEffect(() => { scoreRef.current = { player: playerScore, opponent: opponentScore } }, [playerScore, opponentScore])

  // ── Setup (real data or demo) ──
  const hasRealData = !!(initialPlayerDiscs?.length && initialOpponentDiscs?.length)
  
  const demoPlayer = useMemo(() => spreadDiscs([
    createDemoDisc("p1", "TITAN", "heavy", 0, 0, "player", "dracobell"),
    createDemoDisc("p2", "BLADE", "technical", 0, 0, "player", "cybermon"),
    createDemoDisc("p3", "VORTEX", "spinner", 0, 0, "player", "minimon"),
    createDemoDisc("p4", "SHIELD", "defender", 0, 0, "player", "dracobell"),
    createDemoDisc("p5", "STRIKE", "balanced", 0, 0, "player", "cybermon"),
  ], 1), [])

  const demoOpponents = useMemo(() => spreadDiscs([
    createDemoDisc("o1", "ROCK", "defender", 0, 0, "opponent", "dracobell"),
    createDemoDisc("o2", "BYTE", "technical", 0, 0, "opponent", "cybermon"),
    createDemoDisc("o3", "SLIME", "balanced", 0, 0, "opponent", "minimon"),
  ], -1), [])

  const initDemo = useCallback(() => {
    const p = hasRealData ? (initialPlayerDiscs || []) : demoPlayer
    const o = hasRealData ? (initialOpponentDiscs || []) : demoOpponents
    setDiscs([...p, ...o])
    setPlayerHand(p)
    setSelectedId(p[0]?.id || null)
    setPhase("select")
    scoreRef.current = { player: 0, opponent: 0 }
    turnRef.current = "player"
    setPlayerScore(0)
    setOpponentScore(0)
    setImpacts([])
    setSlamTexts([])
    setDragState({ startX: 0, startZ: 0, currentX: 0, currentZ: 0, active: false })
    setTrajectory([])
  }, [demoPlayer, demoOpponents, hasRealData, initialPlayerDiscs, initialOpponentDiscs])

  useEffect(() => { initDemo() }, [initDemo])

  const selectedDisc = useMemo(() => discs.find(d => d.id === selectedId) || null, [discs, selectedId])

  const dragRatio = useMemo(() => {
    if (!dragState.active) return 0
    return Math.min(1, Math.hypot(dragState.startX - dragState.currentX, dragState.startZ - dragState.currentZ) / 2.5)
  }, [dragState])

  // ── Pointer handlers ──
  const SCREEN_SCALE = 2.6

  const getCoords = useCallback((e: React.PointerEvent) => {
    const rect = arenaRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, z: 0 }
    return {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * ARENA_RADIUS * SCREEN_SCALE * 2,
      z: ((e.clientY - rect.top) / rect.height - 0.5) * ARENA_RADIUS * SCREEN_SCALE * 2,
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== "aim" || !selectedDisc || orbitMode) return
    e.preventDefault()
    const { x, z } = getCoords(e)
    const dsStart = { startX: selectedDisc.x + x * 0.5, startZ: selectedDisc.z + z * 0.5, currentX: x, currentZ: z, active: true }
    dragRef.current = dsStart
    setDragState(dsStart)
    setTrajectory([])
  }, [phase, selectedDisc, getCoords, orbitMode])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active || !selectedDisc) return
    const { x, z } = getCoords(e)
    // Update ref immediately (no stale closure)
    dragRef.current = { ...dragRef.current, currentX: x, currentZ: z }
    setDragState(prev => ({ ...prev, currentX: x, currentZ: z }))
    const dist = Math.hypot(dragRef.current.startX - x, dragRef.current.startZ - z)
    if (dist < 0.2) { setTrajectory([]); return }

    setTrajectory(calculateTrajectoryPreview(
      selectedDisc.x, selectedDisc.z,
      dragRef.current,
      selectedDisc.stats, 70
    ))
  }, [selectedDisc, getCoords])

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current.active || !selectedDisc) return
    const finalDrag = { ...dragRef.current, active: false }
    setDragState(finalDrag)
    dragRef.current = finalDrag
    setTrajectory([])

    const { vx, vy, vz } = calculateLaunchVelocity(dragRef.current, selectedDisc.stats)
    if (Math.hypot(vx, vz) < MIN_LAUNCH_SPEED) { setPhase("aim"); return }

    setPhase("resolving")
    setDiscs(prev => prev.map(d =>
      d.id === selectedId ? { ...d, vx, vy, vz, y: 0.05, moving: true, flying: true, rotationSpeed: vx * 0.6 } : d
    ))
    simulatingRef.current = true
  }, [dragState, selectedDisc, selectedId])

  // ── Simulation ──
  const startSim = useCallback(() => {
    let lastTime = performance.now()
    const tick = () => {
      if (!simulatingRef.current) return
      const now = performance.now()
      const delta = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      setDiscs(prev => {
        const result = simulateStep(prev, delta)
        setImpacts(imp => [...imp.slice(-10), ...result.impacts.slice(-4)])

        result.discs.forEach(d => {
          const prevD = prev.find(p => p.id === d.id)
          const justLanded = prevD?.flying && !d.flying
          if (d.landedOnId && justLanded) {
            const target = result.discs.find(t => t.id === d.landedOnId)
            const isPlayer = d.owner === "player"
            if (target?.flipped) {
              isPlayer ? scoreRef.current.player++ : scoreRef.current.opponent++
              isPlayer ? setPlayerScore(s => s + 1) : setOpponentScore(s => s + 1)
              setShakeIntensity(0.7)
              setTextId(t => { const n = t + 1; setSlamTexts(p => [...p.slice(-3), { text: isPlayer ? "CAPTURE!" : "LOST!", x: d.x, z: d.z, color: isPlayer ? "#44FF44" : "#FF4444", id: n }]); return n })
            } else {
              setTextId(t => { const n = t + 1; setSlamTexts(p => [...p.slice(-3), { text: "BOUNCE!", x: d.x, z: d.z, color: "#FFAA00", id: n }]); return n })
            }
          } else if (d.ringOut && !prevD?.ringOut) {
            setShakeIntensity(0.25)
            setTextId(t => { const n = t + 1; setSlamTexts(p => [...p.slice(-3), { text: "OUT!", x: d.x, z: d.z, color: "#FF4444", id: n }]); return n })
          }
        })

        if (allStopped(result.discs)) {
          simulatingRef.current = false
          const isPlayerTurn = turnRef.current === "player"

          if (scoreRef.current.player >= 5) {
            setPhase("result")
          } else if (isPlayerTurn) {
            // Player's turn ends → now opponent's turn
            turnRef.current = "opponent"
            setPhase("opponent")
            setTimeout(() => doOpponentTurn(result.discs), 900)
          } else {
            // Opponent's turn ends → now player's turn
            turnRef.current = "player"
            setPhase("select")
          }
        }
        return result.discs
      })
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    if (phase === "resolving" && simulatingRef.current) startSim()
    return () => cancelAnimationFrame(animRef.current)
  }, [phase, startSim])

  // ── Opponent AI ──
  const doOpponentTurn = useCallback((cd: DiscState[]) => {
    const avail = cd.filter(d => d.owner === "opponent" && !d.flying && !d.flipped && !d.ringOut)
    if (!avail.length) { setPhase("select"); return }
    const attacker = avail[Math.floor(Math.random() * avail.length)]
    const pDiscs = cd.filter(d => d.owner === "player" && !d.flipped && !d.ringOut)
    const target = pDiscs.length > 0 ? pDiscs[Math.floor(Math.random() * pDiscs.length)] : null

    let aimAngle: number, aimDist: number
    if (target) {
      const dx = target.x - attacker.x, dz = target.z - attacker.z
      aimAngle = Math.atan2(dz, dx)
      aimDist = Math.hypot(dx, dz) / 3.5 + Math.random() * 0.4
    } else {
      aimAngle = Math.random() * Math.PI * 2
      aimDist = 0.6 + Math.random() * 1.2
    }
    aimAngle += (Math.random() - 0.5) * 0.3

    const fd: DragState = {
      startX: attacker.x + Math.cos(aimAngle + Math.PI) * aimDist * 0.3,
      startZ: attacker.z + Math.sin(aimAngle + Math.PI) * aimDist * 0.3,
      currentX: attacker.x - Math.cos(aimAngle + Math.PI) * aimDist * 0.7,
      currentZ: attacker.z - Math.sin(aimAngle + Math.PI) * aimDist * 0.7,
      active: true,
    }

    const launch = calculateLaunchVelocity(fd, attacker.stats)
    setDiscs(prev => prev.map(d =>
      d.id === attacker.id ? { ...d, vx: launch.vx, vy: launch.vy, vz: launch.vz, y: 0.05, moving: true, flying: true, rotationSpeed: launch.vx * 0.6 } : d
    ))
    setPhase("resolving")
    simulatingRef.current = true
  }, [])

  const handleSelectDisc = useCallback((id: string) => {
    if (phase !== "select" && phase !== "aim") return
    setSelectedId(id)
    setPhase("aim")
  }, [phase])

  useEffect(() => {
    if (!slamTexts.length) return
    const t = setTimeout(() => setSlamTexts(p => p.slice(1)), 1400)
    return () => clearTimeout(t)
  }, [slamTexts])

  // ═══ RENDER ═══
  return (
    <div ref={arenaRef} className="w-full h-full relative select-none overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #161630 0%, #0b0b18 50%, #030308 100%)" }}>

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-25 opacity-[0.02]"
        style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 4px)" }} />

      {/* HUD */}
      <ScoreHUD playerScore={playerScore} opponentScore={opponentScore} />
      <TurnIndicator phase={phase} />
      <SlamTexts events={slamTexts} />

      {/* Hand */}
      <HandDisplay discs={playerHand} selectedId={selectedId} onSelect={handleSelectDisc} phase={phase} />

      {/* Camera controls */}
      <div className="absolute top-4 right-4 z-30 flex flex-col gap-1.5">
        {(["default", "top", "side", "player"] as CamPreset[]).map(p => (
          <button key={p} onClick={() => { setOrbitMode(false); setCamPreset(p) }}
            className={`w-8 h-8 rounded-lg border text-[9px] font-black uppercase transition-all ${
              camPreset === p && !orbitMode
                ? "border-yellow-400 bg-yellow-400/20 text-yellow-400"
                : "border-white/10 bg-black/40 text-white/50 hover:border-white/25 hover:text-white/70"
            }`}>
            {p.slice(0, 2).toUpperCase()}
          </button>
        ))}
        <button onClick={() => setOrbitMode(o => !o)}
          className={`w-8 h-8 rounded-lg border text-[8px] font-black uppercase transition-all ${
            orbitMode
              ? "border-cyan-400 bg-cyan-400/20 text-cyan-400"
              : "border-white/10 bg-black/40 text-white/50 hover:border-white/25 hover:text-white/70"
          }`}>
          ORBIT
        </button>
      </div>

      {/* Instructions */}
      {phase === "aim" && dragRatio < 0.15 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <p className="text-white/25 text-[11px] font-black uppercase tracking-[0.2em] text-center animate-pulse">
            Drag back ↓ · Jump! ↗
          </p>
        </div>
      )}

      {/* Result */}
      {phase === "result" && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/70 backdrop-blur-sm">
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="text-7xl mb-2">{playerScore >= 5 ? "🏆" : "💀"}</div>
            <h2 className="text-5xl font-black text-yellow-400 uppercase tracking-wider mb-2 drop-shadow-[0_0_30px_rgba(255,204,0,0.4)]">
              {playerScore >= 5 ? "Victory!" : "Defeat"}
            </h2>
            <p className="text-white/35 text-xl mb-8">{playerScore} — {opponentScore}</p>
            <button onClick={initDemo}
              className="px-12 py-4 bg-yellow-500 text-black font-black uppercase tracking-wider border-3 border-black hover:bg-yellow-400 transition-all rounded-xl shadow-xl shadow-yellow-500/20">
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: CAM_PRESETS.default.pos, fov: 42, near: 0.5, far: 100 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        dpr={[1, 2]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: orbitMode ? "grab" : phase === "aim" ? (dragState.active ? "grabbing" : "grab") : "default" }}
      >
        <CameraController preset={camPreset} orbitEnabled={orbitMode} />

        {/* Lighting */}
        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 16, 4]} intensity={0.85} castShadow
          shadow-mapSize={[512, 512]}
          shadow-camera-near={0.5} shadow-camera-far={50}
          shadow-camera-left={-8} shadow-camera-right={8}
          shadow-camera-top={8} shadow-camera-bottom={-8} />
        <directionalLight position={[-4, 8, -5]} intensity={0.2} />
        <pointLight position={[0, 10, 0]} intensity={1.8} color="#FFF8E7" />
        <pointLight position={[5, 3, 5]} intensity={0.6} color="#FFCC00" />

        <ArenaFloorV3 />
        <ArenaWallV3 />

        {/* Discs */}
        {discs.filter(d => !d.ringOut).map(d => (
          <TazoDiscV3 key={d.id} disc={d}
            isSelected={d.id === selectedId}
            isDragging={dragState.active && d.id === selectedId}
            dragRatio={d.id === selectedId ? dragRatio : 0} />
        ))}

        {/* Trajectory */}
        {trajectory.length > 1 && (
          <>
            <TrajectoryArcV3 points={trajectory} dragRatio={dragRatio} />
            <LandingZoneV3 x={trajectory[trajectory.length - 1].x} z={trajectory[trajectory.length - 1].z} dragRatio={dragRatio} />
          </>
        )}

        <ImpactParticles impacts={impacts} />
        <CameraShakeV3 intensity={shakeIntensity} duration={0.3} />
      </Canvas>

      <style>{`
        @keyframes slam-fly {
          0%   { opacity: 1; transform: translateY(0) scale(0.6); }
          25%  { opacity: 1; transform: translateY(-18px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-55px) scale(0.8); }
        }
        .animate-slam-fly { animation: slam-fly 1.4s ease-out forwards; }
      `}</style>
    </div>
  )
}
