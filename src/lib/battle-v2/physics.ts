// ============================================================
// Arena Slam v2 — Realistic Field Physics (v4)
//
// Rectangular field (soccer/futsal proportions)
// Realistic disc collision — both discs react naturally
// Roughness zones affect movement and flip probability
// No artificial bounce — natural physics response
// ============================================================

// ─── Field Constants ───
export const FIELD_WIDTH = 12.0       // length (x-axis, sideline to sideline)
export const FIELD_HEIGHT = 8.0       // width (z-axis, goal line to goal line)
export const FIELD_HALF_W = FIELD_WIDTH / 2   // 6.0
export const FIELD_HALF_H = FIELD_HEIGHT / 2  // 4.0
export const CENTER_LINE_Z = 0.0

export const DISC_RADIUS = 0.45
export const MAX_LAUNCH_SPEED = 16.0
export const GRAVITY = 28.0
export const JUMP_POWER = 11.0
export const MIN_LAUNCH_SPEED = 2.0

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
  wobbleAngle: number       // visual wobble/tilt angle (radians)
  wobbleSpeed: number       // wobble decay speed
  wobbleAxis: number        // wobble rotation axis angle
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

export type ImpactType = "land" | "flip_hit" | "glancing_hit" | "ringout" | "collision" | "wobble"

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

// ─── Field Helpers ───

export function isInField(x: number, z: number, margin: number = 0): boolean {
  return (
    x > -FIELD_HALF_W + margin &&
    x < FIELD_HALF_W - margin &&
    z > -FIELD_HALF_H + margin &&
    z < FIELD_HALF_H - margin
  )
}

export function isInPlayerHalf(x: number, z: number): boolean {
  return isInField(x, z) && z > CENTER_LINE_Z
}

export function isInOpponentHalf(x: number, z: number): boolean {
  return isInField(x, z) && z < CENTER_LINE_Z
}

/** Clamp a position to the rectangular field bounds */
export function clampToField(x: number, z: number, margin: number = DISC_RADIUS): [number, number] {
  const maxX = FIELD_HALF_W - margin
  const minX = -FIELD_HALF_W + margin
  const maxZ = FIELD_HALF_H - margin
  const minZ = -FIELD_HALF_H + margin
  return [
    Math.max(minX, Math.min(maxX, x)),
    Math.max(minZ, Math.min(maxZ, z))
  ]
}

/** Get the field half for an owner */
export function getOwnerHalf(owner: "player" | "opponent"): { minZ: number; maxZ: number } {
  if (owner === "player") {
    return { minZ: CENTER_LINE_Z + DISC_RADIUS, maxZ: FIELD_HALF_H - DISC_RADIUS }
  }
  return { minZ: -FIELD_HALF_H + DISC_RADIUS, maxZ: CENTER_LINE_Z - DISC_RADIUS }
}

/** Check if a position is in the owner's positioning zone (their half, not too close to center) */
export function isInOwnerZone(x: number, z: number, owner: "player" | "opponent"): boolean {
  if (!isInField(x, z, DISC_RADIUS)) return false
  return owner === "player" ? z > CENTER_LINE_Z + 0.5 : z < CENTER_LINE_Z - 0.5
}

// ─── Roughness Zones ───
// Rectangular zones running along the z-axis (like soccer pitch grass patterns)
// Smooth center stripe → medium mid-zones → rough edges
// Returns 0.5–1.0 (1.0 = smooth/flippable, <1 = rough/resistant)

