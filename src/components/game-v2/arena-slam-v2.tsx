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
  FIELD_WIDTH, FIELD_HEIGHT, FIELD_HALF_W, FIELD_HALF_H, CENTER_LINE_Z,
  DISC_RADIUS, DISC_THICKNESS,
  MIN_LAUNCH_SPEED,
  SETTLE_TIME_MS,
  validatePosition,
  floorRoughness, clampToField, isInField, isInPlayerHalf, isInOpponentHalf, isInOwnerZone,
  calculateLaunchVelocity, calculateTrajectoryPreview,
  simulateStep, allStopped, createDemoDisc,
  type DiscState, type DiscFaceState, type DragState,
  type ImpactEvent, type ImpactType, type TrajectoryPoint,
} from "@/lib/battle-v2/physics"
import TazoDisc3D from "@/components/game/3d/tazo-disc-3d"

// ─── Camera presets ───
type CamPreset = "default" | "top" | "side" | "player"

const CAM_PRESETS: Record<CamPreset, { pos: [number, number, number]; target: [number, number, number] }> = {
  default: { pos: [0, 14, 20], target: [0, 0, 0] },
  top:     { pos: [0, 22, 0.1], target: [0, 0, 0] },
  side:    { pos: [8, 6, 16], target: [0, 0, 0] },
  player:  { pos: [0, 5, 10], target: [0, 0, 0] },
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
// ─── 3D Deck Tube (Tubemazo) ───
// Shows the player's deck as a glowing tube on the edge of the arena

function DeckTubeV3({ deckCount, totalCount, side }: { deckCount: number; totalCount: number; side: 1 | -1 }) {
  const z = side * (FIELD_HALF_H - 1.5)
  const stackHeight = Math.max(0.15, (totalCount - deckCount) * 0.04)
  const remainingRatio = totalCount > 0 ? deckCount / totalCount : 0
  
  return (
    <group position={[0, 0.02, z]}>
      {/* Tube base — glowing ring on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.5, 0.65, 32]} />
        <meshBasicMaterial color={side === 1 ? "#00FFC8" : "#FF3C3C"} transparent opacity={0.25} side={2} depthWrite={false} />
      </mesh>
      
      {/* Tube cylinder — translucent glass */}
      <mesh position={[0, stackHeight / 2 + 0.1, 0]}>
        <cylinderGeometry args={[0.45, 0.5, stackHeight + 0.1, 32, 1, true]} />
        <meshPhysicalMaterial 
          color={side === 1 ? "#00FFC8" : "#FF3C3C"} 
          roughness={0.3} metalness={0.1} 
          transparent opacity={0.12}
          depthWrite={false}
        />
      </mesh>
      
      {/* Remaining discs visual stack */}
      {Array.from({ length: Math.min(deckCount, 5) }).map((_, i) => (
        <mesh key={i} position={[0, 0.1 + i * 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.03, 24]} />
          <meshStandardMaterial 
            color={side === 1 ? "#00FFC8" : "#FF3C3C"} 
            roughness={0.4} metalness={0.5} 
            transparent opacity={0.2 + (remainingRatio * 0.3)}
          />
        </mesh>
      ))}
      
      {/* Deck count ring */}
      {deckCount > 0 && (
        <mesh position={[0, stackHeight + 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.48, 0.025, 8, 32]} />
          <meshBasicMaterial color={side === 1 ? "#00FFC8" : "#FF3C3C"} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  )
}

function RectangularField() {
  const tex = useMemo(() => {
    const w = 1024, h = 512
    const c = document.createElement("canvas")
    c.width = w; c.height = h
    const ctx = c.getContext("2d")!
    const px = (vx: number) => (vx / FIELD_WIDTH + 0.5) * w
    const pz = (vz: number) => ((FIELD_HALF_H - vz) / FIELD_HEIGHT) * h

    // ─── Field base (stadium green with grass-like gradient) ───
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, "#182c18")
    g.addColorStop(0.12, "#1c3420")
    g.addColorStop(0.35, "#1f3c22")
    g.addColorStop(0.5, "#224428")
    g.addColorStop(0.65, "#1e3822")
    g.addColorStop(0.88, "#1a3020")
    g.addColorStop(1, "#162618")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    // ─── Grass texture (tiny dots) ───
    for (let i = 0; i < 8000; i++) {
      const gx = Math.random() * w
      const gy = Math.random() * h
      ctx.fillStyle = `rgba(0,0,0,${0.01 + Math.random() * 0.03})`
      ctx.fillRect(gx, gy, 1 + Math.random() * 2, 1 + Math.random() * 2)
    }

    // ─── Center line ───
    ctx.strokeStyle = "rgba(255,255,255,0.15)"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, pz(CENTER_LINE_Z))
    ctx.lineTo(w, pz(CENTER_LINE_Z))
    ctx.stroke()

    // ─── Center circle ───
    const centerX = px(0), centerY = pz(CENTER_LINE_Z)
    const circleR = px(1.5) - centerX
    ctx.strokeStyle = "rgba(255,255,255,0.12)"
    ctx.lineWidth = 2
    ctx.setLineDash([6, 10])
    ctx.beginPath()
    ctx.arc(centerX, centerY, circleR, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Center dot
    ctx.fillStyle = "rgba(255,204,0,0.2)"
    ctx.beginPath()
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2)
    ctx.fill()

    // ─── Roughness zone stripes (horizontal bands) ───
    const zones = [
      { zMin: 0, zMax: 1.0, color: "255,255,255", alpha: 0.02, label: "SMOOTH" },
      { zMin: 1.0, zMax: 2.2, color: "200,150,50", alpha: 0.06, label: "MEDIUM" },
      { zMin: 2.2, zMax: 3.0, color: "180,120,30", alpha: 0.09, label: "ROUGH" },
      { zMin: 3.0, zMax: 4.0, color: "160,90,20", alpha: 0.12, label: "VERY ROUGH" },
    ]
    
    zones.forEach(zone => {
      // Player side
      const y1 = pz(zone.zMax)
      const y2 = pz(zone.zMin)
      ctx.fillStyle = `rgba(${zone.color}, ${zone.alpha})`
      ctx.fillRect(0, y1, w, y2 - y1)
      
      // Opponent side (mirrored)
      const oy1 = pz(-zone.zMin)
      const oy2 = pz(-zone.zMax)
      ctx.fillStyle = `rgba(${zone.color}, ${zone.alpha})`
      ctx.fillRect(0, oy1, w, oy2 - oy1)

      // Zone label
      if (zone.label) {
        ctx.fillStyle = `rgba(${zone.color}, 0.15)`
        ctx.font = "bold 11px 'Geist', sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("· " + zone.label + " ·", w/2, y1 + 16)
        ctx.fillText("· " + zone.label + " ·", w/2, oy1 + 16)
      }
    })

    // ─── Grid lines (light) ───
    ctx.strokeStyle = "rgba(255,255,255,0.025)"
    ctx.lineWidth = 0.6
    for (let i = -5; i <= 5; i++) {
      const lx = px(i)
      ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, h); ctx.stroke()
    }
    for (let j = -3; j <= 3; j++) {
      const lz = pz(j)
      ctx.beginPath(); ctx.moveTo(0, lz); ctx.lineTo(w, lz); ctx.stroke()
    }

    // ─── Spawn zone: Player half ───
    const playerZ = FIELD_HALF_H - 1.5
    const opponentZ = -FIELD_HALF_H + 1.5
    
    // Player zone box
    const pzY = pz(playerZ)
    ctx.fillStyle = "rgba(0,255,200,0.06)"
    ctx.fillRect(px(-2.5), pzY - 30, px(2.5) - px(-2.5), 60)
    ctx.strokeStyle = "rgba(0,255,200,0.2)"
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 8])
    ctx.strokeRect(px(-2.5), pzY - 30, px(2.5) - px(-2.5), 60)
    ctx.setLineDash([])
    ctx.fillStyle = "rgba(0,255,200,0.18)"
    ctx.font = "bold 16px 'Geist', sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("LAUNCH ZONE", w/2, pzY - 36)

    // Opponent zone box
    const ozY = pz(opponentZ)
    ctx.fillStyle = "rgba(255,60,60,0.06)"
    ctx.fillRect(px(-2.5), ozY - 30, px(2.5) - px(-2.5), 60)
    ctx.strokeStyle = "rgba(255,60,60,0.2)"
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 8])
    ctx.strokeRect(px(-2.5), ozY - 30, px(2.5) - px(-2.5), 60)
    ctx.setLineDash([])
    ctx.fillStyle = "rgba(255,60,60,0.18)"
    ctx.fillText("RIVAL ZONE", w/2, ozY + 50)

    // ─── Labels ───
    ctx.fillStyle = "rgba(255,255,255,0.04)"
    ctx.font = "bold 18px 'Geist', sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("YOUR SIDE", w/2, pz(FIELD_HALF_H - 0.5))
    ctx.fillText("RIVAL SIDE", w/2, pz(-FIELD_HALF_H + 0.5))

    return new THREE.CanvasTexture(c)
  }, [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[FIELD_WIDTH, FIELD_HEIGHT]} />
      <meshStandardMaterial map={tex} roughness={0.55} metalness={0.03} />
    </mesh>
  )
}

