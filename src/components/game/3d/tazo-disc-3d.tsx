// ============================================================
// Trading Tazos Game — 3D Tazo Disc Model
// Procedural 3D disc with franchise colors, text, and metallic rim.
// ============================================================
"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface TazoDisc3DProps {
  name: string
  franchise: string
  color?: string
  size?: number        // radius in scene units (default 1)
  rotationSpeed?: number
  autoRotate?: boolean
  onClick?: () => void
}

export default function TazoDisc3D({
  name,
  franchise,
  color,
  size = 1,
  rotationSpeed = 0.3,
  autoRotate = true,
  onClick,
}: TazoDisc3DProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const meshRef = useRef<THREE.Mesh>(null!)

  const franchiseColors: Record<string, { primary: string; secondary: string; rim: string }> = {
    minimon: { primary: "#FFCB05", secondary: "#FF8C00", rim: "#C0C0C0" },
    cybermon: { primary: "#00A1E9", secondary: "#0057B7", rim: "#A0A0A0" },
    dracobell: { primary: "#FF6B00", secondary: "#CC4400", rim: "#D4AF37" },
  }

  const c = franchiseColors[franchise.toLowerCase()] || { primary: color || "#888", secondary: "#555", rim: "#999" }
  const thickness = size * 0.08
  const rimThickness = thickness * 0.6
  const rimRadius = size * 1.02

  // ─── Canvas texture for disc face ─────
  const faceTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext("2d")!
    
    // Background gradient
    const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 320)
    grad.addColorStop(0, c.primary)
    grad.addColorStop(0.7, c.secondary)
    grad.addColorStop(1, "#111")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 512, 512)

    // Concentric rings
    ctx.strokeStyle = "rgba(255,255,255,0.15)"
    ctx.lineWidth = 3
    for (let r = 60; r < 240; r += 30) {
      ctx.beginPath()
      ctx.arc(256, 256, r, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Center circle
    ctx.fillStyle = "rgba(0,0,0,0.2)"
    ctx.beginPath()
    ctx.arc(256, 256, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "rgba(255,255,255,0.3)"
    ctx.lineWidth = 2
    ctx.stroke()

    // Tazo name
    ctx.fillStyle = "#fff"
    ctx.font = "bold 48px 'Geist', 'Inter', sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.shadowColor = "rgba(0,0,0,0.5)"
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    
    // Shorten name if too long
    let displayName = name
    if (displayName.length > 10) {
      displayName = displayName.substring(0, 10) + "…"
    }
    ctx.fillText(displayName, 256, 256)
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0

    // Edge decoration — dots
    ctx.fillStyle = "rgba(255,255,255,0.4)"
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2
      const x = 256 + Math.cos(angle) * 210
      const y = 256 + Math.sin(angle) * 210
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()
    }

    // Franchise indicator
    ctx.fillStyle = "rgba(255,255,255,0.25)"
    ctx.font = "bold 20px 'Geist', sans-serif"
    ctx.fillText(franchise.toUpperCase(), 256, 380)

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = true
    return tex
  }, [c, name, franchise])

  // ─── Back texture (simpler) ─────
  const backTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext("2d")!
    
    const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 320)
    grad.addColorStop(0, c.secondary)
    grad.addColorStop(1, "#111")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 512, 512)

    // Cross-hatch pattern
    ctx.strokeStyle = "rgba(255,255,255,0.05)"
    ctx.lineWidth = 1
    for (let i = 0; i < 512; i += 16) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 512)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(512, i)
      ctx.stroke()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = true
    return tex
  }, [c.secondary])

  // ─── Rim material ─────
  const rimMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: c.rim,
      metalness: 0.8,
      roughness: 0.3,
    })
  }, [c.rim])

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed * delta
    }
  })

  return (
    <group ref={groupRef} onClick={onClick}>
      {/* Disc body — cylinder for the edge */}
      <mesh ref={meshRef} position={[0, 0, 0]} rotation={[Math.PI / -2, 0, 0]}>
        <cylinderGeometry args={[size, size, thickness, 64]} />
        <meshStandardMaterial
          color={c.secondary}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>

      {/* Top face — separate plane */}
      <mesh position={[0, thickness / 2 + 0.001, 0]} rotation={[Math.PI / -2, 0, 0]}>
        <circleGeometry args={[size, 64]} />
        <meshStandardMaterial
          map={faceTexture}
          roughness={0.5}
          metalness={0.1}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Bottom face — separate plane */}
      <mesh position={[0, -thickness / 2 - 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[size, 64]} />
        <meshStandardMaterial
          map={backTexture}
          roughness={0.5}
          metalness={0.1}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Metallic rim */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / -2, 0, 0]}>
        <torusGeometry args={[rimRadius, rimThickness, 16, 64]} />
        <primitive object={rimMaterial} attach="material" />
      </mesh>
    </group>
  )
}
