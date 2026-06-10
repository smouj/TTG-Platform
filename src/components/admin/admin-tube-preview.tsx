"use client"

// ============================================================
// Admin 3D Tube Preview — Wraps a texture around a cylinder
// Rotates automatically for a nice preview in admin panels.
// ============================================================
import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

function TubeMesh({ textureUrl, height = 2, radius = 0.7 }: { textureUrl: string; height?: number; radius?: number }) {
  const groupRef = useRef<THREE.Group>(null)

  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load(textureUrl)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [textureUrl])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.6
    }
  })

  return (
    <group ref={groupRef}>
      {/* Main cylinder body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[radius, radius, height, 64, 1, true]} />
        <meshStandardMaterial map={texture} side={THREE.DoubleSide} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Top cap ring */}
      <mesh position={[0, height / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.04, 16, 64]} />
        <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Bottom cap ring */}
      <mesh position={[0, -height / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.04, 16, 64]} />
        <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  )
}

export default function AdminTubePreview({ textureUrl, height = 2.4, radius = 0.6 }: { textureUrl: string; height?: number; radius?: number }) {
  return (
    <div className="w-full h-full" style={{ minHeight: 200 }}>
      <Canvas camera={{ position: [0, 0.3, 2.5], fov: 40 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-3, -2, -2]} intensity={0.4} />
        <TubeMesh textureUrl={textureUrl} height={height} radius={radius} />
      </Canvas>
    </div>
  )
}
