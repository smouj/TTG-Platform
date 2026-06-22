// ============================================================
// Trading Tazos Game — Arena Pillars
// Decorative ring of 8 pillars with glowing orbs.
// ============================================================
"use client"

import { useMemo } from "react"
import type { Arena3DConfig } from "@/lib/battle/game-loop"

export function ArenaPillars({ config }: { config: Arena3DConfig }) {
  const pts = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2
      return { x: Math.cos(a) * config.radius * 1.2, z: Math.sin(a) * config.radius * 1.2 }
    })
  }, [config.radius, config.theme])

  return (
    <>
      {pts.map((p, i) => (
        <group key={i} position={[p.x, 0.7, p.z]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.12, 0.16, 1.4, 8]} />
            <meshStandardMaterial color="#d0c8b8" roughness={0.6} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.10, 12, 12]} />
            <meshStandardMaterial color="#FF8800" emissive="#FF8800" emissiveIntensity={0.4} roughness={0.15} />
          </mesh>
        </group>
      ))}
    </>
  )
}
