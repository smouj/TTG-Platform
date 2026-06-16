// ============================================================
// Trading Tazos Game — BagCardMini3D v2
// Compact 3D rotating bag for shop cards.
// Solid bag with side panels — no transparency gaps.
// Auto-rotate, no drag interaction.
// ============================================================
"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

// ── Bag geometry (scaled-down potato chip bag) ──
const BAG_W_TOP = 0.72
const BAG_W_BOT = 0.64
const BAG_H = 1.02
const BAG_D = 0.22
const TOP_CRIMP = 0.09
const BOT_CRIMP = 0.07
const BODY_H = BAG_H - TOP_CRIMP - BOT_CRIMP
const BULGE = 0.09

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function makePillowFaceGeo(wTop: number, wBot: number, h: number, bulge: number, segs: number): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(wTop, h, segs, Math.round(segs * 1.8))
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    const yNorm = y / (h / 2)
    const wAtY = lerp(wBot / 2, wTop / 2, (yNorm + 1) / 2)
    pos.setX(i, x * (wAtY / (wTop / 2)))
    const xN = Math.abs(pos.getX(i)) / wAtY, yN = Math.abs(y) / (h / 2)
    pos.setZ(i, bulge * (1 - Math.pow(xN, 3)) * (1 - Math.pow(yN, 6)) * (1 + 0.4 * Math.sin(xN * Math.PI * 0.85)))
  }
  geo.computeVertexNormals()
  return geo
}

function makeSidePanelGeo(wTop: number, wBot: number, h: number, bulge: number, depth: number, segsH: number): THREE.BufferGeometry {
  const vertices: number[] = []
  const indices: number[] = []
  const halfD = depth / 2

  for (let i = 0; i <= segsH; i++) {
    const t = i / segsH
    const y = (t - 0.5) * h
    const wAtY = lerp(wBot / 2, wTop / 2, t)
    const yNorm = Math.abs(y) / (h / 2)
    const zOffset = bulge * 0.15 * (1 - Math.pow(yNorm, 6))
    vertices.push(wAtY, y, halfD + zOffset)
    vertices.push(wAtY, y, -halfD - zOffset)
    vertices.push(-wAtY, y, halfD + zOffset)
    vertices.push(-wAtY, y, -halfD - zOffset)
  }

  for (let i = 0; i < segsH; i++) {
    const a = i * 4, b = a + 1, c = a + 4, d = a + 5
    indices.push(a, c, b, b, c, d)
    const la = a + 2, lb = b + 2, lc = c + 2, ld = d + 2
    indices.push(la, lc, lb, lb, lc, ld)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

function makeCleanEdgeTex(): THREE.Texture {
  const c = document.createElement("canvas")
  c.width = 128; c.height = 16
  const ctx = c.getContext("2d")!
  ctx.fillStyle = "#d4d0c8"
  ctx.fillRect(0, 0, 128, 16)
  ctx.strokeStyle = "rgba(0,0,0,0.04)"
  ctx.lineWidth = 0.8
  for (let i = 0; i < 8; i++) {
    const y = 1 + i * 1.8 + Math.sin(i * 0.7) * 0.3
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(128, y); ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

let _edgeTex: THREE.Texture | null = null
function getEdgeTex(): THREE.Texture {
  if (!_edgeTex) _edgeTex = makeCleanEdgeTex()
  return _edgeTex
}

// ── Main 3D bag model (mini, auto-rotate only) ──
function MiniBagModel({ frontUrl, backUrl }: { frontUrl: string; backUrl: string }) {
  const groupRef = useRef<THREE.Group>(null!)
  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const edgeTex = useMemo(() => getEdgeTex(), [])
  const pillowGeo = useMemo(() => makePillowFaceGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BULGE, 18), [])
  const sideGeo = useMemo(() => makeSidePanelGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BULGE, BAG_D, 8), [])

  useMemo(() => {
    for (const tex of [frontTex, backTex]) {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.generateMipmaps = true
    }
  }, [frontTex, backTex])

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.4
  })

  const bodyY = (TOP_CRIMP - BOT_CRIMP) / 2
  const topY = BAG_H / 2 - TOP_CRIMP / 2
  const botY = -BAG_H / 2 + BOT_CRIMP / 2
  const halfD = BAG_D / 2

  return (
    <group ref={groupRef} scale={0.9}>
      {/* Bottom edge */}
      <mesh position={[0, botY, 0]}>
        <boxGeometry args={[BAG_W_BOT + 0.012, BOT_CRIMP, BAG_D + 0.012]} />
        <meshStandardMaterial map={edgeTex} roughness={0.6} metalness={0.05} />
      </mesh>
      {/* Side panels */}
      <group position={[0, bodyY, 0]}>
        <mesh geometry={sideGeo}>
          <meshStandardMaterial map={edgeTex} roughness={0.6} metalness={0.05} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Front */}
      <mesh position={[0, bodyY, halfD + 0.001]} geometry={pillowGeo}>
        <meshStandardMaterial map={frontTex} roughness={0.25} metalness={0.0} side={THREE.FrontSide} transparent alphaTest={0.01} />
      </mesh>
      {/* Back */}
      <mesh position={[0, bodyY, -halfD - 0.001]} geometry={pillowGeo} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial map={backTex} roughness={0.25} metalness={0.0} side={THREE.FrontSide} transparent alphaTest={0.01} />
      </mesh>
      {/* Top edge */}
      <mesh position={[0, topY, 0]}>
        <boxGeometry args={[BAG_W_TOP + 0.012, TOP_CRIMP, BAG_D + 0.02]} />
        <meshStandardMaterial map={edgeTex} roughness={0.6} metalness={0.05} />
      </mesh>
    </group>
  )
}

// ── Export: Compact canvas ──
export default function BagCardMini3D({ frontUrl, backUrl }: { frontUrl: string; backUrl: string }) {
  return (
    <div className="w-full h-[180px] sm:h-[200px]" style={{ background: "transparent" }}>
      <Canvas
        camera={{ position: [0, 0.02, 1.65], fov: 38 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 2, 3]} intensity={1.5} />
        <directionalLight position={[-1.5, 1, -1.5]} intensity={0.6} color="#ffeecc" />
        <pointLight position={[0, 0.5, 2]} intensity={0.5} color="#FFCC00" />
        <MiniBagModel frontUrl={frontUrl} backUrl={backUrl} />
      </Canvas>
    </div>
  )
}
