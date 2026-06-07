// ============================================================
// Trading Tazos Game — PotatoChipBag3D
// Realistic 3D potato chip bag: front/back textures,
// crimped seals, slight volume, foil sides, tear notch.
// ============================================================
"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

// ── Crimp seal texture (programmatic) ──
function makeCrimpTexture(): THREE.Texture {
  const c = document.createElement("canvas")
  c.width = 256; c.height = 32
  const ctx = c.getContext("2d")!
  // Silver foil base
  const g = ctx.createLinearGradient(0, 0, 0, 32)
  g.addColorStop(0, "#b0b0b0"); g.addColorStop(0.2, "#d8d8d8")
  g.addColorStop(0.5, "#e8e8e8"); g.addColorStop(0.8, "#c0c0c0")
  g.addColorStop(1, "#909090")
  ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 32)
  // Zigzag crimp lines
  ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.lineWidth = 1
  for (let row = 0; row < 8; row++) {
    ctx.beginPath()
    for (let x = 0; x <= 256; x += 8) {
      const y = 4 + row * 3.5 + Math.sin(x * 0.25 + row) * 1.8
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  // Horizontal seal lines
  ctx.strokeStyle = "rgba(0,0,0,0.08)"
  for (let y = 1; y < 31; y += 5) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 1)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// ── Foil side texture ──
function makeFoilTexture(): THREE.Texture {
  const c = document.createElement("canvas")
  c.width = 8; c.height = 256
  const ctx = c.getContext("2d")!
  const g = ctx.createLinearGradient(0, 0, 8, 0)
  g.addColorStop(0, "#888"); g.addColorStop(0.3, "#c8c8c8")
  g.addColorStop(0.6, "#d8d8d8"); g.addColorStop(1, "#888")
  ctx.fillStyle = g; ctx.fillRect(0, 0, 8, 256)
  // Vertical foil lines
  ctx.strokeStyle = "rgba(0,0,0,0.06)"
  for (let x = 1; x < 7; x += 2) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// ── Shared cache ──
let _crimpTex: THREE.Texture | null = null
let _foilTex: THREE.Texture | null = null

function getCrimpTex(): THREE.Texture {
  if (!_crimpTex) _crimpTex = makeCrimpTexture()
  return _crimpTex
}
function getFoilTex(): THREE.Texture {
  if (!_foilTex) _foilTex = makeFoilTexture()
  return _foilTex
}

// ── Bag dimensions ──
const BAG_W = 0.68    // width
const BAG_H = 0.96    // total height
const BAG_D = 0.07    // depth/thickness
const TOP_CRIMP = 0.12 // top sealed strip height
const BOT_CRIMP = 0.08 // bottom sealed strip height
const BODY_H = BAG_H - TOP_CRIMP - BOT_CRIMP // main body height
const BULGE = 0.025   // outward curve on front/back

// ── Curved face geometry ──
function makeCurvedFaceGeo(width: number, height: number, bulge: number, segments: number): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, segments, segments * 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    // Bell curve outward
    const xFactor = 1 - Math.pow(Math.abs(x) / (width / 2), 2.5)
    const yFactor = 1 - Math.pow(Math.abs(y) / (height / 2), 4)
    const bulgeZ = bulge * xFactor * yFactor
    pos.setZ(i, pos.getZ(i) + bulgeZ)
  }
  geo.computeVertexNormals()
  return geo
}

// ── Props ──
interface Props {
  frontUrl: string
  backUrl: string
  autoRotate?: boolean
  rotationSpeed?: number
  scale?: number
  hovered?: boolean
  interactive?: boolean
  onPointerDown?: (e: THREE.Event) => void
  onPointerMove?: (e: THREE.Event) => void
  onPointerUp?: (e: THREE.Event) => void
}