// ─── Field Walls ───
function FieldWalls() {
  const wallH = 0.35
  const wallT = 0.08
  const hw = FIELD_HALF_W
  const hh = FIELD_HALF_H
  
  return (
    <group>
      {/* North + South walls */}
      {[hh, -hh].map((wz, idx) => (
        <mesh key={"ns"+idx} position={[0, wallH/2, wz]} receiveShadow castShadow>
          <boxGeometry args={[FIELD_WIDTH + wallT, wallH, wallT]} />
          <meshStandardMaterial color="#FFCC00" roughness={0.15} metalness={0.8} emissive="#FFCC00" emissiveIntensity={0.25} />
        </mesh>
      ))}
      {/* East + West walls */}
      {[hw, -hw].map((wx, idx) => (
        <mesh key={"ew"+idx} position={[wx, wallH/2, 0]} receiveShadow castShadow>
          <boxGeometry args={[wallT, wallH, FIELD_HEIGHT]} />
          <meshStandardMaterial color="#FFCC00" roughness={0.15} metalness={0.8} emissive="#FFCC00" emissiveIntensity={0.25} />
        </mesh>
      ))}
      {/* Corner pillars */}
      {[[-hw,-hh],[hw,-hh],[-hw,hh],[hw,hh]].map(([cx,cz], i) => (
        <group key={"pillar"+i}>
          <mesh position={[cx, 0.55, cz]}>
            <cylinderGeometry args={[0.1, 0.12, 1.1, 8]} />
            <meshStandardMaterial color="#FFE0A0" roughness={0.2} metalness={0.9} emissive="#FFCC00" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[cx, 1.05, cz]}>
            <sphereGeometry args={[0.14, 8, 8]} />
            <meshBasicMaterial color="#FFE0A0" transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
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

    // Face orientation via rotation
    const faceState = disc.faceState || "face_down"
    const targetRx = faceState === "face_down" || faceState === "sideways"
      ? THREE.MathUtils.lerp(g.rotation.x, Math.PI + disc.tiltX, 0.25)
      : faceState === "face_up"
        ? THREE.MathUtils.lerp(g.rotation.x, disc.tiltX, 0.25)
        : THREE.MathUtils.lerp(g.rotation.x, disc.tiltX, 0.18)
    
    const targetRz = faceState === "wobbling"
      ? THREE.MathUtils.lerp(g.rotation.z, disc.tiltZ, 0.18)
      : THREE.MathUtils.lerp(g.rotation.z, disc.tiltZ, 0.25)

    if (disc.flipped) {
      // Captured: flatten with front face up
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, 0, 0.25)
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, 0, 0.25)
      g.scale.y = THREE.MathUtils.lerp(g.scale.y, 0.04, 0.12)
    } else if (!disc.moving && !disc.flying) {
      g.rotation.x = targetRx
      g.rotation.z = targetRz
      g.scale.y = THREE.MathUtils.lerp(g.scale.y, 1, 0.18)
    } else {
      // Moving/flying: show rotation + wobble
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, disc.tiltX || targetRx, 0.15)
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, disc.tiltZ || targetRz, 0.15)
      g.scale.y = THREE.MathUtils.lerp(g.scale.y, 1, 0.3)
    }

    // Wobble visual
    if ((disc.wobbleAngle ?? 0) > 0.005) {
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, Math.sin(Date.now() * 0.02 * (disc.wobbleSpeed || 2)) * disc.wobbleAngle, 0.25)
    } else {
      g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, disc.rotation || 0, 0.2)
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
// ─── Ambient Arena Particles (floating dust/motes) ───
// ─── Ghost disc preview during positioning ───
function GhostDisc({ x, z, valid }: { x: number; z: number; valid: boolean }) {
  return (
    <group position={[x, 0.15, z]}>
      {/* Ghost ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[DISC_RADIUS * 0.8, DISC_RADIUS, 32]} />
        <meshBasicMaterial color={valid ? "#00FF88" : "#FF4444"} transparent opacity={0.4} side={2} depthWrite={false} />
      </mesh>
      {/* Ghost disc body */}
      <mesh>
        <cylinderGeometry args={[DISC_RADIUS, DISC_RADIUS, DISC_THICKNESS, 32]} />
        <meshStandardMaterial color={valid ? "#00FF88" : "#FF4444"} transparent opacity={0.25} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── Positioning field overlay (click target) ───
function PositioningOverlay({ onPlace }: { onPlace: (x: number, z: number, valid: boolean) => void }) {
  const { camera, raycaster, pointer } = useThree()
  const meshRef = useRef<THREE.Mesh>(null!)

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.005, 0]}
      onClick={(e) => {
        e.stopPropagation()
        // Validate the position
        const p = e.point
        const validation = validatePosition(p.x, p.z, "player", [], DISC_RADIUS * 2.2)
        onPlace(p.x, p.z, validation.valid)
      }}
    >
      <planeGeometry args={[FIELD_WIDTH, FIELD_HEIGHT]} />
      <meshStandardMaterial transparent opacity={0} depthWrite={false} side={2} />
    </mesh>
  )
}

