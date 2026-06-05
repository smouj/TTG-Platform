// ============================================================
// Trading Tazos Game — 3D Tazo Disc Model (Clean Edition)
// Single clean disc with tazo artwork on one face,
// back art on the other. No floating nameplates.
// ============================================================
"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const BACK_ARTS: Record<string, string> = {
  minimon: "/tazos-artgen/backs/minimon-back.png",
  cybermon: "/tazos-artgen/backs/cybermon-back.png",
  dracobell: "/tazos-artgen/backs/dracobell-back.png",
}

const FRANCHISE_RIM: Record<string, string> = {
  minimon: "#D4AF37",
  cybermon: "#78D0F0",
  dracobell: "#FF8844",
}

// Simple texture cache
const texCache = new Map<string, THREE.Texture>()

function getTex(url: string): THREE.Texture {
  if (texCache.has(url)) return texCache.get(url)!
  const tex = new THREE.TextureLoader().load(url)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  texCache.set(url, tex)
  return tex
}

interface Props {
  name: string
  franchise: string
  imageUrl?: string | null
  backImageUrl?: string | null
  size?: number
  autoRotate?: boolean
  hovered?: boolean
}

export default function TazoDisc3D({
  name, franchise, imageUrl, backImageUrl,
  size = 0.45, autoRotate = true, hovered = false,
}: Props) {
  const groupRef = useRef<THREE.Group>(null!)
  const rimColor = FRANCHISE_RIM[franchise.toLowerCase()] || "#D4AF37"
  const thickness = size * 0.06

  // Face texture
  const faceTex = useMemo(() => {
    if (imageUrl) return getTex(imageUrl)
    // procedural fallback
    const c = document.createElement("canvas"); c.width = 512; c.height = 512
    const ctx = c.getContext("2d")!
    const g = ctx.createRadialGradient(256,256,20,256,256,320)
    g.addColorStop(0, "#FFCB05"); g.addColorStop(1, "#7C2D12")
    ctx.fillStyle = g; ctx.fillRect(0,0,512,512)
    ctx.fillStyle = "#fff"; ctx.font = "bold 36px 'Geist',sans-serif"; ctx.textAlign = "center"
    ctx.fillText(name.slice(0,12), 256, 268)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [imageUrl, name])

  // Back texture
  const backTex = useMemo(() => {
    const url = backImageUrl || BACK_ARTS[franchise.toLowerCase()]
    if (url) return getTex(url)
    return faceTex
  }, [backImageUrl, franchise, faceTex])

  useFrame((_, delta) => {
    if (!groupRef.current || !autoRotate) return
    groupRef.current.rotation.y += 0.3 * delta
  })

  return (
    <group ref={groupRef}>
      {/* Disc cylinder body */}
      <mesh rotation={[Math.PI / -2, 0, 0]}>
        <cylinderGeometry args={[size, size, thickness, 64]} />
        <meshStandardMaterial color="#333" roughness={0.35} metalness={0.4} />
      </mesh>

      {/* Front face (tazo art) — faces UP */}
      <mesh position={[0, thickness / 2 + 0.001, 0]} rotation={[Math.PI / -2, 0, 0]}>
        <circleGeometry args={[size * 0.94, 64]} />
        <meshBasicMaterial map={faceTex} side={THREE.FrontSide} />
      </mesh>

      {/* Back face (franchise back) — faces DOWN */}
      <mesh position={[0, -thickness / 2 - 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.94, 64]} />
        <meshBasicMaterial map={backTex} side={THREE.FrontSide} />
      </mesh>

      {/* Metallic rim */}
      <mesh rotation={[Math.PI / -2, 0, 0]}>
        <torusGeometry args={[size * 1.005, thickness * 0.45, 8, 64]} />
        <meshStandardMaterial color={rimColor} metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Hover highlight */}
      {hovered && (
        <mesh position={[0, thickness / 2 + 0.005, 0]} rotation={[Math.PI / -2, 0, 0]}>
          <torusGeometry args={[size * 1.04, 0.02, 8, 64]} />
          <meshBasicMaterial color="#FFCC00" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  )
}
