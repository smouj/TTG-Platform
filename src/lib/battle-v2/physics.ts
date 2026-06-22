// ============================================================
// Arena Slam v2 — Arcade Jump Physics (v3)
//
// "Saltar tazos encima de otros para darles la vuelta"
// Drag-release → parabolic arc → land on opponent → flip!
// ============================================================

// ─── Constants ───
export const ARENA_RADIUS = 4.5          // larger arena for better gameplay
export const DISC_RADIUS = 0.45
export const MAX_LAUNCH_SPEED = 16.0
export const GRAVITY = 28.0              // snappier arc
export const JUMP_POWER = 11.0           // good height for visibility
export const MIN_LAUNCH_SPEED = 2.0
export const FLIP_MIN_ATTACK_DIFF = 3.0

// ─── Types ───

export type TazoArchetype = "heavy" | "technical" | "spinner" | "bouncer" | "defender" | "balanced"

export interface TazoStats {
  attack: number
  defense: number
  speed: number
  weight: number
}

export const ARCHETYPE_STATS: Record<TazoArchetype, TazoStats> = {
  heavy:     { attack: 75, defense: 80, speed: 25, weight: 95 },
  technical: { attack: 65, defense: 40, speed: 75, weight: 35 },
  spinner:   { attack: 45, defense: 30, speed: 90, weight: 20 },
  bouncer:   { attack: 55, defense: 50, speed: 70, weight: 28 },
  defender:  { attack: 35, defense: 95, speed: 40, weight: 85 },
  balanced:  { attack: 50, defense: 50, speed: 55, weight: 50 },
}

export interface DiscState {
  id: string
  name: string
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  rotation: number
  rotationSpeed: number
  moving: boolean
  flying: boolean
  flipped: boolean
  ringOut: boolean
  landedOnId: string | null
  owner: "player" | "opponent"
  stats: TazoStats
  archetype: TazoArchetype
  franchise?: string
  imageUrl?: string
  backImageUrl?: string
  finish?: string
}

export interface DragState {
  startX: number
  startZ: number
  currentX: number
  currentZ: number
  active: boolean
}

export type ImpactType = "land" | "flip_hit" | "flip_miss" | "ringout" | "capture" | "deflect" | "stack_hit" | "stack_bounce"

export interface ImpactEvent {
  type: ImpactType
  x: number
  z: number
  intensity: number
}

export interface TrajectoryPoint {
  x: number
  y: number
  z: number
}

export interface SimResult {
  discs: DiscState[]
  impacts: ImpactEvent[]
  landedDiscId: string | null
}

// ─── Helpers ───

export function createDemoDisc(
  id: string,
  name: string,
  archetype: TazoArchetype,
  x: number,
  z: number,
  owner: "player" | "opponent",
  franchise: string = "minimon",
): DiscState {
  const stats = ARCHETYPE_STATS[archetype]
  return {
    id, name, x, y: 0, z, vx: 0, vy: 0, vz: 0,
    rotation: 0, rotationSpeed: 0,
    moving: false, flying: false, flipped: false, ringOut: false,
    landedOnId: null,
    owner, stats, archetype, franchise,
  }
}

/** Spread discs in a formation */
export function spreadDiscs(discs: DiscState[], arenaSide: 1 | -1): DiscState[] {
  return discs.map((d, i) => {
    const offsetX = (i - (discs.length - 1) / 2) * 0.9
    return { ...d, x: offsetX, z: arenaSide * 2.8 }
  })
}

// ─── Launch ───

export function calculateLaunchVelocity(
  drag: DragState,
  stats: TazoStats
): { vx: number; vy: number; vz: number } {
  const dx = drag.startX - drag.currentX
  const dz = drag.startZ - drag.currentZ
  const dist = Math.sqrt(dx * dx + dz * dz)
  if (dist < 0.12) return { vx: 0, vy: 0, vz: 0 }

  const angle = Math.atan2(dz, dx)
  const launchAngle = angle  // slingshot: disc goes opposite to finger

  const baseSpeed = dist * 5.0
  const speedMult = 0.55 + stats.speed / 180
  const hSpeed = Math.min(baseSpeed * speedMult, MAX_LAUNCH_SPEED)

  const weightMult = 1.15 - stats.weight / 180
  const vSpeed = dist * JUMP_POWER * weightMult

  return {
    vx: Math.cos(launchAngle) * hSpeed,
    vy: vSpeed,
    vz: Math.sin(launchAngle) * hSpeed,
  }
}