function ArenaParticlesV3() {
  const count = 80
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.sqrt(Math.random()) * (FIELD_HALF_W - 0.5)
      pos[i * 3] = Math.cos(angle) * radius
      pos[i * 3 + 1] = 0.5 + Math.random() * 4
      pos[i * 3 + 2] = Math.sin(angle) * radius
    }
    return pos
  }, [])
  
  useFrame((_, delta) => {
    const m = meshRef.current
    if (!m) return
    for (let i = 0; i < count; i++) {
      // Slowly float upward, reset when too high
      let y = positions[i * 3 + 1] + delta * (0.05 + Math.random() * 0.15)
      if (y > 5) { y = 0.3 + Math.random() * 0.5 }
      positions[i * 3 + 1] = y
      m.setMatrixAt(i, new THREE.Matrix4().compose(
        new THREE.Vector3(positions[i * 3], y, positions[i * 3 + 2]),
        new THREE.Quaternion(),
        new THREE.Vector3(0.015, 0.015, 0.015)
      ))
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[0.015, 4, 4]} />
      <meshBasicMaterial color="#FFFFFF" transparent opacity={0.12} depthWrite={false} />
    </instancedMesh>
  )
}

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

function ScoreHUD({ playerScore, opponentScore, playerName, opponentName }: { playerScore: number; opponentScore: number; playerName?: string; opponentName?: string }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      <div className="flex items-center gap-5 bg-black/40 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/8">
        {/* Player */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-cyan-400 font-black text-2xl drop-shadow-[0_0_12px_rgba(0,255,200,0.3)]">{playerScore}</span>
          <span className="text-white/15 font-black text-[8px] uppercase tracking-wider">{playerName || "YOU"}</span>
        </div>
        {/* VS */}
        <div className="w-8 h-8 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center">
          <span className="text-white/10 font-black text-[10px]">VS</span>
        </div>
        {/* Opponent */}
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-red-400 font-black text-2xl drop-shadow-[0_0_12px_rgba(255,50,50,0.3)]">{opponentScore}</span>
          <span className="text-white/15 font-black text-[8px] uppercase tracking-wider">{opponentName || "RIVAL"}</span>
        </div>
      </div>
    </div>
  )
}

