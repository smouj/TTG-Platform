// ============================================================
// Trading Tazos Game — BagCardMini3D v3
// Compact rotating bag card. Pillow pouch — no box geometry.
// ============================================================
"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

const BAG_W_TOP = 0.72; const BAG_W_BOT = 0.64
const BAG_H = 1.02; const BAG_D = 0.04
const TOP_CRIMP = 0.08; const BOT_CRIMP = 0.06
const BODY_H = BAG_H - TOP_CRIMP - BOT_CRIMP
const BULGE = 0.17

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
}
function darkenHex(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `#${Math.round(Math.max(0, r * factor) * 255).toString(16).padStart(2, "0")}${Math.round(Math.max(0, g * factor) * 255).toString(16).padStart(2, "0")}${Math.round(Math.max(0, b * factor) * 255).toString(16).padStart(2, "0")}`
}
function lightenHex(hex: string, mix: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `#${Math.round(Math.min(255, (r + (1 - r) * mix) * 255)).toString(16).padStart(2, "0")}${Math.round(Math.min(255, (g + (1 - g) * mix) * 255)).toString(16).padStart(2, "0")}${Math.round(Math.min(255, (b + (1 - b) * mix) * 255)).toString(16).padStart(2, "0")}`
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
    pos.setZ(i, bulge * Math.pow(1 - Math.pow(xN, 3), 2) * Math.pow(1 - Math.pow(yN, 5), 2.5))
  }
  geo.computeVertexNormals()
  return geo
}

