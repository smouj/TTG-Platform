// ============================================================
// Trading Tazos Game — BagCardMini3D v6
// Compact rotating bag card. Superellipse pillow mesh.
// No crimp seals. Angle-based UV mapping.
// ============================================================
"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

const BAG_W_TOP = 0.72; const BAG_W_BOT = 0.64; const BAG_H = 1.02; const BULGE = 0.17
const COS_THRESHOLD = 0.18
const ARC_HALF_RAD = Math.acos(COS_THRESHOLD)

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
}
function darkenHex(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `#${Math.round(Math.max(0, r * factor) * 255).toString(16).padStart(2, "0")}${Math.round(Math.max(0, g * factor) * 255).toString(16).padStart(2, "0")}${Math.round(Math.max(0, b * factor) * 255).toString(16).padStart(2, "0")}`
}

function makePillowBodyGeo(
  wTop: number, wBot: number, h: number,
  bulge: number, segsAround: number, segsH: number
): THREE.BufferGeometry {
  const positions: number[] = []; const uvs: number[] = []
  const zones: ("front" | "back" | "side")[] = []
  for (let i = 0; i < segsAround; i++) {
    const cosA = Math.cos((i / segsAround) * Math.PI * 2)
    if (cosA > COS_THRESHOLD) zones.push("front")
    else if (cosA < -COS_THRESHOLD) zones.push("back")
    else zones.push("side")
  }

  for (let yi = 0; yi <= segsH; yi++) {
    const t = yi / segsH; const y = (t - 0.5) * h
    const halfW = lerp(wBot / 2, wTop / 2, t)
    const hf = Math.pow(1 - Math.pow(Math.abs(y) / (h / 2), 5), 2.5)
    const halfD = bulge * hf

    for (let i = 0; i < segsAround; i++) {
      const angle = (i / segsAround) * Math.PI * 2
      const cosA = Math.cos(angle); const sinA = Math.sin(angle)
      const r = Math.pow(Math.pow(Math.abs(cosA), 3.5) + Math.pow(Math.abs(sinA), 3.5), -1 / 3.5)
      positions.push(r * cosA * halfW, y, r * sinA * halfD)

      let u = 0.5
      const zone = zones[i]
      if (zone === "front") {
        let a = angle > Math.PI ? angle - 2 * Math.PI : angle
        u = (a / ARC_HALF_RAD + 1) / 2
        if (u < 0) u = 0; if (u > 1) u = 1
      } else if (zone === "back") {
        let a = angle - Math.PI
        u = (a / ARC_HALF_RAD + 1) / 2
        if (u < 0) u = 0; if (u > 1) u = 1
      }
      uvs.push(u, t)
    }
  }

  const allIdx: number[] = []; const frontI: number[] = []; const backI: number[] = []; const sideI: number[] = []
  for (let yi = 0; yi < segsH; yi++) {
    const r0 = yi * segsAround; const r1 = (yi + 1) * segsAround
    for (let i = 0; i < segsAround; i++) {
      const j = (i + 1) % segsAround
      const a = r0 + i, b = r1 + i, c = r0 + j, d = r1 + j
      const tgt = zones[i] === "front" ? frontI : zones[i] === "back" ? backI : sideI
      allIdx.push(a, b, c); tgt.push(a, b, c)
      allIdx.push(b, d, c); tgt.push(b, d, c)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(allIdx); geo.computeVertexNormals(); geo.clearGroups()
  if (frontI.length) geo.addGroup(0, frontI.length, 0)
  if (backI.length) geo.addGroup(frontI.length, backI.length, 1)
  if (sideI.length) geo.addGroup(frontI.length + backI.length, sideI.length, 2)
  return geo
}

function MiniBagModel({ frontUrl, backUrl, bagColor }: { frontUrl: string; backUrl: string; bagColor: string }) {
  const groupRef = useRef<THREE.Group>(null!)
  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const seamColorHex = useMemo(() => darkenHex(bagColor, 0.65), [bagColor])

  const bodyGeo = useMemo(() => makePillowBodyGeo(BAG_W_TOP, BAG_W_BOT, BAG_H, BULGE, 48, 14), [])
  const materials = useMemo(() => [
    new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.18, metalness: 0, side: THREE.FrontSide }),
    new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.18, metalness: 0, side: THREE.FrontSide }),
    new THREE.MeshStandardMaterial({ color: seamColorHex, roughness: 0.5, metalness: 0.04, side: THREE.FrontSide }),
  ], [frontTex, backTex, seamColorHex])

  useMemo(() => { for (const tex of [frontTex, backTex]) { tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true } }, [frontTex, backTex])
  useFrame((_, delta) => { if (groupRef.current) groupRef.current.rotation.y += delta * 0.4 })

  return (
    <group ref={groupRef} scale={0.9} rotation={[0, -0.04, 0.02]}>
      <mesh geometry={bodyGeo} material={materials} />
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
