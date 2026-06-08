// ============================================================
// Trading Tazos Game — PotatoChipBag3D v4
//
// Premium 3D foil bag model. Game-quality.
// - Trapezoidal pillow shape (wider at top, puffy volume)
// - NO rotation — always faces camera
// - Self-animates: `opening` bool → smooth lerp with pop effect
// - Interior glow activates during opening
// - Professional foil materials with crinkle
// ============================================================
"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

// ── Bag dimensions (trapezoidal: wider at top) ──
export const BAG_W_TOP = 0.72
export const BAG_W_BOT = 0.64
export const BAG_H = 1.02
export const BAG_D = 0.22
export const TOP_CRIMP = 0.14
export const BOT_CRIMP = 0.10
export const BODY_H = BAG_H - TOP_CRIMP - BOT_CRIMP
const BULGE = 0.09
const EDGE_R = 0.028

// ── Helper ──
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }

// ── Programmatic crimp texture (HD metallic zigzag) ──
function makeCrimpTexture(): THREE.Texture {
  const c = document.createElement("canvas")
  c.width = 512; c.height = 80
  const ctx = c.getContext("2d")!

  const g = ctx.createLinearGradient(0, 0, 0, 80)
  g.addColorStop(0.0, "#6a6a6a")
  g.addColorStop(0.12, "#a8a8a8")
  g.addColorStop(0.28, "#d4d4d4")
  g.addColorStop(0.5, "#eee")
  g.addColorStop(0.72, "#c8c8c8")
  g.addColorStop(0.88, "#969696")
  g.addColorStop(1.0, "#5a5a5a")
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 80)

  // Deep crimp grooves
  ctx.strokeStyle = "rgba(0,0,0,0.28)"; ctx.lineWidth = 2
  for (let row = 0; row < 14; row++) {
    ctx.beginPath()
    const baseY = 5 + row * 5.2
    for (let x = 0; x <= 512; x += 7) {
      const y = baseY + Math.sin(x * 0.14 + row * 0.75) * 2.5
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Highlight reflections
  ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 0.6
  for (let y = 4; y < 76; y += 7) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

let _crimpTex: THREE.Texture | null = null
function getCrimpTex(): THREE.Texture {
  if (!_crimpTex) _crimpTex = makeCrimpTexture()
  return _crimpTex
}

// ── Trapezoidal pillow face geometry ──
function makePillowFaceGeo(
  wTop: number, wBot: number, h: number, bulge: number, segs: number
): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(wTop, h, segs, Math.round(segs * 1.8))
  const pos = geo.attributes.position
  const halfWTop = wTop / 2
  const halfWBot = wBot / 2

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    // Trapezoidal: width varies from top to bottom
    const yNorm = (y / (h / 2)) // -1 at bottom, +1 at top
    const wAtY = lerp(halfWBot, halfWTop, (yNorm + 1) / 2)
    const newX = x * (wAtY / halfWTop)
    pos.setX(i, newX)

    // Pillow bulge
    const xN = Math.abs(newX) / wAtY
    const yN = Math.abs(y) / (h / 2)
    const z = bulge
      * (1 - Math.pow(xN, 3.0))
      * (1 - Math.pow(yN, 6.0))
      * (1 + 0.4 * Math.sin(xN * Math.PI * 0.85))
    pos.setZ(i, z)
  }
  geo.computeVertexNormals()
  return geo
}

// ── Props ──
interface Props {
  frontUrl: string
  backUrl: string
  scale?: number
  interactive?: boolean
  onPointerDown?: (e: THREE.Event) => void
  onPointerMove?: (e: THREE.Event) => void
  onPointerUp?: (e: THREE.Event) => void
  opening?: boolean
}

