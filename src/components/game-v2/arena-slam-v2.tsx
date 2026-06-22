// ============================================================
// Trading Tazos Game — Arena Slam v2 (v2)
//
// Drag-release tazo arcade with real 3D tazo discs.
// Isometric camera, trajectory preview, impact VFX.
// ============================================================
"use client"

import { useRef, useState, useCallback, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import {
  ARENA_RADIUS, DISC_RADIUS,
  calculateLaunchVelocity, calculateTrajectoryPreview,
  simulateStep, allStopped, createDemoDisc,
  type DiscState, type DragState, type TazoArchetype,
  type ImpactEvent,
} from "@/lib/battle-v2/physics"
import { THEME_COLORS } from "@/components/game/arena/ArenaTheme"
import TazoDisc3D from "@/components/game/3d/tazo-disc-3d"

// ─── Constants ───
const CAMERA_HEIGHT = 10
const CAMERA_DISTANCE = 12
const DRAG_SENSITIVITY = 2.4

// ─── Force indicator ring color ───
function forceColor(ratio: number): string {
  if (ratio < 0.25) return "#44FF44"   // green = soft
  if (ratio < 0.5) return "#FFCC00"    // yellow = medium
  if (ratio < 0.75) return "#FF8800"   // orange = strong
  return "#FF4444"                      // red = max
}

// ─── Arena Floor ───
function ArenaFloorV2() {
  const theme = THEME_COLORS.default
  const tex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 1024; c.height = 1024
    const ctx = c.getContext("2d")!
    const g = ctx.createRadialGradient(512, 512, 20, 512, 512, 480)
    g.addColorStop(0, theme.floor[0]); g.addColorStop(0.45, theme.floor[1])
    g.addColorStop(0.75, theme.floor[2]); g.addColorStop(0.92, theme.floor[3])
    g.addColorStop(1, theme.floor[4])
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 1024)
    // Outer ring
    ctx.strokeStyle = theme.accent; ctx.lineWidth = 4
    ctx.beginPath(); ctx.arc(512, 512, 480, 0, Math.PI * 2); ctx.stroke()
    // Inner ring
    ctx.strokeStyle = theme.accent + "66"; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.arc(512, 512, 380, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(512, 512, 200, 0, Math.PI * 2); ctx.stroke()
    // Center dot
    ctx.fillStyle = theme.accent + "33"; ctx.beginPath()
    ctx.arc(512, 512, 15, 0, Math.PI * 2); ctx.fill()
    // Zone labels — faint
    ctx.fillStyle = "rgba(0,0,0,0.06)"
    ctx.font = "bold 28px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("P1", 512, 270)
    ctx.fillText("P2", 512, 780)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <circleGeometry args={[ARENA_RADIUS + 0.3, 64]} />
      <meshStandardMaterial map={tex} roughness={0.5} metalness={0.02} />
    </mesh>
  )
}

// ─── Arena Border ───
function ArenaBorderV2() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <ringGeometry args={[ARENA_RADIUS - 0.05, ARENA_RADIUS + 0.05, 64]} />
      <meshStandardMaterial color="#FFCC00" transparent opacity={0.5} side={2} />
    </mesh>
  )
}

