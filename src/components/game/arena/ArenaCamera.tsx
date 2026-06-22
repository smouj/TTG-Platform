// ============================================================
// Trading Tazos Game — Arena Camera
// Adaptive camera with phase-based lerp and screen shake on impact.
// Free orbit enabled; auto-lerps only after phase transitions.
// ============================================================
"use client"

import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"

export function ArenaCamera({ gamePhase }: { gamePhase: string }) {
  const { camera } = useThree()
  const targetRef = useRef(new THREE.Vector3(0, 0, 0))
  const shakeRef = useRef({ intensity: 0, time: 0 })
  const userInteractedRef = useRef(false)
  const prevPhaseRef = useRef(gamePhase)
  const introTimeRef = useRef(0)

  // Phase change → allow auto-pan to new position
  useEffect(() => {
    if (gamePhase !== prevPhaseRef.current) {
      userInteractedRef.current = false
      prevPhaseRef.current = gamePhase
    }
  }, [gamePhase])

  useFrame((_, delta) => {
    // Auto-lerp only when user hasn't manually moved the camera
    if (!userInteractedRef.current) {
      if (gamePhase === "match_intro") {
        introTimeRef.current += delta
        const angle = introTimeRef.current * 0.8
        const radius = 8
        const height = 5 + Math.sin(angle * 0.7) * 2
        const target = new THREE.Vector3(0, 1, 0)
        const pos = new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius)
        targetRef.current.lerp(target, 0.03)
        camera.position.lerp(pos, 0.03)
        camera.lookAt(targetRef.current)
      } else if (gamePhase === "aim" || gamePhase === "stake_player" || gamePhase === "stake_reveal") {
        const target = new THREE.Vector3(0, 0, 0)
        const pos = new THREE.Vector3(0, 14, 1)
        targetRef.current.lerp(target, 0.06)
        camera.position.lerp(pos, 0.05)
        camera.lookAt(targetRef.current)
      } else if (gamePhase === "charge") {
        const target = new THREE.Vector3(0, 2, 0)
        const pos = new THREE.Vector3(7, 8, 7)
        targetRef.current.lerp(target, 0.06)
        camera.position.lerp(pos, 0.05)
        camera.lookAt(targetRef.current)
      } else if (gamePhase === "throw" || gamePhase === "physics_resolve") {
        const target = new THREE.Vector3(0, 0.2, 0)
        const pos = new THREE.Vector3(4, 3, 5)
        targetRef.current.lerp(target, 0.08)
        camera.position.lerp(pos, 0.06)
        camera.lookAt(targetRef.current)
      } else {
        const target = new THREE.Vector3(0, 0.5, 0)
        const pos = new THREE.Vector3(4, 8, 5)
        targetRef.current.lerp(target, 0.03)
        camera.position.lerp(pos, 0.03)
        camera.lookAt(targetRef.current)
      }
    }

    // Screen shake — applied AFTER lerp for dramatic impact during slam
    if (gamePhase === "physics_resolve" || gamePhase === "throw") {
      const sh = shakeRef.current
      if (sh.intensity < 0.1) {
        sh.intensity = 1.2
        sh.time = 0
      }
      sh.time += 0.16
      sh.intensity *= 0.86
      const sx = Math.sin(sh.time * 35) * sh.intensity * 0.28
      const sy = Math.cos(sh.time * 41) * sh.intensity * 0.14
      const sz = Math.sin(sh.time * 33) * sh.intensity * 0.20
      camera.position.x += sx
      camera.position.y += sy
      camera.position.z += sz
    } else {
      shakeRef.current.intensity = 0
    }
  })

  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.08}
      minDistance={3}
      maxDistance={20}
      maxPolarAngle={Math.PI / 2.2}
      minPolarAngle={0.2}
      target={[0, 0.3, 0]}
      enablePan={true}
      panSpeed={0.6}
      rotateSpeed={0.4}
      enabled={true}
      onStart={() => { userInteractedRef.current = true }}
      mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE }}
    />
  )
}
