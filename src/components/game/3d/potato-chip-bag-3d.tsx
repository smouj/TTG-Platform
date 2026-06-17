// ============================================================
// Trading Tazos Game — PotatoChipBag3D v15
//
// 3 separate meshes (front/back/side). Full UV 0→1 on each face.
// UV u computed from x-position across the face width (not angle).
// ClampToEdgeWrapping on all textures.
// ============================================================
"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

export const BAG_W_TOP = 0.72
export const BAG_W_BOT = 0.64
export const BAG_H = 1.02
export const BODY_H = BAG_H
const BULGE = 0.17

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
}
function darkenHex(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `#${Math.round(Math.max(0, r * factor) * 255).toString(16).padStart(2, "0")}${Math.round(Math.max(0, g * factor) * 255).toString(16).padStart(2, "0")}${Math.round(Math.max(0, b * factor) * 255).toString(16).padStart(2, "0")}`
}

const COS_THRESH = 0.18  // wide face boundary (≈80° half-arc)

function buildFaceGeo(
  wTop: number, wBot: number, h: number, bulge: number,
  segsAround: number, segsH: number,
  vertexFilter: (angle: number) => boolean,
): THREE.BufferGeometry {
  const positions: number[] = []
  const uvs: number[] = []
  const oldToNew: number[][] = []

  for (let yi = 0; yi <= segsH; yi++) {
    const t = yi / segsH
    const y = (t - 0.5) * h
    const halfW = lerp(wBot / 2, wTop / 2, t)
    const hf = Math.pow(1 - Math.pow(Math.abs(y) / (h / 2), 5), 2.5)
    const halfD = bulge * hf

    // Pass 1: find x-range of filtered vertices at this height
    let xMin = Infinity, xMax = -Infinity
    for (let i = 0; i < segsAround; i++) {
      const angle = (i / segsAround) * Math.PI * 2
      if (vertexFilter(angle)) {
        const cosA = Math.cos(angle), sinA = Math.sin(angle)
        const n = 3.5
        const r = Math.pow(Math.pow(Math.abs(cosA), n) + Math.pow(Math.abs(sinA), n), -1 / n)
        const x = r * cosA * halfW
        if (x < xMin) xMin = x
        if (x > xMax) xMax = x
      }
    }
    const xRange = xMax - xMin || 1

    // Pass 2: build filtered ring with proper UVs
    const row: number[] = []
    for (let i = 0; i < segsAround; i++) {
      const angle = (i / segsAround) * Math.PI * 2
      if (vertexFilter(angle)) {
        const cosA = Math.cos(angle), sinA = Math.sin(angle)
        const n = 3.5
        const r = Math.pow(Math.pow(Math.abs(cosA), n) + Math.pow(Math.abs(sinA), n), -1 / n)
        const x = r * cosA * halfW
        positions.push(x, y, r * sinA * halfD)
        // UV u: 0→1 across the face x-range. UV v: 0 at bottom, 1 at top.
        uvs.push(Number(((x - xMin) / xRange).toFixed(6)), t)
        row.push(positions.length / 3 - 1)
      } else {
        row.push(-1)
      }
    }
    oldToNew.push(row)
  }

  const indices: number[] = []
  for (let yi = 0; yi < segsH; yi++) {
    const r0 = oldToNew[yi], r1 = oldToNew[yi + 1]
    for (let i = 0; i < segsAround; i++) {
      const j = (i + 1) % segsAround
      const a = r0[i], b = r1[i], c = r0[j], d = r1[j]
      if (a >= 0 && b >= 0 && c >= 0 && d >= 0) indices.push(a, b, c, b, d, c)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

function buildSideGeo(
  wTop: number, wBot: number, h: number, bulge: number,
  segsAround: number, segsH: number,
): THREE.BufferGeometry {
  const positions: number[] = []
  const uvs: number[] = []
  const oldToNew: number[][] = []

  for (let yi = 0; yi <= segsH; yi++) {
    const t = yi / segsH
    const y = (t - 0.5) * h
    const halfW = lerp(wBot / 2, wTop / 2, t)
    const hf = Math.pow(1 - Math.pow(Math.abs(y) / (h / 2), 5), 2.5)
    const halfD = bulge * hf

    const row: number[] = []
    for (let i = 0; i < segsAround; i++) {
      const angle = (i / segsAround) * Math.PI * 2
      if (Math.abs(Math.cos(angle)) <= COS_THRESH) {
        const cosA = Math.cos(angle), sinA = Math.sin(angle)
        const n = 3.5
        const r = Math.pow(Math.pow(Math.abs(cosA), n) + Math.pow(Math.abs(sinA), n), -1 / n)
        positions.push(r * cosA * halfW, y, r * sinA * halfD)
        // Simple UV for side — just for consistency (material is solid color)
        const sideU = sinA > 0 ? 0.0 : 1.0
        uvs.push(sideU, t)
        row.push(positions.length / 3 - 1)
      } else {
        row.push(-1)
      }
    }
    oldToNew.push(row)
  }

  const indices: number[] = []
  for (let yi = 0; yi < segsH; yi++) {
    const r0 = oldToNew[yi], r1 = oldToNew[yi + 1]
    for (let i = 0; i < segsAround; i++) {
      const j = (i + 1) % segsAround
      const a = r0[i], b = r1[i], c = r0[j], d = r1[j]
      if (a >= 0 && b >= 0 && c >= 0 && d >= 0) indices.push(a, b, c, b, d, c)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

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
  const bodyRef = useRef<THREE.Group>(null!)
  const interiorRef = useRef<THREE.Mesh>(null!)
  const interiorGlowRef = useRef<THREE.PointLight>(null!)
  const openRef = useRef(0); const popRef = useRef(0); const wasOpening = useRef(false)

  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const seamColorHex = useMemo(() => darkenHex(bagColor, 0.65), [bagColor])

  // ── Geometry ──
  const frontGeo = useMemo(() => buildFaceGeo(
    BAG_W_TOP, BAG_W_BOT, BAG_H, BULGE, 72, 20,
    (a) => Math.cos(a) > COS_THRESH,
  ), [])
  const backGeo = useMemo(() => buildFaceGeo(
    BAG_W_TOP, BAG_W_BOT, BAG_H, BULGE, 72, 20,
    (a) => Math.cos(a) < -COS_THRESH,
  ), [])
  const sideGeo = useMemo(() => buildSideGeo(
    BAG_W_TOP, BAG_W_BOT, BAG_H, BULGE, 72, 20,
  ), [])

  // ── Materials with ClampToEdgeWrapping ──
  const fMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: frontTex, roughness: 0.18, metalness: 0, side: THREE.FrontSide,
  }), [frontTex])
  const bMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: backTex, roughness: 0.18, metalness: 0, side: THREE.FrontSide,
  }), [backTex])
  const sMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: seamColorHex, roughness: 0.5, metalness: 0.04, side: THREE.FrontSide,
  }), [seamColorHex])

  useEffect(() => {
    for (const tex of [frontTex, backTex]) {
      tex.wrapS = THREE.ClampToEdgeWrapping
      tex.wrapT = THREE.ClampToEdgeWrapping
      tex.colorSpace = THREE.SRGBColorSpace
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.generateMipmaps = true
      tex.repeat.set(1, 1)
      tex.offset.set(0, 0)
      tex.needsUpdate = true
    }
  }, [frontTex, backTex])

  const bs = scale

  useFrame((_, delta) => {
    const g = groupRef.current; if (!g) return
    if (opening && !wasOpening.current) popRef.current = 1.0
    wasOpening.current = opening
    popRef.current = Math.max(0, popRef.current - delta * 5)
    openRef.current = THREE.MathUtils.lerp(openRef.current, opening ? 1 : 0, 3.0 * delta)
    const p = Math.max(0, Math.min(1, openRef.current))
    g.scale.setScalar(bs * (1 + popRef.current * 0.06 * Math.sin(popRef.current * Math.PI) * (1 - popRef.current * 0.3)))
    if (bodyRef.current) {
      const t = 1 - Math.pow(1 - Math.min(1, Math.max(0, (p - 0.06) / 0.65)), 3)
      bodyRef.current.scale.y = 1 - t * 0.03
    }
    if (interiorRef.current) {
      const t = 1 - Math.pow(1 - Math.min(1, Math.max(0, (p - 0.15) / 0.55)), 3)
      interiorRef.current.scale.setScalar(0.25 + t * 0.75)
      if (!Array.isArray(interiorRef.current.material)) interiorRef.current.material.opacity = t * 0.85
    }
    if (interiorGlowRef.current) {
      const t = 1 - Math.pow(1 - Math.min(1, Math.max(0, (p - 0.2) / 0.5)), 3)
      interiorGlowRef.current.intensity = t * 1.4 * (1 + Math.sin(Date.now() * 0.008) * 0.3 * t)
    }
  })

  return (
    <group ref={groupRef} scale={scale} rotation={[0, -0.04, 0.02]}>
      <group ref={bodyRef}
        onPointerDown={interactive ? onPointerDown : undefined}
        onPointerMove={interactive ? onPointerMove : undefined}
        onPointerUp={interactive ? onPointerUp : undefined}
      >
        <mesh geometry={frontGeo} material={fMat} />
        <mesh geometry={backGeo} material={bMat} />
        <mesh geometry={sideGeo} material={sMat} />
      </group>
      <mesh ref={interiorRef} position={[0, 0, 0]}>
        <boxGeometry args={[BAG_W_BOT * 0.5, BAG_H * 0.35, 0.02]} />
        <meshStandardMaterial color="#050302" roughness={0.95} metalness={0} transparent opacity={0} depthWrite />
      </mesh>
      <pointLight ref={interiorGlowRef} position={[0, BAG_H * 0.25, 0]} intensity={0} color="#ffdd55" distance={1.5} decay={2} />
    </group>
  )
}
