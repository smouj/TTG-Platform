// ============================================================
// Trading Tazos Game — PotatoChipBag3D v7
//
// Solid 3D foil bag with side panels — no transparent gaps.
// Clean edges, no metallic crimps — magazine aesthetic.
// ============================================================
"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

// ── Bag dimensions (same proportions) ──
export const BAG_W_TOP = 0.72
export const BAG_W_BOT = 0.64
export const BAG_H = 1.02
export const BAG_D = 0.22
const TOP_CRIMP = 0.09  // Thinner top edge
const BOT_CRIMP = 0.07  // Thinner bottom edge
export const BODY_H = BAG_H - TOP_CRIMP - BOT_CRIMP
const BULGE = 0.09

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function easeOutBack(t: number) { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) }
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }

// ── Pillow face geometry (trapezoidal) ──
function makePillowFaceGeo(wTop: number, wBot: number, h: number, bulge: number, segs: number): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(wTop, h, segs, Math.round(segs * 1.8))
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    const yNorm = y / (h / 2)
    const wAtY = lerp(wBot / 2, wTop / 2, (yNorm + 1) / 2)
    pos.setX(i, x * (wAtY / (wTop / 2)))
    const xN = Math.abs(pos.getX(i)) / wAtY, yN = Math.abs(y) / (h / 2)
    pos.setZ(i, bulge * (1 - Math.pow(xN, 3)) * (1 - Math.pow(yN, 6)) * (1 + 0.4 * Math.sin(xN * Math.PI * 0.85)))
  }
  geo.computeVertexNormals()
  return geo
}

