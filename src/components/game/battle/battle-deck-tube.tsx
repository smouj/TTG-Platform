// ============================================================
// Trading Tazos Game — Battle Deck Tube v1
//
// 3D cylinder tube visible in arena scene during battle.
// Shows player's remaining deck — tazos fly out when drawn.
// Pulsates when it's time to draw. Shows remaining count.
// ============================================================
"use client"

import { useRef, useMemo, useEffect, useState } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

// ── Tube dimensions (bigger than lobby tube, visible in arena) ──
const TUBE_RADIUS = 0.42
const TUBE_HEIGHT = 1.35

// ── Franchise textures ──
const TUBE_TEXTURES: Record<string, string> = {
  minimon: "/tazos-tubes/tube-minimon.png",
  cybermon: "/tazos-tubes/tube-cybermon.png",
  dracobell: "/tazos-tubes/tube-dracobell.png",
}

const FRANCHISE_COLORS: Record<string, string> = {
  minimon: "#FFCC00",
  cybermon: "#00B4D8",
  dracobell: "#FF6B00",
}

// ── Card that flies from tube to hand ──
export function CardFlyParticle({
  startPos, endPos, color, onDone, index,
}: {
  startPos: THREE.Vector3; endPos: THREE.Vector3
  color: string; onDone: () => void; index: number
}) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const lifeRef = useRef(0)
  const startTimeRef = useRef(-index * 0.12) // stagger
  const duration = 0.65
  const arcHeight = 1.8

  useFrame((_, delta) => {
    if (!meshRef.current) return
    if (startTimeRef.current < 0) {
      startTimeRef.current += delta
      meshRef.current.visible = false
      return
    }
    meshRef.current.visible = true
    lifeRef.current += delta
    const t = Math.min(1, lifeRef.current / duration)
    // Ease out quad
    const ease = 1 - (1 - t) * (1 - t)
    // Arc
    const x = THREE.MathUtils.lerp(startPos.x, endPos.x, ease)
    const y = THREE.MathUtils.lerp(startPos.y, endPos.y, ease) + Math.sin(t * Math.PI) * arcHeight
    const z = THREE.MathUtils.lerp(startPos.z, endPos.z, ease)
    meshRef.current.position.set(x, y, z)
    // Rotation
    meshRef.current.rotation.set(0, ease * Math.PI * 4, 0)
    // Scale: shrink at end
    meshRef.current.scale.setScalar(0.8 + Math.sin(t * Math.PI) * 0.4)

    if (t >= 1) {
      meshRef.current.visible = false
      onDone()
    }
  })

  return (
    <mesh ref={meshRef} visible={false}>
      <cylinderGeometry args={[0.16, 0.16, 0.04, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.2} metalness={0.3} />
    </mesh>
  )
}

// ── Simple rotating disc inside tube ──
function DiscInTube({ url, yOffset, rotation }: { url: string; yOffset: number; rotation: number }) {
  const loadedTexture = useLoader(THREE.TextureLoader, url)
  const texture = useMemo(() => {
    const t = loadedTexture.clone()
    t.colorSpace = THREE.SRGBColorSpace
    t.needsUpdate = true
    return t
  }, [loadedTexture])

  return (
    <mesh position={[0, yOffset, 0]} rotation={[-Math.PI / 2, rotation, 0]}>
      <circleGeometry args={[TUBE_RADIUS * 0.75, 24]} />
      <meshStandardMaterial map={texture} side={THREE.DoubleSide} transparent opacity={0.85} roughness={0.3} />
    </mesh>
  )
}

interface BattleDeckTubeProps {
  position: [number, number, number]
  franchise: string
  remainingCount: number
  totalCount: number
  isPlayer: boolean
  isDrawing?: boolean
  drawTrigger?: number  // increments to trigger draw animation
  tazoImageUrls?: string[]
}