// ── Component ──
export default function PotatoChipBag3D({
  frontUrl, backUrl, scale = 1,
  interactive = false,
  onPointerDown, onPointerMove, onPointerUp,
  opening = false,
}: Props) {
  const groupRef = useRef<THREE.Group>(null!)
  const topSealRef = useRef<THREE.Group>(null!)
  const frontBodyRef = useRef<THREE.Group>(null!)
  const backBodyRef = useRef<THREE.Group>(null!)
  const interiorRef = useRef<THREE.Mesh>(null!)
  const interiorGlowRef = useRef<THREE.PointLight>(null!)
  const openRef = useRef(0)
  const popRef = useRef(0)
  const wasOpening = useRef(false)

  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const crimpTex = useMemo(() => getCrimpTex(), [])
  const pillowGeo = useMemo(() => makePillowFaceGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BULGE, 24), [])
  const edgeGeo = useMemo(() => new THREE.CylinderGeometry(EDGE_R, EDGE_R, BODY_H, 12), [])

  useEffect(() => {
    for (const tex of [frontTex, backTex]) {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.generateMipmaps = true
    }
  }, [frontTex, backTex])

  const bodyY = (TOP_CRIMP - BOT_CRIMP) / 2
  const topY = BAG_H / 2 - TOP_CRIMP / 2
  const botY = -BAG_H / 2 + BOT_CRIMP / 2
  const halfWTop = BAG_W_TOP / 2
  const halfD = BAG_D / 2
  const baseScale = scale

  // ── Self-animating ──
  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return

    // Detect opening transition for pop
    if (opening && !wasOpening.current) {
      popRef.current = 1.0
    }
    wasOpening.current = opening

    // Pop decay
    popRef.current = Math.max(0, popRef.current - delta * 8)

    // Lerp open progress
    openRef.current = THREE.MathUtils.lerp(openRef.current, opening ? 1 : 0, 3.5 * delta)
    const p = Math.max(0, Math.min(1, openRef.current))

    // Pop scale (multiply by base scale, not override)
    const popScale = baseScale * (1 + popRef.current * 0.06 * Math.sin(popRef.current * Math.PI))
    g.scale.setScalar(popScale)

    // ═══ TOP SEAL: rip and fly ═══
    if (topSealRef.current) {
      const t = easeOutCubic(Math.min(1, p / 0.3))
      topSealRef.current.position.y = topY + t * 0.55
      topSealRef.current.position.z = t * 0.28
      topSealRef.current.rotation.x = t * -1.35
      topSealRef.current.rotation.z = t * 0.18
      // Slight twist + wobble
      topSealRef.current.rotation.y = t * Math.sin(Date.now() * 0.006) * 0.3
      // Continuous upward drift after peeling — no abrupt disappearance
      topSealRef.current.position.y += (p > 0.7 ? (p - 0.7) * 3.5 : 0) * delta * 16
    }

    // ═══ FRONT BODY: peel forward dramatically ═══
    if (frontBodyRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.08) / 0.6)))
      frontBodyRef.current.position.z = halfD + 0.001 + t * 0.09
      frontBodyRef.current.rotation.x = t * 0.65
      // Also rotate Z slightly for organic feel
      frontBodyRef.current.rotation.z = t * 0.04
    }

    // ═══ BACK BODY: peel backward ═══
    if (backBodyRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.08) / 0.6)))
      backBodyRef.current.position.z = -halfD - 0.001 - t * 0.09
      backBodyRef.current.rotation.x = t * -0.55
      backBodyRef.current.rotation.z = t * -0.03
    }

    // ═══ INTERIOR CAVITY ═══
    if (interiorRef.current) {
      const t = Math.min(1, Math.max(0, (p - 0.15) / 0.5))
      interiorRef.current.scale.setScalar(0.4 + t * 0.7)
      if (!Array.isArray(interiorRef.current.material)) {
        interiorRef.current.material.opacity = t * 0.95
      }
    }

    // ═══ INTERIOR GLOW LIGHT ═══
    if (interiorGlowRef.current) {
      const t = Math.min(1, Math.max(0, (p - 0.25) / 0.5))
      interiorGlowRef.current.intensity = t * 0.9
    }
  })

  return (
    <group ref={groupRef} scale={scale}>
      {/* ═══ BOTTOM CRIMP ═══ */}
      <mesh position={[0, botY, 0]}>
        <boxGeometry args={[BAG_W_BOT + 0.015, BOT_CRIMP, BAG_D + 0.015]} />
        <meshStandardMaterial map={crimpTex} roughness={0.3} metalness={0.65} />
      </mesh>

      {/* ═══ FRONT BODY ═══ */}
      <group ref={frontBodyRef} position={[0, bodyY, halfD + 0.001]}>
        <mesh
          geometry={pillowGeo}
          onPointerDown={interactive ? onPointerDown : undefined}
          onPointerMove={interactive ? onPointerMove : undefined}
          onPointerUp={interactive ? onPointerUp : undefined}
        >
          <meshStandardMaterial
            map={frontTex}
            roughness={0.18}
            metalness={0.45}
            side={THREE.FrontSide}
            transparent
            alphaTest={0.01}
          />
        </mesh>
      </group>

      {/* ═══ BACK BODY ═══ */}
      <group ref={backBodyRef} position={[0, bodyY, -halfD - 0.001]}>
        <mesh geometry={pillowGeo} rotation={[0, Math.PI, 0]}>
          <meshStandardMaterial
            map={backTex}
            roughness={0.18}
            metalness={0.45}
            side={THREE.FrontSide}
            transparent
            alphaTest={0.01}
          />
        </mesh>
      </group>

      {/* ═══ LEFT EDGE ═══ */}
      <mesh geometry={edgeGeo} position={[-halfWTop + EDGE_R, bodyY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#b0b0b0" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* ═══ RIGHT EDGE ═══ */}
      <mesh geometry={edgeGeo} position={[halfWTop - EDGE_R, bodyY, 0]} rotation={[0, 0, Math.PI / 2]}>
        <meshStandardMaterial color="#b0b0b0" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* ═══ INTERIOR CAVITY ═══ */}
      <mesh ref={interiorRef} position={[0, bodyY, 0]}>
        <boxGeometry args={[BAG_W_BOT * 0.7, BODY_H * 0.5, BAG_D * 0.35]} />
        <meshStandardMaterial
          color="#050302"
          roughness={0.95}
          metalness={0}
          transparent
          opacity={0}
          depthWrite={true}
        />
      </mesh>

      {/* ═══ INTERIOR POINT LIGHT (glow from inside) ═══ */}
      <pointLight
        ref={interiorGlowRef}
        position={[0, bodyY, 0]}
        intensity={0}
        color="#ffaa44"
        distance={1.2}
        decay={2}
      />

      {/* ═══ TOP CRIMP SEAL (tears off with notch + corners) ═══ */}
      <group ref={topSealRef} position={[0, topY, 0]}>
      <mesh>
        <boxGeometry args={[BAG_W_TOP + 0.015, TOP_CRIMP, BAG_D + 0.025]} />
        <meshStandardMaterial map={crimpTex} roughness={0.3} metalness={0.65} />
      </mesh>

      {/* ═══ TEAR NOTCH ═══ */}
      <mesh position={[halfWTop + 0.018, -TOP_CRIMP * 0.3, 0]}>
        <boxGeometry args={[0.045, 0.08, BAG_D + 0.035]} />
        <meshStandardMaterial color="#E3350D" roughness={0.1} metalness={0.05} emissive="#E3350D" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[halfWTop + 0.022, -TOP_CRIMP * 0.55, 0]}>
        <boxGeometry args={[0.032, 0.032, BAG_D + 0.04]} />
        <meshStandardMaterial color="#E3350D" roughness={0.1} metalness={0.05} emissive="#E3350D" emissiveIntensity={0.3} />
      </mesh>

      {/* ═══ CORNER ROUNDS ═══ */}
      <mesh position={[halfWTop, 0, 0]}>
        <sphereGeometry args={[EDGE_R * 1.3, 8, 8]} />
        <meshStandardMaterial color="#b0b0b0" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[-halfWTop, 0, 0]}>
        <sphereGeometry args={[EDGE_R * 1.3, 8, 8]} />
        <meshStandardMaterial color="#b0b0b0" roughness={0.3} metalness={0.6} />
      </mesh>
      </group>
    </group>
  )
}