// ─── Trajectory preview ───

export function calculateTrajectoryPreview(
  startX: number,
  startZ: number,
  drag: DragState,
  stats: TazoStats,
  steps: number = 70
): TrajectoryPoint[] {
  const { vx, vy, vz } = calculateLaunchVelocity(drag, stats)
  if (Math.abs(vx) < 0.01 && Math.abs(vz) < 0.01 && vy < 1) return []

  const dt = 1 / 60
  const points: TrajectoryPoint[] = [{ x: startX, y: 0, z: startZ }]
  let x = startX, y = 0, z = startZ
  let cvx = vx, cvy = vy, cvz = vz
  const boundary = ARENA_RADIUS - 0.15

  for (let i = 0; i < steps; i++) {
    cvy -= GRAVITY * dt
    x += cvx * dt
    y += cvy * dt
    z += cvz * dt

    // Arena boundary check during flight
    const dist = Math.sqrt(x * x + z * z)
    if (dist > boundary) {
      const nx = x / dist, nz = z / dist
      x = nx * boundary
      z = nz * boundary
      points.push({ x, y, z })
      break
    }

    // Landing
    if (y <= 0) {
      if (i > 0 && points.length > 0) {
        const prev = points[points.length - 1]
        const ratio = prev.y / Math.max(prev.y - y, 0.001)
        points.push({
          x: prev.x + (x - prev.x) * ratio,
          y: 0,
          z: prev.z + (z - prev.z) * ratio,
        })
      } else {
        points.push({ x, y: 0, z })
      }
      break
    }

    points.push({ x, y, z })
  }

  return points
}

// ─── Landing detection (uses updated positions) ───

function checkLanding(
  discX: number, discZ: number, discY: number,
  allDiscs: DiscState[],
  selfId: string
): { landed: boolean; targetId: string | null; impactType: ImpactType; targetIsEnemy: boolean } {
  if (discY > DISC_RADIUS * 1.5) return { landed: false, targetId: null, impactType: "land", targetIsEnemy: false }

  const dist = Math.sqrt(discX * discX + discZ * discZ)
  if (dist > ARENA_RADIUS - 0.05) {
    return { landed: true, targetId: null, impactType: "ringout", targetIsEnemy: false }
  }

  // Find closest disc we're landing on (enemy OR friendly)
  const selfDisc = allDiscs.find(d => d.id === selfId)
  const selfOwner = selfDisc?.owner
  const candidates = allDiscs
    .filter(d => d.id !== selfId && !d.flying && !d.flipped && !d.ringOut)
    .map(d => ({ 
      id: d.id, 
      dist: Math.hypot(discX - d.x, discZ - d.z),
      isEnemy: d.owner !== selfOwner 
    }))
    .filter(d => d.dist < DISC_RADIUS * 2.05)
    .sort((a, b) => a.dist - b.dist)

  if (candidates.length > 0) {
    return { 
      landed: true, 
      targetId: candidates[0].id, 
      impactType: candidates[0].isEnemy ? "flip_hit" : "stack_hit",
      targetIsEnemy: candidates[0].isEnemy
    }
  }

  return { landed: true, targetId: null, impactType: "land", targetIsEnemy: false }
}

// ─── Flip resolution ───

// Momentum-based flip: collision impulse from weight × landing speed
function resolveFlip(
  attacker: DiscState,
  defender: DiscState
): { flipped: boolean; impactType: ImpactType } {
  // Landing impulse: heavier + faster = more flip force
  const attackerMass = attacker.stats.weight / 50          // 0.4–2.0 range
  const landingSpeed = Math.max(0.5, Math.hypot(attacker.vx, attacker.vz))
  const rawImpulse = attackerMass * landingSpeed * 0.65

  // Defender resistance: weight (hard to move) + defense (stable stance)
  const defenderMass = defender.stats.weight / 60          // 0.33–1.67
  const stability = defender.stats.defense / 100            // 0.0–1.0
  const resistance = defenderMass * 1.8 + stability * 3.0

  // Attack penetration: higher attack = easier to break through defense
  const attackPen = (attacker.stats.attack - 30) / 120     // -0.16–0.58
  const effectiveImpulse = rawImpulse * (0.55 + Math.max(0, attackPen) * 0.45)

  // Very small randomness (only ±5%) for realistic feel
  const variance = 0.95 + Math.random() * 0.1

  // Flip threshold: impulse must significantly exceed resistance
  const FLIP_THRESHOLD = 1.15
  const flipScore = (effectiveImpulse * variance) / (resistance + 0.01)

  if (flipScore > FLIP_THRESHOLD) {
    return { flipped: true, impactType: "capture" }
  }
  return { flipped: false, impactType: "deflect" }
}