// ─── Real Tazo Disc (uses TazoDisc3D) ───
function TazoDiscV2({ disc, isSelected, isDragging, dragRatio }: {
  disc: DiscState
  isSelected: boolean
  isDragging: boolean
  dragRatio: number
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const targetPos = useMemo(() => new THREE.Vector3(disc.x, 0.06, disc.z), [disc.x, disc.z])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.position.lerp(targetPos, Math.min(1, delta * 15))
    // Scale on flip
    if (disc.flipped) {
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, 0.1, 0.1)
    }
    // Pulse if selected
    if (isSelected && !disc.moving) {
      const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.04
      groupRef.current.scale.x = pulse
      groupRef.current.scale.z = pulse
    } else {
      groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, 1, 0.1)
      groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, 1, 0.1)
    }
  })

  const franchise = disc.franchise || disc.archetype === "defender" ? "dracobell" : disc.archetype === "technical" ? "cybermon" : "minimon"

  return (
    <group ref={groupRef} position={[disc.x, 0.06, disc.z]}>
      {/* Selection glow */}
      {isSelected && !disc.moving && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[DISC_RADIUS + 0.06, DISC_RADIUS + 0.14, 32]} />
          <meshBasicMaterial
            color={forceColor(dragRatio)}
            transparent
            opacity={0.35 + Math.sin(Date.now() * 0.006) * 0.15}
            side={2}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* Force ring indicator */}
      {isDragging && dragRatio > 0.1 && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[DISC_RADIUS - 0.02, DISC_RADIUS + 0.02, 32, 1, 0, dragRatio * Math.PI * 2]} />
          <meshBasicMaterial color={forceColor(dragRatio)} transparent opacity={0.8} side={2} depthWrite={false} />
        </mesh>
      )}
      {/* Flip overlay */}
      {disc.flipped && (
        <mesh position={[0, 0.05, 0]}>
          <circleGeometry args={[DISC_RADIUS + 0.05, 16]} />
          <meshBasicMaterial color="#44FF44" transparent opacity={0.3} side={2} depthWrite={false} />
        </mesh>
      )}

      <TazoDisc3D
        name={disc.name}
        franchise={franchise}
        imageUrl={disc.imageUrl}
        backImageUrl={disc.backImageUrl}
        size={DISC_RADIUS * 1.05}
        autoRotate={false}
        finish={disc.finish}
      />
    </group>
  )
}

// ─── Trajectory Line ───
function TrajectoryLine({ points, dragRatio }: { points: Array<[number, number]>; dragRatio: number }) {
  if (points.length < 2) return null

  const lineRef = useRef<THREE.Line>(null!)
  const dotRefs = useRef<THREE.Mesh[]>([])

  useEffect(() => {
    if (!lineRef.current) return
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(points.length * 3)
    points.forEach(([x, z], i) => {
      positions[i * 3] = x
      positions[i * 3 + 1] = 0.03
      positions[i * 3 + 2] = z
    })
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    lineRef.current.geometry = geometry
  }, [points])

  return (
    <>
      <line ref={lineRef as any}>
        <bufferGeometry />
        <lineBasicMaterial color={forceColor(dragRatio)} transparent opacity={0.5} />
      </line>
      {/* Impact dot at end of trajectory */}
      {points.length > 2 && (
        <mesh position={[points[points.length - 1][0], 0.04, points[points.length - 1][1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.1, 8]} />
          <meshBasicMaterial color={forceColor(dragRatio)} transparent opacity={0.7} side={2} depthWrite={false} />
        </mesh>
      )}
    </>
  )
}

// ─── Impact VFX (rings + flash) ───
function ImpactVFX({ impacts }: { impacts: ImpactEvent[] }) {
  const meshRefs = useRef<Map<string, { mesh: THREE.Mesh; time: number }>>(new Map())

  useFrame((_, delta) => {
    // Animate existing
    meshRefs.current.forEach((data, key) => {
      data.time -= delta * 3
      if (data.time <= 0) {
        data.mesh.visible = false
        meshRefs.current.delete(key)
      } else {
        const s = 0.2 + (1 - data.time) * 2.0
        data.mesh.scale.setScalar(s)
        const mat = data.mesh.material as THREE.MeshBasicMaterial
        mat.opacity = Math.max(0, data.time * 0.8)
      }
    })
  })

  return (
    <>
      {impacts.map((impact, i) => {
        const key = `${impact.x}-${impact.z}-${i}-${performance.now()}`
        const colors = {
          capture: "#44FF44",
          flip: "#FFAA00",
          ringout: "#FF4444",
          bounce: "#4488FF",
          hit: "#FFFFFF",
        }
        return (
          <mesh
            key={key}
            position={[impact.x, 0.05, impact.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.08, 0.2, 16]} />
            <meshBasicMaterial
              color={colors[impact.type]}
              transparent
              opacity={0.9}
              side={2}
              depthWrite={false}
            />
          </mesh>
        )
      })}
    </>
  )
}

// ─── Camera Shake Controller ───
function CameraShake({ intensity, duration }: { intensity: number; duration: number }) {
  const { camera } = useThree()
  const timeRef = useRef(0)
  const activeRef = useRef(false)

  useEffect(() => {
    if (intensity > 0) {
      activeRef.current = true
      timeRef.current = duration
    }
  }, [intensity, duration])

  useFrame((_, delta) => {
    if (!activeRef.current) return
    timeRef.current -= delta
    if (timeRef.current <= 0) {
      activeRef.current = false
      return
    }
    const factor = timeRef.current / duration
    camera.position.x += (Math.random() - 0.5) * intensity * factor * 0.15
    camera.position.y += (Math.random() - 0.5) * intensity * factor * 0.1
    camera.position.z += (Math.random() - 0.5) * intensity * factor * 0.15
  })

  return null
}

// ─── HUD Overlays ───

function ScoreHUD({ playerScore, opponentScore }: { playerScore: number; opponentScore: number }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20 pointer-events-none">
      <div className="flex items-center gap-3 bg-black/50 backdrop-blur-sm px-5 py-2 rounded-full border border-white/10">
        <span className="text-yellow-400 font-black text-xl">{playerScore}</span>
        <span className="text-white/20 font-bold text-xs">VS</span>
        <span className="text-red-400 font-black text-xl">{opponentScore}</span>
      </div>
    </div>
  )
}