export function floorRoughness(x: number, z: number): number {
  const absZ = Math.abs(z)
  const microVar = 1.0 + (Math.sin(x * 19.7 + z * 31.3) * 0.03)

  if (absZ < 1.0) {
    // Center stripe — smooth, easy flips
    return 1.0 * microVar
  } else if (absZ < 2.2) {
    // Inner midfield — medium roughness
    return 0.78 * microVar
  } else if (absZ < 3.0) {
    // Outer midfield — rough
    return 0.6 * microVar
  } else {
    // Near edges — hardest to flip
    return 0.5 * microVar
  }
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
    wobbleAngle: 0, wobbleSpeed: 0, wobbleAxis: 0,
    moving: false, flying: false, flipped: false, ringOut: false,
    landedOnId: null,
    owner, stats, archetype, franchise,
  }
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

  const baseSpeed = dist * 5.0
  const speedMult = 0.55 + stats.speed / 180
  const hSpeed = Math.min(baseSpeed * speedMult, MAX_LAUNCH_SPEED)

  const weightMult = 1.15 - stats.weight / 180
  const vSpeed = dist * JUMP_POWER * weightMult

  return {
    vx: Math.cos(angle) * hSpeed,
    vy: vSpeed,
    vz: Math.sin(angle) * hSpeed,
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

  for (let i = 0; i < steps; i++) {
    cvy -= GRAVITY * dt
    x += cvx * dt
    y += cvy * dt
    z += cvz * dt

    if (!isInField(x, z, 0.2)) {
      const [cx, cz] = clampToField(x, z, 0.2)
      x = cx; z = cz
      points.push({ x, y, z })
      break
    }

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

// ─── Realistic Collision Detection ───

interface CollisionResult {
  collided: boolean
  targetId: string
  impactType: ImpactType
  intensity: number
  collisionNX: number
  collisionNZ: number
}

function detectCollision(
  attacker: DiscState,
  landingX: number,
  landingZ: number,
  allDiscs: DiscState[]
): CollisionResult {
  const candidates = allDiscs
    .filter(d => d.id !== attacker.id && !d.flying && !d.flipped && !d.ringOut)
    .map(d => ({
      id: d.id,
      dist: Math.hypot(landingX - d.x, landingZ - d.z),
      dx: d.x - landingX,
      dz: d.z - landingZ,
      isEnemy: d.owner !== attacker.owner
    }))
    .filter(d => d.dist < DISC_RADIUS * 2.8)
    .sort((a, b) => a.dist - b.dist)

  if (candidates.length === 0) {
    return { collided: false, targetId: "", impactType: "land", intensity: 0, collisionNX: 0, collisionNZ: 0 }
  }

  const hit = candidates[0]
  const dist = hit.dist || 0.001

  const nx = hit.dx / dist
  const nz = hit.dz / dist

  const speed = Math.hypot(attacker.vx, attacker.vz)
  const intensity = attacker.stats.weight / 100 * speed * 4.5

  const overlapDepth = (DISC_RADIUS * 2.0 - dist) / (DISC_RADIUS * 2.0)

  let impactType: ImpactType = "land"
  if (overlapDepth > 0.6 && hit.isEnemy) {
    impactType = "flip_hit"
  } else if (overlapDepth > 0.3 && hit.isEnemy) {
    impactType = "glancing_hit"
  } else if (hit.isEnemy) {
    impactType = "wobble"
  } else {
    impactType = "collision"
  }

  return {
    collided: true,
    targetId: hit.id,
    impactType,
    intensity,
    collisionNX: nx,
    collisionNZ: nz,
  }
}

// ─── Flip Resolution ───

function resolveCollision(
  attacker: DiscState,
  defender: DiscState,
  collisionNX: number,
  collisionNZ: number,
  intensity: number,
  impactType: ImpactType
): { attacker: Partial<DiscState>; defender: Partial<DiscState> } {
  const aMass = attacker.stats.weight / 100
  const dMass = defender.stats.weight / 100

  const restitution = 0.35
  const totalMass = aMass + dMass
  const transferRatio = (aMass * (1 + restitution)) / totalMass

  const roughness = floorRoughness(defender.x, defender.z)
  const groundResistance = (1.0 - roughness) * dMass * 0.8

  const defenderVx = attacker.vx * transferRatio
  const defenderVz = attacker.vz * transferRatio

  const attackerLoss = 1.0 - transferRatio * 0.7
  const attackerVx = attacker.vx * attackerLoss
  const attackerVz = attacker.vz * attackerLoss

  const attackFactor = attacker.stats.attack / 100
  const defenseFactor = defender.stats.defense / 100
  const roughnessPenalty = roughness

  const flipScore = (intensity / 4.0) * attackFactor / (defenseFactor + 0.3) * roughnessPenalty
  const flipThreshold = 1.8

  const flipped = (impactType === "flip_hit" || impactType === "glancing_hit") && flipScore > flipThreshold

  const wobbleIntensity = Math.min(flipScore / flipThreshold, 2.5)
  const wobbleAngle = wobbleIntensity * 0.35
  const wobbleSpeed = intensity * 0.25

  return {
    attacker: {
      vx: attackerVx,
      vy: attacker.vy > 0 ? attacker.vy * 0.3 : 0,
      vz: attackerVz,
      moving: true,
      flying: attacker.vy > 0.3,
    },
    defender: {
      vx: flipped ? defenderVx * 0.15 : defenderVx * (1.0 - groundResistance),
      vz: flipped ? defenderVz * 0.15 : defenderVz * (1.0 - groundResistance),
      moving: true,
      flipped,
      wobbleAngle,
      wobbleSpeed,
      wobbleAxis: Math.atan2(collisionNZ, collisionNX),
    }
  }
}

// ─── Disc Overlap Resolution ───

function resolveDiscOverlaps(discs: DiscState[]): DiscState[] {
  const result = discs.map(d => ({ ...d }))
  const RESTING = DISC_RADIUS * 2.0
  const ITERATIONS = 3

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i], b = result[j]
        if (a.flying || a.flipped || a.ringOut) continue
        if (b.flying || b.flipped || b.ringOut) continue

        const dx = b.x - a.x
        const dz = b.z - a.z
        const dist = Math.hypot(dx, dz)
        if (dist < RESTING && dist > 0.001) {
          const overlap = (RESTING - dist) * 0.51
          const nx = dx / dist, nz = dz / dist
          a.x -= nx * overlap
          a.z -= nz * overlap
          b.x += nx * overlap
          b.z += nz * overlap
          ;[a.x, a.z] = clampToField(a.x, a.z)
          ;[b.x, b.z] = clampToField(b.x, b.z)
        }
      }
    }
  }
  return result
}

