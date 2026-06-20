// ============================================================
// Trading Tazos Game — BagShowcase3D
// Shop preview: rotatable 3D bag with front/back textures.
// Magazine-styled container with "drag to rotate" hint.
// ============================================================
"use client"

import { useRef, useState, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { BATTLE_COLORS } from "@/lib/battle/colors"
import PotatoChipBag3D from "./potato-chip-bag-3d"

// ── Auto-drag rotation ──
function DragRotator({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null!)
  const dragging = useRef(false)
  const prevX = useRef(0)
  const rotY = useRef(0)
  const autoY = useRef(0)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (!dragging.current) {
      autoY.current += delta * 0.35
      rotY.current += (autoY.current - rotY.current) * 0.05
    }
    groupRef.current.rotation.y = rotY.current
  })

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    prevX.current = e.clientX
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - prevX.current
    rotY.current += dx * 0.008
    autoY.current = rotY.current
    prevX.current = e.clientX
  }, [])

  const handlePointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  return (
    <group
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {children}
    </group>
  )
}

// ── Lighting ──
function Lights() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <spotLight position={[3, 2, 4]} intensity={2.5} angle={0.4} penumbra={0.5} color="#fffef5" />
      <spotLight position={[-2, 1.5, -3]} intensity={1.2} angle={0.35} penumbra={0.6} color="#fffef5" />
      <pointLight position={[0, -1.5, 3]} intensity={0.5} color={BATTLE_COLORS.yellow} />
    </>
  )
}

// ── Floor reflection ──
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.75, 0]}>
      <planeGeometry args={[2.5, 2.5]} />
      <meshStandardMaterial color="#1a1815" roughness={0.9} metalness={0.05} />
    </mesh>
  )
}

// ── Props ──
interface Props {
  frontUrl: string
  backUrl: string
}

// ── Main ──
export default function BagShowcase3D({ frontUrl, backUrl }: Props) {
  return (
    <div className="relative w-full h-[320px] sm:h-[380px] select-none touch-none"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #2a2520 0%, #0f0d0a 100%)",
        border: "3px solid var(--ttg-black)",
        boxShadow: "inset 0 0 60px rgba(0,0,0,0.4), 4px 4px 0px var(--ttg-black)",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 0.05, 1.75], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <color attach="background" args={[0x000000]} />
        <Lights />
        <Floor />
        <DragRotator>
          <PotatoChipBag3D
            frontUrl={frontUrl}
            backUrl={backUrl}
            scale={1.25}
          />
        </DragRotator>
      </Canvas>

      {/* UI hint */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
        <span className="text-[9px] font-black text-white/25 uppercase tracking-[0.2em]">
          Drag to rotate · See front & back
        </span>
      </div>
    </div>
  )
}