// ─── Clamp position inside arena ───

function clampToArena(x: number, z: number, margin: number = 0.15): [number, number] {
  const dist = Math.hypot(x, z)
  const max = ARENA_RADIUS - margin
  if (dist > max) {
    const n = 1 / dist
    return [x * n * max, z * n * max]
  }
  return [x, z]
}

// ─── Main simulation step ───

// ─── Disc overlap resolution ───
// Pushes apart discs that are too close on the ground (prevents fusion)

function resolveDiscOverlaps(discs: DiscState[]): DiscState[] {
  const result = discs.map(d => ({ ...d }))
  const RESTING = DISC_RADIUS * 2.0  // minimum distance between disc centers
  const ITERATIONS = 2  // run multiple passes for stable separation

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]
        const b = result[j]
        // Skip discs that are flying, flipped, or ring-out
        if (a.flying || a.flipped || a.ringOut) continue
        if (b.flying || b.flipped || b.ringOut) continue

        const dx = b.x - a.x
        const dz = b.z - a.z
        const dist = Math.hypot(dx, dz)
        if (dist < RESTING && dist > 0.001) {
          const overlap = RESTING - dist
          const nx = dx / dist
          const nz = dz / dist
          // Push each disc away by half the overlap
          const pushX = nx * overlap * 0.5
          const pushZ = nz * overlap * 0.5
          
          // Move disc A
          a.x -= pushX
          a.z -= pushZ
          // Move disc B
          b.x += pushX
          b.z += pushZ

          // Clamp both to arena bounds
          ;[a.x, a.z] = clampToArena(a.x, a.z, DISC_RADIUS + 0.03)
          ;[b.x, b.z] = clampToArena(b.x, b.z, DISC_RADIUS + 0.03)
        }
      }
    }
  }
  return result
}