// ── Inner bag model ──
function BagModel({
  frontUrl, backUrl, hovered, interactive,
  onPointerDown, onPointerMove, onPointerUp,
}: Omit<Props, "autoRotate" | "rotationSpeed" | "scale">) {
  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const crimpTex = useMemo(() => getCrimpTex(), [])
  const foilTex = useMemo(() => getFoilTex(), [])
  const curvedGeo = useMemo(() => makeCurvedFaceGeo(BAG_W, BODY_H, BULGE, 16), [])

  // Configure textures
  useEffect(() => {
    for (const tex of [frontTex, backTex]) {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
    }
  }, [frontTex, backTex])

  const bodyY = (TOP_CRIMP - BOT_CRIMP) / 2
  const topY = BAG_H / 2 - TOP_CRIMP / 2
  const botY = -BAG_H / 2 + BOT_CRIMP / 2

  return (
    <group>
      {/* ── Front face (curved, textured) ── */}
      <mesh geometry={curvedGeo} position={[0, bodyY, BAG_D / 2 + 0.001]}
        onPointerDown={interactive ? onPointerDown : undefined}
        onPointerMove={interactive ? onPointerMove : undefined}
        onPointerUp={interactive ? onPointerUp : undefined}
      >
        <meshStandardMaterial map={frontTex} roughness={0.35} metalness={0.05} side={THREE.FrontSide} />
      </mesh>

      {/* ── Back face (curved, textured, reversed) ── */}
      <mesh geometry={curvedGeo} position={[0, bodyY, -BAG_D / 2 - 0.001]} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial map={backTex} roughness={0.35} metalness={0.05} side={THREE.FrontSide} />
      </mesh>

      {/* ── Left edge (foil) ── */}
      <mesh position={[-BAG_W / 2, bodyY, 0]}>
        <boxGeometry args={[0.02, BODY_H, BAG_D]} />
        <meshStandardMaterial color="#b8b8b8" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* ── Right edge (foil) ── */}
      <mesh position={[BAG_W / 2, bodyY, 0]}>
        <boxGeometry args={[0.02, BODY_H, BAG_D]} />
        <meshStandardMaterial color="#b8b8b8" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* ── Top crimp seal ── */}
      <mesh position={[0, topY, 0]}>
        <boxGeometry args={[BAG_W + 0.005, TOP_CRIMP, BAG_D + 0.005]} />
        <meshStandardMaterial map={crimpTex} roughness={0.4} metalness={0.5} />
      </mesh>

      {/* ── Bottom crimp seal ── */}
      <mesh position={[0, botY, 0]}>
        <boxGeometry args={[BAG_W + 0.005, BOT_CRIMP, BAG_D + 0.005]} />
        <meshStandardMaterial map={crimpTex} roughness={0.4} metalness={0.5} />
      </mesh>

      {/* ── "Tear here" notch (top-right) ── */}
      <mesh position={[BAG_W / 2 + 0.01, topY - TOP_CRIMP / 2 - 0.01, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.03, 0.06, BAG_D]} />
        <meshStandardMaterial color="#E3350D" roughness={0.3} />
      </mesh>
      <mesh position={[BAG_W / 2 + 0.015, topY - TOP_CRIMP / 2 - 0.03, 0]}>
        <boxGeometry args={[0.02, 0.025, BAG_D + 0.005]} />
        <meshStandardMaterial color="#E3350D" roughness={0.3} />
      </mesh>

      {/* ── Hover glow ── */}
      {hovered && (
        <mesh position={[0, bodyY, BAG_D / 2 + 0.02]}>
          <planeGeometry args={[BAG_W + 0.06, BODY_H + 0.06]} />
          <meshBasicMaterial color="#FFCC00" transparent opacity={0.12} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  )
}

// ── Main export with rotation wrapper ──
export default function PotatoChipBag3D({
  frontUrl, backUrl,
  autoRotate = true, rotationSpeed = 0.4, scale = 1,
  hovered = false, interactive = false,
  onPointerDown, onPointerMove, onPointerUp,
}: Props) {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame((_, delta) => {
    if (!groupRef.current || !autoRotate) return
    groupRef.current.rotation.y += rotationSpeed * delta
    // Gentle float
    groupRef.current.position.y = Math.sin(Date.now() * 0.0012) * 0.06
  })

  return (
    <group ref={groupRef} scale={scale}>
      <BagModel
        frontUrl={frontUrl}
        backUrl={backUrl}
        hovered={hovered}
        interactive={interactive}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </group>
  )
}

// Export dimensions for layout calculations
export { BAG_W, BAG_H, BAG_D, TOP_CRIMP, BOT_CRIMP, BODY_H }
