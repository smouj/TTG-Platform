// ============================================================
// Trading Tazos Game — BagCardMini3D v8
// 3 meshes, wide faces (cos>0.18), UV on central 60%.
// ============================================================
"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

const BAG_W_TOP = 0.72; const BAG_W_BOT = 0.64; const BAG_H = 1.02; const BULGE = 0.17
const COS_THRESH = 0.18; const ARC_HALF = Math.acos(COS_THRESH); const UV_SPREAD = 0.6

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
}
function darkenHex(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `#${Math.round(Math.max(0, r * factor) * 255).toString(16).padStart(2, "0")}${Math.round(Math.max(0, g * factor) * 255).toString(16).padStart(2, "0")}${Math.round(Math.max(0, b * factor) * 255).toString(16).padStart(2, "0")}`
}

function buildSubGeo(
  wTop: number, wBot: number, h: number, bulge: number,
  segsAround: number, segsH: number,
  vertexFilter: (angle: number) => boolean, uvMap: (angle: number) => number,
): THREE.BufferGeometry {
  const positions: number[] = []; const uvs: number[] = []
  const oldToNew: number[][] = []
  for (let yi = 0; yi <= segsH; yi++) {
    const row: number[] = []
    const t = yi / segsH; const y = (t - 0.5) * h
    const halfW = lerp(wBot / 2, wTop / 2, t)
    const hf = Math.pow(1 - Math.pow(Math.abs(y) / (h / 2), 5), 2.5)
    const halfD = bulge * hf
    for (let i = 0; i < segsAround; i++) {
      const angle = (i / segsAround) * Math.PI * 2
      if (vertexFilter(angle)) {
        const cosA = Math.cos(angle), sinA = Math.sin(angle)
        const r = Math.pow(Math.pow(Math.abs(cosA), 3.5) + Math.pow(Math.abs(sinA), 3.5), -1 / 3.5)
        positions.push(r * cosA * halfW, y, r * sinA * halfD)
        uvs.push(uvMap(angle), t)
        row.push(positions.length / 3 - 1)
      } else row.push(-1)
    }
    oldToNew.push(row)
  }
  const indices: number[] = []
  for (let yi = 0; yi < segsH; yi++) {
    const r0 = oldToNew[yi], r1 = oldToNew[yi + 1]
    for (let i = 0; i < segsAround; i++) {
      const j = (i + 1) % segsAround
      const a = r0[i], b = r1[i], c = r0[j], d = r1[j]
      if (a >= 0 && b >= 0 && c >= 0 && d >= 0) indices.push(a, b, c, b, d, c)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices); geo.computeVertexNormals()
  return geo
}

function MiniBagModel({ frontUrl, backUrl, bagColor }: { frontUrl: string; backUrl: string; bagColor: string }) {
  const groupRef = useRef<THREE.Group>(null!)
  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const seamColorHex = useMemo(() => darkenHex(bagColor, 0.65), [bagColor])

  const frontGeo = useMemo(() => buildSubGeo(BAG_W_TOP, BAG_W_BOT, BAG_H, BULGE, 48, 14,
    (a) => Math.cos(a) > COS_THRESH,
    (a) => { const aa = a > Math.PI ? a - 2 * Math.PI : a; const s = aa / (ARC_HALF * UV_SPREAD); return Math.max(0, Math.min(1, (s + 1) / 2)) }
  ), [])
  const backGeo = useMemo(() => buildSubGeo(BAG_W_TOP, BAG_W_BOT, BAG_H, BULGE, 48, 14,
    (a) => Math.cos(a) < -COS_THRESH,
    (a) => { const aa = a - Math.PI; const s = aa / (ARC_HALF * UV_SPREAD); return Math.max(0, Math.min(1, (s + 1) / 2)) }
  ), [])
  const sideGeo = useMemo(() => buildSubGeo(BAG_W_TOP, BAG_W_BOT, BAG_H, BULGE, 48, 14,
    (a) => Math.abs(Math.cos(a)) <= COS_THRESH, () => 0.5,
  ), [])

  const fMat = useMemo(() => new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.18, metalness: 0, side: THREE.FrontSide }), [frontTex])
  const bMat = useMemo(() => new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.18, metalness: 0, side: THREE.FrontSide }), [backTex])
  const sMat = useMemo(() => new THREE.MeshStandardMaterial({ color: seamColorHex, roughness: 0.5, metalness: 0.04, side: THREE.FrontSide }), [seamColorHex])

  useMemo(() => { for (const tex of [frontTex, backTex]) { tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true } }, [frontTex, backTex])
  useFrame((_, delta) => { if (groupRef.current) groupRef.current.rotation.y += delta * 0.4 })

  return (
    <group ref={groupRef} scale={0.9} rotation={[0, -0.04, 0.02]}>
      <mesh geometry={frontGeo} material={fMat} />
      <mesh geometry={backGeo} material={bMat} />
      <mesh geometry={sideGeo} material={sMat} />
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
