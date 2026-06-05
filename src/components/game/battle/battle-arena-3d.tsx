// ============================================================
// Trading Tazos Game — Battle Arena 3D (Magazine Edition)
// Coliseum arena with tazo discs showing real images,
// comic-panel framing, responsive mobile/desktop.
// ============================================================
"use client"

import { Suspense, useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import type { DiscPhysics, Arena3DConfig } from "@/lib/battle/game-loop"
import TazoDisc3D from "../3d/tazo-disc-3d"

// ─── Floor ───
function Floor({ config }: { config: Arena3DConfig }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = 1024; c.height = 1024
    const ctx = c.getContext("2d")!
    const g = ctx.createRadialGradient(512, 512, 40, 512, 512, 540)
    g.addColorStop(0, "#faf7f0"); g.addColorStop(0.78, "#e8e0d0"); g.addColorStop(1, "#b0a490")
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 1024)
    // Outer combat ring
    ctx.strokeStyle = "#FFCC00"; ctx.lineWidth = 22
    ctx.beginPath(); ctx.arc(512, 512, 472, 0, Math.PI*2); ctx.stroke()
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 5
    ctx.beginPath(); ctx.arc(512, 512, 472, 0, Math.PI*2); ctx.stroke()
    // Inner rings
    ctx.strokeStyle = "rgba(0,0,0,0.05)"; ctx.lineWidth = 1.5
    for (let r = 70; r < 460; r += 65) { ctx.beginPath(); ctx.arc(512, 512, r, 0, Math.PI*2); ctx.stroke() }
    // Center
    ctx.fillStyle = "rgba(255,204,0,0.2)"; ctx.beginPath(); ctx.arc(512, 512, 12, 0, Math.PI*2); ctx.fill()
    // Halftone edge
    ctx.fillStyle = "rgba(0,0,0,0.03)"
    for (let y = 0; y < 1024; y += 12) {
      for (let x = 0; x < 1024; x += 12) {
        if (Math.sqrt((x-512)**2+(y-512)**2) > 440) {
          ctx.beginPath(); ctx.arc(x+((y/12)%2)*6, y, 2, 0, Math.PI*2); ctx.fill()
        }
      }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true
    return t
  }, [])

  return (
    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
      <planeGeometry args={[config.radius * 2.7, config.radius * 2.7]} />
      <meshStandardMaterial map={tex} roughness={0.75} metalness={0.03} />
    </mesh>
  )
}

// ─── Ring ───
function Ring({ config, phase }: { config: Arena3DConfig; phase: string }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.12
    const mat = ref.current.material as THREE.MeshStandardMaterial
    const pulse = (Math.sin(Date.now()*0.0015)+1)*0.5
    mat.emissiveIntensity = 0.25 + pulse * 0.55
  })
  return (
    <mesh ref={ref} position={[0, 2.3, 0]} rotation={[Math.PI/2.7, 0, 0]}>
      <torusGeometry args={[config.radius * 1.12, 0.035, 16, 128]} />
      <meshStandardMaterial color="#FFCC00" emissive="#FFCC00" emissiveIntensity={0.4} roughness={0.12} metalness={0.9} transparent opacity={0.65} />
    </mesh>
  )
}

// ─── Pillars ───
function Pillars({ config }: { config: Arena3DConfig }) {
  const pts = useMemo(() => {
    const r: { x: number; z: number }[] = []
    for (let i = 0; i < 8; i++) {
      const a = (i/8)*Math.PI*2
      r.push({ x: Math.cos(a)*config.radius*1.32, z: Math.sin(a)*config.radius*1.32 })
    }
    return r
  }, [config.radius])
  return (
    <>
      {pts.map((p, i) => (
        <group key={i} position={[p.x, 0.9, p.z]}>
          <mesh castShadow><cylinderGeometry args={[0.18, 0.22, 1.8, 8]} />
            <meshStandardMaterial color="#c8c0b0" roughness={0.7} metalness={0.1} />
          </mesh>
          <mesh position={[0, 1.0, 0]}><sphereGeometry args={[0.12, 6, 6]} />
            <meshStandardMaterial color="#FF8800" emissive="#FF8800" emissiveIntensity={0.5} roughness={0.1} />
          </mesh>
        </group>
      ))}
    </>
  )
}

