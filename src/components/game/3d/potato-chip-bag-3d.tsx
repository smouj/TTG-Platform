// ============================================================
// Trading Tazos Game — PotatoChipBag3D v8
//
// Pillow-pouch snack bag. Inflated center, crimped edges,
// color-matched side seams — no grey blocks.
// Front + back textures correctly aligned.
// ============================================================
"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

// ── Bag dimensions ──
export const BAG_W_TOP = 0.72
export const BAG_W_BOT = 0.64
export const BAG_H = 1.02
export const BAG_D = 0.22
const TOP_CRIMP = 0.08
const BOT_CRIMP = 0.06
export const BODY_H = BAG_H - TOP_CRIMP - BOT_CRIMP
const BULGE = 0.14  // Increased for more visible pillow inflation

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function easeOutBack(t: number) { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) }
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }

// ── HEX helpers ──
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
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

// ── Pillow face geometry (trapezoidal with centre bulge) ──
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
    // Softer pillow curve — max bulge at center, taper to edges
    pos.setZ(i, bulge * Math.pow(1 - Math.pow(xN, 2.5), 1.5) * Math.pow(1 - Math.pow(yN, 4), 2.0) * (1 + 0.3 * Math.sin(xN * Math.PI * 0.8)))
  }
  geo.computeVertexNormals()
  return geo
}

