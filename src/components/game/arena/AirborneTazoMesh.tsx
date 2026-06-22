// ============================================================
// Trading Tazos Game — Airborne Tazo Mesh
// Launcher tazo that falls, impacts, and shows charge glow.
// ============================================================
"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { playerOrOpponent } from "@/lib/battle/colors"
import type { AirborneTazo } from "@/lib/battle/game-loop"
import TazoDisc3D from "../3d/tazo-disc-3d"

export function AirborneTazoMesh({
  airborne, isPlayer, stakedPositions = [],
}: {
  airborne: AirborneTazo
  isPlayer: boolean
  stakedPositions?: [number, number, number][]
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const physRef = useRef({
    pos: new THREE.Vector3(...airborne.position),
    vel: new THREE.Vector3(0, 0, 0),
    falling: false,
    impactTime: 0,
    collisionTarget: new THREE.Vector3(),
  })

  useEffect(() => {
    const p = physRef.current
    p.pos.set(...airborne.position)
    if (airborne.state === "falling") {
      p.falling = true
      p.impactTime = 0
    }
    if (airborne.state === "aiming" || airborne.state === "charging") {
      p.falling = false
    }
  }, [airborne.position, airborne.state])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    const p = physRef.current
    const dt = Math.min(delta, 0.05)

    if (p.falling) {
      // Gravity fall — visible dramatic descent
      p.vel.y -= 22 * dt
      p.pos.add(p.vel.clone().multiplyScalar(dt))

      // Hit table — snap toward nearest staked tazo for collision feel
      if (p.pos.y < 0.06) {
        p.pos.y = 0.06
        if (stakedPositions.length > 0) {
          let nearest = stakedPositions[0]
          let minDist = Infinity
          for (const sp of stakedPositions) {
            const d = Math.hypot(p.pos.x - sp[0], p.pos.z - sp[2])
            if (d < minDist) { minDist = d; nearest = sp }
          }
          p.collisionTarget.set(nearest[0], 0.06, nearest[2])
        }
        p.falling = false
        p.vel.set(0, 0, 0)
        p.impactTime = 1.0
      }
    } else if (p.impactTime > 0) {
      p.impactTime = Math.max(0, p.impactTime - dt * 4)
      // Lerp toward collision target during impact flash
      if (p.impactTime > 0.5) {
        p.pos.lerp(p.collisionTarget, (1 - p.impactTime) * 0.3)
      }
    }

    groupRef.current.position.copy(p.pos)

    // Apply tilt from airborne data
    groupRef.current.rotation.set(
      airborne.tilt[0],
      airborne.tilt[1],
      airborne.tilt[2]
    )

    // Scale up during falling for dramatic effect
    if (p.falling) {
      const hFactor = 1 + (p.pos.y / 7) * 0.25
      groupRef.current.scale.setScalar(hFactor)
    } else if (p.impactTime > 0) {
      const s = 1 + p.impactTime * 0.45
      groupRef.current.scale.setScalar(s)
    } else {
      groupRef.current.scale.setScalar(1)
    }
  })

  if (airborne.state === "idle") {
    return (
      <group ref={groupRef} position={airborne.position}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.3, 0.33, 32]} />
          <meshBasicMaterial color={playerOrOpponent(isPlayer)} transparent opacity={0.15} side={2} depthWrite={false} />
        </mesh>
        <TazoDisc3D
          name={airborne.tazoName}
          franchise={airborne.franchise}
          imageUrl={airborne.imageUrl}
          backImageUrl={airborne.backImageUrl}
          finish={airborne.finish}
          size={0.38}
          autoRotate={true}
        />
      </group>
    )
  }

  return (
    <group ref={groupRef} position={airborne.position}>
      {/* Motion trail during falling — vertical streak */}
      {airborne.state === "falling" && (
        <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, physRef.current.pos.y * 1.5]} />
          <meshBasicMaterial
            color={playerOrOpponent(isPlayer)}
            transparent
            opacity={0.15}
            side={2}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* Charge glow ring — horizontal on table */}
      {airborne.state === "charging" && (
        <mesh position={[0, 0.03, 0]}>
          <ringGeometry args={[0.44, 0.46, 32]} />
          <meshBasicMaterial
            color="#FFCC00"
            transparent
            opacity={0.25 + airborne.charge * 0.5}
            side={2}
            depthWrite={false}
          />
        </mesh>
      )}
      {/* Drop shadow on table — stays at table level, tracks launcher in XZ */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[airborne.position[0], 0.03, airborne.position[2]]}
        scale={[0.35, 1, 0.35]}
      >
        <planeGeometry args={[0.4, 0.4]} />
        <meshBasicMaterial color="#000" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <TazoDisc3D
        name={airborne.tazoName}
        franchise={airborne.franchise}
        imageUrl={airborne.imageUrl}
        backImageUrl={airborne.backImageUrl}
        finish={airborne.finish}
        size={0.38}
        autoRotate={false}
      />
      {/* Impact ring flash — horizontal on table */}
      {physRef.current.impactTime > 0 && (
        <mesh position={[0, 0.03, 0]}>
          <ringGeometry args={[0.15 * (2 - physRef.current.impactTime), 0.55 * (2 - physRef.current.impactTime), 32]} />
          <meshBasicMaterial
            color="#FFCC00"
            transparent
            opacity={physRef.current.impactTime * 0.6}
            side={2}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
