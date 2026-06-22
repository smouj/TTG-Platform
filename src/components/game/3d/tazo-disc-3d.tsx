// ============================================================
// Trading Tazos Game — 3D Tazo Disc Model
// Shows actual tazo artwork on disc faces with proper back-art.
// Falls back to procedural textures when no image available.
// Uses meshStandardMaterial for proper lighting.
// ============================================================
"use client"

import { useRef, useMemo, useEffect, useState } from "react"
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
const pendingLoads = new Set<string>()

function loadTexture(url: string, onLoaded?: (tex: THREE.Texture) => void): THREE.Texture | null {
  if (textureCache.has(url)) return textureCache.get(url)!
  
  // Return null while loading; callback or re-render will provide the texture
  if (!pendingLoads.has(url)) {
    pendingLoads.add(url)
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.minFilter = THREE.LinearMipmapLinearFilter
        tex.magFilter = THREE.LinearFilter
        textureCache.set(url, tex)
        pendingLoads.delete(url)
        onLoaded?.(tex)
      },
      undefined,
      () => {
        // Image load error: clean up, let component fallback handle display
        pendingLoads.delete(url)
      }
    )
  }
  return null
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

// ─── Procedural back face (card-back style) ───
function makeBackFallbackTexture(franchise: string): THREE.Texture {
  const colors = FRANCHISE_COLORS[franchise] || FRANCHISE_COLORS.minimon
  const canvas = document.createElement("canvas")
  canvas.width = 512; canvas.height = 512
  const ctx = canvas.getContext("2d")!
  // Dark base
  const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 360)
  grad.addColorStop(0, "#1a1a2e")
  grad.addColorStop(0.6, "#0d0d1a")
  grad.addColorStop(1, "#050510")
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 512)
  // Diamond/cross pattern
  ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 1.5
  for (let i = -512; i < 1024; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 512, 512); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(i, 512); ctx.lineTo(i + 512, 0); ctx.stroke()
  }
  // Concentric rings
  for (let r = 40; r < 240; r += 40) {
    ctx.strokeStyle = `rgba(255,255,255,${0.03 - r * 0.00008})`
    ctx.beginPath(); ctx.arc(256, 256, r, 0, Math.PI * 2); ctx.stroke()
  }
  // Center logo mark
  ctx.fillStyle = colors.primary + "15"
  ctx.beginPath(); ctx.arc(256, 256, 48, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = colors.primary + "30"; ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(256, 256, 48, 0, Math.PI * 2); ctx.stroke()
  // "TTG" text center
  ctx.fillStyle = colors.primary + "25"; ctx.font = "bold 52px 'Geist', sans-serif"
  ctx.textAlign = "center"; ctx.textBaseline = "middle"
  ctx.fillText("TTG", 256, 256)
  // Border rim
  ctx.strokeStyle = colors.primary + "15"; ctx.lineWidth = 8
  ctx.beginPath(); ctx.arc(256, 256, 230, 0, Math.PI * 2); ctx.stroke()
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
  finish?: string  // holo, gold, chrome, metallic, etc.
  onClick?: () => void
}

// ─── Rim color overrides by finish ───
const FINISH_RIM_COLORS: Record<string, string> = {
  gold: "#D4AF37",
  chrome: "#C0C0C0",
  metallic: "#A8A8A8",
  rainbow: "#E8D5E8",
  prismatic: "#C8B8E0",
}

const FINISH_RIM_METALNESS: Record<string, number> = {
  gold: 0.95,
  chrome: 0.98,
  metallic: 0.9,
}

export default function TazoDisc3D({
  name, franchise, imageUrl, backImageUrl,
  size = 0.45, rotationSpeed = 0.6, autoRotate = true,
  hovered = false, finish, onClick,
}: TazoDisc3DProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const colors = FRANCHISE_COLORS[franchise.toLowerCase()] || FRANCHISE_COLORS.minimon
  const thickness = size * 0.08

  // Rim customization based on finish
  const rimColor = finish ? (FINISH_RIM_COLORS[finish] || colors.rim) : colors.rim
  const rimMetalness = finish ? (FINISH_RIM_METALNESS[finish] || 0.85) : 0.85

  // Front face texture — loaded async, fallback while loading
  const [faceTex, setFaceTex] = useState<THREE.Texture | null>(null)
  const faceFallback = useMemo(() => makeFallbackTexture(name, franchise), [name, franchise])
  
  useEffect(() => {
    if (imageUrl) {
      const cached = loadTexture(imageUrl, (tex) => setFaceTex(tex))
      if (cached) setFaceTex(cached)
    } else {
      setFaceTex(null)
    }
    return () => {} // keep cache alive across unmount/remount
  }, [imageUrl])

  // Back texture — franchise back art or fallback
  const [backTex, setBackTex] = useState<THREE.Texture | null>(null)
  const backFallback = useMemo(() => makeBackFallbackTexture(franchise), [franchise])

  useEffect(() => {
    const url = backImageUrl || BACK_ARTS[franchise.toLowerCase()]
    if (url) {
      const cached = loadTexture(url, (tex) => setBackTex(tex))
      if (cached) setBackTex(cached)
    } else {
      setBackTex(null)
    }
    return () => {}
  }, [backImageUrl, franchise])

  useFrame((_, delta) => {
    if (!groupRef.current || !autoRotate) return
    groupRef.current.rotation.y += rotationSpeed * delta
  })

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onClick?.() }}>
      {/* Disc cylinder body — NO rotation: cylinder height is Y, faces are in XZ plane */}
      <mesh>
        <cylinderGeometry args={[size, size, thickness, 64]} />
        <meshStandardMaterial color={colors.secondary} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Front face — tazo art, rotated to XZ plane (facing +Y) */}
      <mesh position={[0, thickness / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.96, 64]} />
        <meshStandardMaterial
          map={faceTex || faceFallback}
          roughness={0.4}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Back face — franchise back art, rotated to XZ plane (facing -Y) */}
      <mesh position={[0, -thickness / 2 - 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size * 0.96, 64]} />
        <meshStandardMaterial
          map={backTex || backFallback}
          roughness={0.4}
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Metallic rim — in XZ plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[size * 1.02, thickness * 0.55, 16, 64]} />
        <meshStandardMaterial color={rimColor} metalness={rimMetalness} roughness={0.25} />
      </mesh>

      {/* Hover glow */}
      {hovered && (
        <mesh position={[0, thickness / 2 + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 1.08, 0.025, 8, 64]} />
          <meshBasicMaterial color={colors.primary} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  )
}