function TurnIndicator({ phase, turn, playerName, opponentName }: { phase: string; turn?: string; playerName?: string; opponentName?: string }) {
  if (phase === "intro" || phase === "result") return null
  const msgs: Record<string, string> = {
    positioning: "Place your tazos on the field",
    select: "Choose your tazo",
    aim: "Drag back · Release to jump!",
    physics_live: turn === "player" ? "Your disc in flight!" : "Rival disc incoming!",
    settle: "Disks settling...",
    opponent: "Opponent aims...",
  }
  const colors: Record<string, string> = {
    positioning: "border-cyan-400/20 text-cyan-400/60",
    select: "border-yellow-400/20 text-yellow-400/60",
    aim: "border-green-400/20 text-green-400/60",
    physics_live: turn === "player" ? "border-cyan-400/20 text-cyan-400/60" : "border-red-400/20 text-red-400/60",
    settle: "border-yellow-400/15 text-yellow-400/40",
    opponent: "border-red-400/20 text-red-400/50",
  }
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-6">
      {/* Player name chip */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/10 bg-black/30 backdrop-blur-sm">
        <div className="w-2 h-2 rounded-full bg-cyan-400/60" />
        <span className="text-white/40 font-black text-[10px] uppercase tracking-wider">{playerName || "YOU"}</span>
      </div>
      
      {/* Phase indicator */}
      <div className={`px-4 py-1.5 rounded-full border bg-black/40 backdrop-blur-sm text-[10px] font-black uppercase tracking-[0.12em] ${colors[phase] || "border-white/10 text-white/50"}`}>
        {msgs[phase] || phase}
      </div>
      
      {/* Opponent name chip */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-400/10 bg-black/30 backdrop-blur-sm">
        <span className="text-white/40 font-black text-[10px] uppercase tracking-wider">{opponentName || "RIVAL"}</span>
        <div className="w-2 h-2 rounded-full bg-red-400/60" />
      </div>
    </div>
  )
}

function HandDisplay({ discs, selectedId, onSelect, phase, deckCount, placingId, onPlace, placedCount }: {
  discs: DiscState[]
  selectedId: string | null
  onSelect: (id: string) => void
  phase: string
  deckCount?: number
  placingId?: string | null
  onPlace?: (id: string) => void
  placedCount?: number
}) {
  if (phase === "result" || phase === "intro") return null
  const available = discs.filter(d => !d.flipped && !d.ringOut)
  const isPositioning = phase === "positioning"
  if (available.length === 0 && (typeof deckCount !== "number" || deckCount === 0)) return null
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20" style={{ maxWidth: "90vw", overflowX: "auto" }}>
    {isPositioning && (
      <div className="text-center mb-3">
        <div className="inline-block px-5 py-2 rounded-full bg-cyan-400/5 border border-cyan-400/10 backdrop-blur-sm">
          <span className="text-cyan-400/60 font-black text-[10px] uppercase tracking-[0.15em]">
            {placingId ? "Click field to place" : "Click card then field"} · {3 - (placedCount ?? 0)} left
          </span>
        </div>
      </div>
    )}
    <div className="flex items-end gap-2.5 px-4 justify-center">
      {/* Deck counter */}
      {typeof deckCount === "number" && deckCount > 0 && (
        <div className="w-10 h-14 rounded-lg border border-white/8 bg-white/3 flex flex-col items-center justify-center text-white/20 text-[9px] font-black uppercase tracking-wider mr-1 flex-shrink-0">
          <span className="text-[11px]">{deckCount}</span>
          <span className="text-[7px]">deck</span>
        </div>
      )}
      {available.map(d => (
        <button
          key={d.id}
          onClick={() => { if (isPositioning && onPlace) { onPlace(d.id); return } if (phase !== "resolving") onSelect(d.id) }}
          disabled={phase === "physics_live" || phase === "settle"}
          className={`relative w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center transition-all duration-150 ${
            selectedId === d.id || placingId === d.id
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
              {d.name.slice(0, 3).toUpperCase()}
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
      {available.length === 0 && (
        <span className="text-white/15 text-[9px] font-black uppercase tracking-wider px-2">No cards</span>
      )}
    </div>
    </div>
  )
}

function SlamTexts({ events }: { events: Array<{ text: string; x: number; z: number; color: string; id: number }> }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
      {events.map(ev => (
        <div key={ev.id} className="absolute text-center font-black uppercase animate-slam-fly"
          style={{
            left: `${50 + (ev.x / FIELD_HALF_W) * 42}%`,
            top: `${50 - (ev.z / FIELD_HALF_W) * 42}%`,
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
  const [placingId, setPlacingId] = useState<string | null>(null)
  const [ghostPos, setGhostPos] = useState<{ x: number; z: number; valid: boolean } | null>(null)
  const [placedCount, setPlacedCount] = useState(0)  // how many player tazos placed
  const [phase, setPhase] = useState<"intro" | "positioning" | "select" | "aim" | "physics_live" | "settle" | "opponent" | "result">("intro")
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [impacts, setImpacts] = useState<ImpactEvent[]>([])
  const [playerHand, setPlayerHand] = useState<DiscState[]>([])
  const [playerDeck, setPlayerDeck] = useState<DiscState[]>([])
  const [opponentHand, setOpponentHand] = useState<DiscState[]>([])
  const [playerName, setPlayerName] = useState("YOU")
  const [opponentName, setOpponentName] = useState("RIVAL")
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
  const opponentDeckRef = useRef<DiscState[]>([])
  const opponentHandRef = useRef<DiscState[]>([])

  useEffect(() => { scoreRef.current = { player: playerScore, opponent: opponentScore } }, [playerScore, opponentScore])
  useEffect(() => { opponentHandRef.current = opponentHand }, [opponentHand])

  // ── Setup (real data or demo) ──
  const hasRealData = !!(initialPlayerDiscs?.length && initialOpponentDiscs?.length)
  
  const demoPlayerRaw = useMemo(() => [
    createDemoDisc("p1", "TITAN", "heavy", 0, 0, "player", "dracobell"),
    createDemoDisc("p2", "BLADE", "technical", 0, 0, "player", "cybermon"),
    createDemoDisc("p3", "VORTEX", "spinner", 0, 0, "player", "minimon"),
    createDemoDisc("p4", "SHIELD", "defender", 0, 0, "player", "dracobell"),
    createDemoDisc("p5", "STRIKE", "balanced", 0, 0, "player", "cybermon"),
  ], [])

  const demoOpponentsRaw = useMemo(() => [
    createDemoDisc("o1", "ROCK", "defender", 0, 0, "opponent", "dracobell"),
    createDemoDisc("o2", "BYTE", "technical", 0, 0, "opponent", "cybermon"),
    createDemoDisc("o3", "SLIME", "balanced", 0, 0, "opponent", "minimon"),
  ], [])

  const initDemo = useCallback(() => {
    // Build player and opponent full rosters (from real data or demo)
    const rawP = hasRealData ? (initialPlayerDiscs || []) : demoPlayerRaw
    const rawO = hasRealData ? (initialOpponentDiscs || []) : demoOpponentsRaw

    // Draw initial hand (3 for quick start), rest in deck
    const pDeck = [...rawP]
    const oDeck = [...rawO]
    const initialHandSize = Math.min(3, pDeck.length)
    const pHand = pDeck.splice(0, initialHandSize)
    const oHand = oDeck.splice(0, Math.min(3, oDeck.length))

    // Clean field
    setDiscs([])
    setPlayerHand(pHand)
    setPlayerDeck(pDeck)
    setOpponentHand(oHand)
    opponentDeckRef.current = oDeck
    setSelectedId(pHand[0]?.id || null)
    setPhase("intro")
    // Auto-transition to select after intro animation
    setTimeout(() => setPhase("positioning"), 1800)
    scoreRef.current = { player: 0, opponent: 0 }
    turnRef.current = "player"
    setPlayerScore(0)
    setOpponentScore(0)
    setImpacts([])
    setSlamTexts([])
    setDragState({ startX: 0, startZ: 0, currentX: 0, currentZ: 0, active: false })
    setTrajectory([])
    setPlacingId(null)
    setPlacedCount(0)
  }, [demoPlayerRaw, demoOpponentsRaw, hasRealData, initialPlayerDiscs, initialOpponentDiscs])

  useEffect(() => { initDemo() }, [initDemo])

  const selectedDisc = useMemo(() => playerHand.find(d => d.id === selectedId) || null, [playerHand, selectedId])

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
      x: ((e.clientX - rect.left) / rect.width - 0.5) * FIELD_HALF_W * SCREEN_SCALE * 2,
      z: ((e.clientY - rect.top) / rect.height - 0.5) * FIELD_HALF_W * SCREEN_SCALE * 2,
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (phase !== "aim" || !selectedDisc || orbitMode) return
    e.preventDefault()
    const { x, z } = getCoords(e)
    // Player spawn position (discs enter from player's side)
    const spawnX = 0, spawnZ = FIELD_HALF_H - 1.5
    const dsStart = { startX: spawnX + x * 0.5, startZ: spawnZ + z * 0.5, currentX: x, currentZ: z, active: true }
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

  // ─── Positioning: click field to place disc ───
  const handlePlaceDisc = useCallback((fieldX: number, fieldZ: number) => {
    const isPositioning = phase === "positioning"
    if (!isPositioning) return
    
    const z = Math.max(CENTER_LINE_Z + 0.8, Math.min(FIELD_HALF_H - 0.8, fieldZ))
    const x = Math.max(-FIELD_HALF_W + 1.5, Math.min(FIELD_HALF_W - 1.5, fieldX))
    
    // Auto-select first card if none explicitly selected
    const targetCard = playerHand.find(d => d.id === placingId) || playerHand[0]
    if (!targetCard) return
    
    // Place on field
    setDiscs(prev => [...prev, {
      ...targetCard, x, y: 0, z,
      vx: 0, vy: 0, vz: 0, moving: false, flying: false,
      wobbleAngle: 0, wobbleSpeed: 0, wobbleAxis: 0,
    }])
    setPlayerHand(prev => prev.filter(d => d.id !== targetCard.id))
    setPlacingId(null)
    
    // Check placement progress
    const newPlaced = placedCount + 1
    setPlacedCount(newPlaced)
    
    if (newPlaced >= 3) {
      // Auto-place opponent tazos, then start battle
      setTimeout(() => {
        setOpponentHand(oh => {
          const oppPlaced = oh.map((d, i) => ({
            ...d,
            x: (i - 1) * 2.0,
            y: 0,
            z: -(FIELD_HALF_H - 1.5),
            moving: false, flying: false,
            wobbleAngle: 0, wobbleSpeed: 0, wobbleAxis: 0,
          }))
          setDiscs(prev => [...prev, ...oppPlaced])
          return []
        })
        // Auto-draw one card for battle
        setPlayerDeck(pd => {
          if (pd.length > 0) {
            const [next, ...rest] = pd
            setPlayerHand(ph => ph.length === 0 ? [next] : [...ph, next])
            return rest
          }
          return pd
        })
        setPhase("select")
        // Auto-select first hand card for battle launch
        setTimeout(() => {
          setPlayerHand(ph => {
            if (ph.length > 0) setSelectedId(ph[0].id)
            return ph
          })
        }, 100)
      }, 600)
    }
  }, [phase, placingId, playerHand, placedCount])

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current.active || !selectedDisc) return
    const finalDrag = { ...dragRef.current, active: false }
    setDragState(finalDrag)
    dragRef.current = finalDrag
    setTrajectory([])

    const { vx, vy, vz } = calculateLaunchVelocity(dragRef.current, selectedDisc.stats)
    if (Math.hypot(vx, vz) < MIN_LAUNCH_SPEED) { setPhase("aim"); return }

    setPhase("physics_live")
    // Remove from hand, place on field at default position
    setPlayerHand(prev => prev.filter(d => d.id !== selectedId))
    setDiscs(prev => [...prev, { ...selectedDisc, x: 0, z: FIELD_HALF_H - 1.5, vx, vy, vz, y: 0.05, moving: true, flying: true, rotationSpeed: vx * 0.6 }])
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

          if (scoreRef.current.player >= 5 || scoreRef.current.opponent >= 5) {
            setPhase("result")
          } else if (isPlayerTurn) {
            // Player's turn ends → now opponent's turn
            // Draw 1 from deck into hand (if deck not empty)
            setPlayerDeck(pd => {
              if (pd.length > 0) {
                const [next, ...rest] = pd
                setPlayerHand(ph => [...ph, next])
                return rest
              }
              return pd
            })
            turnRef.current = "opponent"
            setPhase("opponent")
            setTimeout(() => doOpponentTurn(result.discs), 900)
          } else {
            // Opponent's turn ends → now player's turn
            turnRef.current = "player"
            setPhase("select")
            // If hand empty, auto-draw from deck
            setPlayerHand(ph => {
              if (ph.filter(d => !d.flipped && !d.ringOut).length > 0) return ph
              // Empty hand — try draw
              setPlayerDeck(pdk => {
                if (pdk.length > 0) {
                  setPlayerHand(() => [pdk[0]])
                  return pdk.slice(1)
                }
                // Completely out — game over by elimination
                return pdk
              })
              return ph
            })
          }
        }
        return result.discs
      })
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    if (phase === "physics_live" || phase === "settle" && simulatingRef.current) startSim()
    return () => cancelAnimationFrame(animRef.current)
  }, [phase, startSim])

  // ── Opponent AI ──
  const doOpponentTurn = useCallback((cd: DiscState[]) => {
    // Pick from opponent hand, not from field
    let attacker: DiscState | undefined
    // Use closure over opponentHand (fresh via setter callback in setTimeout closure)
    setOpponentHand(oh => {
      const avail = oh.filter(d => !d.flipped && !d.ringOut)
      if (!avail.length) return oh  // no hand → can't play
      const chosenIdx = Math.floor(Math.random() * avail.length)
      attacker = avail[chosenIdx]
      return oh.filter(d => d.id !== attacker?.id)
    })
    if (!attacker) {
      // No hand cards — check if game should end
      const playerCanPlay = cd.some(d => d.owner === "player" && !d.flying && !d.flipped && !d.ringOut)
      if (!playerCanPlay) {
        // Neither side can play — end game by score
        setPhase("result")
      } else {
        setPhase("select")
      }
      return
    }
    // Place attacker on field at opponent side + compute launch in one batch
    const attackerX = 0 + (Math.random() - 0.5) * 1.2
    const attackerZ = -(FIELD_HALF_H - 1.5)
    const pDiscs = cd.filter(d => d.owner === "player" && !d.flipped && !d.ringOut)
    let target: DiscState | null = null
    if (pDiscs.length > 0) {
      // Pick closest player disc to attacker spawn point
      let closestDist = Infinity
      for (const pd of pDiscs) {
        const d = Math.hypot(pd.x - attackerX, pd.z - attackerZ)
        if (d < closestDist) { closestDist = d; target = pd }
      }
    }

    let aimAngle: number, aimDist: number
    if (target) {
      const dx = target.x - attackerX, dz = target.z - attackerZ
      aimAngle = Math.atan2(dz, dx)
      aimDist = Math.hypot(dx, dz) / 3.5 + Math.random() * 0.4
    } else {
      aimAngle = Math.random() * Math.PI * 2
      aimDist = 0.6 + Math.random() * 1.2
    }
    aimAngle += (Math.random() - 0.5) * 0.3

    const fd: DragState = {
      startX: attackerX + Math.cos(aimAngle + Math.PI) * aimDist * 0.3,
      startZ: attackerZ + Math.sin(aimAngle + Math.PI) * aimDist * 0.3,
      currentX: attackerX - Math.cos(aimAngle + Math.PI) * aimDist * 0.7,
      currentZ: attackerZ - Math.sin(aimAngle + Math.PI) * aimDist * 0.7,
      active: true,
    }

    const launch = calculateLaunchVelocity(fd, attacker.stats)
    // Single atomic operation: add disc + set velocity
    setDiscs(prev => [...prev, { ...attacker!, x: attackerX, z: attackerZ, vx: launch.vx, vy: launch.vy, vz: launch.vz, y: 0.05, moving: true, flying: true, rotationSpeed: launch.vx * 0.6 } as DiscState])
    // Draw 1 into opponent hand (using ref for deck)
    const deck = opponentDeckRef.current
    if (deck.length > 0) {
      opponentDeckRef.current = deck.slice(1)
      setOpponentHand(oh => [...oh, deck[0]])
    }
    setPhase("physics_live")
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

  // Auto-select first available hand card when returning to select phase
  useEffect(() => {
    if (phase !== "select") return
    const available = playerHand.filter(d => !d.flipped && !d.ringOut)
    if (available.length > 0 && !available.find(d => d.id === selectedId)) {
      setSelectedId(available[0].id)
    }
  }, [phase, playerHand, selectedId])


  // ═══ RENDER ═══
  return (
    <div ref={arenaRef} className="w-full h-full relative select-none overflow-hidden"
      style={{ background: "radial-gradient(ellipse at center, #1a1a3e 0%, #12122a 35%, #0a0a1e 65%, #050510 100%)" }}>

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none z-25 opacity-[0.02]"
        style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 4px)" }} />

      {/* HUD */}
      <ScoreHUD playerScore={playerScore} opponentScore={opponentScore} playerName={playerName} opponentName={opponentName} />
      <TurnIndicator phase={phase} turn={turnRef.current} playerName={playerName} opponentName={opponentName} />
      <SlamTexts events={slamTexts} />

      {/* Hand */}
      <HandDisplay discs={playerHand} selectedId={selectedId} onSelect={handleSelectDisc} phase={phase} deckCount={playerDeck.length} />

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

      {/* ─── Intro / VS Screen ─── */}
      {phase === "intro" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, #1a1a3e00 0%, #0a0a1e88 60%, #030308ee 100%)" }}>
          <style>{`
            @keyframes intro-vs-pulse {
              0%, 100% { transform: scale(1); opacity: 0.5; }
              50% { transform: scale(1.08); opacity: 1; }
            }
            @keyframes intro-deck-slide-left {
              0% { opacity: 0; transform: translateX(-120px) scale(0.6); }
              70% { opacity: 0.7; transform: translateX(5px) scale(1.03); }
              100% { opacity: 1; transform: translateX(0) scale(1); }
            }
            @keyframes intro-deck-slide-right {
              0% { opacity: 0; transform: translateX(120px) scale(0.6); }
              70% { opacity: 0.7; transform: translateX(-5px) scale(1.03); }
              100% { opacity: 1; transform: translateX(0) scale(1); }
            }
            @keyframes intro-vs-appear {
              0% { opacity: 0; transform: scale(0.2) rotate(-8deg); }
              100% { opacity: 1; transform: scale(1) rotate(0deg); }
            }
            .anim-deck-left { animation: intro-deck-slide-left 0.7s 0.3s ease-out both; }
            .anim-deck-right { animation: intro-deck-slide-right 0.7s 0.3s ease-out both; }
            .anim-vs { animation: intro-vs-appear 0.5s 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
            .anim-vs-pulse { animation: intro-vs-pulse 2s 0.7s ease-in-out infinite; }
            @keyframes intro-fade-text {
              0%, 100% { opacity: 0.2; }
              50% { opacity: 0.5; }
            }
            .anim-fade-text { animation: intro-fade-text 2s 0.5s ease-in-out infinite; }
          `}</style>

          {/* Player side — left */}
          <div className="absolute left-[8%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 anim-deck-left">
            <div className="w-20 h-28 rounded-xl border-2 border-cyan-400/25 bg-cyan-400/3 flex flex-col items-center justify-center gap-1 shadow-[0_0_45px_rgba(0,255,200,0.06)]">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-400/15 bg-cyan-400/3 flex items-center justify-center">
                <span className="text-cyan-400/30 text-xl">⚔</span>
              </div>
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-7 h-1 rounded-full bg-cyan-400/20" style={{ opacity: 0.3 + i * 0.25 }} />
                ))}
              </div>
            </div>
            <span className="text-cyan-400/70 font-black text-sm uppercase tracking-[0.2em]">{playerName}</span>
          </div>

          {/* VS center */}
          <div className="flex flex-col items-center gap-5 anim-vs">
            <div className="w-24 h-24 rounded-full border-3 border-yellow-400/15 bg-yellow-400/3 flex items-center justify-center anim-vs-pulse shadow-[0_0_70px_rgba(255,204,0,0.1)]">
              <span className="text-yellow-400 font-black text-4xl tracking-[-0.04em] drop-shadow-[0_0_18px_rgba(255,204,0,0.45)]">VS</span>
            </div>
            <span className="text-white/15 font-black text-[10px] uppercase tracking-[0.3em] anim-fade-text">· ARENA SLAM ·</span>
          </div>

          {/* Opponent side — right */}
          <div className="absolute right-[8%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 anim-deck-right">
            <div className="w-20 h-28 rounded-xl border-2 border-red-400/25 bg-red-400/3 flex flex-col items-center justify-center gap-1 shadow-[0_0_45px_rgba(255,50,50,0.06)]">
              <div className="w-12 h-12 rounded-full border-2 border-red-400/15 bg-red-400/3 flex items-center justify-center">
                <span className="text-red-400/30 text-xl">⚔</span>
              </div>
              <div className="flex gap-0.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-7 h-1 rounded-full bg-red-400/20" style={{ opacity: 0.3 + i * 0.25 }} />
                ))}
              </div>
            </div>
            <span className="text-red-400/70 font-black text-sm uppercase tracking-[0.2em]">{opponentName}</span>
          </div>

          {/* Bottom hint */}
          <div className="absolute bottom-[14%] text-white/08 font-black text-[9px] uppercase tracking-[0.4em] anim-fade-text">
            PREPARING ARENA…
          </div>
        </div>
      )}

      {/* ─── Result screen ─── */}
      {phase === "result" && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/75 backdrop-blur-md">
          <div className="text-center animate-in fade-in zoom-in duration-500 flex flex-col items-center gap-6">
            {/* Crown or skull */}
            <div className="w-24 h-24 rounded-full border-2 flex items-center justify-center mb-2"
              style={{ borderColor: playerScore >= 5 ? "var(--ttg-yellow)" : "var(--ttg-red)", opacity: 0.25, background: playerScore >= 5 ? "rgba(255,204,0,0.05)" : "rgba(255,50,50,0.05)" }}>
              <span className="text-5xl">{playerScore >= 5 ? "👑" : "💀"}</span>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <h2 className="text-5xl sm:text-6xl font-black uppercase tracking-[0.05em]" style={{
                color: playerScore >= 5 ? "var(--ttg-yellow)" : "var(--ttg-red)",
                textShadow: playerScore >= 5 ? "0 0 60px rgba(255,204,0,0.4)" : "0 0 60px rgba(255,50,50,0.4)"
              }}>
                {playerScore >= 5 ? "VICTORY" : "DEFEAT"}
              </h2>
              <p className="text-white/20 font-black text-base tracking-[0.15em] mt-1">
                {playerName || "YOU"} {playerScore} — {opponentScore} {opponentName || "RIVAL"}
              </p>
            </div>

            <button onClick={initDemo}
              className="px-14 py-4 bg-yellow-500 text-black font-black uppercase tracking-[0.15em] text-sm rounded-xl hover:bg-yellow-400 transition-all shadow-xl shadow-yellow-500/25 active:scale-95">
              Rematch
            </button>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: CAM_PRESETS.default.pos, fov: 38, near: 0.5, far: 120 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        dpr={[1, 2]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ cursor: phase === "intro" ? "default" : (orbitMode ? "grab" : phase === "aim" ? (dragState.active ? "grabbing" : "grab") : "default"), pointerEvents: phase === "intro" ? "none" : "auto" }}
      >
        {/* Positioning: ghost preview + click target */}
        {phase === "positioning" && (
          <>
            <PositioningOverlay onPlace={handlePlaceDisc} />
            {ghostPos && <GhostDisc x={ghostPos.x} z={ghostPos.z} valid={ghostPos.valid} />}
          </>
        )}
        <CameraController preset={camPreset} orbitEnabled={orbitMode} />

        {/* Lighting */}
        <ambientLight intensity={0.55} />
        <directionalLight position={[6, 16, 4]} intensity={1.0} castShadow
          shadow-mapSize={[512, 512]}
          shadow-camera-near={0.5} shadow-camera-far={60}
          shadow-camera-left={-10} shadow-camera-right={10}
          shadow-camera-top={10} shadow-camera-bottom={-10} />
        <directionalLight position={[-4, 8, -5]} intensity={0.3} />
        <spotLight position={[0, 12, 0]} angle={0.6} penumbra={0.4} intensity={2.5} color="#FFF8E7" castShadow
          shadow-mapSize={[256, 256]} />
        <pointLight position={[5, 3, 5]} intensity={0.8} color="#FFCC00" />
        <pointLight position={[-5, 3, -5]} intensity={0.5} color="#4488FF" />

        <RectangularField />
        <FieldWalls />
        {/* Distant arena horizon ring */}
        <mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[FIELD_HALF_W + 2.0, FIELD_HALF_W + 2.15, 64]} />
          <meshBasicMaterial color="#FFE0A0" transparent opacity={0.025} side={2} depthWrite={false} />
        </mesh>
        {/* Stadium ambient lights — ring of distant lights */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i / 16) * Math.PI * 2
          const r = FIELD_HALF_W + 2.5
          const px = Math.cos(angle) * r
          const pz = Math.sin(angle) * r
          return (
            <pointLight key={i} position={[px, 6 + Math.sin(i * 1.7) * 2, pz]} 
              intensity={0.15 + Math.sin(i * 2.3) * 0.08} 
              color="#FFE0A0" distance={12} />
          )
        })}
        {/* Deck tubes (tubemazos) — player + opponent */}
        <DeckTubeV3 deckCount={playerDeck.length} totalCount={playerDeck.length + playerHand.length} side={1} />
        <DeckTubeV3 deckCount={opponentDeckRef.current.length} totalCount={opponentDeckRef.current.length + opponentHand.length} side={-1} />

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
        <ArenaParticlesV3 />
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
