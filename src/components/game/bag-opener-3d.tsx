// ============================================================
// Trading Tazos Game — BagOpener3D
// 3D potato chip bag with real franchise textures,
// tear-open animation, and tazo reveal.
// ============================================================
"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"
import { Gift, Loader2, SkipForward } from "lucide-react"

// ── types ──
export interface TazoPreview {
  slug?: string
  franchise?: { slug: string; color?: string; name?: string }
  rarity: string
}
export interface BagData {
  id: string
  bagType?: string
  preview?: TazoPreview | null
}

interface BagOpener3DProps {
  bag: BagData | null
  opening: boolean
  progress: number // 0..1 tear progress
  onOpen: () => void
  onSkip: () => void
}

// ── texture registry ──
const BAG_TEXTURES: Record<string, { front: string[]; back: string[] }> = {
  minimon: {
    front: ["/textures/bags/minimon/bag-minimon-front-01.png", "/textures/bags/minimon/bag-minimon-front-02.png"],
    back: ["/textures/bags/minimon/bag-minimon-back-01.png", "/textures/bags/minimon/bag-minimon-back-02.png"],
  },
  cybermon: {
    front: ["/textures/bags/cybermon/bag-cybermon-front-01.png", "/textures/bags/cybermon/bag-cybermon-front-02.png"],
    back: ["/textures/bags/cybermon/bag-cybermon-back-01.png", "/textures/bags/cybermon/bag-cybermon-back-02.png"],
  },
  dracobell: {
    front: ["/textures/bags/dracobell/bag-dracobell-front-01.png", "/textures/bags/dracobell/bag-dracobell-front-02.png"],
    back: ["/textures/bags/dracobell/bag-dracobell-back-01.png", "/textures/bags/dracobell/bag-dracobell-back-02.png"],
  },
}

// ── get random bag texture for a franchise ──
function pickBagTexture(franchiseSlug: string | undefined) {
  const slug = franchiseSlug || "minimon"
  const set = BAG_TEXTURES[slug] || BAG_TEXTURES.minimon
  const frontIdx = Math.floor(Math.random() * set.front.length)
  const backIdx = Math.floor(Math.random() * set.back.length)
  return { frontUrl: set.front[frontIdx], backUrl: set.back[backIdx], franchise: slug }
}

// ── tear overlay canvas ──
function createTearCanvas(progress: number, width = 512, height = 512) {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!
  ctx.clearRect(0, 0, width, height)
  if (progress <= 0) return canvas

  // Draw tear line across the bag
  const tearY = height * 0.45
  const tearAmplitude = width * 0.25 * progress
  ctx.strokeStyle = "#1a1a1a"
  ctx.lineWidth = 3 + progress * 5
  ctx.beginPath()
  ctx.moveTo(0, tearY)
  for (let x = 0; x <= width; x += 8) {
    const noise = Math.sin(x * 0.03 + progress * 12) * tearAmplitude * Math.min(1, progress * 2)
    ctx.lineTo(x, tearY + noise)
  }
  ctx.stroke()

  // Gap opening
  const gap = progress * height * 0.15
  ctx.fillStyle = "#1a1a1a"
  ctx.beginPath()
  const topEdge = tearY - gap
  const botEdge = tearY + gap
  ctx.rect(0, topEdge, width, botEdge - topEdge)
  ctx.fill()

  // Glow inside the tear
  const glow = ctx.createRadialGradient(width / 2, tearY, 0, width / 2, tearY, gap * 2.5)
  glow.addColorStop(0, "rgba(255, 204, 0, 0.8)")
  glow.addColorStop(0.5, "rgba(255, 150, 0, 0.3)")
  glow.addColorStop(1, "rgba(0,0,0,0)")
  ctx.fillStyle = glow
  ctx.fillRect(0, topEdge - gap, width, gap * 4)

  return canvas
}

// ── 3D Bag Model ──
function Bag3D({ frontUrl, opening, progress, onTextureReady }: {
  frontUrl: string
  opening: boolean
  progress: number
  onTextureReady: () => void
}) {
  const texture = useLoader(THREE.TextureLoader, frontUrl)
  const [tearTex, setTearTex] = useState<THREE.CanvasTexture | null>(null)
  const groupRef = useRef<THREE.Group>(null!)
  const meshRef = useRef<THREE.Mesh>(null!)

  // Configure texture for proper alpha rendering
  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.generateMipmaps = true
      texture.minFilter = THREE.LinearMipmapLinearFilter
      texture.magFilter = THREE.LinearFilter
      texture.needsUpdate = true
      onTextureReady()
    }
  }, [texture, onTextureReady])

  // Update tear overlay
  useEffect(() => {
    if (opening || progress > 0) {
      const canvas = createTearCanvas(progress)
      const tex = new THREE.CanvasTexture(canvas)
      tex.needsUpdate = true
      setTearTex(tex)
    } else {
      setTearTex(null)
    }
  }, [progress, opening])

  // Curved bag geometry
  const bagGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1.6, 2.2, 32, 32)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // Gentle pillow curve — bulges in the middle
      const bulge = 0.06 * (1 - Math.abs(x) * 1.5) * (1 - Math.abs(y) * 1.3)
      pos.setZ(i, bulge + Math.sin(x * 2.5) * 0.03 * (1 - Math.abs(y)))
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    // Gentle float when idle, shake when opening
    if (opening) {
      const shakeX = Math.sin(Date.now() * 0.05) * progress * 0.06
      const shakeY = Math.cos(Date.now() * 0.07) * progress * 0.04
      groupRef.current.position.x = shakeX
      groupRef.current.position.y = shakeY + Math.sin(Date.now() * 0.003) * 0.15
      groupRef.current.rotation.z = Math.sin(Date.now() * 0.004) * 0.08
    } else {
      groupRef.current.position.y = Math.sin(Date.now() * 0.0015) * 0.15
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.0008) * 0.12
      groupRef.current.rotation.z = Math.cos(Date.now() * 0.001) * 0.04
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main bag plane */}
      <mesh ref={meshRef} geometry={bagGeo}>
        <meshStandardMaterial
          map={texture}
          roughness={0.35}
          metalness={0.05}
          side={THREE.FrontSide}
          transparent
          alphaTest={0.01}
          depthWrite
        />
      </mesh>

      {/* Tear overlay */}
      {tearTex && (
        <mesh position={[0, 0, 0.002]} geometry={bagGeo}>
          <meshBasicMaterial
            map={tearTex}
            transparent
            depthTest={false}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Edge seal — top crimp */}
      <mesh position={[0, 1.12, 0.02]}>
        <boxGeometry args={[1.62, 0.04, 0.04]} />
        <meshStandardMaterial color="#999" roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Bottom crimp */}
      <mesh position={[0, -1.12, 0.02]}>
        <boxGeometry args={[1.62, 0.04, 0.04]} />
        <meshStandardMaterial color="#999" roughness={0.6} metalness={0.2} />
      </mesh>
    </group>
  )
}