// ── Side panel geometry (color-matched to bag, soft wrap) ──
function makeSidePanelGeo(wTop: number, wBot: number, h: number, bulge: number, depth: number, segsH: number): THREE.BufferGeometry {
  const vertices: number[] = []
  const indices: number[] = []
  const halfD = depth / 2
  const wrapMargin = 0.02

  for (let i = 0; i <= segsH; i++) {
    const t = i / segsH
    const y = (t - 0.5) * h
    const wAtY = lerp(wBot / 2, wTop / 2, t)
    const yNorm = Math.abs(y) / (h / 2)
    const edgePush = 1 - Math.pow(yNorm, 6)
    const zOffset = bulge * 0.3 * edgePush

    const rx = wAtY - wrapMargin
    vertices.push(rx, y, halfD + zOffset - 0.002)
    vertices.push(rx, y, -halfD - zOffset + 0.002)
    vertices.push(-rx, y, halfD + zOffset - 0.002)
    vertices.push(-rx, y, -halfD - zOffset + 0.002)
  }

  for (let i = 0; i < segsH; i++) {
    const a = i * 4, b = a + 1, c = a + 4, d = a + 5
    indices.push(a, c, b, b, c, d)
    const la = a + 2, lb = b + 2, lc = c + 2, ld = d + 2
    indices.push(la, lc, lb, lb, lc, ld)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// ── Foil edge texture with serrated crimp pattern ──
function makeEdgeTexture(bagColor: string): THREE.Texture {
  const seamColor = darkenHex(bagColor, 0.68)
  const crimpColor = darkenHex(bagColor, 0.55)
  const highlightColor = lightenHex(bagColor, 0.35)

  const c = document.createElement("canvas")
  c.width = 256; c.height = 64
  const ctx = c.getContext("2d")!

  ctx.fillStyle = seamColor
  ctx.fillRect(0, 0, 256, 64)

  for (let i = 0; i < 80; i++) {
    const x = i * 3.2 + Math.sin(i * 0.5) * 1.5
    const alpha = 0.04 + Math.random() * 0.06
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
    ctx.lineWidth = 0.8 + Math.random() * 1.2
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 64)
    ctx.stroke()
  }

  ctx.strokeStyle = crimpColor
  ctx.lineWidth = 3.5
  for (let row = 0; row < 4; row++) {
    const y = 8 + row * 16
    ctx.beginPath()
    for (let x = 0; x < 256; x += 6) {
      const notch = Math.sin(x * 1.2 + row * 2.1) * 3
      if (x === 0) ctx.moveTo(x, y + notch)
      else ctx.lineTo(x, y + notch)
    }
    ctx.stroke()
  }

  ctx.strokeStyle = highlightColor
  ctx.globalAlpha = 0.3
  ctx.lineWidth = 1.5
  for (let row = 0; row < 4; row++) {
    const y = 6.5 + row * 16
    ctx.beginPath()
    for (let x = 0; x < 256; x += 6) {
      const notch = Math.sin(x * 1.2 + row * 2.1) * 3
      if (x === 0) ctx.moveTo(x, y + notch)
      else ctx.lineTo(x, y + notch)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1.0

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

const _edgeTexCache: Record<string, THREE.Texture> = {}
function getEdgeTex(bagColor: string): THREE.Texture {
  if (!_edgeTexCache[bagColor]) {
    _edgeTexCache[bagColor] = makeEdgeTexture(bagColor)
  }
  return _edgeTexCache[bagColor]
}

// ── Props ──
interface Props {
  frontUrl: string
  backUrl: string
  bagColor?: string
  scale?: number
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
  const seamColorHex = useMemo(() => darkenHex(bagColor, 0.68), [bagColor])

  const pillowGeo = useMemo(() => makePillowFaceGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BULGE, 28), [])
  const sideGeo = useMemo(() => makeSidePanelGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BULGE, BAG_D, 14), [])

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
      frontBodyRef.current.position.z = halfD + 0.001 + t * 0.13
      frontBodyRef.current.rotation.x = t * 0.7
      frontBodyRef.current.rotation.z = t * 0.05
    }

    if (backBodyRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.06) / 0.65)))
      backBodyRef.current.position.z = -halfD - 0.001 - t * 0.13
      backBodyRef.current.rotation.x = t * -0.6
      backBodyRef.current.rotation.z = t * -0.04
    }

    if (interiorRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.12) / 0.55)))
      interiorRef.current.scale.setScalar(0.3 + t * 0.8)
      if (!Array.isArray(interiorRef.current.material)) {
        interiorRef.current.material.opacity = t * 0.95
      }
    }

    if (interiorGlowRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.2) / 0.5)))
      interiorGlowRef.current.intensity = t * 1.2
      interiorGlowRef.current.intensity *= 1 + Math.sin(Date.now() * 0.008) * 0.3 * t
    }
  })

  return (
    <group ref={groupRef} scale={scale} rotation={[0, -0.04, 0.02]}>
      {/* ── BOTTOM CRIMP ── */}
      <mesh position={[0, botY, 0]}>
        <boxGeometry args={[BAG_W_BOT + 0.01, BOT_CRIMP, BAG_D + 0.006]} />
        <meshStandardMaterial map={edgeTex} roughness={0.55} metalness={0.08} />
      </mesh>

      {/* ── SIDE PANELS — color-matched ── */}
      <group position={[0, bodyY, 0]}>
        <mesh geometry={sideGeo}>
          <meshStandardMaterial
            color={seamColorHex}
            roughness={0.55}
            metalness={0.06}
            side={THREE.DoubleSide}
            depthWrite
          />
        </mesh>
      </group>

      {/* ── FRONT BODY ── */}
      <group ref={frontBodyRef} position={[0, bodyY, halfD + 0.001]}>
        <mesh geometry={pillowGeo}
          onPointerDown={interactive ? onPointerDown : undefined}
          onPointerMove={interactive ? onPointerMove : undefined}
          onPointerUp={interactive ? onPointerUp : undefined}>
          <meshStandardMaterial
            map={frontTex}
            roughness={0.18}
            metalness={0.0}
            side={THREE.FrontSide}
            transparent
            alphaTest={0.01}
          />
        </mesh>
      </group>

      {/* ── BACK BODY ── */}
      <group ref={backBodyRef} position={[0, bodyY, -halfD - 0.001]}>
        <mesh geometry={pillowGeo} rotation={[0, Math.PI, 0]}>
          <meshStandardMaterial
            map={backTex}
            roughness={0.18}
            metalness={0.0}
            side={THREE.FrontSide}
            transparent
            alphaTest={0.01}
          />
        </mesh>
      </group>

      {/* ── INTERIOR CAVITY ── */}
      <mesh ref={interiorRef} position={[0, bodyY, 0]}>
        <boxGeometry args={[BAG_W_BOT * 0.7, BODY_H * 0.5, BAG_D * 0.35]} />
        <meshStandardMaterial
          color="#050302"
          roughness={0.95}
          metalness={0}
          transparent
          opacity={0}
          depthWrite
        />
      </mesh>

      {/* ── INTERIOR GLOW ── */}
      <pointLight ref={interiorGlowRef} position={[0, bodyY, 0]} intensity={0} color="#ffbb33" distance={1.3} decay={2} />

      {/* ── TOP CRIMP ── */}
      <group ref={topSealRef} position={[0, topY, 0]}>
        <mesh>
          <boxGeometry args={[BAG_W_TOP + 0.01, TOP_CRIMP, BAG_D + 0.01]} />
          <meshStandardMaterial map={edgeTex} roughness={0.55} metalness={0.08} />
        </mesh>
      </group>
    </group>
  )
}
