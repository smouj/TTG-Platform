// ============================================================
// Trading Tazos Game — PotatoChipBag3D v13
//
// Superellipse pillow mesh. NO crimp seals. NO groups.
// THREE SEPARATE MESHES — front / back / sides — no ambiguity.
//
// Front face: cos θ > 0.4  → narrow ~66° flat face
// Back face:  cos θ < -0.4 → narrow ~66° flat face
// Sides:      whole rest    → bag color
//
// Each mesh has its own geometry with only its vertices/UVs.
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

// ════════════════════════════════════════════════════════
// Build ONE geometry subset (positions + UVs + indices)
// for a given vertex filter.
// Each subset gets its OWN BufferGeometry — no groups.
// ════════════════════════════════════════════════════════
const COS_FRONT = 0.4 // narrower face = ~66° arc, flatter

function buildSubGeo(
  wTop: number, wBot: number, h: number, bulge: number,
  segsAround: number, segsH: number,
  vertexFilter: (i: number, angle: number) => boolean,
  uvMap: (angle: number) => number,
): THREE.BufferGeometry {
  // ── Collect vertex data ──
  const positions: number[] = []
  const uvs: number[] = []
  // Map original ring-index to new index within this subset
  const oldToNew: number[][] = [] // [ring][oldI] = newIndex or -1

  for (let yi = 0; yi <= segsH; yi++) {
    const row: number[] = []
    const t = yi / segsH
    const y = (t - 0.5) * h
    const halfW = lerp(wBot / 2, wTop / 2, t)
    const hf = Math.pow(1 - Math.pow(Math.abs(y) / (h / 2), 5), 2.5)
    const halfD = bulge * hf

    for (let i = 0; i < segsAround; i++) {
      const angle = (i / segsAround) * Math.PI * 2
      if (vertexFilter(i, angle)) {
        const cosA = Math.cos(angle), sinA = Math.sin(angle)
        const n = 3.5
        const r = Math.pow(Math.pow(Math.abs(cosA), n) + Math.pow(Math.abs(sinA), n), -1 / n)
        positions.push(r * cosA * halfW, y, r * sinA * halfD)
        uvs.push(uvMap(angle), t)
        row.push(positions.length / 3 - 1) // new vertex index
      } else {
        row.push(-1)
      }
    }
    oldToNew.push(row)
  }

  // ── Build indices ──
  const indices: number[] = []
  for (let yi = 0; yi < segsH; yi++) {
    const r0 = oldToNew[yi], r1 = oldToNew[yi + 1]
    for (let i = 0; i < segsAround; i++) {
      const j = (i + 1) % segsAround
      const a = r0[i], b = r1[i], c = r0[j], d = r1[j]
      if (a >= 0 && b >= 0 && c >= 0 && d >= 0) {
        indices.push(a, b, c, b, d, c)
      }
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// UV mapping helpers
function uvFront(angle: number): number {
  let a = angle > Math.PI ? angle - 2 * Math.PI : angle
  const r = Math.acos(COS_FRONT)
  let u = (a / r + 1) / 2
  return Math.max(0, Math.min(1, u))
}
function uvBack(angle: number): number {
  let a = angle - Math.PI
  const r = Math.acos(COS_FRONT)
  let u = (a / r + 1) / 2
  return Math.max(0, Math.min(1, u))
}

// ════════════════════════════════════════════════════════
// PROPS & COMPONENT
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
  const openRef = useRef(0)
  const popRef = useRef(0)
  const wasOpening = useRef(false)

  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const seamColorHex = useMemo(() => darkenHex(bagColor, 0.65), [bagColor])

  // THREE separate geometries — each with only its own triangles
  const frontGeo = useMemo(() => buildSubGeo(
    BAG_W_TOP, BAG_W_BOT, BAG_H, BULGE, 72, 20,
    (_i, angle) => Math.cos(angle) > COS_FRONT,
    uvFront,
  ), [])
  const backGeo = useMemo(() => buildSubGeo(
    BAG_W_TOP, BAG_W_BOT, BAG_H, BULGE, 72, 20,
    (_i, angle) => Math.cos(angle) < -COS_FRONT,
    uvBack,
  ), [])
  const sideGeo = useMemo(() => buildSubGeo(
    BAG_W_TOP, BAG_W_BOT, BAG_H, BULGE, 76, 20,
    (_i, angle) => Math.abs(Math.cos(angle)) <= COS_FRONT,
    () => 0.5,
  ), [])

  const frontMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: frontTex, roughness: 0.18, metalness: 0.0, side: THREE.FrontSide,
  }), [frontTex])
  const backMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: backTex, roughness: 0.18, metalness: 0.0, side: THREE.FrontSide,
  }), [backTex])
  const sideMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: seamColorHex, roughness: 0.5, metalness: 0.04, side: THREE.FrontSide,
  }), [seamColorHex])

  useEffect(() => {
    for (const tex of [frontTex, backTex]) {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.generateMipmaps = true
    }
  }, [frontTex, backTex])

  const baseScale = scale

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return
    if (opening && !wasOpening.current) popRef.current = 1.0
    wasOpening.current = opening
    popRef.current = Math.max(0, popRef.current - delta * 5)
    openRef.current = THREE.MathUtils.lerp(openRef.current, opening ? 1 : 0, 3.0 * delta)
    const p = Math.max(0, Math.min(1, openRef.current))
    const popEnv = Math.sin(popRef.current * Math.PI) * (1 - popRef.current * 0.3)
    g.scale.setScalar(baseScale * (1 + popRef.current * 0.06 * popEnv))
    if (bodyRef.current) {
      const t = 1 - Math.pow(1 - Math.min(1, Math.max(0, (p - 0.06) / 0.65)), 3)
      bodyRef.current.scale.y = 1 - t * 0.03
    }
    if (interiorRef.current) {
      const t = 1 - Math.pow(1 - Math.min(1, Math.max(0, (p - 0.15) / 0.55)), 3)
      interiorRef.current.scale.setScalar(0.25 + t * 0.75)
      if (!Array.isArray(interiorRef.current.material))
        interiorRef.current.material.opacity = t * 0.85
    }
    if (interiorGlowRef.current) {
      const t = 1 - Math.pow(1 - Math.min(1, Math.max(0, (p - 0.2) / 0.5)), 3)
      interiorGlowRef.current.intensity = t * 1.4 * (1 + Math.sin(Date.now() * 0.008) * 0.3 * t)
    }
  })

  return (
    <group ref={groupRef} scale={scale} rotation={[0, -0.04, 0.02]}>
      {/* Three separate meshes — no group ambiguity */}
      <group ref={bodyRef}
        onPointerDown={interactive ? onPointerDown : undefined}
        onPointerMove={interactive ? onPointerMove : undefined}
        onPointerUp={interactive ? onPointerUp : undefined}
      >
        <mesh geometry={frontGeo} material={frontMat} />
        <mesh geometry={backGeo} material={backMat} />
        <mesh geometry={sideGeo} material={sideMat} />
      </group>

      {/* Interior glow (only visible during opening) */}
      <mesh ref={interiorRef} position={[0, 0, 0]}>
        <boxGeometry args={[BAG_W_BOT * 0.5, BAG_H * 0.35, 0.02]} />
        <meshStandardMaterial color="#050302" roughness={0.95} metalness={0} transparent opacity={0} depthWrite />
      </mesh>
      <pointLight ref={interiorGlowRef} position={[0, BAG_H * 0.25, 0]} intensity={0} color="#ffdd55" distance={1.5} decay={2} />
    </group>
  )
}
