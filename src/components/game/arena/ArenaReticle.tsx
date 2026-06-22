// ============================================================
// Trading Tazos Game — Arena Reticle
// Target indicator with impact ghost ring and crosshair.
// ============================================================
"use client"

export function ArenaReticle({
  position, visible, gamePhase,
}: {
  position: [number, number, number]
  visible: boolean
  gamePhase: string
}) {
  if (!visible) return null
  const isCharging = gamePhase === "charge"

  return (
    <group position={position}>
      {/* Impact ghost — grows as player charges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.44, 0.50, 32]} />
        <meshBasicMaterial
          color={isCharging ? "#FFCC00" : "#FFFFFF"}
          transparent opacity={isCharging ? 0.6 : 0.2}
          side={2}
          depthWrite={false}
        />
      </mesh>
      {/* Inner ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.38, 0.42, 24]} />
        <meshBasicMaterial color="#FFCC00" transparent opacity={0.45} side={2} depthWrite={false} />
      </mesh>
      {/* Crosshair lines */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.03, 0.005, 0.75]} />
        <meshBasicMaterial color="#FFCC00" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[0.75, 0.005, 0.03]} />
        <meshBasicMaterial color="#FFCC00" transparent opacity={0.5} />
      </mesh>
      {/* Center dot */}
      <mesh position={[0, 0.03, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#FFCC00" />
      </mesh>
    </group>
  )
}
