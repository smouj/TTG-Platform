"use client"

// ============================================================
// Admin 3D Bag Preview — Shows front/back bag textures on
// a card that slowly rotates for a nice preview.
// ============================================================
import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

function BagMesh({ frontUrl, backUrl }: { frontUrl: string; backUrl: string }) {
  const groupRef = useRef<THREE.Group>(null)

  const frontTex = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load(frontUrl)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [frontUrl])

  const backTex = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load(backUrl)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [backUrl])

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  const w = 1.2  // width
  const h = 1.6  // height (aspect ~ 3:4)

  return (
    <group ref={groupRef}>
      {/* Front face */}
      <mesh position={[0, 0, 0.015]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          map={frontTex}
          side={THREE.FrontSide}
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>
      {/* Back face (flipped) */}
      <mesh position={[0, 0, -0.015]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial
          map={backTex}
          side={THREE.FrontSide}
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>
      {/* Edge (thin box to give thickness) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[w, h, 0.03]} />
        <meshStandardMaterial color="#cccccc" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  )
}

export default function AdminBagPreview({ frontUrl, backUrl }: { frontUrl: string; backUrl: string }) {
  return (
    <div className="w-full h-full" style={{ minHeight: 220 }}>
      <Canvas camera={{ position: [0, 0.05, 2.2], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 4, 4]} intensity={1.0} />
        <directionalLight position={[-3, -2, -4]} intensity={0.3} />
        <BagMesh frontUrl={frontUrl} backUrl={backUrl} />
      </Canvas>
    </div>
  )
}
