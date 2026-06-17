// ============================================================
// Trading Tazos Game — PotatoChipBag3D v12
//
// Single closed superellipse pillow mesh. Full height body.
// NO separate crimp seals — the continuous curve handles it.
// UV mapping by angle for correct front/back texture display.
//
// Material groups (by cos θ):
//   0 = front (cos > 0.18) → front texture
//   1 = back  (cos < -0.18) → back texture
//   2 = sides (the rest) → bag color
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
// SUPER-ELLIPSE BODY — full height, no seals
//
// Cross-section: |x/a|^3.5 + |z/b|^3.5 = 1
// True continuous closed surface — 0 gaps, 0 seams.
//
// UV mapping by angle from face center:
//   Front: angle 0° ± 80° → U 0..1
//   Back:  angle 180° ± 80° → U 0..1
//   Sides: any UV (solid color)
// ════════════════════════════════════════════════════════
const COS_THRESHOLD = 0.18
const ARC_HALF_RAD = Math.acos(COS_THRESHOLD) // ≈ 1.39 rad = 80°

function makePillowBodyGeo(
  wTop: number, wBot: number, h: number,
  bulge: number, segsAround: number, segsH: number
): THREE.BufferGeometry {
  const positions: number[] = []
  const uvs: number[] = []

  // Precompute vertex zones
  const zones: ("front" | "back" | "side")[] = []
  for (let i = 0; i < segsAround; i++) {
    const cosA = Math.cos((i / segsAround) * Math.PI * 2)
    if (cosA > COS_THRESHOLD) zones.push("front")
    else if (cosA < -COS_THRESHOLD) zones.push("back")
    else zones.push("side")
  }

  for (let yi = 0; yi <= segsH; yi++) {
    const t = yi / segsH
    const y = (t - 0.5) * h
    const halfW = lerp(wBot / 2, wTop / 2, t)
    const yNorm = Math.abs(y) / (h / 2)
    const hf = Math.pow(1 - Math.pow(yNorm, 5), 2.5)
    const halfD = bulge * hf

    for (let i = 0; i < segsAround; i++) {
      const angle = (i / segsAround) * Math.PI * 2
      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)
      const n = 3.5
      const r = Math.pow(
        Math.pow(Math.abs(cosA), n) + Math.pow(Math.abs(sinA), n),
        -1 / n
      )
      positions.push(r * cosA * halfW, y, r * sinA * halfD)

      // Angle-based UV mapping — key fix for correct front/back textures
      let u = 0.5
      const zone = zones[i]
      if (zone === "front") {
        // Front center at angle=0, span -ARC_HALF..+ARC_HALF
        let a = angle > Math.PI ? angle - 2 * Math.PI : angle
        u = (a / ARC_HALF_RAD + 1) / 2
        if (u < 0) u = 0; if (u > 1) u = 1
      } else if (zone === "back") {
        // Back center at angle=π, span π-ARC_HALF..π+ARC_HALF
        let a = angle - Math.PI
        u = (a / ARC_HALF_RAD + 1) / 2
        if (u < 0) u = 0; if (u > 1) u = 1
      }
      uvs.push(u, t)
    }
  }

  // ── Indices with material groups ──
  const allIdx: number[] = []
  const frontI: number[] = [], backI: number[] = [], sideI: number[] = []

  for (let yi = 0; yi < segsH; yi++) {
    const r0 = yi * segsAround, r1 = (yi + 1) * segsAround
    for (let i = 0; i < segsAround; i++) {
      const j = (i + 1) % segsAround
      const a = r0 + i, b = r1 + i, c = r0 + j, d = r1 + j
      const tgt = zones[i] === "front" ? frontI : zones[i] === "back" ? backI : sideI
      allIdx.push(a, b, c); tgt.push(a, b, c)
      allIdx.push(b, d, c); tgt.push(b, d, c)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(allIdx)
  geo.computeVertexNormals()
  geo.clearGroups()
  if (frontI.length) geo.addGroup(0, frontI.length, 0)
  if (backI.length) geo.addGroup(frontI.length, backI.length, 1)
  if (sideI.length) geo.addGroup(frontI.length + backI.length, sideI.length, 2)
  return geo
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
  const bodyRef = useRef<THREE.Mesh>(null!)
  const interiorRef = useRef<THREE.Mesh>(null!)
  const interiorGlowRef = useRef<THREE.PointLight>(null!)
  const openRef = useRef(0)
  const popRef = useRef(0)
  const wasOpening = useRef(false)

  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const seamColorHex = useMemo(() => darkenHex(bagColor, 0.65), [bagColor])

  // 72 verts/ring = ~5°, 20 rings — smooth pillow shape
  const bodyGeo = useMemo(
    () => makePillowBodyGeo(BAG_W_TOP, BAG_W_BOT, BAG_H, BULGE, 72, 20),
    []
  )

  const bodyMaterials = useMemo(() => [
    new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.18, metalness: 0.0, side: THREE.FrontSide }),
    new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.18, metalness: 0.0, side: THREE.FrontSide }),
    new THREE.MeshStandardMaterial({ color: seamColorHex, roughness: 0.5, metalness: 0.04, side: THREE.FrontSide }),
  ], [frontTex, backTex, seamColorHex])

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

    // Pop pulse
    const popEnv = Math.sin(popRef.current * Math.PI) * (1 - popRef.current * 0.3)
    g.scale.setScalar(baseScale * (1 + popRef.current * 0.06 * popEnv))

    // Body squish
    if (bodyRef.current) {
      const t = 1 - Math.pow(1 - Math.min(1, Math.max(0, (p - 0.06) / 0.65)), 3)
      bodyRef.current.scale.y = 1 - t * 0.03
    }

    // Interior glow
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
      {/* Single closed body — all 3 materials on one mesh */}
      <mesh ref={bodyRef} geometry={bodyGeo} material={bodyMaterials}
        onPointerDown={interactive ? onPointerDown : undefined}
        onPointerMove={interactive ? onPointerMove : undefined}
        onPointerUp={interactive ? onPointerUp : undefined}
      />

      {/* Interior glow (only visible during opening) */}
      <mesh ref={interiorRef} position={[0, 0, 0]}>
        <boxGeometry args={[BAG_W_BOT * 0.5, BAG_H * 0.35, 0.02]} />
        <meshStandardMaterial color="#050302" roughness={0.95} metalness={0} transparent opacity={0} depthWrite />
      </mesh>
      <pointLight ref={interiorGlowRef} position={[0, BAG_H * 0.25, 0]} intensity={0} color="#ffdd55" distance={1.5} decay={2} />
    </group>
  )
}