export default function BattleDeckTube({
  position, franchise, remainingCount, totalCount,
  isPlayer, isDrawing = false, drawTrigger = 0,
  tazoImageUrls = [],
}: BattleDeckTubeProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const textureUrl = TUBE_TEXTURES[franchise] || TUBE_TEXTURES.minimon
  const tubeColor = FRANCHISE_COLORS[franchise] || "#FFCC00"
  const color = isPlayer ? tubeColor : "var(--ttg-opponent)"

  const loadedTexture = useLoader(THREE.TextureLoader, textureUrl)
  const texture = useMemo(() => {
    const t = loadedTexture.clone()
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.ClampToEdgeWrapping
    t.needsUpdate = true
    return t
  }, [loadedTexture])

  // ── Fill level visualization ──
  const fillPct = totalCount > 0 ? remainingCount / totalCount : 0
  const visibleDiscs = Math.max(0, Math.min(5, remainingCount))
  const discUrls = tazoImageUrls.slice(0, visibleDiscs)

  // ── Pulse on draw ──
  const pulseRef = useRef(0)
  useEffect(() => {
    if (drawTrigger > 0) pulseRef.current = 1.0
  }, [drawTrigger])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    // Gentle idle rotation
    groupRef.current.rotation.y += 0.15 * delta

    // Draw pulse
    if (pulseRef.current > 0) {
      pulseRef.current = Math.max(0, pulseRef.current - delta * 3)
      const scale = 1 + pulseRef.current * 0.15
      groupRef.current.scale.setScalar(scale)
    } else {
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1)
    }

    // Glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.12 + Math.sin(Date.now() * 0.003) * 0.05 + (isDrawing ? 0.25 : 0)
      if (isDrawing) {
        mat.color.set("#FFCC00")
      } else {
        mat.color.set(color)
      }
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* ── Tube body ── */}
      <mesh>
        <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, TUBE_HEIGHT, 48, 1, true]} />
        <meshStandardMaterial map={texture} roughness={0.3} metalness={0.08} />
      </mesh>

      {/* ── Top cap rim ── */}
      <mesh position={[0, TUBE_HEIGHT / 2 - 0.02, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[TUBE_RADIUS, 0.04, 16, 48]} />
        <meshStandardMaterial color="#d0c8b8" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* ── Bottom cap rim ── */}
      <mesh position={[0, -TUBE_HEIGHT / 2 + 0.02, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[TUBE_RADIUS, 0.04, 16, 48]} />
        <meshStandardMaterial color="#d0c8b8" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* ── Tazo discs visible inside ── */}
      {discUrls.map((url, i) => (
        <DiscInTube
          key={i}
          url={url}
          yOffset={-0.22 + i * 0.12}
          rotation={i * 0.7}
        />
      ))}

      {/* ── Fill indicator (colored liquid line inside) ── */}
      {fillPct > 0 && fillPct < 1 && (
        <mesh position={[0, -TUBE_HEIGHT / 2 + fillPct * TUBE_HEIGHT * 0.7, 0]}>
          <cylinderGeometry args={[TUBE_RADIUS * 0.92, TUBE_RADIUS * 0.92, 0.03, 32]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.4}
            roughness={0.15}
            metalness={0.1}
            transparent
            opacity={0.45}
          />
        </mesh>
      )}

      {/* ── Outer glow ring ── */}
      <mesh ref={glowRef} position={[0, -0.15, 0]}>
        <torusGeometry args={[TUBE_RADIUS + 0.15, 0.06, 8, 48]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>

      {/* ── Count label floating above ── */}
      <CountLabel
        count={remainingCount}
        total={totalCount}
        color={color}
        isPlayer={isPlayer}
        isDrawing={isDrawing}
      />

      {/* ── Light pillar from tube top (when drawing) ── */}
      {isDrawing && (
        <pointLight
          position={[0, TUBE_HEIGHT / 2 + 0.1, 0]}
          intensity={0.8}
          color="#FFCC00"
          distance={4}
        />
      )}
    </group>
  )
}

// ── Floating count text above tube ──
function CountLabel({ count, total, color, isPlayer, isDrawing }: {
  count: number; total: number; color: string
  isPlayer: boolean; isDrawing: boolean
}) {
  const labelRef = useRef<THREE.Group>(null!)

  useFrame(() => {
    if (labelRef.current) {
      labelRef.current.position.y = TUBE_HEIGHT / 2 + 0.6 + Math.sin(Date.now() * 0.002) * 0.05
    }
  })

  // Canvas texture for the count
  const tex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 256; c.height = 64
    const ctx = c.getContext("2d")!
    ctx.fillStyle = isDrawing ? "#FFCC00" : color
    ctx.font = "bold 28px monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    const text = `${count}/${total}`
    ctx.fillText(text, 128, 32)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearFilter
    return t
  }, [count, total, color, isDrawing])

  return (
    <group ref={labelRef} position={[0, TUBE_HEIGHT / 2 + 0.6, 0]}>
      <mesh rotation={[0, 0, 0]}>
        <planeGeometry args={[1.2, 0.3]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
