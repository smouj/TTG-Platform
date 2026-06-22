// ============================================================
// Trading Tazos Game — Arena Slam v2 (Jump Mechanics)
//
// Drag back → parabolic arc jump → land on opponent tazo → flip!
// ============================================================
"use client"

import { useRef, useState, useCallback, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import {
  ARENA_RADIUS, DISC_RADIUS, GRAVITY, JUMP_POWER,
  MIN_LAUNCH_SPEED,
  calculateLaunchVelocity, calculateTrajectoryPreview,
  simulateStep, allStopped, createDemoDisc,
  type DiscState, type DragState, type TazoArchetype,
  type ImpactEvent, type ImpactType, type TrajectoryPoint,
} from "@/lib/battle-v2/physics"
import { THEME_COLORS } from "@/components/game/arena/ArenaTheme"
import TazoDisc3D from "@/components/game/3d/tazo-disc-3d"

// ─── Camera ───
const CAMERA_POS: [number, number, number] = [0, 8, 14]
const CAMERA_FOV = 38

// ─── Force color ───
function forceColor(ratio: number): string {
  if (ratio < 0.15) return "#44FF66"
  if (ratio < 0.35) return "#FFCC00"
  if (ratio < 0.55) return "#FF8800"
  if (ratio < 0.75) return "#FF4444"
  return "#FF2222"
}

// ─── Arena Floor ───
function ArenaFloorV2() {
  const theme = THEME_COLORS.default
  const tex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 1024; c.height = 1024
    const ctx = c.getContext("2d")!
    // Radial gradient from center
    const g = ctx.createRadialGradient(512, 512, 30, 512, 512, 500)
    g.addColorStop(0, "#1a1a2e")
    g.addColorStop(0.4, "#151525")
    g.addColorStop(0.7, "#0d0d1a")
    g.addColorStop(0.95, "#080812")
    g.addColorStop(1, "#050510")
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 1024)
    // Outer ring
    ctx.strokeStyle = "#FFCC0066"; ctx.lineWidth = 3
    ctx.beginPath(); ctx.arc(512, 512, 496, 0, Math.PI * 2); ctx.stroke()
    // Mid ring
    ctx.strokeStyle = "#FFCC0033"; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(512, 512, 350, 0, Math.PI * 2); ctx.stroke()
    // Center
    ctx.fillStyle = "#FFCC0011"; ctx.beginPath()
    ctx.arc(512, 512, 18, 0, Math.PI * 2); ctx.fill()
    // Zone markers
    ctx.fillStyle = "rgba(255,255,255,0.04)"
    ctx.font = "bold 24px sans-serif"; ctx.textAlign = "center"
    ctx.fillText("YOUR ZONE", 512, 260)
    ctx.fillText("RIVAL ZONE", 512, 790)
    return new THREE.CanvasTexture(c)
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <circleGeometry args={[ARENA_RADIUS + 0.5, 64]} />
      <meshStandardMaterial map={tex} roughness={0.55} metalness={0.05} />
    </mesh>
  )
}

// ─── Arena Border (3D ring) ───
function ArenaBorderV2() {
  return (
    <mesh position={[0, 0.15, 0]}>
      <torusGeometry args={[ARENA_RADIUS, 0.08, 16, 64]} />
      <meshStandardMaterial color="#FFCC00" roughness={0.3} metalness={0.6} />
    </mesh>
  )
}