function makeEdgeSeamGeo(wTop: number, wBot: number, h: number, gap: number, segsH: number): THREE.BufferGeometry {
  const vertices: number[] = []; const indices: number[] = []
  const halfGap = gap / 2; const seamInset = 0.008
  for (let i = 0; i <= segsH; i++) {
    const t = i / segsH; const y = (t - 0.5) * h
    const wAtY = lerp(wBot / 2, wTop / 2, t) - seamInset
    vertices.push(wAtY, y, halfGap, wAtY, y, -halfGap)
    vertices.push(-wAtY, y, halfGap, -wAtY, y, -halfGap)
  }
  for (let i = 0; i < segsH; i++) {
    const a = i * 4, b = a + 1, c = a + 4, d = a + 5
    indices.push(a, c, b, b, c, d)
    indices.push(a + 2, c + 2, b + 2, b + 2, c + 2, d + 2)
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

function makeCrimpGeo(w: number, h: number, gap: number, segs: number): THREE.BufferGeometry {
  const vertices: number[] = []; const indices: number[] = []
  const halfGap = gap / 2 + 0.004; const overhang = 0.015
  const w2 = w / 2 + overhang; const h2 = h / 2
  const rowsW = segs + 1; const rowsH = 3
  for (let yi = 0; yi < rowsH; yi++) {
    const y = (yi / (rowsH - 1) - 0.5) * h
    const crimpWave = Math.sin(yi * 2.5) * 0.004
    for (let xi = 0; xi < rowsW; xi++) {
      const x = (xi / (rowsW - 1) - 0.5) * w2 * 2
      vertices.push(x, y + crimpWave, halfGap, x, y + crimpWave, -halfGap)
    }
  }
  for (let yi = 0; yi < rowsH - 1; yi++) {
    for (let xi = 0; xi < rowsW - 1; xi++) {
      const a = yi * rowsW * 2 + xi * 2, b = a + 2, c = a + rowsW * 2, d = c + 2
      indices.push(a, c, b, b, c, d)
      indices.push(a + 1, b + 1, c + 1, c + 1, b + 1, d + 1)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

function makeEdgeTex(bagColor: string): THREE.Texture {
  const seamColor = darkenHex(bagColor, 0.65); const crimpColor = darkenHex(bagColor, 0.50)
  const c = document.createElement("canvas"); c.width = 128; c.height = 32
  const ctx = c.getContext("2d")!
  ctx.fillStyle = seamColor; ctx.fillRect(0, 0, 128, 32)
  for (let i = 0; i < 40; i++) {
    const x = i * 3.2 + Math.sin(i * 0.5) * 1.5
    ctx.strokeStyle = `rgba(255,255,255,${(0.03 + Math.random() * 0.05).toFixed(3)})`
    ctx.lineWidth = 0.6 + Math.random()
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
const _et: Record<string, THREE.Texture> = {}
function getEdgeTex(c: string): THREE.Texture { if (!_et[c]) _et[c] = makeEdgeTex(c); return _et[c] }

function MiniBagModel({ frontUrl, backUrl, bagColor }: { frontUrl: string; backUrl: string; bagColor: string }) {
  const groupRef = useRef<THREE.Group>(null!)
  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const edgeTex = useMemo(() => getEdgeTex(bagColor), [bagColor])
  const seamColorHex = useMemo(() => darkenHex(bagColor, 0.65), [bagColor])
  const pillowGeo = useMemo(() => makePillowFaceGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BULGE, 22), [])
  const seamGeo = useMemo(() => makeEdgeSeamGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BAG_D, 12), [])
  const topCrimpGeo = useMemo(() => makeCrimpGeo(BAG_W_TOP, TOP_CRIMP, BAG_D, 6), [])
  const botCrimpGeo = useMemo(() => makeCrimpGeo(BAG_W_BOT, BOT_CRIMP, BAG_D, 6), [])

  useMemo(() => {
    for (const tex of [frontTex, backTex]) {
      tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true
    }
  }, [frontTex, backTex])

  useFrame((_, delta) => { if (groupRef.current) groupRef.current.rotation.y += delta * 0.4 })

  const bodyY = (TOP_CRIMP - BOT_CRIMP) / 2
  const topY = BAG_H / 2 - TOP_CRIMP / 2
  const botY = -BAG_H / 2 + BOT_CRIMP / 2
  const halfGap = BAG_D / 2

  return (
    <group ref={groupRef} scale={0.9} rotation={[0, -0.04, 0.02]}>
      <mesh geometry={botCrimpGeo} position={[0, botY, 0]}>
        <meshStandardMaterial map={edgeTex} roughness={0.55} metalness={0.06} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={seamGeo} position={[0, bodyY, 0]}>
        <meshStandardMaterial color={seamColorHex} roughness={0.5} metalness={0.04} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, bodyY, halfGap + 0.001]} geometry={pillowGeo}>
        <meshStandardMaterial map={frontTex} roughness={0.18} metalness={0.0} side={THREE.FrontSide} transparent alphaTest={0.01} />
      </mesh>
      <mesh position={[0, bodyY, -halfGap - 0.001]} geometry={pillowGeo} rotation={[0, Math.PI, 0]}>
        <meshStandardMaterial map={backTex} roughness={0.18} metalness={0.0} side={THREE.FrontSide} transparent alphaTest={0.01} />
      </mesh>
      <mesh geometry={topCrimpGeo} position={[0, topY, 0]}>
        <meshStandardMaterial map={edgeTex} roughness={0.55} metalness={0.06} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default function BagCardMini3D({ frontUrl, backUrl, bagColor = "#d4d0c8" }: { frontUrl: string; backUrl: string; bagColor?: string }) {
  return (
    <div className="w-full h-[180px] sm:h-[200px]" style={{ background: "transparent" }}>
      <Canvas camera={{ position: [0, 0.02, 1.65], fov: 38 }} style={{ background: "transparent" }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 2, 3]} intensity={1.5} />
        <directionalLight position={[-1.5, 1, -1.5]} intensity={0.6} color="#ffeecc" />
        <pointLight position={[0, 0.5, 2]} intensity={0.5} color="#FFCC00" />
        <MiniBagModel frontUrl={frontUrl} backUrl={backUrl} bagColor={bagColor} />
      </Canvas>
    </div>
  )
}
