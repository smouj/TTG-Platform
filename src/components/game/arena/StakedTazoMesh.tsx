// ============================================================
// Trading Tazos Game — Staked Tazo Mesh
// Face-down tazo on arena with wobble, half-flip, and capture animations.
// ============================================================
"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { BATTLE_COLORS, playerOrOpponent } from "@/lib/battle/colors"
import type { StakedTazo } from "@/lib/battle/game-loop"
import TazoDisc3D from "../3d/tazo-disc-3d"

export function StakedTazoMesh({ staked }: { staked: StakedTazo }) {
  const groupRef = useRef<THREE.Group>(null!)
  const wobbleRef = useRef({ intensity: 0, time: 0 })

  // Sync wobble intensity from props
  useEffect(() => {
    wobbleRef.current.intensity = staked.wobbleIntensity
    wobbleRef.current.time = 0
  }, [staked.wobbleIntensity])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const w = wobbleRef.current

    // Wobble animation
    if (w.intensity > 0.01 && staked.state === "wobbling") {
      w.time += delta * 25
      w.intensity *= 0.92  // Decay
      const wobX = Math.sin(w.time * 2.3) * w.intensity * 0.06
      const wobZ = Math.cos(w.time * 1.7) * w.intensity * 0.06
      groupRef.current.rotation.set(Math.PI + wobX, 0, wobZ)
      groupRef.current.position.y = 0.06 + Math.abs(Math.sin(w.time * 3)) * w.intensity * 0.03
    } else if (staked.state === "wobbling") {
      // Settling back to face-down
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x, Math.PI, 0.08
      )
      groupRef.current.position.y = 0.06
    }

    // Half-flip: partially lifted
    if (staked.state === "half_flip") {
      const targetXR = Math.PI / 2
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x, targetXR, 0.08
      )
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y, 0.12, 0.1
      )
    }

    // Face-up / secured / captured — flip to show front face
    if (staked.state === "face_up" || staked.state === "secured" || staked.state === "captured") {
      const targetXR = 0  // Face-up (front art visible from above)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x, targetXR, 0.12
      )
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y, 0.06, 0.15
      )
    }

    // Ring-out: slide away and fade
    if (staked.state === "out_of_circle") {
      groupRef.current.position.x += (staked.position[0] * 1.5 - groupRef.current.position.x) * 0.05
      groupRef.current.position.z += (staked.position[2] * 1.5 - groupRef.current.position.z) * 0.05
      groupRef.current.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.03)
    }
  })

  if (staked.state === "out_of_circle") {
    const isGone = Math.abs(groupRef.current?.position.x || 0) > 6
    if (isGone) return null
  }

  // Color tint for secured/captured
  const getGlow = () => {
    if (staked.state === "secured") return BATTLE_COLORS.success  // Green
    if (staked.state === "captured") return BATTLE_COLORS.opponent  // Red
    return undefined
  }

  return (
    <group
      ref={groupRef}
      position={[staked.position[0], 0.06, staked.position[2]]}
      rotation={[Math.PI, 0, 0]}  // Face-down default
    >
      <TazoDisc3D
        name={staked.tazoName}
        franchise={staked.franchise}
        imageUrl={staked.imageUrl}
        backImageUrl={staked.backImageUrl}
        size={0.50}
        autoRotate={false}
      />
      {/* Glow ring for secured/captured — at top of tazo disc */}
      {getGlow() && (
        <mesh position={[0, 0.02, 0]}>
          <ringGeometry args={[0.40, 0.44, 32]} />
          <meshBasicMaterial color={getGlow()} transparent opacity={0.5} side={2} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}