// ─── Flying Disc with Shadow ───
function TazoDiscV2({ disc, isSelected, isDragging, dragRatio }: {
  disc: DiscState
  isSelected: boolean
  isDragging: boolean
  dragRatio: number
}) {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    // Smooth position
    const target = new THREE.Vector3(disc.x, disc.y, disc.z)
    groupRef.current.position.lerp(target, Math.min(1, delta * 18))

    // Flip visual
    if (disc.flipped) {
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, 0.05, 0.1)
    } else {
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, 1, 0.1)
    }

    // Selection pulse
    if (isSelected && !disc.moving && !disc.flying) {
      const pulse = 1 + Math.sin(Date.now() * 0.004) * 0.05
      groupRef.current.scale.x = pulse
      groupRef.current.scale.z = pulse
    } else if (!isDragging) {
      groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, 1, 0.15)
      groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, 1, 0.15)
    }
  })

  const franchise = disc.franchise || "minimon"
  const yOffset = disc.flipped ? 0.01 : disc.y

  return (
    <group ref={groupRef} position={[disc.x, yOffset, disc.z]}>
      {/* Selection glow ring */}
      {isSelected && !disc.moving && !disc.flying && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[DISC_RADIUS + 0.04, DISC_RADIUS + 0.12, 32]} />
          <meshBasicMaterial
            color={forceColor(dragRatio)}
            transparent opacity={0.4}
            side={2} depthWrite={false}
          />
        </mesh>
      )}

      {/* Flip glow */}
      {disc.flipped && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[DISC_RADIUS - 0.02, DISC_RADIUS + 0.08, 16]} />
          <meshBasicMaterial color="#FF4444" transparent opacity={0.5} side={2} depthWrite={false} />
        </mesh>
      )}

      {/* Shadow disc on ground while flying */}
      {disc.flying && (
        <mesh position={[0, -disc.y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[DISC_RADIUS * 0.85, 16]} />
          <meshBasicMaterial color="#000" transparent opacity={0.3 - disc.y * 0.02} depthWrite={false} />
        </mesh>
      )}

      <TazoDisc3D
        name={disc.name}
        franchise={franchise}
        imageUrl={disc.imageUrl}
        backImageUrl={disc.backImageUrl}
        size={DISC_RADIUS * 1.05}
        autoRotate={disc.flying}
        finish={disc.finish}
      />
    </group>
  )
}

// ─── Parabolic Trajectory Line ───
function TrajectoryArcV2({ points, dragRatio }: { points: TrajectoryPoint[]; dragRatio: number }) {
  const lineRef = useRef<THREE.Line>(null!)

  useEffect(() => {
    if (!lineRef.current || points.length < 2) return
    const positions = new Float32Array(points.length * 3)
    points.forEach((p, i) => {
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y + 0.02
      positions[i * 3 + 2] = p.z
    })
    lineRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  }, [points])

  if (points.length < 2) return null

  const color = forceColor(dragRatio)

  return (
    <line ref={lineRef as any}>
      <bufferGeometry />
      <lineBasicMaterial color={color} transparent opacity={0.55} depthTest={true} />
    </line>
  )
}

// ─── Landing zone indicator ───
function LandingZone({ x, z, dragRatio }: { x: number; z: number; dragRatio: number }) {
  return (
    <mesh position={[x, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[DISC_RADIUS * 0.9, DISC_RADIUS * 1.15, 32]} />
      <meshBasicMaterial
        color={forceColor(dragRatio)}
        transparent opacity={0.4}
        side={2} depthWrite={false}
      />
    </mesh>
  )
}

// ─── Impact VFX ───
function ImpactVFX({ impacts }: { impacts: ImpactEvent[] }) {
  const meshRefs = useRef<Map<string, { mesh: THREE.Mesh; time: number; type: ImpactType }>>(new Map())

  useFrame((_, delta) => {
    meshRefs.current.forEach((data, key) => {
      data.time -= delta * 3.5
      if (data.time <= 0) {
        data.mesh.visible = false
        meshRefs.current.delete(key)
      } else {
        const scale = 0.3 + (1 - data.time) * (
          data.type === "capture" ? 3.5 : data.type === "deflect" ? 1.8 : 2.2
        )
        data.mesh.scale.setScalar(scale)
        const mat = data.mesh.material as THREE.MeshBasicMaterial
        mat.opacity = Math.max(0, data.time * 0.7)
      }
    })
  })

  const colors: Record<string, string> = {
    capture: "#44FF44",
    flip_hit: "#FFAA00",
    flip_miss: "#FF8844",
    deflect: "#4488FF",
    ringout: "#FF2222",
    land: "#FFFFFF",
  }

  return (
    <>
      {impacts.map((impact, i) => {
        const key = `${impact.x}-${impact.z}-${i}`
        return (
          <mesh key={key} position={[impact.x, 0.06, impact.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.05, 0.15, 16]} />
            <meshBasicMaterial
              color={colors[impact.type] || "#FFFFFF"}
              transparent opacity={0.85}
              side={2} depthWrite={false}
            />
          </mesh>
        )
      })}
    </>
  )
}

// ─── Camera Shake ───
function CameraShake({ intensity, duration }: { intensity: number; duration: number }) {
  const { camera } = useThree()
  const timeRef = useRef(0)
  const activeRef = useRef(false)

  useEffect(() => {
    if (intensity > 0) { activeRef.current = true; timeRef.current = duration }
  }, [intensity, duration])

  useFrame((_, delta) => {
    if (!activeRef.current) return
    timeRef.current -= delta
    if (timeRef.current <= 0) { activeRef.current = false; return }
    const f = timeRef.current / duration
    camera.position.x += (Math.random() - 0.5) * intensity * f * 0.2
    camera.position.y += (Math.random() - 0.5) * intensity * f * 0.08
    camera.position.z += (Math.random() - 0.5) * intensity * f * 0.2
  })

  return null
}

// ─── HUD ───
function ScoreHUD({ playerScore, opponentScore }: { playerScore: number; opponentScore: number }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 pointer-events-none">
      <div className="flex items-center gap-3 bg-black/50 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
        <span className="text-yellow-400 font-black text-xl">{playerScore}</span>
        <span className="text-white/15 font-bold text-xs">VS</span>
        <span className="text-red-400 font-black text-xl">{opponentScore}</span>
      </div>
    </div>
  )
}

