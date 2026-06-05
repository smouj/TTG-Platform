// ============================================================
// Trading Tazos Game — 3D Tazo Disc Model
// Shows actual tazo artwork on disc faces with proper back-art.
// Falls back to procedural textures when no image available.
// Uses meshStandardMaterial for proper lighting.
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

const FRANCHISE_COLORS: Record<string, { primary: string; secondary: string; rim: string }> = {
  minimon: { primary: "#FFCB05", secondary: "#FF8C00", rim: "#D4AF37" },
  cybermon: { primary: "#00A1E9", secondary: "#0057B7", rim: "#A0C8E0" },
  dracobell: { primary: "#FF6B00", secondary: "#CC4400", rim: "#D4AF37" },
}

// ─── Texture cache ───
const textureCache = new Map<string, THREE.Texture>()

function loadTexture(url: string): THREE.Texture | null {
  if (textureCache.has(url)) return textureCache.get(url)!
  const tex = new THREE.TextureLoader().load(
    url,
    undefined, undefined,
    () => textureCache.delete(url)
  )
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  textureCache.set(url, tex)
  return tex
}

// ─── Procedural fallback ───
function makeFallbackTexture(name: string, franchise: string): THREE.Texture {
  const colors = FRANCHISE_COLORS[franchise] || FRANCHISE_COLORS.minimon
  const canvas = document.createElement("canvas")
  canvas.width = 512; canvas.height = 512
  const ctx = canvas.getContext("2d")!
  const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 320)
  grad.addColorStop(0, colors.primary)
  grad.addColorStop(0.7, colors.secondary)
  grad.addColorStop(1, "#111")
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 512)
  ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 2
  for (let r = 50; r < 230; r += 36) { ctx.beginPath(); ctx.arc(256, 256, r, 0, Math.PI*2); ctx.stroke() }
  ctx.fillStyle = "#fff"; ctx.font = "bold 40px 'Geist', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"
  ctx.shadowColor = "#000"; ctx.shadowBlur = 4
  ctx.fillText(name.length > 12 ? name.slice(0,11)+"…" : name, 256, 256)
  ctx.shadowBlur = 0
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter
  return tex
}

interface TazoDisc3DProps {
  name: string
  franchise: string
  imageUrl?: string | null
  backImageUrl?: string | null
  size?: number
  rotationSpeed?: number
  autoRotate?: boolean
  hovered?: boolean
  onClick?: () => void
}

export default function TazoDisc3D({
  name, franchise, imageUrl, backImageUrl,
  size = 0.45, rotationSpeed = 0.6, autoRotate = true,
  hovered = false, onClick,
}: TazoDisc3DProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const colors = FRANCHISE_COLORS[franchise.toLowerCase()] || FRANCHISE_COLORS.minimon
  const thickness = size * 0.08

  // Front face texture
  const faceTex = useMemo(() => {
    if (imageUrl) {
      const tex = loadTexture(imageUrl)
      if (tex) return tex
    }
    return makeFallbackTexture(name, franchise)
  }, [imageUrl, name, franchise])

  // Back texture — franchise back art or fallback
  const backTex = useMemo(() => {
    const url = backImageUrl || BACK_ARTS[franchise.toLowerCase()]
    if (url) {
      const tex = loadTexture(url)
      if (tex) return tex
    }
    return makeFallbackTexture(name, franchise)
  }, [backImageUrl, franchise, name])

  useFrame((_, delta) => {
    if (!groupRef.current || !autoRotate) return
    groupRef.current.rotation.y += rotationSpeed * delta
  })

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onClick?.() }}>
      {/* Disc cylinder body */}
      <mesh rotation={[Math.PI / -2, 0, 0]}>
        <cylinderGeometry args={[size, size, thickness, 64]} />
        <meshStandardMaterial color={colors.secondary} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Front face — tazo art */}
      <mesh position={[0, thickness / 2 + 0.002, 0]} rotation={[Math.PI / -2, 0, 0]}>
        <circleGeometry args={[size * 0.96, 64]} />
        <meshStandardMaterial map={faceTex} roughness={0.4} metalness={0.05} side={THREE.FrontSide} />
      </mesh>

      {/* Back face — franchise back art */}
      <mesh position={[0, -thickness / 2 - 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.96, 64]} />
        <meshStandardMaterial map={backTex} roughness={0.4} metalness={0.05} side={THREE.FrontSide} />
      </mesh>

      {/* Metallic rim */}
      <mesh rotation={[Math.PI / -2, 0, 0]}>
        <torusGeometry args={[size * 1.02, thickness * 0.55, 16, 64]} />
        <meshStandardMaterial color={colors.rim} metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Hover glow */}
      {hovered && (
        <mesh position={[0, thickness / 2 + 0.01, 0]} rotation={[Math.PI / -2, 0, 0]}>
          <torusGeometry args={[size * 1.08, 0.025, 8, 64]} />
          <meshBasicMaterial color={colors.primary} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  )
}