// ─── Main Simulation Step ───

export function simulateStep(discs: DiscState[], delta: number): SimResult {
  const dt = Math.min(delta, 0.033)
  const impacts: ImpactEvent[] = []
  let landedDiscId: string | null = null

  const stepped = discs.map(disc => {
    if (!disc.moving && !disc.flying) {
      if (disc.wobbleAngle > 0.005) {
        return { ...disc, wobbleAngle: disc.wobbleAngle * 0.95, wobbleSpeed: disc.wobbleSpeed * 0.93 }
      }
      return { ...disc, wobbleAngle: 0, wobbleSpeed: 0 }
    }

    if (disc.flipped || disc.ringOut) {
      return { ...disc, moving: false, flying: false, vx: 0, vy: 0, vz: 0, wobbleAngle: 0, wobbleSpeed: 0 }
    }

    let { x, y, z, vx, vy, vz, moving, flying, wobbleAngle: wa, wobbleSpeed: ws } = disc

    if (flying) {
      vy -= GRAVITY * dt
      x += vx * dt
      z += vz * dt
      y += vy * dt

      if (!isInField(x, z, 0.1)) {
        const [cx, cz] = clampToField(x, z, 0.1)
        x = cx; z = cz
        vx *= 0.25; vz *= 0.25
      }

      if (y <= 0) {
        y = 0
        flying = false
        ;[x, z] = clampToField(x, z, 0.05)

        if (!isInField(x, z, 0.05)) {
          impacts.push({ type: "ringout", x, z, intensity: 6 })
          return { ...disc, x, y, z, vx: 0, vy: 0, vz: 0, moving: false, flying: false, ringOut: true, wobbleAngle: 0, wobbleSpeed: 0 }
        }

        const collision = detectCollision(disc, x, z, discs)

        if (collision.collided) {
          const defender = discs.find(d => d.id === collision.targetId)
          if (defender && collision.impactType !== "collision") {
            const { attacker: aPatch, defender: dPatch } = resolveCollision(
              disc, defender, collision.collisionNX, collision.collisionNZ,
              collision.intensity, collision.impactType
            )

            impacts.push({ type: collision.impactType, x, z, intensity: collision.intensity })

            if (dPatch.flipped) {
              landedDiscId = disc.id
            }

            const offsetX = x + collision.collisionNX * -0.3
            const offsetZ = z + collision.collisionNZ * -0.3
            const [cx2, cz2] = clampToField(offsetX, offsetZ)

            return {
              ...disc,
              x: cx2, y, z: cz2,
              vx: aPatch.vx ?? 0, vy: aPatch.vy ?? 0, vz: aPatch.vz ?? 0,
              moving: aPatch.moving ?? false,
              flying: aPatch.flying ?? false,
              wobbleAngle: 0.15,
              wobbleSpeed: collision.intensity * 0.2,
              wobbleAxis: Math.atan2(collision.collisionNZ, collision.collisionNX),
              landedOnId: dPatch.flipped ? collision.targetId : null,
            }
          } else {
            impacts.push({ type: "land", x, z, intensity: 2 })
            const remainSpeed = Math.hypot(vx, vz) * 0.25
            return {
              ...disc, x, y, z,
              vx: vx * 0.25, vy: 0, vz: vz * 0.25,
              moving: remainSpeed > 0.5,
              flying: false,
              wobbleAngle: 0.08, wobbleSpeed: 1.5,
              wobbleAxis: Math.atan2(collision.collisionNZ, collision.collisionNX),
              landedOnId: null,
            }
          }
        } else {
          impacts.push({ type: "land", x, z, intensity: 2 })
          return { ...disc, x, y, z, vx: 0, vy: 0, vz: 0, moving: false, flying: false, wobbleAngle: 0, wobbleSpeed: 0, landedOnId: null }
        }
      }
    } else if (moving) {
      x += vx * dt
      z += vz * dt

      const others = discs.filter(d => d.id !== disc.id && !d.flying && !d.flipped && !d.ringOut)
      for (const od of others) {
        const dx2 = x - od.x, dz2 = z - od.z
        const dist2 = Math.hypot(dx2, dz2)
        if (dist2 < DISC_RADIUS * 2.0 && dist2 > 0.0001) {
          const nx = dx2 / dist2, nz = dz2 / dist2
          const relVn = vx * nx + vz * nz - (od.vx * nx + od.vz * nz)
          if (relVn > 0) {
            const impulse = relVn * 0.5
            vx -= impulse * nx
            vz -= impulse * nz
            const pushDist = (DISC_RADIUS * 2.0 - dist2) * 0.55
            x -= nx * pushDist
            z -= nz * pushDist
          }
        }
      }

      const roughnessMod = floorRoughness(x, z)
      const surfaceFriction = 4.5 * (2.0 - roughnessMod)
      const speed = Math.hypot(vx, vz)
      if (speed > 0.05) {
        const ns = Math.max(0, speed - surfaceFriction * dt)
        const ratio = ns / speed
        vx *= ratio; vz *= ratio
      } else {
        vx = 0; vz = 0; moving = false
      }

      wa *= 0.93; ws *= 0.9
      ;[x, z] = clampToField(x, z)
    }

    return { ...disc, x, y, z, vx, vy, vz, moving, flying, wobbleAngle: wa, wobbleSpeed: ws }
  })

  const flippedIds = new Set<string>()
  stepped.forEach(d => {
    if (d.landedOnId && !flippedIds.has(d.landedOnId)) {
      flippedIds.add(d.landedOnId)
    }
  })
  const withFlips = stepped.map(d =>
    flippedIds.has(d.id) ? { ...d, flipped: true, moving: false, flying: false, wobbleAngle: 0.1, wobbleSpeed: 2.0 } : d
  )

  return { discs: resolveDiscOverlaps(withFlips), impacts, landedDiscId }
}

export function allStopped(discs: DiscState[]): boolean {
  return discs.every(d => !d.moving && !d.flying)
}

export function getActiveDiscs(discs: DiscState[], owner: "player" | "opponent"): DiscState[] {
  return discs.filter(d => d.owner === owner && !d.flipped && !d.ringOut)
}
