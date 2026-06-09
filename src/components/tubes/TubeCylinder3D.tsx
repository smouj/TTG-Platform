// ============================================================
// Trading Tazos Game — TubeCylinder3D
// Real 3D cylindrical battle tube with texture-wrapped label.
// Clean side view only — no caps, no rings, just the body.
// ============================================================
"use client"

import { useRef, useMemo, Suspense } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"
import { OrbitControls } from "@react-three/drei"

// ── Tube dimensions ──────────────────────────────
const TUBE_RADIUS = 0.42
const TUBE_HEIGHT = 1.50

interface TubeCylinderProps {
  textureUrl: string
  color: string
  rotationSpeed?: number
  showTazos?: boolean
  tazoImageUrls?: string[]
}

function TubeModel({ textureUrl, color, rotationSpeed = 0.15, showTazos = false, tazoImageUrls = [] }: TubeCylinderProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const texture = useLoader(THREE.TextureLoader, textureUrl)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += rotationSpeed * delta
  })

  const bodyMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: texture,
    metalness: 0.05,
    roughness: 0.35,
  }), [texture])

  const glassMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#ffffff"),
    metalness: 0,
    roughness: 0.1,
    transparent: true,
    opacity: 0.25,
    clearcoat: 0.2,
  }), [])

  return (
    <group ref={groupRef}>
      {/* ═══ TUBE BODY — open-ended cylinder, texture wrapped ═══ */}
      <mesh position={[0, 0, 0]} material={bodyMaterial}>
        <cylinderGeometry args={[TUBE_RADIUS, TUBE_RADIUS, TUBE_HEIGHT, 64, 1, true]} />
      </mesh>

      {/* ═══ TRANSPARENT WINDOW (front, showing tazos inside) ═══ */}
      {showTazos && (
        <>
          <mesh position={[0, 0.05, TUBE_RADIUS * 0.88]} material={glassMaterial}>
            <planeGeometry args={[TUBE_RADIUS * 1.1, TUBE_HEIGHT * 0.55]} />
          </mesh>
          {tazoImageUrls.slice(0, 3).map((url, i) => (
            <Suspense key={i} fallback={null}>
              <TazoDiscInTube url={url} index={i} />
            </Suspense>
          ))}
        </>
      )}
    </group>
  )
}

// ── Tazo disc lying flat inside the tube (horizontal stack) ──
function TazoDiscInTube({ url, index }: { url: string; index: number }) {
  const texture = useLoader(THREE.TextureLoader, url)
  texture.colorSpace = THREE.SRGBColorSpace

  const yOffset = -0.28 + index * 0.11

  return (
    <mesh position={[0, yOffset, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[TUBE_RADIUS * 0.82, 32]} />
      <meshStandardMaterial map={texture} side={THREE.DoubleSide} transparent opacity={0.85} roughness={0.3} />
    </mesh>
  )
}

// ── Interactive version ──────────────────────────
interface TubeCylinder3DProps extends TubeCylinderProps {
  className?: string
  style?: React.CSSProperties
}

export default function TubeCylinder3D({ className = "", style, ...props }: TubeCylinder3DProps) {
  return (
    <div className={className} style={style}>
      <Canvas
        camera={{ position: [0, 0, 3.0], fov: 40 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} />
        <directionalLight position={[-2, 1, -2]} intensity={0.4} color="#aaccff" />
        <pointLight position={[0, TUBE_HEIGHT / 2, 1.5]} intensity={0.6} color="#ffffff" />
        <Suspense fallback={null}>
          <TubeModel {...props} />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          minPolarAngle={Math.PI * 0.42}
          maxPolarAngle={Math.PI * 0.58}
        />
      </Canvas>
    </div>
  )
}

// ── Static version (auto-rotate, no user interaction) ──
export function TubeCylinder3DStatic({ className = "", style, ...props }: TubeCylinder3DProps) {
  return (
    <div className={className} style={style}>
      <Canvas
        camera={{ position: [0, 0, 3.0], fov: 40 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} />
        <directionalLight position={[-2, 1, -2]} intensity={0.4} color="#aaccff" />
        <pointLight position={[0, TUBE_HEIGHT / 2, 1.5]} intensity={0.6} color="#ffffff" />
        <Suspense fallback={null}>
          <TubeModel {...props} rotationSpeed={0.25} />
        </Suspense>
      </Canvas>
    </div>
  )
}
