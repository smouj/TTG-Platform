// ============================================================
// Trading Tazos Game — BagCardMini3D v5
// Compact rotating bag card. Superellipse pillow mesh.
// Same geometry as PotatoChipBag3D v11, scaled for preview.
// ============================================================
"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

const BAG_W_TOP = 0.72; const BAG_W_BOT = 0.64
const BAG_H = 1.02; const TOP_CRIMP = 0.08; const BOT_CRIMP = 0.06
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

function makePillowBodyGeo(
  wTop: number, wBot: number, h: number, bulge: number,
  segsAround: number, segsH: number
): THREE.BufferGeometry {
  const positions: number[] = []; const uvs: number[] = []
  const vertexZones: ("front" | "back" | "side")[] = []
  for (let i = 0; i < segsAround; i++) {
    const cosA = Math.cos((i / segsAround) * Math.PI * 2)
    if (cosA > 0.18) vertexZones.push("front")
    else if (cosA < -0.18) vertexZones.push("back")
    else vertexZones.push("side")
  }
  const frontStart = vertexZones.findIndex(z => z === "front")
  const frontEnd = vertexZones.lastIndexOf("front")
  const backStart = vertexZones.findIndex(z => z === "back")
  const backEnd = vertexZones.lastIndexOf("back")

  for (let yi = 0; yi <= segsH; yi++) {
    const t = yi / segsH; const y = (t - 0.5) * h
    const halfW = lerp(wBot / 2, wTop / 2, t)
    const yNorm = Math.abs(y) / (h / 2)
    const hf = Math.pow(1 - Math.pow(yNorm, 5), 2.5)
    const halfD = bulge * hf

    for (let i = 0; i < segsAround; i++) {
      const angle = (i / segsAround) * Math.PI * 2
      const cosA = Math.cos(angle); const sinA = Math.sin(angle)
      const n = 3.5
      const r = Math.pow(Math.pow(Math.abs(cosA), n) + Math.pow(Math.abs(sinA), n), -1 / n)
      const x = r * cosA * halfW * 0.92; const z = r * sinA * halfD
      positions.push(x, y, z)
      const zone = vertexZones[i]
      let u = 0.5
      if (zone === "front" && frontEnd > frontStart) u = (i - frontStart) / (frontEnd - frontStart)
      else if (zone === "back" && backEnd > backStart) u = (i - backStart) / (backEnd - backStart)
      uvs.push(u, t)
    }
  }

  const allIndices: number[] = []; const frontI: number[] = []; const backI: number[] = []; const sideI: number[] = []
  for (let yi = 0; yi < segsH; yi++) {
    const r0 = yi * segsAround; const r1 = (yi + 1) * segsAround
    for (let i = 0; i < segsAround; i++) {
      const iNext = (i + 1) % segsAround
      const a = r0 + i, b = r1 + i, c = r0 + iNext, d = r1 + iNext
      const zone = vertexZones[i]
      const tgt = zone === "front" ? frontI : zone === "back" ? backI : sideI
      allIndices.push(a, b, c); tgt.push(a, b, c)
      allIndices.push(b, d, c); tgt.push(b, d, c)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(allIndices)
  geo.computeVertexNormals()
  geo.clearGroups()
  if (frontI.length > 0) geo.addGroup(0, frontI.length, 0)
  if (backI.length > 0) geo.addGroup(frontI.length, backI.length, 1)
  if (sideI.length > 0) geo.addGroup(frontI.length + backI.length, sideI.length, 2)
  return geo
}

function makeCrimpGeo(w: number, h: number, segsW: number): THREE.BufferGeometry {
  const vertices: number[] = []; const indices: number[] = []
  const overhang = 0.018; const w2 = w / 2 + overhang
  const rowsW = segsW + 1; const rowsH = 3; const depth = 0.006
  for (let yi = 0; yi < rowsH; yi++) {
    const yv = (yi / (rowsH - 1) - 0.5) * h; const wave = Math.sin(yi * 2.5) * 0.004
    for (let xi = 0; xi < rowsW; xi++) {
      const x = (xi / (rowsW - 1) - 0.5) * w2 * 2
      vertices.push(x, yv + wave, depth, x, yv + wave, -depth)
    }
  }
  for (let yi = 0; yi < rowsH - 1; yi++)
    for (let xi = 0; xi < rowsW - 1; xi++) {
      const a = yi * rowsW * 2 + xi * 2, b = a + 2, c = a + rowsW * 2, d = c + 2
      indices.push(a, c, b, b, c, d); indices.push(a + 1, b + 1, c + 1, c + 1, b + 1, d + 1)
    }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
  geo.setIndex(indices); geo.computeVertexNormals()
  return geo
}

function makeEdgeTex(bagColor: string): THREE.Texture {
  const seamColor = darkenHex(bagColor, 0.65); const crimpColor = darkenHex(bagColor, 0.48)
  const c = document.createElement("canvas"); c.width = 128; c.height = 32
  const ctx = c.getContext("2d")!
  ctx.fillStyle = seamColor; ctx.fillRect(0, 0, 128, 32)
  for (let i = 0; i < 45; i++) {
    const x = i * 2.84 + Math.sin(i * 0.45) * 1.8
    ctx.strokeStyle = `rgba(255,255,255,${(0.02 + Math.random() * 0.05).toFixed(3)})`
    ctx.lineWidth = 0.5 + Math.random(); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 32); ctx.stroke()
  }
  ctx.strokeStyle = crimpColor; ctx.lineWidth = 2.5
  for (let row = 0; row < 2; row++) {
    const yv = 8 + row * 16; ctx.beginPath()
    for (let x = 0; x < 128; x += 5) { const notch = Math.sin(x * 1.2 + row * 2.1) * 2.5; if (x === 0) ctx.moveTo(x, yv + notch); else ctx.lineTo(x, yv + notch) }
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter
  return tex
}
const _etc2: Record<string, THREE.Texture> = {}
function getEdgeTex(c: string): THREE.Texture { if (!_etc2[c]) _etc2[c] = makeEdgeTex(c); return _etc2[c] }

function MiniBagModel({ frontUrl, backUrl, bagColor }: { frontUrl: string; backUrl: string; bagColor: string }) {
  const groupRef = useRef<THREE.Group>(null!)
  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const edgeTex = useMemo(() => getEdgeTex(bagColor), [bagColor])
  const seamColorHex = useMemo(() => darkenHex(bagColor, 0.65), [bagColor])
  // 48 verts/ring for mini — lighter but still smooth
  const bodyGeo = useMemo(() => makePillowBodyGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BULGE, 48, 14), [])
  const topCrimpGeo = useMemo(() => makeCrimpGeo(BAG_W_TOP, TOP_CRIMP, 8), [])
  const botCrimpGeo = useMemo(() => makeCrimpGeo(BAG_W_BOT, BOT_CRIMP, 8), [])

  const materials = useMemo(() => [
    new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.18, metalness: 0, side: THREE.FrontSide }),
    new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.18, metalness: 0, side: THREE.FrontSide }),
    new THREE.MeshStandardMaterial({ color: seamColorHex, roughness: 0.5, metalness: 0.04, side: THREE.FrontSide }),
  ], [frontTex, backTex, seamColorHex])

  useMemo(() => { for (const tex of [frontTex, backTex]) { tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true } }, [frontTex, backTex])
  useFrame((_, delta) => { if (groupRef.current) groupRef.current.rotation.y += delta * 0.4 })

  const bodyY = (TOP_CRIMP - BOT_CRIMP) / 2
  const topY = BAG_H / 2 - TOP_CRIMP / 2
  const botY = -BAG_H / 2 + BOT_CRIMP / 2

  return (
    <group ref={groupRef} scale={0.9} rotation={[0, -0.04, 0.02]}>
      <mesh geometry={botCrimpGeo} position={[0, botY, 0]}>
        <meshStandardMaterial map={edgeTex} roughness={0.55} metalness={0.06} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={bodyGeo} position={[0, bodyY, 0]} material={materials} />
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
