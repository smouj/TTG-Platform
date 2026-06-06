// ============================================================
// Trading Tazos Game — 3D Battle Stadium
// Magazine-style 3D arena with animated tazo discs battling.
// Replaces the 2D canvas arena completely.
// ============================================================
"use client"

import { Suspense, useRef, useMemo, useState, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Text, ContactShadows, PerspectiveCamera, Html } from "@react-three/drei"
import TazoDisc3D from "./tazo-disc-3d"
import * as THREE from "three"

// ─── Stadium Floor with halftone ─────
function StadiumFloor() {
  const floorTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext("2d")!

    // Cream base
    ctx.fillStyle = "#fffbe6"
    ctx.fillRect(0, 0, 1024, 1024)

    // Outer ring
    ctx.strokeStyle = "#FFCC00"
    ctx.lineWidth = 24
    ctx.beginPath()
    ctx.arc(512, 512, 460, 0, Math.PI * 2)
    ctx.stroke()

    // Black ring
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.arc(512, 512, 460, 0, Math.PI * 2)
    ctx.stroke()

    // Inner battle zone
    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.arc(512, 512, 420, 0, Math.PI * 2)
    ctx.fill()

    // Battle zone border
    ctx.strokeStyle = "#FFCC00"
    ctx.lineWidth = 6
    ctx.beginPath()
    ctx.arc(512, 512, 420, 0, Math.PI * 2)
    ctx.stroke()

    // Crosshair lines
    ctx.strokeStyle = "rgba(26,26,26,0.15)"
    ctx.lineWidth = 2
    ctx.setLineDash([20, 20])
    ctx.beginPath()
    ctx.moveTo(92, 512); ctx.lineTo(932, 512)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(512, 92); ctx.lineTo(512, 932)
    ctx.stroke()

    // Score zones
    ctx.setLineDash([])
    ctx.strokeStyle = "#E3350D"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(512, 512, 210, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = "#3B4CCA"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(512, 512, 70, 0, Math.PI * 2)
    ctx.stroke()

    // Halftone pattern
    ctx.fillStyle = "rgba(26,26,26,0.04)"
    for (let y = 0; y < 1024; y += 12) {
      for (let x = 0; x < 1024; x += 12) {
        const dx = x - 512, dy = y - 512
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 420) {
          ctx.beginPath()
          ctx.arc(x + ((y / 12) % 2) * 6, y, 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = true
    return tex
  }, [])

  return (
    <mesh rotation={[Math.PI / -2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial
        map={floorTexture}
        roughness={0.8}
        metalness={0}
      />
    </mesh>
  )
}

// ─── Floating ring above the stadium ─────
function HolographicRing() {
  const ringRef = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 0.15
      ringRef.current.position.y = 1.8 + Math.sin(Date.now() * 0.001) * 0.1
    }
  })

  return (
    <mesh ref={ringRef} position={[0, 1.8, 0]} rotation={[Math.PI / 3, 0, 0]}>
      <torusGeometry args={[4.2, 0.06, 32, 128]} />
      <meshStandardMaterial
        color="#FFCC00"
        emissive="#FFCC00"
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.9}
        transparent
        opacity={0.7}
      />
    </mesh>
  )
}

// ─── Battle Tazo (animated disc entering arena) ─────
function BattleTazo({
  slot,
  tazo,
  side,
}: {
  slot: number // 0-2
  tazo: {
    name: string
    franchise: string
    attack: number
    defense: number
    color?: string
  } | null
  side: "player" | "opponent"
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const targetPos = useMemo(() => {
    const zDir = side === "player" ? -1 : 1
    const rowOff = slot - 1
    return new THREE.Vector3(rowOff * 1.8, 0.6, zDir * 2)
  }, [slot, side])

  useFrame((_, delta) => {
    if (groupRef.current && tazo) {
      // Float + orbit
      groupRef.current.position.lerp(targetPos, 0.08)
      groupRef.current.rotation.z += delta * 0.5
    }
  })

  if (!tazo) return null

  return (
    <group ref={groupRef} position={[0, 5, 0]}>
      {/* Shadow disc on ground */}
      <mesh position={[0, -0.6, 0]} rotation={[Math.PI / -2, 0, 0]}>
        <circleGeometry args={[0.6, 32]} />
        <meshBasicMaterial
          color="#1a1a1a"
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </mesh>

      <TazoDisc3D
        name={tazo.name}
        franchise={tazo.franchise}
        size={0.6}
        rotationSpeed={0.8}
        autoRotate={true}
      />
    </group>
  )
}

// ─── Stat display floating label ─────
function StatLabel({
  label,
  value,
  position,
  color,
}: {
  label: string
  value: number | string
  position: [number, number, number]
  color: string
}) {
  return (
    <Text
      position={position}
      fontSize={0.18}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.01}
      outlineColor="#1a1a1a"
      font="/fonts/Geist-Bold.ttf"
    >
      {`${label}: ${value}`}
    </Text>
  )
}