function TurnIndicator({ turn, phase }: { turn: "player" | "opponent"; phase: string }) {
  const msgs: Record<string, string> = {
    select: "Choose your tazo",
    aim: "Drag back · Release to launch",
    resolving: "Resolving...",
    opponent: "Opponent's turn",
    result: phase,
  }
  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className={`text-center px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider backdrop-blur-sm ${
        turn === "player"
          ? "border-yellow-500/30 bg-yellow-500/5 text-yellow-400"
          : "border-red-500/30 bg-red-500/5 text-red-400"
      }`}>
        {msgs[phase] || (turn === "player" ? "Your turn" : "Opponent turn")}
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
      {discs.filter(d => !d.flipped).map(d => (
        <button
          key={d.id}
          onClick={() => phase !== "resolving" && onSelect(d.id)}
          disabled={phase === "resolving"}
          className={`relative w-15 h-15 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
            selectedId === d.id
              ? "border-yellow-400 bg-yellow-400/15 scale-110 shadow-lg shadow-yellow-400/20 z-10"
              : d.flipped
              ? "border-green-500/20 bg-black/30 opacity-40"
              : "border-white/15 bg-black/50 hover:border-white/30 hover:bg-white/10"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {/* Mini tazo disc */}
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
              {d.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="text-[7px] font-bold text-white/50 mt-0.5 uppercase leading-none">
            {d.archetype.slice(0, 4)}
          </span>
          {/* Stat bar */}
          <div className="absolute -bottom-1 left-1 right-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${d.stats.attack}%`,
                background: forceColor(d.stats.attack / 100),
              }}
            />
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Arena slam text feedback ───
function SlamTexts({ events }: { events: Array<{ text: string; x: number; z: number; color: string; id: number }> }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
      {events.map(ev => (
        <div
          key={ev.id}
          className="absolute text-center font-black uppercase animate-slam-text"
          style={{
            left: `${50 + (ev.x / ARENA_RADIUS) * 40}%`,
            top: `${50 - (ev.z / ARENA_RADIUS) * 40}%`,
            color: ev.color,
            fontSize: `${12 + Math.random() * 8}px`,
            textShadow: `0 0 10px ${ev.color}80`,
          }}
        >
          {ev.text}
        </div>
      ))}
    </div>
  )
}

// ─── Main Arena Slam V2 Component ───
export default function ArenaSlamV2() {
  // ── Game state ──
  const [discs, setDiscs] = useState<DiscState[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [phase, setPhase] = useState<"select" | "aim" | "resolving" | "opponent" | "result">("select")
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [impacts, setImpacts] = useState<ImpactEvent[]>([])
  const [playerHand, setPlayerHand] = useState<DiscState[]>([])
  const [turn, setTurn] = useState<"player" | "opponent">("player")
  const [dragState, setDragState] = useState<DragState>({
    startX: 0, startZ: 0, currentX: 0, currentZ: 0, active: false,
  })
  const [trajectory, setTrajectory] = useState<Array<[number, number]>>([])
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const [slamTexts, setSlamTexts] = useState<Array<{ text: string; x: number; z: number; color: string; id: number }>>([])
  const [textId, setTextId] = useState(0)

  const arenaRef = useRef<HTMLDivElement>(null)
  const simulatingRef = useRef(false)
  const animFrameRef = useRef(0)
  const scoreRef = useRef({ player: 0, opponent: 0 })

  // Sync ref for score
  useEffect(() => { scoreRef.current = { player: playerScore, opponent: opponentScore } }, [playerScore, opponentScore])

  // ── Nice disc names by archetype ──
  const demoPlayerDiscs = useMemo(() => [
    createDemoDisc("p1", "Titan", "heavy", 0, 2.2, "player", "dracobell"),
    createDemoDisc("p2", "Blade", "technical", 0, 2.2, "player", "cybermon"),
    createDemoDisc("p3", "Vortex", "spinner", 0, 2.2, "player", "minimon"),
    createDemoDisc("p4", "Guardian", "defender", 0, 2.2, "player", "dracobell"),
    createDemoDisc("p5", "Striker", "balanced", 0, 2.2, "player", "cybermon")
  ], [])

  // ── Initialize demo setup ──
  const initDemo = useCallback(() => {
    const opponentTargets = [
      createDemoDisc("o1", "Grunt", "balanced", 0, -1.5, "opponent", "minimon"),
      createDemoDisc("o2", "Scout", "technical", -1.2, -1.0, "opponent", "cybermon"),
      createDemoDisc("o3", "Tank", "defender", 1.2, -1.0, "opponent", "dracobell")
    ]
    setDiscs([...demoPlayerDiscs, ...opponentTargets])
    setPlayerHand(demoPlayerDiscs)
    setSelectedId(demoPlayerDiscs[0].id)
    setPhase("select")
    scoreRef.current = { player: 0, opponent: 0 }
    setPlayerScore(0)
    setOpponentScore(0)
    setTurn("player")
    setImpacts([])
    setSlamTexts([])
  }, [demoPlayerDiscs])

  useEffect(() => { initDemo() }, [initDemo])

  // ── Get selected disc ──
  const selectedDisc = useMemo(
    () => discs.find(d => d.id === selectedId) || null,
    [discs, selectedId]
  )

  // ── Drag ratio (0-1) for force indicator ──
  const dragRatio = useMemo(() => {
    if (!dragState.active) return 0
    const dx = dragState.startX - dragState.currentX
    const dz = dragState.startZ - dragState.currentZ
    const d = Math.sqrt(dx * dx + dz * dz)
    return Math.min(1, d / 3.0)
  }, [dragState])

  // ─── Pointer events for drag-release ───
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== "aim" || !selectedDisc) return
    e.preventDefault()
    e.stopPropagation()
    const rect = arenaRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * ARENA_RADIUS * DRAG_SENSITIVITY * 2
    const z = ((e.clientY - rect.top) / rect.height - 0.5) * ARENA_RADIUS * DRAG_SENSITIVITY * 2
    setDragState({ startX: x, startZ: z, currentX: x, currentZ: z, active: true })
    setTrajectory([])
  }, [phase, selectedDisc])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.active || !selectedDisc) return
    const rect = arenaRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * ARENA_RADIUS * DRAG_SENSITIVITY * 2
    const z = ((e.clientY - rect.top) / rect.height - 0.5) * ARENA_RADIUS * DRAG_SENSITIVITY * 2
    setDragState(prev => ({ ...prev, currentX: x, currentZ: z }))

    // Dead zone: don't show trajectory for tiny drags
    const dx = dragState.startX - x
    const dz = dragState.startZ - z
    const dist = Math.sqrt(dx * dx + dz * dz)
    if (dist < 0.15) {
      setTrajectory([])
      return
    }

    const preview = calculateTrajectoryPreview(selectedDisc.x, selectedDisc.z, {
      startX: dragState.startX, startZ: dragState.startZ,
      currentX: x, currentZ: z, active: true,
    }, selectedDisc.stats, 40)
    setTrajectory(preview)
  }, [dragState, selectedDisc])

  const handlePointerUp = useCallback(() => {
    if (!dragState.active || !selectedDisc) return
    setDragState(prev => ({ ...prev, active: false }))
    setTrajectory([])

    // Launch!
    const { vx, vz } = calculateLaunchVelocity(dragState, selectedDisc.stats)
    const speed = Math.sqrt(vx * vx + vz * vz)
    if (speed < 1.5) {
      // Too weak — go back to aim phase
      setPhase("aim")
      return
    }

    setPhase("resolving")

    // Set disc velocity and start simulation
    setDiscs(prev => prev.map(d =>
      d.id === selectedId
        ? { ...d, vx, vz, moving: true, rotationSpeed: vx * 0.8 }
        : d
    ))

    // Start physics simulation
    simulatingRef.current = true
  }, [dragState, selectedDisc, selectedId])

  // ── Physics simulation loop ──
  const physicsRef = useRef({ allImpacts: [] as ImpactEvent[], captCount: 0 })
  const startSim = useCallback(() => {
    const state = physicsRef.current
    state.allImpacts = []
    state.captCount = 0

    let lastTime = performance.now()

    const tick = () => {
      if (!simulatingRef.current) return

      const now = performance.now()
      const delta = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      setDiscs(prev => {
        const result = simulateStep(prev, delta)
        state.allImpacts.push(...result.impacts)

        // Emit impact VFX
        setImpacts(impacts => [...impacts.slice(-8), ...result.impacts.slice(-3)])

        // Check for captures
        result.discs.forEach(d => {
          if (d.flipped && !prev.find(p => p.id === d.id)?.flipped) {
            const isPlayerCapture = d.owner === "opponent"
            if (isPlayerCapture) {
              scoreRef.current.player++
              setPlayerScore(s => s + 1)
              setShakeIntensity(0.5)
              setTextId(tid => {
                const newId = tid + 1
                setSlamTexts(prev => [...prev.slice(-3), {
                  text: "CAPTURE!", x: d.x, z: d.z, color: "#44FF44", id: newId,
                }])
                return newId
              })
            } else {
              scoreRef.current.opponent++
              setOpponentScore(s => s + 1)
              setShakeIntensity(0.3)
              setTextId(tid => {
                const newId = tid + 1
                setSlamTexts(prev => [...prev.slice(-3), {
                  text: "LOST!", x: d.x, z: d.z, color: "#FF4444", id: newId,
                }])
                return newId
              })
            }
          }
        })

        if (allStopped(result.discs)) {
          simulatingRef.current = false

          // Check win condition
          if (scoreRef.current.player >= 5) {
            setPhase("result")
          } else {
            // Opponent turn
            setPhase("opponent")
            setTimeout(() => opponentTurn(result.discs), 700)
          }
        }

        return result.discs
      })

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
  }, [])

  // Start simulation when phase changes to resolving
  useEffect(() => {
    if (phase === "resolving" && simulatingRef.current) {
      startSim()
    }
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [phase, startSim])

  // ── Simplified opponent AI ──
  const opponentTurn = useCallback((currentDiscs: DiscState[]) => {
    const available = currentDiscs.filter(d => d.owner === "opponent" && !d.flipped && !d.ringOut)
    if (available.length === 0) {
      setPhase("select")
      setTurn("player")
      return
    }
    const launcher = available[Math.floor(Math.random() * available.length)]
    const targets = currentDiscs.filter(d => d.owner === "player" && !d.flipped && !d.ringOut)
    const target = targets.length > 0 ? targets[Math.floor(Math.random() * targets.length)] : null

    const angle = target
      ? Math.atan2(target.z - launcher.z, target.x - launcher.x) + (Math.random() - 0.5) * 0.25
      : Math.random() * Math.PI * 2
    const speed = 5 + Math.random() * 6

    setDiscs(prev => prev.map(d =>
      d.id === launcher.id
        ? { ...d, vx: Math.cos(angle) * speed, vz: Math.sin(angle) * speed, moving: true, rotationSpeed: Math.cos(angle) * 2 }
        : d
    ))
    setPhase("resolving")
    simulatingRef.current = true
  }, [])

  // Select a tazo from hand to launch
  const handleSelectDisc = useCallback((id: string) => {
    if (phase !== "select" && phase !== "aim") return
    setSelectedId(id)
    setPhase("aim")
  }, [phase])

  // Clean up slam texts after animation
  useEffect(() => {
    if (slamTexts.length === 0) return
    const timer = setTimeout(() => setSlamTexts(prev => prev.slice(1)), 1500)
    return () => clearTimeout(timer)
  }, [slamTexts])

  // ── Render ──
  return (
    <div ref={arenaRef} className="w-full h-full relative select-none overflow-hidden" style={{
      background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 55%, #050510 100%)",
    }}>
      {/* Scanlines overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)" }}
      />

      {/* HUD */}
      <ScoreHUD playerScore={playerScore} opponentScore={opponentScore} />
      <TurnIndicator turn={turn} phase={phase} />

      {/* Slam texts */}
      <SlamTexts events={slamTexts} />

      {/* Hand */}
      {playerHand.length > 0 && (
        <HandDisplay
          discs={playerHand}
          selectedId={selectedId}
          onSelect={handleSelectDisc}
          phase={phase}
        />
      )}

      {/* Instructions bottom center */}
      {phase === "aim" && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <p className="text-white/25 text-[11px] font-black uppercase tracking-widest text-center animate-pulse">
            Drag back ↓ · Aim ↗ · Release
          </p>
        </div>
      )}

      {/* Result overlay */}
      {phase === "result" && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 backdrop-blur-sm">
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="text-6xl mb-2">{playerScore >= 5 ? "🏆" : "💀"}</div>
            <h2 className="text-4xl font-black text-yellow-400 uppercase tracking-wider mb-2 drop-shadow-[0_0_20px_rgba(255,204,0,0.3)]">
              {playerScore >= 5 ? "Victory!" : "Defeat"}
            </h2>
            <p className="text-white/40 text-lg mb-8">
              {playerScore} — {opponentScore}
            </p>
            <button
              onClick={initDemo}
              className="px-10 py-4 bg-yellow-500 text-black font-black uppercase tracking-wider border-3 border-black hover:bg-yellow-400 transition-all rounded-lg shadow-lg shadow-yellow-500/20"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, CAMERA_HEIGHT, CAMERA_DISTANCE], fov: 35, near: 0.5, far: 100 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        dpr={[1, 2]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: phase === "aim" ? (dragState.active ? "grabbing" : "grab") : "default" }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 14, 3]} intensity={0.85} castShadow />
        <directionalLight position={[-3, 8, -4]} intensity={0.2} />
        <pointLight position={[0, 6, 0]} intensity={1.8} color="#FFF5E0" />

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

        {/* Trajectory preview */}
        {trajectory.length > 0 && <TrajectoryLine points={trajectory} dragRatio={dragRatio} />}

        {/* Impact VFX */}
        <ImpactVFX impacts={impacts} />

        {/* Camera shake */}
        <CameraShake intensity={shakeIntensity} duration={0.4} />

        {/* Arena shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
          <circleGeometry args={[ARENA_RADIUS + 0.5, 64]} />
          <meshBasicMaterial color="#000" transparent opacity={0.12} />
        </mesh>
      </Canvas>

      {/* CSS animation for slam texts */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slamFade {
          0% { opacity: 1; transform: translateY(0) scale(0.8); }
          30% { opacity: 1; transform: translateY(-20px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-60px) scale(0.9); }
        }
        .animate-slam-text {
          animation: slamFade 1.2s ease-out forwards;
          pointer-events: none;
        }
      `}} />
    </div>
  )
}
