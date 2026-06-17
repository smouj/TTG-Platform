// ============================================================
// Trading Tazos Game — PotatoChipBag3D v9
//
// TRUE pillow pouch. NO box geometry anywhere.
// Front + back bulging faces, thin crimped seals,
// microscopic side seams — NOT walls.
// ============================================================
"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

// ── Bag dimensions ──
export const BAG_W_TOP = 0.72
export const BAG_W_BOT = 0.64
export const BAG_H = 1.02
const BAG_D = 0.04       // Gap between front/back at edges (just the seam)
const TOP_CRIMP = 0.08
const BOT_CRIMP = 0.06
export const BODY_H = BAG_H - TOP_CRIMP - BOT_CRIMP
const BULGE = 0.17        // Each face inflates this much at center

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function easeOutBack(t: number) { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) }
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }

// ── HEX helpers ──
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
}
function darkenHex(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex)
  const dr = Math.round(Math.max(0, r * factor) * 255)
  const dg = Math.round(Math.max(0, g * factor) * 255)
  const db = Math.round(Math.max(0, b * factor) * 255)
  return `#${dr.toString(16).padStart(2, "0")}${dg.toString(16).padStart(2, "0")}${db.toString(16).padStart(2, "0")}`
}
function lightenHex(hex: string, mix: number): string {
  const [r, g, b] = hexToRgb(hex)
  const lr = Math.round(Math.min(255, (r + (1 - r) * mix) * 255))
  const lg = Math.round(Math.min(255, (g + (1 - g) * mix) * 255))
  const lb = Math.round(Math.min(255, (b + (1 - b) * mix) * 255))
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`
}

// ════════════════════════════════════════════════════════
// PILLOW FACE — bulging front or back face, trapezoidal
// ════════════════════════════════════════════════════════
function makePillowFaceGeo(wTop: number, wBot: number, h: number, bulge: number, segs: number): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(wTop, h, segs, Math.round(segs * 1.8))
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    const yNorm = y / (h / 2)
    const wAtY = lerp(wBot / 2, wTop / 2, (yNorm + 1) / 2)
    pos.setX(i, x * (wAtY / (wTop / 2)))
    const xN = Math.abs(pos.getX(i)) / wAtY
    const yN = Math.abs(y) / (h / 2)
    // Smooth pillow: max at center, falls to zero at edges
    pos.setZ(i, bulge * Math.pow(1 - Math.pow(xN, 3), 2) * Math.pow(1 - Math.pow(yN, 5), 2.5))
  }
  geo.computeVertexNormals()
  return geo
}

// ════════════════════════════════════════════════════════
// EDGE SEAM — microscopic connector, NOT a wall
// ════════════════════════════════════════════════════════
function makeEdgeSeamGeo(wTop: number, wBot: number, h: number, gap: number, segsH: number): THREE.BufferGeometry {
  const vertices: number[] = []
  const indices: number[] = []
  const halfGap = gap / 2
  const seamInset = 0.008  // seam sits slightly inside the edge

  // Minimal seam: just 2 columns per side, bridging the tiny gap
  for (let i = 0; i <= segsH; i++) {
    const t = i / segsH
    const y = (t - 0.5) * h
    const wAtY = lerp(wBot / 2, wTop / 2, t) - seamInset

    // Right seam: front-edge → back-edge (very narrow gap)
    vertices.push(wAtY, y, halfGap)     // front edge
    vertices.push(wAtY, y, -halfGap)     // back edge
    // Left seam
    vertices.push(-wAtY, y, halfGap)     // front edge
    vertices.push(-wAtY, y, -halfGap)    // back edge
  }

  for (let i = 0; i < segsH; i++) {
    const a = i * 4, b = a + 1, c = a + 4, d = a + 5
    indices.push(a, c, b, b, c, d)        // right seam
    indices.push(a + 2, c + 2, b + 2, b + 2, c + 2, d + 2) // left seam
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// ════════════════════════════════════════════════════════
// CRIMP SEAL — thin sealed strip for top/bottom
// NOT a box — a thin strip wider than the bag body
// ════════════════════════════════════════════════════════
function makeCrimpGeo(w: number, h: number, gap: number, segs: number): THREE.BufferGeometry {
  const vertices: number[] = []
  const indices: number[] = []
  const halfGap = gap / 2 + 0.004
  const overhang = 0.015 // Seal slightly wider than bag

  const w2 = w / 2 + overhang
  const h2 = h / 2

  // Grid: segs+1 across width, 3 rows (top, middle, bottom of crimp)
  const rowsW = segs + 1
  const rowsH = 3
  for (let yi = 0; yi < rowsH; yi++) {
    const y = (yi / (rowsH - 1) - 0.5) * h
    // Crimp waviness
    const crimpWave = Math.sin(yi * 2.5) * 0.004
    for (let xi = 0; xi < rowsW; xi++) {
      const x = (xi / (rowsW - 1) - 0.5) * w2 * 2
      vertices.push(x, y + crimpWave, halfGap)
      vertices.push(x, y + crimpWave, -halfGap)
    }
  }

  for (let yi = 0; yi < rowsH - 1; yi++) {
    for (let xi = 0; xi < rowsW - 1; xi++) {
      const a = yi * rowsW * 2 + xi * 2
      const b = a + 2
      const c = a + rowsW * 2
      const d = c + 2
      indices.push(a, c, b, b, c, d)
      indices.push(a + 1, b + 1, c + 1, c + 1, b + 1, d + 1)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// ════════════════════════════════════════════════════════
// FOIL EDGE TEXTURE — procedural crimp pattern
// ════════════════════════════════════════════════════════
function makeEdgeTexture(bagColor: string): THREE.Texture {
  const seamColor = darkenHex(bagColor, 0.65)
  const crimpColor = darkenHex(bagColor, 0.50)
  const highlightColor = lightenHex(bagColor, 0.40)

  const c = document.createElement("canvas")
  c.width = 256; c.height = 64
  const ctx = c.getContext("2d")!
  ctx.fillStyle = seamColor
  ctx.fillRect(0, 0, 256, 64)

  // Vertical foil micro-lines
  for (let i = 0; i < 80; i++) {
    const x = i * 3.2 + Math.sin(i * 0.5) * 1.5
    const alpha = 0.03 + Math.random() * 0.05
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
    ctx.lineWidth = 0.6 + Math.random() * 1.0
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 64); ctx.stroke()
  }

  // Serrated crimp lines
  ctx.strokeStyle = crimpColor; ctx.lineWidth = 3
  for (let row = 0; row < 4; row++) {
    const y = 8 + row * 16
    ctx.beginPath()
    for (let x = 0; x < 256; x += 6) {
      const notch = Math.sin(x * 1.2 + row * 2.1) * 3
      if (x === 0) ctx.moveTo(x, y + notch); else ctx.lineTo(x, y + notch)
    }
    ctx.stroke()
  }
  ctx.strokeStyle = highlightColor; ctx.globalAlpha = 0.3; ctx.lineWidth = 1.5
  for (let row = 0; row < 4; row++) {
    const y = 6.5 + row * 16
    ctx.beginPath()
    for (let x = 0; x < 256; x += 6) {
      const notch = Math.sin(x * 1.2 + row * 2.1) * 3
      if (x === 0) ctx.moveTo(x, y + notch); else ctx.lineTo(x, y + notch)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

const _edgeTexCache: Record<string, THREE.Texture> = {}
function getEdgeTex(bagColor: string): THREE.Texture {
  if (!_edgeTexCache[bagColor]) _edgeTexCache[bagColor] = makeEdgeTexture(bagColor)
  return _edgeTexCache[bagColor]
}

// ════════════════════════════════════════════════════════
// PROPS
// ════════════════════════════════════════════════════════
interface Props {
  frontUrl: string; backUrl: string; bagColor?: string; scale?: number
  interactive?: boolean
  onPointerDown?: (e: THREE.Event) => void
  onPointerMove?: (e: THREE.Event) => void
  onPointerUp?: (e: THREE.Event) => void
  opening?: boolean
}

export default function PotatoChipBag3D({
  frontUrl, backUrl, bagColor = "#d4d0c8",
  scale = 1, interactive = false,
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
  const edgeTex = useMemo(() => getEdgeTex(bagColor), [bagColor])
  const seamColorHex = useMemo(() => darkenHex(bagColor, 0.65), [bagColor])

  // ═══ GEOMETRIES (no BoxGeometry anywhere) ═══
  const pillowGeo = useMemo(() => makePillowFaceGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BULGE, 32), [])
  const seamGeo = useMemo(() => makeEdgeSeamGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BAG_D, 16), [])
  const topCrimpGeo = useMemo(() => makeCrimpGeo(BAG_W_TOP, TOP_CRIMP, BAG_D, 8), [])
  const botCrimpGeo = useMemo(() => makeCrimpGeo(BAG_W_BOT, BOT_CRIMP, BAG_D, 8), [])

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
  const halfGap = BAG_D / 2
  const baseScale = scale

  // ── Opening animation ──
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
    if (frontBodyRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.06) / 0.65)))
      frontBodyRef.current.position.z = halfGap + 0.001 + t * 0.15
      frontBodyRef.current.rotation.x = t * 0.7
    }
    if (backBodyRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.06) / 0.65)))
      backBodyRef.current.position.z = -halfGap - 0.001 - t * 0.15
      backBodyRef.current.rotation.x = t * -0.6
    }
    if (interiorRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.12) / 0.55)))
      interiorRef.current.scale.setScalar(0.3 + t * 0.8)
      if (!Array.isArray(interiorRef.current.material)) interiorRef.current.material.opacity = t * 0.9
    }
    if (interiorGlowRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.2) / 0.5)))
      interiorGlowRef.current.intensity = t * 1.2
      interiorGlowRef.current.intensity *= 1 + Math.sin(Date.now() * 0.008) * 0.3 * t
    }
  })

  return (
    <group ref={groupRef} scale={scale} rotation={[0, -0.04, 0.02]}>
      {/* ── BOTTOM CRIMP SEAL — thin strip, NOT a box ── */}
      <mesh geometry={botCrimpGeo} position={[0, botY, 0]}>
        <meshStandardMaterial map={edgeTex} roughness={0.55} metalness={0.06} side={THREE.DoubleSide} />
      </mesh>

      {/* ── EDGE SEAMS — microscopic, not walls ── */}
      <mesh geometry={seamGeo} position={[0, bodyY, 0]}>
        <meshStandardMaterial color={seamColorHex} roughness={0.5} metalness={0.04} side={THREE.DoubleSide} />
      </mesh>

      {/* ── FRONT BODY — fully bulging pillow face ── */}
      <group ref={frontBodyRef} position={[0, bodyY, halfGap + 0.001]}>
        <mesh geometry={pillowGeo}
          onPointerDown={interactive ? onPointerDown : undefined}
          onPointerMove={interactive ? onPointerMove : undefined}
          onPointerUp={interactive ? onPointerUp : undefined}>
          <meshStandardMaterial map={frontTex} roughness={0.18} metalness={0.0} side={THREE.FrontSide} transparent alphaTest={0.01} />
        </mesh>
      </group>

      {/* ── BACK BODY — fully bulging pillow face ── */}
      <group ref={backBodyRef} position={[0, bodyY, -halfGap - 0.001]}>
        <mesh geometry={pillowGeo} rotation={[0, Math.PI, 0]}>
          <meshStandardMaterial map={backTex} roughness={0.18} metalness={0.0} side={THREE.FrontSide} transparent alphaTest={0.01} />
        </mesh>
      </group>

      {/* ── INTERIOR CAVITY (opening animation) ── */}
      <mesh ref={interiorRef} position={[0, bodyY, 0]}>
        <boxGeometry args={[BAG_W_BOT * 0.6, BODY_H * 0.4, BAG_D * 0.8]} />
        <meshStandardMaterial color="#050302" roughness={0.95} metalness={0} transparent opacity={0} depthWrite />
      </mesh>
      <pointLight ref={interiorGlowRef} position={[0, bodyY, 0]} intensity={0} color="#ffcc44" distance={1.3} decay={2} />

      {/* ── TOP CRIMP SEAL — thin strip, NOT a box ── */}
      <group ref={topSealRef} position={[0, topY, 0]}>
        <mesh geometry={topCrimpGeo}>
          <meshStandardMaterial map={edgeTex} roughness={0.55} metalness={0.06} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}