// ─── Attack arc particle ─────
function AttackArc({
  from,
  to,
  color,
  active,
}: {
  from: [number, number, number]
  to: [number, number, number]
  color: string
  active: boolean
}) {
  const arcRef = useRef<THREE.Mesh>(null!)
  const progress = useRef(0)

  useFrame((_, delta) => {
    if (active && arcRef.current) {
      progress.current = Math.min(1, progress.current + delta * 2)
      const t = progress.current
      const mid = [
        (from[0] + to[0]) / 2,
        (from[1] + to[1]) / 2 + 2,
        (from[2] + to[2]) / 2,
      ]
      const bx = (1 - t) * (1 - t) * from[0] + 2 * (1 - t) * t * mid[0] + t * t * to[0]
      const by = (1 - t) * (1 - t) * from[1] + 2 * (1 - t) * t * mid[1] + t * t * to[1]
      const bz = (1 - t) * (1 - t) * from[2] + 2 * (1 - t) * t * mid[2] + t * t * to[2]
      arcRef.current.position.set(bx, by, bz)
      const material = arcRef.current.material as THREE.MeshStandardMaterial
      material.opacity = Math.sin(t * Math.PI) * 0.8
    }
    if (!active) progress.current = 0
  })

  return (
    <mesh ref={arcRef} visible={active}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  )
}

// ─── Battle scene ─────
interface BattleTazoInfo {
  id: string
  name: string
  franchise: string
  attack: number
  defense: number
  speed?: number
  color?: string
}

interface BattleStadium3DProps {
  playerTazos: BattleTazoInfo[]
  opponentTazos: BattleTazoInfo[]
  playerHP?: number
  opponentHP?: number
  activeAttack?: { from: number; to: number; color: string }
  className?: string
  style?: React.CSSProperties
}

function BattleScene({
  playerTazos,
  opponentTazos,
  playerHP = 100,
  opponentHP = 100,
  activeAttack,
}: BattleStadium3DProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 3]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 4, -5]} intensity={0.3} />

      {/* Spotlights from above */}
      <spotLight
        position={[0, 8, 0]}
        angle={0.5}
        penumbra={0.5}
        intensity={2}
        color="#FFCC00"
        castShadow
      />
      <pointLight position={[-4, 2, 3]} intensity={0.4} color="#E3350D" />
      <pointLight position={[4, 2, -3]} intensity={0.4} color="#3B4CCA" />

      {/* Stadium elements */}
      <StadiumFloor />
      <HolographicRing />

      {/* Battle tazos */}
      {playerTazos.map((t, i) => (
        <BattleTazo key={`p${i}`} slot={i} tazo={t} side="player" />
      ))}
      {opponentTazos.map((t, i) => (
        <BattleTazo key={`o${i}`} slot={i} tazo={t} side="opponent" />
      ))}

      {/* Attack arc */}
      {activeAttack && (
        <AttackArc
          from={[-activeAttack.from * 1.5 + 0.9, 0.8, -2]}
          to={[activeAttack.to * 1.5 - 0.9, 0.8, 2]}
          color={activeAttack.color}
          active={true}
        />
      )}

      {/* HP bars as 3D text */}
      <StatLabel label="YOU" value={`${playerHP} HP`} position={[0, 0.2, -3.2]} color="#E3350D" />
      <StatLabel label="OPPONENT" value={`${opponentHP} HP`} position={[0, 0.2, 3.2]} color="#3B4CCA" />

      <ContactShadows position={[0, -0.05, 0]} opacity={0.3} scale={10} blur={2} />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={5}
        maxDistance={15}
        autoRotate={true}
        autoRotateSpeed={0.4}
        target={[0, 0.5, 0]}
      />
    </>
  )
}

// ─── Exported wrapper ─────
export default function BattleStadium3D(props: BattleStadium3DProps) {
  return (
    <div
      className={props.className}
      style={{
        width: "100%",
        minHeight: 500,
        background: "linear-gradient(180deg, #fffbe6 0%, #f0e8c8 50%, #e8d8b0 100%)",
        ...props.style,
      }}
    >
      <Canvas
        camera={{ position: [0, 6, 8], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        shadows
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <BattleScene {...props} />
        </Suspense>
      </Canvas>
    </div>
  )
}