function TurnIndicator({ phase }: { phase: string }) {
  const msgs: Record<string, string> = {
    select: "Choose a tazo",
    aim: "Drag back to jump · Release!",
    resolving: "In flight...",
    opponent: "Opponent's turn",
    result: phase,
  }
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="text-center px-4 py-1.5 rounded-full border border-white/15 bg-black/40 backdrop-blur-sm text-[10px] font-black uppercase tracking-wider text-white/60">
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
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-2 z-20">
      {discs.filter(d => !d.flipped && !d.ringOut).map(d => (
        <button
          key={d.id}
          onClick={() => phase !== "resolving" && onSelect(d.id)}
          disabled={phase === "resolving"}
          className={`relative w-15 h-15 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
            selectedId === d.id
              ? "border-yellow-400 bg-yellow-400/15 scale-110 shadow-lg shadow-yellow-400/20 z-10"
              : "border-white/10 bg-black/50 hover:border-white/25"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: d.archetype === "heavy" ? "radial-gradient(circle, #8B4513, #5C2E00)"
                : d.archetype === "technical" ? "radial-gradient(circle, #4488CC, #2255AA)"
                : d.archetype === "spinner" ? "radial-gradient(circle, #9944FF, #5500CC)"
                : d.archetype === "bouncer" ? "radial-gradient(circle, #44BB44, #228822)"
                : d.archetype === "defender" ? "radial-gradient(circle, #666688, #334455)"
                : "radial-gradient(circle, #FFD700, #CC8800)",
              border: `2px solid ${d.owner === "player" ? "#FFCC00" : "#FF4444"}`,
            }}
          >
            <span className="text-[8px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {d.name.slice(0, 2)}
            </span>
          </div>
          <span className="text-[7px] font-bold text-white/40 mt-0.5 uppercase">
            {d.archetype.slice(0, 4)}
          </span>
          {/* Power bar */}
          <div className="absolute -bottom-1 left-1 right-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{
              width: `${d.stats.attack}%`,
              background: d.stats.attack > 60 ? "#44FF44" : d.stats.attack > 40 ? "#FFCC00" : "#FF8844",
            }} />
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Slam texts overlay ───
function SlamTexts({ events }: { events: Array<{ text: string; x: number; z: number; color: string; id: number }> }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
      {events.map(ev => (
        <div key={ev.id} className="absolute text-center font-black uppercase animate-slam-fly"
          style={{
            left: `${50 + (ev.x / ARENA_RADIUS) * 42}%`,
            top: `${50 - (ev.z / ARENA_RADIUS) * 42}%`,
            color: ev.color,
            fontSize: "14px",
            textShadow: `0 0 12px ${ev.color}80`,
          }}>
          {ev.text}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// Main Arena Slam V2 Component
// ═══════════════════════════════════════════════════════════

export default function ArenaSlamV2() {
  const [discs, setDiscs] = useState<DiscState[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [phase, setPhase] = useState<"select" | "aim" | "resolving" | "opponent" | "result">("select")
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [impacts, setImpacts] = useState<ImpactEvent[]>([])
  const [playerHand, setPlayerHand] = useState<DiscState[]>([])
  const [dragState, setDragState] = useState<DragState>({
    startX: 0, startZ: 0, currentX: 0, currentZ: 0, active: false,
  })
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([])
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const [slamTexts, setSlamTexts] = useState<Array<{ text: string; x: number; z: number; color: string; id: number }>>([])
  const [textId, setTextId] = useState(0)

  const arenaRef = useRef<HTMLDivElement>(null)
  const simulatingRef = useRef(false)
  const animFrameRef = useRef(0)
  const scoreRef = useRef({ player: 0, opponent: 0 })

  useEffect(() => { scoreRef.current = { player: playerScore, opponent: opponentScore } }, [playerScore, opponentScore])

  // ── Demo player team ──
  const demoPlayerDiscs = useMemo(() => [
    createDemoDisc("p1", "Titan", "heavy", 0, 2.5, "player", "dracobell"),
    createDemoDisc("p2", "Blade", "technical", 0, 2.5, "player", "cybermon"),
    createDemoDisc("p3", "Vortex", "spinner", 0, 2.5, "player", "minimon"),
    createDemoDisc("p4", "Guardian", "defender", 0, 2.5, "player", "dracobell"),
    createDemoDisc("p5", "Striker", "balanced", 0, 2.5, "player", "cybermon"),
  ], [])

  // ── Init ──
  const initDemo = useCallback(() => {
    const targets: DiscState[] = [
      createDemoDisc("o1", "Rock", "defender", -0.7, -2.2, "opponent", "dracobell"),
      createDemoDisc("o2", "Byte", "technical", 0.7, -2.2, "opponent", "cybermon"),
      createDemoDisc("o3", "Slime", "balanced", 0, -1.8, "opponent", "minimon"),
    ]
    setDiscs([...demoPlayerDiscs, ...targets])
    setPlayerHand(demoPlayerDiscs)
    setSelectedId(demoPlayerDiscs[0].id)
    setPhase("select")
    scoreRef.current = { player: 0, opponent: 0 }
    setPlayerScore(0)
    setOpponentScore(0)
    setImpacts([])
    setSlamTexts([])
    setDragState({ startX: 0, startZ: 0, currentX: 0, currentZ: 0, active: false })
    setTrajectory([])
  }, [demoPlayerDiscs])

  useEffect(() => { initDemo() }, [initDemo])

  // ── Selected disc ──
  const selectedDisc = useMemo(
    () => discs.find(d => d.id === selectedId) || null,
    [discs, selectedId]
  )

  // ── Drag ratio ──
  const dragRatio = useMemo(() => {
    if (!dragState.active) return 0
    const dx = dragState.startX - dragState.currentX
    const dz = dragState.startZ - dragState.currentZ
    return Math.min(1, Math.sqrt(dx * dx + dz * dz) / 2.5)
  }, [dragState])

  // ── Pointer handlers ──
  const SCREEN_SCALE = 2.8

  const getArenaCoords = useCallback((e: React.PointerEvent) => {
    const rect = arenaRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, z: 0 }
    return {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * ARENA_RADIUS * SCREEN_SCALE * 2,
      z: ((e.clientY - rect.top) / rect.height - 0.5) * ARENA_RADIUS * SCREEN_SCALE * 2,
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== "aim" || !selectedDisc) return
    e.preventDefault()
    const { x, z } = getArenaCoords(e)
    // Start drag from selected disc's position conceptually
    setDragState({ startX: selectedDisc.x + x * 0.5, startZ: selectedDisc.z + z * 0.5, currentX: x, currentZ: z, active: true })
    setTrajectory([])
  }, [phase, selectedDisc, getArenaCoords])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.active || !selectedDisc) return
    const { x, z } = getArenaCoords(e)
    setDragState(prev => ({ ...prev, currentX: x, currentZ: z }))

    // Preview
    const dist = Math.sqrt(
      (dragState.startX - x) ** 2 +
      (dragState.startZ - z) ** 2
    )
    if (dist < 0.2) { setTrajectory([]); return }

    const preview = calculateTrajectoryPreview(
      selectedDisc.x, selectedDisc.z,
      { startX: dragState.startX, startZ: dragState.startZ, currentX: x, currentZ: z, active: true },
      selectedDisc.stats, 60
    )
    setTrajectory(preview)
  }, [dragState, selectedDisc, getArenaCoords])

  const handlePointerUp = useCallback(() => {
    if (!dragState.active || !selectedDisc) return
    setDragState(prev => ({ ...prev, active: false }))
    setTrajectory([])

    const { vx, vy, vz } = calculateLaunchVelocity(dragState, selectedDisc.stats)
    const hSpeed = Math.sqrt(vx * vx + vz * vz)
    if (hSpeed < MIN_LAUNCH_SPEED) {
      setPhase("aim")
      return
    }

    setPhase("resolving")

    // Launch!
    setDiscs(prev => prev.map(d =>
      d.id === selectedId
        ? { ...d, vx, vy, vz, y: 0.05, moving: true, flying: true, rotationSpeed: vx * 0.5 }
        : d
    ))

    simulatingRef.current = true
  }, [dragState, selectedDisc, selectedId])

  // ── Physics loop ──
  const startSim = useCallback(() => {
    let lastTime = performance.now()

    const tick = () => {
      if (!simulatingRef.current) return

      const now = performance.now()
      const delta = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      setDiscs(prev => {
        const result = simulateStep(prev, delta)

        // Impacts
        setImpacts(imp => [...imp.slice(-8), ...result.impacts.slice(-3)])

        // Check landings and captures
        result.discs.forEach(d => {
          const prevDisc = prev.find(p => p.id === d.id)
          const justLanded = prevDisc?.flying && !d.flying

          if (d.landedOnId && justLanded) {
            const target = result.discs.find(t => t.id === d.landedOnId)
            const isPlayer = d.owner === "player"
            // Check if target is now flipped (capture)
            if (target?.flipped) {
              const sc = isPlayer ? scoreRef.current.player + 1 : scoreRef.current.opponent + 1
              if (isPlayer) { scoreRef.current.player = sc; setPlayerScore(sc) }
              else { scoreRef.current.opponent = sc; setOpponentScore(sc) }
              setShakeIntensity(0.6)
              setTextId(tid => {
                const newId = tid + 1
                setSlamTexts(prev => [...prev.slice(-2), {
                  text: isPlayer ? "CAPTURE!" : "LOST!",
                  x: d.x, z: d.z,
                  color: isPlayer ? "#44FF44" : "#FF4444",
                  id: newId,
                }])
                return newId
              })
            } else {
              // Deflected
              setTextId(tid => {
                const newId = tid + 1
                setSlamTexts(prev => [...prev.slice(-2), {
                  text: "BOUNCE!", x: d.x, z: d.z, color: "#FFAA00", id: newId,
                }])
                return newId
              })
            }
          } else if (d.ringOut && prevDisc && !prevDisc.ringOut) {
            setShakeIntensity(0.2)
            setTextId(tid => {
              const newId = tid + 1
              setSlamTexts(prev => [...prev.slice(-2), {
                text: "OUT!", x: d.x, z: d.z, color: "#FF4444", id: newId,
              }])
              return newId
            })
          }
        })

        if (allStopped(result.discs)) {
          simulatingRef.current = false

          if (scoreRef.current.player >= 5) {
            setPhase("result")
          } else {
            setPhase("opponent")
            setTimeout(() => doOpponentTurn(result.discs), 800)
          }
        }

        return result.discs
      })

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    if (phase === "resolving" && simulatingRef.current) startSim()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [phase, startSim])

  // ── Opponent AI ──
  const doOpponentTurn = useCallback((currentDiscs: DiscState[]) => {
    const available = currentDiscs.filter(d => d.owner === "opponent" && !d.flying && !d.flipped && !d.ringOut)
    if (available.length === 0) {
      setPhase("select")
      return
    }

    const attacker = available[Math.floor(Math.random() * available.length)]
    const playerDiscs = currentDiscs.filter(d => d.owner === "player" && !d.flipped && !d.ringOut)
    const target = playerDiscs.length > 0 ? playerDiscs[Math.floor(Math.random() * playerDiscs.length)] : null

    // Aim roughly at a player tazo
    let aimAngle: number
    let aimDist: number
    if (target) {
      const dx = target.x - attacker.x
      const dz = target.z - attacker.z
      aimAngle = Math.atan2(dz, dx)
      aimDist = Math.sqrt(dx * dx + dz * dz) / 4
    } else {
      aimAngle = Math.random() * Math.PI * 2
      aimDist = 0.5 + Math.random() * 0.8
    }

    // Simulated drag — predictable but with some randomness
    const dragDx = Math.cos(aimAngle + Math.PI) * aimDist + (Math.random() - 0.5) * 0.8
    const dragDz = Math.sin(aimAngle + Math.PI) * aimDist + (Math.random() - 0.5) * 0.8

    const fakeDrag: DragState = {
      startX: attacker.x + dragDx * 0.4,
      startZ: attacker.z + dragDz * 0.4,
      currentX: attacker.x - dragDx * 0.6,
      currentZ: attacker.z - dragDz * 0.6,
      active: true,
    }

    const launch = calculateLaunchVelocity(fakeDrag, attacker.stats)

    setDiscs(prev => prev.map(d =>
      d.id === attacker.id
        ? { ...d, vx: launch.vx, vy: launch.vy, vz: launch.vz, y: 0.05, moving: true, flying: true, rotationSpeed: launch.vx * 0.5 }
        : d
    ))

    setPhase("resolving")
    simulatingRef.current = true
  }, [])

  const handleSelectDisc = useCallback((id: string) => {
    if (phase !== "select" && phase !== "aim") return
    setSelectedId(id)
    setPhase("aim")
  }, [phase])

  // Clean slam texts
  useEffect(() => {
    if (slamTexts.length === 0) return
    const t = setTimeout(() => setSlamTexts(prev => prev.slice(1)), 1400)
    return () => clearTimeout(t)
  }, [slamTexts])

  // Grid helper for aiming
  const gridVisible = phase === "aim" || phase === "select"

  return (
    <div ref={arenaRef} className="w-full h-full relative select-none overflow-hidden" style={{
      background: "radial-gradient(ellipse at center, #141428 0%, #0a0a15 55%, #040408 100%)",
    }}>
      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)" }}
      />

      <ScoreHUD playerScore={playerScore} opponentScore={opponentScore} />
      <TurnIndicator phase={phase} />
      <SlamTexts events={slamTexts} />

      {playerHand.length > 0 && (
        <HandDisplay discs={playerHand} selectedId={selectedId} onSelect={handleSelectDisc} phase={phase} />
      )}

      {/* Aim hint */}
      {phase === "aim" && dragRatio < 0.15 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <p className="text-white/30 text-[11px] font-black uppercase tracking-widest text-center animate-pulse">
            Drag back ↓ · Jump! ↗
          </p>
        </div>
      )}

      {/* Result */}
      {phase === "result" && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/65 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="text-center">
            <div className="text-6xl mb-2">{playerScore >= 5 ? "🏆" : "💀"}</div>
            <h2 className="text-4xl font-black text-yellow-400 uppercase tracking-wider mb-2 drop-shadow-[0_0_20px_rgba(255,204,0,0.3)]">
              {playerScore >= 5 ? "Victory!" : "Defeat"}
            </h2>
            <p className="text-white/40 text-lg mb-8">{playerScore} — {opponentScore}</p>
            <button onClick={initDemo}
              className="px-10 py-4 bg-yellow-500 text-black font-black uppercase tracking-wider border-3 border-black hover:bg-yellow-400 transition-all rounded-lg shadow-lg shadow-yellow-500/20">
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* 3D Scene */}
      <Canvas
        camera={{ position: CAMERA_POS, fov: CAMERA_FOV, near: 0.5, far: 100 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        dpr={[1, 2]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: phase === "aim" ? (dragState.active ? "grabbing" : "grab") : "default" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 14, 4]} intensity={0.8} castShadow />
        <directionalLight position={[-4, 6, -5]} intensity={0.15} />
        <pointLight position={[0, 8, 0]} intensity={2.0} color="#FFFAF0" />

        <ArenaFloorV2 />
        <ArenaBorderV2 />

        {/* Discs */}
        {discs.filter(d => !d.ringOut).map(d => (
          <TazoDiscV2
            key={d.id}
            disc={d}
            isSelected={d.id === selectedId}
            isDragging={dragState.active && d.id === selectedId}
            dragRatio={d.id === selectedId ? dragRatio : 0}
          />
        ))}

        {/* Trajectory */}
        {trajectory.length > 1 && (
          <>
            <TrajectoryArcV2 points={trajectory} dragRatio={dragRatio} />
            {/* Landing zone at trajectory end */}
            {(() => {
              const last = trajectory[trajectory.length - 1]
              return <LandingZone x={last.x} z={last.z} dragRatio={dragRatio} />
            })()}
          </>
        )}

        {/* VFX */}
        <ImpactVFX impacts={impacts} />
        <CameraShake intensity={shakeIntensity} duration={0.35} />

        {/* Arena shadow border */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <circleGeometry args={[ARENA_RADIUS + 0.6, 64]} />
          <meshBasicMaterial color="#000" transparent opacity={0.08} />
        </mesh>
      </Canvas>

      <style>{`
        @keyframes slam-fly {
          0%   { opacity: 1; transform: translateY(0) scale(0.7); }
          30%  { opacity: 1; transform: translateY(-15px) scale(1.15); }
          100% { opacity: 0; transform: translateY(-50px) scale(0.85); }
        }
        .animate-slam-fly {
          animation: slam-fly 1.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
