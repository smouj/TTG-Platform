// ============================================================
// Trading Tazos Game — PotatoChipBag3D v17
//
// Refinements:
//   - Seam lighter (0.68 factor, closer to bag color)
//   - Subtle specular on textured faces (plastic sheen)
//   - Softer interior glow
//   - Tear animation preserves seal visibility threshold
// ============================================================
"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"
import {
  buildFaceGeo, buildSideGeo, buildSealGeo, buildBodyCapGeo,
  BAG_LARGE,
} from "@/lib/bag-geometry"

// ═══ Re-exports ═══
export const BAG_W_TOP = BAG_LARGE.wTop
export const BAG_W_BOT = BAG_LARGE.wBot
export const BAG_H = BAG_LARGE.h
export { BAG_LARGE }

// ═══ Helpers ═══
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
}
function darkenHex(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `#${Math.round(Math.max(0, r * factor) * 255).toString(16).padStart(2, "0")}${Math.round(Math.max(0, g * factor) * 255).toString(16).padStart(2, "0")}${Math.round(Math.max(0, b * factor) * 255).toString(16).padStart(2, "0")}`
}

// ═══ Props ═══
interface Props {
  frontUrl: string; backUrl: string; bagColor?: string; scale?: number
  interactive?: boolean
  onPointerDown?: (e: THREE.Event) => void
  onPointerMove?: (e: THREE.Event) => void
  onPointerUp?: (e: THREE.Event) => void
  opening?: boolean
  tearProgress?: number
}

export default function PotatoChipBag3D({
  frontUrl, backUrl, bagColor = "#d4d0c8",
  scale = 1, interactive = false,
  onPointerDown, onPointerMove, onPointerUp, opening = false,
  tearProgress = 0,
}: Props) {
  const groupRef = useRef<THREE.Group>(null!)
  const bodyRef = useRef<THREE.Group>(null!)
  const sealRef = useRef<THREE.Group>(null!)
  const interiorRef = useRef<THREE.Mesh>(null!)
  const interiorGlowRef = useRef<THREE.PointLight>(null!)
  const openRef = useRef(0); const popRef = useRef(0); const wasOpening = useRef(false)

  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const seamColorHex = useMemo(() => darkenHex(bagColor, 0.78), [bagColor])
  const sealColorHex = useMemo(() => darkenHex(bagColor, 0.66), [bagColor])

  const dims = BAG_LARGE
  const frontGeo = useMemo(() => buildFaceGeo(true, dims), [])
  const backGeo = useMemo(() => buildFaceGeo(false, dims), [])
  const sideGeo = useMemo(() => buildSideGeo(dims), [])
  const topSealGeo = useMemo(() => buildSealGeo(true, dims), [])
  const bottomSealGeo = useMemo(() => buildSealGeo(false, dims), [])
  const topCapGeo = useMemo(() => buildBodyCapGeo(true, dims), [])
  const bottomCapGeo = useMemo(() => buildBodyCapGeo(false, dims), [])

  const fMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: frontTex, roughness: 0.14, metalness: 0.06, side: THREE.FrontSide,
  }), [frontTex])
  const bMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: backTex, roughness: 0.14, metalness: 0.06, side: THREE.FrontSide,
  }), [backTex])
  const sMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: seamColorHex, roughness: 0.45, metalness: 0.06, side: THREE.FrontSide,
  }), [seamColorHex])
  const sealMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: sealColorHex, roughness: 0.48, metalness: 0.05, side: THREE.FrontSide,
  }), [sealColorHex])
  const capMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#3a2f25", roughness: 0.42, metalness: 0.03, side: THREE.FrontSide,
  }), [])

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
      bodyRef.current.scale.y = 1 - t * 0.02
    }

    if (sealRef.current) {
      const sealAnim = Math.max(tearProgress, p)
      sealRef.current.position.y = sealAnim * 0.30
      sealRef.current.rotation.x = sealAnim * -0.45
      sealRef.current.scale.setScalar(1 - sealAnim * 0.25)
      sealRef.current.visible = sealAnim < 0.92
    }

    if (interiorRef.current) {
      const t = 1 - Math.pow(1 - Math.min(1, Math.max(0, (p - 0.15) / 0.5)), 3)
      interiorRef.current.scale.setScalar(0.20 + t * 0.80)
      const mat = interiorRef.current.material as THREE.MeshStandardMaterial
      if (!Array.isArray(mat)) mat.opacity = t * 0.82
    }
    if (interiorGlowRef.current) {
      const t = 1 - Math.pow(1 - Math.min(1, Math.max(0, (p - 0.2) / 0.5)), 3)
      interiorGlowRef.current.intensity = t * 1.5 * (1 + Math.sin(Date.now() * 0.006) * 0.25 * t)
    }
  })

  return (
    <group ref={groupRef} scale={scale} rotation={[0, -0.03, 0.01]}>
      <group ref={bodyRef}
        onPointerDown={interactive ? onPointerDown : undefined}
        onPointerMove={interactive ? onPointerMove : undefined}
        onPointerUp={interactive ? onPointerUp : undefined}
      >
        <mesh geometry={frontGeo} material={fMat} />
        <mesh geometry={backGeo} material={bMat} />
        <mesh geometry={sideGeo} material={sMat} />
        <mesh geometry={bottomSealGeo} material={sealMat} />
        <mesh geometry={bottomCapGeo} material={capMat} />
        <mesh geometry={topCapGeo} material={capMat} visible={tearProgress > 0.3} />
      </group>

      <group ref={sealRef}
        onPointerDown={interactive ? onPointerDown : undefined}
        onPointerMove={interactive ? onPointerMove : undefined}
        onPointerUp={interactive ? onPointerUp : undefined}
      >
        <mesh geometry={topSealGeo} material={sealMat} />
      </group>

      <mesh ref={interiorRef} position={[0, 0, 0]}>
        <boxGeometry args={[BAG_LARGE.wBot * 0.5, BAG_LARGE.h * 0.32, 0.02]} />
        <meshStandardMaterial color="#1a1410" roughness={0.95} metalness={0} transparent opacity={0} depthWrite />
      </mesh>
      <pointLight ref={interiorGlowRef} position={[0, BAG_LARGE.h * 0.22, 0]} intensity={0} color="#ffdd55" distance={1.4} decay={2} />
    </group>
  )
}
