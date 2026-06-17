// ============================================================
// Trading Tazos Game — BagCardMini3D v11
//
// Uses shared ring-based bag geometry (bag-geometry.ts).
// Same visual as PotatoChipBag3D (the opener) — consistent.
// 6 meshes: front, back, side, top seal, bottom seal, caps.
// Franchise-specific static rotation + gentle float animation.
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
  minimon: -0.25,
  cybermon: 0.15,
  dracobell: 0.25,
}
const TILT_X = -0.09

// ═══ Inner model ═══
function MiniBagModel({ frontUrl, backUrl, bagColor, franchiseSlug }: {
  frontUrl: string; backUrl: string; bagColor: string; franchiseSlug?: string
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const rotY = FRANCHISE_ROT_Y[franchiseSlug || ""] ?? -0.15

  const seamColor = useMemo(() => darkenHex(bagColor, 0.55), [bagColor])
  const sealColor = useMemo(() => darkenHex(bagColor, 0.42), [bagColor])
  const capColor = "#1a1512"

  const dims = BAG_SMALL
  const frontGeo = useMemo(() => buildFaceGeo(true, dims), [])
  const backGeo = useMemo(() => buildFaceGeo(false, dims), [])
  const sideGeo = useMemo(() => buildSideGeo(dims), [])
  const topSealGeo = useMemo(() => buildSealGeo(true, dims), [])
  const bottomSealGeo = useMemo(() => buildSealGeo(false, dims), [])
  const topCapGeo = useMemo(() => buildBodyCapGeo(true, dims), [])
  const bottomCapGeo = useMemo(() => buildBodyCapGeo(false, dims), [])

  const fMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: frontTex, roughness: 0.18, metalness: 0, side: THREE.FrontSide,
  }), [frontTex])
  const bMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: backTex, roughness: 0.18, metalness: 0, side: THREE.FrontSide,
  }), [backTex])
  const sMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: seamColor, roughness: 0.45, metalness: 0.03, side: THREE.FrontSide,
  }), [seamColor])
  const sealMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: sealColor, roughness: 0.55, metalness: 0.02, side: THREE.FrontSide,
  }), [sealColor])
  const capMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: capColor, roughness: 0.8, metalness: 0, side: THREE.FrontSide,
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

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotY + Math.sin(Date.now() * 0.0008) * 0.06
    }
  })

  return (
    <group ref={groupRef} scale={0.92} rotation={[TILT_X, rotY, 0]}>
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
    <div className="w-full h-[180px] sm:h-[200px]" style={{ background: "transparent" }}>
      <Canvas
        camera={{ position: [0, 0.05, 1.7], fov: 40 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 2.5, 4]} intensity={1.6} />
        <directionalLight position={[-2, 1.5, -2]} intensity={0.5} color="#ffeecc" />
        <pointLight position={[0, 0.8, 2.5]} intensity={0.4} color="#FFCC00" />
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
