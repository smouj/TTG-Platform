// ============================================================
// Trading Tazos Game — BagCardMini3D v3
// Compact 3D rotating bag for shop cards.
// Color-matched side seams, pillow inflation — no grey blocks.
// Auto-rotate, no drag interaction.
// ============================================================
"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

// ── Bag geometry (same as PotatoChipBag3D v8) ──
const BAG_W_TOP = 0.72
const BAG_W_BOT = 0.64
const BAG_H = 1.02
const BAG_D = 0.22
const TOP_CRIMP = 0.08
const BOT_CRIMP = 0.06
const BODY_H = BAG_H - TOP_CRIMP - BOT_CRIMP
const BULGE = 0.14

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}
function darkenHex(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex)
  const dr = Math.round(Math.max(0, r * factor) * 255)
  const dg = Math.round(Math.max(0, g * factor) * 255)
  const db = Math.round(Math.max(0, b * factor) * 255)
  return `#${dr.toString(16).padStart(2, "0")}${dg.toString(16).padStart(2, "0")}${db.toString(16).padStart(2, "0")}`
}
function lightenHex(hex: string, mix: number): string {
  const [r, g, b] = hexToRgb(hex)
  const lr = Math.round(Math.min(255, (r + (1 - r) * mix) * 255))
  const lg = Math.round(Math.min(255, (g + (1 - g) * mix) * 255))
  const lb = Math.round(Math.min(255, (b + (1 - b) * mix) * 255))
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`
}

function makePillowFaceGeo(wTop: number, wBot: number, h: number, bulge: number, segs: number): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(wTop, h, segs, Math.round(segs * 1.8))
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    const yNorm = y / (h / 2)
    const wAtY = lerp(wBot / 2, wTop / 2, (yNorm + 1) / 2)
    pos.setX(i, x * (wAtY / (wTop / 2)))
    const xN = Math.abs(pos.getX(i)) / wAtY, yN = Math.abs(y) / (h / 2)
    pos.setZ(i, bulge * Math.pow(1 - Math.pow(xN, 2.5), 1.5) * Math.pow(1 - Math.pow(yN, 4), 2.0) * (1 + 0.3 * Math.sin(xN * Math.PI * 0.8)))
  }
  geo.computeVertexNormals()
  return geo
}

function makeSidePanelGeo(wTop: number, wBot: number, h: number, bulge: number, depth: number, segsH: number): THREE.BufferGeometry {
  const vertices: number[] = []
  const indices: number[] = []
  const halfD = depth / 2
  const wrapMargin = 0.02

  for (let i = 0; i <= segsH; i++) {
    const t = i / segsH
    const y = (t - 0.5) * h
    const wAtY = lerp(wBot / 2, wTop / 2, t)
    const yNorm = Math.abs(y) / (h / 2)
    const edgePush = 1 - Math.pow(yNorm, 6)
    const zOffset = bulge * 0.3 * edgePush
    const rx = wAtY - wrapMargin
    vertices.push(rx, y, halfD + zOffset - 0.002)
    vertices.push(rx, y, -halfD - zOffset + 0.002)
    vertices.push(-rx, y, halfD + zOffset - 0.002)
    vertices.push(-rx, y, -halfD - zOffset + 0.002)
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

function makeEdgeTexture(bagColor: string): THREE.Texture {
  const seamColor = darkenHex(bagColor, 0.68)
  const crimpColor = darkenHex(bagColor, 0.55)
  const highlightColor = lightenHex(bagColor, 0.35)

  const c = document.createElement("canvas")
  c.width = 128; c.height = 32
  const ctx = c.getContext("2d")!
  ctx.fillStyle = seamColor
  ctx.fillRect(0, 0, 128, 32)
  for (let i = 0; i < 40; i++) {
    const x = i * 3.2 + Math.sin(i * 0.5) * 1.5
    ctx.strokeStyle = `rgba(255,255,255,${(0.03 + Math.random() * 0.05).toFixed(3)})`
    ctx.lineWidth = 0.6 + Math.random() * 1
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 32); ctx.stroke()
  }
  ctx.strokeStyle = crimpColor; ctx.lineWidth = 2.5
  for (let row = 0; row < 2; row++) {
    const y = 8 + row * 16
    ctx.beginPath()
    for (let x = 0; x < 128; x += 5) {
      const notch = Math.sin(x * 1.2 + row * 2.1) * 2
      if (x === 0) ctx.moveTo(x, y + notch); else ctx.lineTo(x, y + notch)
    }
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

const _edgeTexCache: Record<string, THREE.Texture> = {}
function getEdgeTex(bagColor: string): THREE.Texture {
  if (!_edgeTexCache[bagColor]) _edgeTexCache[bagColor] = makeEdgeTexture(bagColor)
  return _edgeTexCache[bagColor]
}

function MiniBagModel({ frontUrl, backUrl, bagColor }: { frontUrl: string; backUrl: string; bagColor: string }) {
  const groupRef = useRef<THREE.Group>(null!)
  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const edgeTex = useMemo(() => getEdgeTex(bagColor), [bagColor])
  const seamColorHex = useMemo(() => darkenHex(bagColor, 0.68), [bagColor])
  const pillowGeo = useMemo(() => makePillowFaceGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BULGE, 20), [])
  const sideGeo = useMemo(() => makeSidePanelGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BULGE, BAG_D, 10), [])

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
    <group ref={groupRef} scale={0.9} rotation={[0, -0.04, 0.02]}>
      <mesh position={[0, botY, 0]}>
        <boxGeometry args={[BAG_W_BOT + 0.01, BOT_CRIMP, BAG_D + 0.006]} />
        <meshStandardMaterial map={edgeTex} roughness={0.55} metalness={0.08} />
      </mesh>
      <group position={[0, bodyY, 0]}>
        <mesh geometry={sideGeo}>
          <meshStandardMaterial color={seamColorHex} roughness={0.55} metalness={0.06} side={THREE.DoubleSide} depthWrite />
        </mesh>
      </group>
      <mesh position={[0, bodyY, halfD + 0.001]} geometry={pillowGeo}>
        <meshStandardMaterial map={frontTex} roughness={0.18} metalness={0.0} side={THREE.FrontSide} transparent alphaTest={0.01} />
      </mesh>
      <mesh position={[0, bodyY, -halfD - 0.001]} geometry={pillowGeo} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial map={backTex} roughness={0.18} metalness={0.0} side={THREE.FrontSide} transparent alphaTest={0.01} />
      </mesh>
      <mesh position={[0, topY, 0]}>
        <boxGeometry args={[BAG_W_TOP + 0.01, TOP_CRIMP, BAG_D + 0.01]} />
        <meshStandardMaterial map={edgeTex} roughness={0.55} metalness={0.08} />
      </mesh>
    </group>
  )
}

export default function BagCardMini3D({ frontUrl, backUrl, bagColor = "#d4d0c8" }: { frontUrl: string; backUrl: string; bagColor?: string }) {
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
        <MiniBagModel frontUrl={frontUrl} backUrl={backUrl} bagColor={bagColor} />
      </Canvas>
    </div>
  )
}
