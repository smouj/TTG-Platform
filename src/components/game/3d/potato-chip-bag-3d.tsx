// ============================================================
// Trading Tazos Game — PotatoChipBag3D v6
//
// Cinematic 3D foil bag. No metal props, no clutter.
// Dynamic opening: pop → seal rip → peel → glow → reveal.
// ============================================================
"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import * as THREE from "three"

// ── Bag dimensions ──
export const BAG_W_TOP = 0.72
export const BAG_W_BOT = 0.64
export const BAG_H = 1.02
export const BAG_D = 0.22
export const TOP_CRIMP = 0.14
export const BOT_CRIMP = 0.10
export const BODY_H = BAG_H - TOP_CRIMP - BOT_CRIMP
const BULGE = 0.09

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function easeOutBack(t: number) { const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) }
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }

// ── Crimp texture ──
function makeCrimpTexture(): THREE.Texture {
  const c = document.createElement("canvas")
  c.width = 512; c.height = 80
  const ctx = c.getContext("2d")!
  const g = ctx.createLinearGradient(0, 0, 0, 80)
  g.addColorStop(0.0, "#d0d0d0"); g.addColorStop(0.25, "#e8e8e8")
  g.addColorStop(0.5, "#f5f5f5"); g.addColorStop(0.75, "#e0e0e0"); g.addColorStop(1.0, "#c8c8c8")
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 80)
  ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 1.5
  for (let row = 0; row < 14; row++) {
    ctx.beginPath()
    const baseY = 5 + row * 5.2
    for (let x = 0; x <= 512; x += 7) {
      const y = baseY + Math.sin(x * 0.14 + row * 0.75) * 2.0
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.magFilter = THREE.LinearFilter
  return tex
}

let _crimpTex: THREE.Texture | null = null
function getCrimpTex(): THREE.Texture {
  if (!_crimpTex) _crimpTex = makeCrimpTexture()
  return _crimpTex
}

// ── Trapezoidal pillow face ──
function makePillowFaceGeo(wTop: number, wBot: number, h: number, bulge: number, segs: number): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(wTop, h, segs, Math.round(segs * 1.8))
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i)
    const yNorm = y / (h / 2)
    const wAtY = lerp(wBot / 2, wTop / 2, (yNorm + 1) / 2)
    pos.setX(i, x * (wAtY / (wTop / 2)))
    const xN = Math.abs(pos.getX(i)) / wAtY, yN = Math.abs(y) / (h / 2)
    pos.setZ(i, bulge * (1 - Math.pow(xN, 3)) * (1 - Math.pow(yN, 6)) * (1 + 0.4 * Math.sin(xN * Math.PI * 0.85)))
  }
  geo.computeVertexNormals()
  return geo
}

interface Props {
  frontUrl: string; backUrl: string; scale?: number
  interactive?: boolean
  onPointerDown?: (e: THREE.Event) => void
  onPointerMove?: (e: THREE.Event) => void
  onPointerUp?: (e: THREE.Event) => void
  opening?: boolean
}