// ── Particle burst ──
function ParticleBurst({ active, progress }: { active: boolean; progress: number }) {
  const count = 40
  const particlesRef = useRef<THREE.Points>(null!)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 2
      arr[i * 3 + 1] = Math.random() * -1.5
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    }
    return arr
  }, [])

  useFrame(() => {
    if (!particlesRef.current || !active) {
      particlesRef.current!.visible = false
      return
    }
    particlesRef.current.visible = true
    particlesRef.current.rotation.y += 0.01
    const attr = particlesRef.current.geometry.attributes.position
    for (let i = 0; i < count; i++) {
      attr.array[i * 3 + 1] -= 0.008 * (1 + progress)
      attr.array[i * 3] += (Math.random() - 0.5) * 0.01
    }
    attr.needsUpdate = true
  })

  const sizes = useMemo(() => {
    const arr = new Float32Array(count)
    for (let i = 0; i < count; i++) arr[i] = Math.random() * 0.04 + 0.01
    return arr
  }, [])

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial color="#FFCC00" size={0.03} blending={THREE.AdditiveBlending} depthWrite={false} transparent />
    </points>
  )
}

// ── Scene setup: lighting + transparent background ──
function SceneSetup() {
  return (
    <>
      <color attach="background" args={[0]} /> {/* explicit transparent bg */}
      <ambientLight intensity={1.2} />
      <spotLight position={[3, 2, 4]} intensity={2.5} angle={0.5} penumbra={0.5} color="#fffef0" />
      <spotLight position={[-2, 1, -3]} intensity={1.2} angle={0.4} penumbra={0.6} color="#fffef0" />
      <pointLight position={[0, -2, 2]} intensity={0.8} color="#FFCC00" />
    </>
  )
}

// ── Main component ──
export default function BagOpener3D({ bag, opening, progress, onOpen, onSkip }: BagOpener3DProps) {
  const { frontUrl, franchise } = useMemo(() => {
    const slug = bag?.preview?.franchise?.slug
    return pickBagTexture(slug)
  }, [bag])
  const [textureReady, setTextureReady] = useState(false)

  const franchiseColor = useMemo(() => {
    const slug = bag?.preview?.franchise?.slug || franchise
    const colors: Record<string, string> = { minimon: "#22C55E", cybermon: "#3B82F6", dracobell: "#F97316" }
    return colors[slug] || "#FFCC00"
  }, [bag, franchise])

  return (
    <div className="relative w-full h-[420px] sm:h-[480px]">
      {/* 3D Scene */}
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 42 }}
        gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}
        style={{ background: "radial-gradient(ellipse at center, #2a2015 0%, #0d0a05 100%)" }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        }}
      >
        <SceneSetup />
        <Bag3D
          frontUrl={frontUrl}
          opening={opening}
          progress={progress}
          onTextureReady={() => setTextureReady(true)}
        />
        <ParticleBurst active={opening && progress > 0.15} progress={progress} />
        {/* Spotlight glow on floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
          <planeGeometry args={[3.5, 2.5]} />
          <meshBasicMaterial color="#FFCC00" transparent opacity={0.08} depthWrite={false} />
        </mesh>
      </Canvas>

      {/* HUD overlay */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 p-4">
        {!textureReady && !opening ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-black/70 border-2 border-[#FFCC00]/30 text-[#FFCC00] text-xs font-black uppercase">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading bag...
          </div>
        ) : !opening ? (
          <button
            onClick={onOpen}
            className="flex items-center gap-2 px-6 py-3 font-black text-sm uppercase tracking-wider border-3 transition-all animate-pulse"
            style={{
              backgroundColor: franchiseColor,
              color: "#fff",
              borderColor: "#1a1a1a",
              boxShadow: "4px 4px 0px #1a1a1a",
            }}
          >
            <Gift className="w-5 h-5" />
            Open Bag!
          </button>
        ) : progress < 1 ? (
          <>
            {/* Progress bar */}
            <div className="flex-1 max-w-[200px]">
              <div className="h-2 bg-black/60 rounded-full overflow-hidden border border-white/30">
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: franchiseColor,
                  }}
                />
              </div>
            </div>
            <button
              onClick={onSkip}
              className="flex items-center gap-1 px-3 py-1.5 bg-black/60 border border-white/20 text-white/80 text-[10px] font-black uppercase hover:bg-black/80"
            >
              <SkipForward className="w-3 h-3" />
              Skip
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