export function simulateStep(discs: DiscState[], delta: number): SimResult {
  const dt = Math.min(delta, 0.033) // cap at ~30fps min stability
  const impacts: ImpactEvent[] = []
  let landedDiscId: string | null = null
  const boundary = ARENA_RADIUS - 0.15

  // Pass 1: update positions
  const stepped = discs.map(disc => {
    if (!disc.moving && !disc.flying) return { ...disc }
    if (disc.flipped || disc.ringOut) {
      return { ...disc, moving: false, flying: false, vx: 0, vy: 0, vz: 0 }
    }

    let { x, y, z, vx, vy, vz, moving, flying } = disc

    if (flying) {
      // Parabolic arc with gravity
      vy -= GRAVITY * dt
      x += vx * dt
      z += vz * dt
      y += vy * dt

      // Boundary clamp mid-flight
      const d = Math.hypot(x, z)
      if (d > boundary) {
        const n = 1 / d
        x = n * boundary
        z = n * boundary
        // Dampen horizontal velocity on wall hit
        vx *= 0.3; vz *= 0.3
      }

      // Landing
      if (y <= 0) {
        y = 0
        flying = false
        moving = false
        ;[x, z] = clampToArena(x, z, 0.1)

        const landResult = checkLanding(x, z, y, discs, disc.id)

        if (landResult.impactType === "ringout") {
          impacts.push({ type: "ringout", x, z, intensity: 6 })
          return { ...disc, x, y, z, vx: 0, vy: 0, vz: 0, moving: false, flying: false, ringOut: true }
        }

        if (landResult.targetId) {
          const target = discs.find(d => d.id === landResult.targetId)
          if (target) {
            if (landResult.targetIsEnemy) {
              // Enemy target → flip or deflect
              const { flipped, impactType } = resolveFlip(disc, target)
              impacts.push({ type: impactType, x, z, intensity: flipped ? 12 : 6 })

              if (flipped) {
                landedDiscId = disc.id
                return { ...disc, x, y: 0.12, z, vx: 0, vy: 0, vz: 0, moving: false, flying: false, landedOnId: landResult.targetId }
              } else {
                // Natural deflection: bounce away from target
                const toTargetX = x - (target?.x || 0)
                const toTargetZ = z - (target?.z || 0)
                const distToTarget = Math.hypot(toTargetX, toTargetZ) || 1
                const bounceAngle = Math.atan2(toTargetZ, toTargetX) + (Math.random() - 0.5) * 0.8
                const bounceForce = 0.8 + Math.random() * 0.5
                x += Math.cos(bounceAngle) * bounceForce
                z += Math.sin(bounceAngle) * bounceForce
                ;[x, z] = clampToArena(x, z, 0.1)
              }
            } else {
              // Friendly disc — bounce away to avoid stacking
              impacts.push({ type: "stack_bounce", x, z, intensity: 4 })
              const toTargetX = x - (target?.x || 0)
              const toTargetZ = z - (target?.z || 0)
              const distToTarget = Math.hypot(toTargetX, toTargetZ) || 0.001
              const bounceAngle = Math.atan2(toTargetZ, toTargetX) + (Math.random() - 0.5) * 0.5
              const bounceForce = 1.0 + Math.random() * 0.7
              x += Math.cos(bounceAngle) * bounceForce
              z += Math.sin(bounceAngle) * bounceForce
              ;[x, z] = clampToArena(x, z, DISC_RADIUS + 0.05)
            }
          }
        } else {
          impacts.push({ type: "land", x, z, intensity: 3 })
        }

        return { ...disc, x, y, z, vx: 0, vy: 0, vz: 0, moving: false, flying: false, landedOnId: null }
      }
    } else if (moving) {
      // Ground movement (deflected discs) with collision detection
      x += vx * dt
      z += vz * dt

      // Check collision with other grounded discs
      const otherDiscs = discs.filter(d => d.id !== disc.id && !d.flying && !d.flipped && !d.ringOut)
      for (const od of otherDiscs) {
        const dx2 = x - od.x
        const dz2 = z - od.z
        const dist2 = Math.hypot(dx2, dz2)
        if (dist2 < DISC_RADIUS * 2.0 && dist2 > 0.001) {
          // Bounce off the other disc
          const nx2 = dx2 / dist2
          const nz2 = dz2 / dist2
          x = od.x + nx2 * DISC_RADIUS * 2.0
          z = od.z + nz2 * DISC_RADIUS * 1.9
          // Reflect velocity (dampened)
          const dot = vx * nx2 + vz * nz2
          vx -= 2 * dot * nx2
          vz -= 2 * dot * nz2
          vx *= 0.4
          vz *= 0.4
        }
      }

      const friction = 5.0
      const speed = Math.hypot(vx, vz)
      if (speed > 0.08) {
        const ns = Math.max(0, speed - friction * dt)
        const ratio = ns / speed
        vx *= ratio
        vz *= ratio
      } else {
        vx = 0; vz = 0; moving = false
      }

      ;[x, z] = clampToArena(x, z, DISC_RADIUS + 0.05)
    }

    return { ...disc, x, y, z, vx, vy, vz, moving, flying }
  })

  // Pass 2: apply capture effects (flip defender discs)
  const flippedIds = new Set<string>()
  stepped.forEach(d => {
    if (d.landedOnId && !flippedIds.has(d.landedOnId)) {
      flippedIds.add(d.landedOnId)
    }
  })
  const result = stepped.map(d =>
    flippedIds.has(d.id) ? { ...d, flipped: true, moving: false, flying: false } : d
  )

  return { discs: result, impacts, landedDiscId }
}

export function allStopped(discs: DiscState[]): boolean {
  return discs.every(d => !d.moving && !d.flying)
}

export function getActiveDiscs(discs: DiscState[], owner: "player" | "opponent"): DiscState[] {
  return discs.filter(d => d.owner === owner && !d.flipped && !d.ringOut)
}