export default function PotatoChipBag3D({
  frontUrl, backUrl, scale = 1, interactive = false,
  onPointerDown, onPointerMove, onPointerUp, opening = false,
}: Props) {
  const groupRef = useRef<THREE.Group>(null!)
  const topSealRef = useRef<THREE.Group>(null!)
  const frontBodyRef = useRef<THREE.Group>(null!)
  const backBodyRef = useRef<THREE.Group>(null!)
  const interiorRef = useRef<THREE.Mesh>(null!)
  const interiorGlowRef = useRef<THREE.PointLight>(null!)
  const openRef = useRef(0)
  const popRef = useRef(0)
  const wasOpening = useRef(false)

  const frontTex = useLoader(THREE.TextureLoader, frontUrl)
  const backTex = useLoader(THREE.TextureLoader, backUrl)
  const crimpTex = useMemo(() => getCrimpTex(), [])
  const pillowGeo = useMemo(() => makePillowFaceGeo(BAG_W_TOP, BAG_W_BOT, BODY_H, BULGE, 24), [])

  useEffect(() => {
    for (const tex of [frontTex, backTex]) {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.generateMipmaps = true
    }
  }, [frontTex, backTex])

  const bodyY = (TOP_CRIMP - BOT_CRIMP) / 2
  const topY = BAG_H / 2 - TOP_CRIMP / 2
  const botY = -BAG_H / 2 + BOT_CRIMP / 2
  const halfD = BAG_D / 2
  const baseScale = scale

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return

    // Trigger pop on opening start
    if (opening && !wasOpening.current) popRef.current = 1.0
    wasOpening.current = opening

    // Pop decay — dramatic envelope
    popRef.current = Math.max(0, popRef.current - delta * 5)
    // Lerp open progress — slower for more dramatic feel
    openRef.current = THREE.MathUtils.lerp(openRef.current, opening ? 1 : 0, 3.0 * delta)
    const p = Math.max(0, Math.min(1, openRef.current))

    // Pop scale — bag swells then settles
    const popEnvelope = Math.sin(popRef.current * Math.PI) * (1 - popRef.current * 0.3)
    g.scale.setScalar(baseScale * (1 + popRef.current * 0.08 * popEnvelope))

    // ── TOP SEAL: rip off dramatically ──
    if (topSealRef.current) {
      const t = easeOutBack(Math.min(1, p / 0.25)) // Back easing for snap
      topSealRef.current.position.y = topY + t * 0.7
      topSealRef.current.position.z = t * 0.35
      topSealRef.current.rotation.x = t * -1.6
      topSealRef.current.rotation.z = t * 0.22
      topSealRef.current.rotation.y = t * Math.sin(Date.now() * 0.005) * 0.35
      // Float away after peeling
      if (p > 0.65) {
        topSealRef.current.position.y += (p - 0.65) * delta * 20
        topSealRef.current.rotation.z += delta * 2
      }
    }

    // ── FRONT BODY: peel forward ──
    if (frontBodyRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.06) / 0.65)))
      frontBodyRef.current.position.z = halfD + 0.001 + t * 0.11
      frontBodyRef.current.rotation.x = t * 0.7
      frontBodyRef.current.rotation.z = t * 0.05
    }

    // ── BACK BODY: peel backward ──
    if (backBodyRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.06) / 0.65)))
      backBodyRef.current.position.z = -halfD - 0.001 - t * 0.11
      backBodyRef.current.rotation.x = t * -0.6
      backBodyRef.current.rotation.z = t * -0.04
    }

    // ── INTERIOR: grow dark cavity ──
    if (interiorRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.12) / 0.55)))
      interiorRef.current.scale.setScalar(0.3 + t * 0.8)
      if (!Array.isArray(interiorRef.current.material)) {
        interiorRef.current.material.opacity = t * 0.95
      }
    }

    // ── GLOW: warm golden light from inside ──
    if (interiorGlowRef.current) {
      const t = easeOutCubic(Math.min(1, Math.max(0, (p - 0.2) / 0.5)))
      interiorGlowRef.current.intensity = t * 1.2
      // Pulse the glow
      interiorGlowRef.current.intensity *= 1 + Math.sin(Date.now() * 0.008) * 0.3 * t
    }
  })

  return (
    <group ref={groupRef} scale={scale}>
      {/* BOTTOM CRIMP */}
      <mesh position={[0, botY, 0]}>
        <boxGeometry args={[BAG_W_BOT + 0.015, BOT_CRIMP, BAG_D + 0.015]} />
        <meshStandardMaterial map={crimpTex} roughness={0.5} metalness={0.1} />
      </mesh>

      {/* FRONT BODY */}
      <group ref={frontBodyRef} position={[0, bodyY, halfD + 0.001]}>
        <mesh geometry={pillowGeo}
          onPointerDown={interactive ? onPointerDown : undefined}
          onPointerMove={interactive ? onPointerMove : undefined}
          onPointerUp={interactive ? onPointerUp : undefined}>
          <meshStandardMaterial map={frontTex} roughness={0.22} metalness={0.0} side={THREE.FrontSide} transparent alphaTest={0.01} />
        </mesh>
      </group>

      {/* BACK BODY */}
      <group ref={backBodyRef} position={[0, bodyY, -halfD - 0.001]}>
        <mesh geometry={pillowGeo} rotation={[0, Math.PI, 0]}>
          <meshStandardMaterial map={backTex} roughness={0.22} metalness={0.0} side={THREE.FrontSide} transparent alphaTest={0.01} />
        </mesh>
      </group>

      {/* INTERIOR CAVITY */}
      <mesh ref={interiorRef} position={[0, bodyY, 0]}>
        <boxGeometry args={[BAG_W_BOT * 0.7, BODY_H * 0.5, BAG_D * 0.35]} />
        <meshStandardMaterial color="#050302" roughness={0.95} metalness={0} transparent opacity={0} depthWrite />
      </mesh>

      {/* INTERIOR GLOW */}
      <pointLight ref={interiorGlowRef} position={[0, bodyY, 0]} intensity={0} color="#ffbb33" distance={1.3} decay={2} />

      {/* TOP SEAL */}
      <group ref={topSealRef} position={[0, topY, 0]}>
        <mesh>
          <boxGeometry args={[BAG_W_TOP + 0.015, TOP_CRIMP, BAG_D + 0.025]} />
          <meshStandardMaterial map={crimpTex} roughness={0.5} metalness={0.1} />
        </mesh>
      </group>
    </group>
  )
}