// ── Side panel geometry (connects front and back edges) ──
function makeSidePanelGeo(wTop: number, wBot: number, h: number, bulge: number, depth: number, segsH: number): THREE.BufferGeometry {
  const vertices: number[] = []
  const indices: number[] = []
  const halfD = depth / 2

  for (let i = 0; i <= segsH; i++) {
    const t = i / segsH
    const y = (t - 0.5) * h
    const wAtY = lerp(wBot / 2, wTop / 2, t)
    const yNorm = Math.abs(y) / (h / 2)
    const zOffset = bulge * (1 - Math.pow(1, 3)) * (1 - Math.pow(yNorm, 6)) * 0.85 // Edge bulge
    
    // Right side: front edge + back edge
    vertices.push(wAtY, y, halfD + zOffset)   // front right
    vertices.push(wAtY, y, -halfD - zOffset)   // back right
    // Left side: front edge + back edge  
    vertices.push(-wAtY, y, halfD + zOffset)   // front left
    vertices.push(-wAtY, y, -halfD - zOffset)  // back left
  }

  // Triangles: right side (0,1,2,3 pattern)
  for (let i = 0; i < segsH; i++) {
    const a = i * 4, b = a + 1, c = a + 4, d = a + 5
    // Right side
    indices.push(a, c, b, b, c, d)
    // Left side
    const la = a + 2, lb = b + 2, lc = c + 2, ld = d + 2
    indices.push(la, lc, lb, lb, lc, ld)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// ── Clean edge texture (replaces metallic crimp) ──
function makeCleanEdgeTexture(bagColor: string): THREE.Texture {
  const c = document.createElement("canvas")
  c.width = 256; c.height = 32
  const ctx = c.getContext("2d")!
  
  // Solid fill matching the bag
  ctx.fillStyle = bagColor
  ctx.fillRect(0, 0, 256, 32)
  
  // Subtle horizontal lines (like foil crimps, but subtle)
  ctx.strokeStyle = "rgba(0,0,0,0.06)"
  ctx.lineWidth = 1
  for (let i = 0; i < 10; i++) {
    const y = 2 + i * 2.8 + Math.sin(i * 0.8) * 0.5
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(256, y)
    ctx.stroke()
  }
  
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

let _edgeTex: THREE.Texture | null = null
function getEdgeTex(): THREE.Texture {
  if (!_edgeTex) _edgeTex = makeCleanEdgeTexture("#d4d0c8") // Neutral foil color
  return _edgeTex
}

interface Props {
  frontUrl: string; backUrl: string; scale?: number
  interactive?: boolean
  onPointerDown?: (e: THREE.Event) => void
  onPointerMove?: (e: THREE.Event) => void
  onPointerUp?: (e: THREE.Event) => void
  opening?: boolean
}

export default function PotatoChipBag3D({
  frontUrl, backUrl, scale = 1, interactive = false,
  onPointerDown, onPointerMove, onPointerUp, opening = false,
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
  const edgeTex = useMemo(() => getEdgeTex(), [])
  const pillowGeo = useMemo(() => makePillowFaceGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BULGE, 24), [])
  const sideGeo = useMemo(() => makeSidePanelGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BULGE, BAG_D, 12), [])

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
  const halfD = BAG_D / 2
  const baseScale = scale

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return

    if (opening && !wasOpening.current) popRef.current = 1.0
    wasOpening.current = opening

    popRef.current = Math.max(0, popRef.current - delta * 5)
    openRef.current = THREE.MathUtils.lerp(openRef.current, opening ? 1 : 0, 3.0 * delta)
    const p = Math.max(0, Math.min(1, openRef.current))

    const popEnvelope = Math.sin(popRef.current * Math.PI) * (1 - popRef.current * 0.3)
    g.scale.setScalar(baseScale * (1 + popRef.current * 0.08 * popEnvelope))

    // ── TOP SEAL: rip off ──
    if (topSealRef.current) {
      const t = easeOutBack(Math.min(1, p / 0.25))
      topSealRef.current.position.y = topY + t * 0.7
      topSealRef.current.position.z = t * 0.35
      topSealRef.current.rotation.x = t * -1.6
      topSealRef.current.rotation.z = t * 0.22
      topSealRef.current.rotation.y = t * Math.sin(Date.now() * 0.005) * 0.35
      if (p > 0.65) {
        topSealRef.current.position.y += (p - 0.65) * delta * 20
        topSealRef.current.rotation.z += delta * 2
      }
    }

    // ── FRONT BODY: peel forward ──
    if (frontBodyRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.06) / 0.65)))
      frontBodyRef.current.position.z = halfD + 0.001 + t * 0.11
      frontBodyRef.current.rotation.x = t * 0.7
      frontBodyRef.current.rotation.z = t * 0.05
    }

    // ── BACK BODY: peel backward ──
    if (backBodyRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.06) / 0.65)))
      backBodyRef.current.position.z = -halfD - 0.001 - t * 0.11
      backBodyRef.current.rotation.x = t * -0.6
      backBodyRef.current.rotation.z = t * -0.04
    }

    // ── INTERIOR: grow dark cavity ──
    if (interiorRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.12) / 0.55)))
      interiorRef.current.scale.setScalar(0.3 + t * 0.8)
      if (!Array.isArray(interiorRef.current.material)) {
        interiorRef.current.material.opacity = t * 0.95
      }
    }

    // ── GLOW: warm golden light from inside ──
    if (interiorGlowRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.2) / 0.5)))
      interiorGlowRef.current.intensity = t * 1.2
      interiorGlowRef.current.intensity *= 1 + Math.sin(Date.now() * 0.008) * 0.3 * t
    }
  })

  return (
    <group ref={groupRef} scale={scale}>
      {/* ── BOTTOM EDGE ── */}
      <mesh position={[0, botY, 0]}>
        <boxGeometry args={[BAG_W_BOT + 0.012, BOT_CRIMP, BAG_D + 0.012]} />
        <meshStandardMaterial map={edgeTex} roughness={0.6} metalness={0.05} />
      </mesh>

      {/* ── SIDE PANELS (connect front and back, eliminate transparency) ── */}
      <group position={[0, bodyY, 0]}>
        <mesh geometry={sideGeo}>
          <meshStandardMaterial map={edgeTex} roughness={0.6} metalness={0.05} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ── FRONT BODY ── */}
      <group ref={frontBodyRef} position={[0, bodyY, halfD + 0.001]}>
        <mesh geometry={pillowGeo}
          onPointerDown={interactive ? onPointerDown : undefined}
          onPointerMove={interactive ? onPointerMove : undefined}
          onPointerUp={interactive ? onPointerUp : undefined}>
          <meshStandardMaterial map={frontTex} roughness={0.22} metalness={0.0} side={THREE.FrontSide} transparent alphaTest={0.01} />
        </mesh>
      </group>

      {/* ── BACK BODY ── */}
      <group ref={backBodyRef} position={[0, bodyY, -halfD - 0.001]}>
        <mesh geometry={pillowGeo} rotation={[0, Math.PI, 0]}>
          <meshStandardMaterial map={backTex} roughness={0.22} metalness={0.0} side={THREE.FrontSide} transparent alphaTest={0.01} />
        </mesh>
      </group>

      {/* ── INTERIOR CAVITY (for opening animation) ── */}
      <mesh ref={interiorRef} position={[0, bodyY, 0]}>
        <boxGeometry args={[BAG_W_BOT * 0.7, BODY_H * 0.5, BAG_D * 0.35]} />
        <meshStandardMaterial color="#050302" roughness={0.95} metalness={0} transparent opacity={0} depthWrite />
      </mesh>

      {/* ── INTERIOR GLOW ── */}
      <pointLight ref={interiorGlowRef} position={[0, bodyY, 0]} intensity={0} color="#ffbb33" distance={1.3} decay={2} />

      {/* ── TOP EDGE ── */}
      <group ref={topSealRef} position={[0, topY, 0]}>
        <mesh>
          <boxGeometry args={[BAG_W_TOP + 0.012, TOP_CRIMP, BAG_D + 0.02]} />
          <meshStandardMaterial map={edgeTex} roughness={0.6} metalness={0.05} />
        </mesh>
      </group>
    </group>
  )
}
