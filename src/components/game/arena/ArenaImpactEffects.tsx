// ============================================================
// Trading Tazos Game — Arena Impact Effects
// Impact spark ring and flash light for slam animations.
// ============================================================
"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

// ─── Impact spark ring (expands on slam) ───
export function ImpactSpark({ trigger, pos }: { trigger: number; pos: [number, number, number] }) {
  const ringRef = useRef<THREE.Mesh>(null!)
  const timeRef = useRef(0)

  useEffect(() => {
    if (trigger > 0) {
      timeRef.current = 1.0
      if (ringRef.current) {
        ringRef.current.visible = true
        ringRef.current.scale.setScalar(0.2)
      }
    }
  }, [trigger])

  useFrame((_, delta) => {
    if (!ringRef.current || timeRef.current <= 0) return
    timeRef.current -= delta * 3
    const s = 0.2 + (1 - timeRef.current) * 2.5
    ringRef.current.scale.setScalar(Math.min(s, 3.0))
    const mat = ringRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = Math.max(0, timeRef.current * 0.7)
    if (timeRef.current <= 0) ringRef.current.visible = false
  })

  return (
    <mesh ref={ringRef} position={[pos[0], 0.04, pos[2]]} rotation={[-Math.PI/2, 0, 0]} visible={false}>
      <ringGeometry args={[0.15, 0.2, 32]} />
      <meshBasicMaterial color="#FFCC00" transparent opacity={0.8} side={2} depthWrite={false} />
    </mesh>
  )
}

// ─── Impact flash light (momentary bright light on slam impact) ───
export function ImpactLight({ impactPhase }: { impactPhase: string }) {
  const lightRef = useRef<THREE.PointLight>(null!)
  useFrame((_, delta) => {
    if (!lightRef.current) return
    if (impactPhase === "impact" || impactPhase === "slamming") {
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 8, 0.3)
    } else {
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0, 0.15)
    }
  })
  return (
    <pointLight ref={lightRef} position={[0, 0.8, 0]} intensity={0} color="#FFF8E0" distance={8} decay={2} />
  )
}
