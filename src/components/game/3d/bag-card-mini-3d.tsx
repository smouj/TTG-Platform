// ============================================================
// Trading Tazos Game — BagCardMini3D v12
//
// Refinements over v11:
//   - Professional 3-point lighting: key + fill + subtle rim back
//   - Seam material closer to bag color (factor 0.62 vs 0.55)
//   - Subtle specular sheen on textured faces (plastic bag look)
//   - Smoother sway animation (slower, dampened)
//   - Scale bumped to 0.94 for better canvas fill
// ============================================================
"use client"

import { useRef, useMemo, useEffect } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"
import {
  buildFaceGeo, buildSideGeo, buildSealGeo, buildBodyCapGeo,
  BAG_SMALL,
} from "@/lib/bag-geometry"

// ═══ Helpers ═══
function darkenHex(hex: string, factor: number): string {
  const h = hex.replace("#", "")
  const r = Math.max(0, Math.round(parseInt(h.slice(0, 2), 16) * factor)).toString(16).padStart(2, "0")
  const g = Math.max(0, Math.round(parseInt(h.slice(2, 4), 16) * factor)).toString(16).padStart(2, "0")
  const b = Math.max(0, Math.round(parseInt(h.slice(4, 6), 16) * factor)).toString(16).padStart(2, "0")
  return `#${r}${g}${b}`
}

// ═══ Franchise rotations ═══
const FRANCHISE_ROT_Y: Record<string, number> = {
  minimon: -0.22,
  cybermon: 0.12,
  dracobell: 0.22,
}
const TILT_X = -0.07

// ═══ Inner model ═══
function MiniBagModel({ frontUrl, backUrl, bagColor, franchiseSlug }: {
  frontUrl: string; backUrl: string; bagColor: string; franchiseSlug?: string
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const rotY = FRANCHISE_ROT_Y[franchiseSlug || ""] ?? -0.12
  const swayRef = useRef(0)

  const seamColor = useMemo(() => darkenHex(bagColor, 0.62), [bagColor])
  const sealColor = useMemo(() => darkenHex(bagColor, 0.48), [bagColor])
  const capColor = "#14100e"

  const dims = BAG_SMALL
  const frontGeo = useMemo(() => buildFaceGeo(true, dims), [])
  const backGeo = useMemo(() => buildFaceGeo(false, dims), [])
  const sideGeo = useMemo(() => buildSideGeo(dims), [])
  const topSealGeo = useMemo(() => buildSealGeo(true, dims), [])
  const bottomSealGeo = useMemo(() => buildSealGeo(false, dims), [])
  const topCapGeo = useMemo(() => buildBodyCapGeo(true, dims), [])
  const bottomCapGeo = useMemo(() => buildBodyCapGeo(false, dims), [])

  const fMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: frontTex, roughness: 0.22, metalness: 0.02, side: THREE.FrontSide,
  }), [frontTex])
  const bMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: backTex, roughness: 0.22, metalness: 0.02, side: THREE.FrontSide,
  }), [backTex])
  const sMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: seamColor, roughness: 0.50, metalness: 0.04, side: THREE.FrontSide,
  }), [seamColor])
  const sealMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: sealColor, roughness: 0.55, metalness: 0.03, side: THREE.FrontSide,
  }), [sealColor])
  const capMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: capColor, roughness: 0.85, metalness: 0, side: THREE.FrontSide,
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

  useFrame((_, delta) => {
    if (!groupRef.current) return
    // Smooth sway using accumulated phase (frame-rate independent)
    swayRef.current += delta * 0.45
    const sway = Math.sin(swayRef.current) * 0.075
    const floatY = Math.cos(swayRef.current * 0.7) * 0.018
    groupRef.current.rotation.y = rotY + sway
    groupRef.current.position.y = floatY
  })

  return (
    <group ref={groupRef} scale={0.94} rotation={[TILT_X, rotY, 0]}>
      <mesh geometry={frontGeo} material={fMat} />
      <mesh geometry={backGeo} material={bMat} />
      <mesh geometry={sideGeo} material={sMat} />
      <mesh geometry={topSealGeo} material={sealMat} />
      <mesh geometry={bottomSealGeo} material={sealMat} />
      <mesh geometry={topCapGeo} material={capMat} />
      <mesh geometry={bottomCapGeo} material={capMat} />
    </group>
  )
}

// ═══ Public component ═══
export default function BagCardMini3D({ frontUrl, backUrl, bagColor = "#d4d0c8", franchiseSlug }: {
  frontUrl: string; backUrl: string; bagColor?: string; franchiseSlug?: string
}) {
  return (
    <div className="w-full h-[190px] sm:h-[210px]" style={{ background: "transparent" }}>
      <Canvas
        camera={{ position: [0, 0.03, 1.65], fov: 38 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        dpr={[1, 2]}
      >
        {/* ═══ 3-point lighting ═══ */}
        {/* Key light — main front-upper illumination */}
        <directionalLight position={[2.5, 3, 4]} intensity={2.2} color="#fffef5" />
        {/* Fill light — soft ambient from below-front */}
        <pointLight position={[0, 0.5, 2.5]} intensity={0.45} color="#fff5e8" />
        {/* Rim/back light — subtle edge glow for depth */}
        <directionalLight position={[-1.5, 1, -3]} intensity={0.35} color="#e8d5c0" />
        {/* Ambient — even base illumination */}
        <ambientLight intensity={0.55} color="#fffaf5" />

        <MiniBagModel
          frontUrl={frontUrl}
          backUrl={backUrl}
          bagColor={bagColor}
          franchiseSlug={franchiseSlug}
        />
      </Canvas>
    </div>
  )
}