// ─── Disc (with real images) ───
function ADisc({ disc, idx }: { disc: DiscPhysics; idx: number }) {
  const g = useRef<THREE.Group>(null!)
  const t = useRef(new THREE.Vector3(...disc.position))
  useFrame((_, delta) => {
    if (!g.current) return
    t.current.set(...disc.position)
    g.current.position.lerp(t.current, 0.22)
    if (disc.state === "sliding" || disc.state === "spinning") g.current.rotation.z += delta * 2
    const ty = disc.state === "captured" ? 5 : disc.state === "out_of_bounds" ? 3 : 0.08
    g.current.position.y += (ty - g.current.position.y) * 0.12
    if (disc.state === "captured") g.current.scale.lerp(new THREE.Vector3(0.01,0.01,0.01), 0.06)
  })
  if (disc.state === "captured") return null
  return (
    <group ref={g} position={disc.position}>
      <TazoDisc3D
        name={disc.tazoName} franchise={disc.franchise}
        imageUrl={disc.imageUrl} backImageUrl={disc.backImageUrl}
        size={0.4} rotationSpeed={0.35 + idx*0.06} autoRotate
      />
    </group>
  )
}

// ─── Camera ───
function Cam({ phase }: { phase: string }) {
  useFrame(({ camera }) => {
    if (phase === "intro") {
      const t = Date.now()*0.00025
      camera.position.lerp(new THREE.Vector3(Math.sin(t)*6, 7+Math.sin(t*1.6)*1, Math.cos(t)*6), 0.025)
    } else {
      camera.position.lerp(new THREE.Vector3(0, 8, 8.5), 0.035)
    }
    camera.lookAt(0, 0, 0)
  })
  return null
}

// ─── Main ───
interface Props {
  config: Arena3DConfig; playerDiscs: DiscPhysics[]; opponentDiscs: DiscPhysics[]
  gamePhase: string; compact?: boolean; className?: string; style?: React.CSSProperties
}

function Scene({ config, playerDiscs, opponentDiscs, gamePhase }: Props) {
  const all = useMemo(() => [...playerDiscs, ...opponentDiscs], [playerDiscs, opponentDiscs])
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 14, 3]} intensity={0.8} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512} />
      <directionalLight position={[-4, 6, -5]} intensity={0.18} />
      <spotLight position={[0, 12, 0]} angle={0.55} penumbra={0.6} intensity={3.2} color="#FFF8E0" castShadow />
      <Floor config={config} />
      <Ring config={config} phase={gamePhase} />
      <Pillars config={config} />
      {all.map((d, i) => <ADisc key={d.id} disc={d} idx={i} />)}
      <Cam phase={gamePhase} />
      <OrbitControls enablePan={false} enableZoom minPolarAngle={0.25} maxPolarAngle={Math.PI/2.6}
        minDistance={4} maxDistance={13} autoRotate={gamePhase==="intro"} autoRotateSpeed={0.35}
        target={[0, 0.3, 0]} />
    </>
  )
}

export default function BattleArena3D(props: Props) {
  return (
    <div
      className={props.className}
      style={{
        width: "100%", minHeight: props.compact ? 280 : 440,
        background: "radial-gradient(ellipse at 50% 60%, #fdfaf2, #e4d8c0 70%, #c4b498)",
        borderRadius: 4, overflow: "hidden",
        border: "3px solid #1a1a1a",
        boxShadow: "inset 0 0 60px rgba(0,0,0,0.06)",
        ...props.style,
      }}>
      <Canvas camera={{ position: [0, 8, 8.5], fov: 38, near: 0.5, far: 50 }}
        gl={{ antialias: true, alpha: false }} shadows dpr={[1, 1.5]}>
        <Suspense fallback={null}><Scene {...props} /></Suspense>
      </Canvas>
    </div>
  )
}
