// ============================================================
// Arena Slam v2 — Arcade Jump Physics
//
// "Saltar tazos encima de otros para darles la vuelta"
// Drag-release → parabolic arc → land on opponent → flip!
// ============================================================

// ─── Constants ───
export const ARENA_RADIUS = 4.0
export const DISC_RADIUS = 0.45
/** Max horizontal speed on launch */
export const MAX_LAUNCH_SPEED = 14.0
/** Gravity pulling the disc down (units/s²) */
export const GRAVITY = 25.0
/** Jump power multiplier (how high the disc goes) */
export const JUMP_POWER = 10.0
/** Minimum launch speed to trigger a jump */
export const MIN_LAUNCH_SPEED = 2.5
/** Capture: land on top → attack threshold for flip */
export const FLIP_MIN_ATTACK_DIFF = 3.0
/** Extra bounce-off if flip fails */
export const DEFLECT_SPEED = 3.0

// ─── Types ───

export type TazoArchetype = "heavy" | "technical" | "spinner" | "bouncer" | "defender" | "balanced"

export interface TazoStats {
  attack: number   // 0-100 — chance to flip on landing
  defense: number  // 0-100 — chance to resist being flipped
  speed: number    // 0-100 — affects launch velocity
  weight: number   // 0-100 — affects arc height and wind resistance
}

// Archetype presets
export const ARCHETYPE_STATS: Record<TazoArchetype, TazoStats> = {
  heavy:     { attack: 70, defense: 75, speed: 30, weight: 90 },
  technical: { attack: 60, defense: 45, speed: 70, weight: 40 },
  spinner:   { attack: 40, defense: 35, speed: 85, weight: 25 },
  bouncer:   { attack: 55, defense: 50, speed: 65, weight: 30 },
  defender:  { attack: 35, defense: 95, speed: 45, weight: 80 },
  balanced:  { attack: 50, defense: 50, speed: 50, weight: 50 },
}

export interface DiscState {
  id: string
  name: string
  /** 3D position */
  x: number
  y: number    // height above arena floor
  z: number
  /** Velocity */
  vx: number
  vy: number    // vertical velocity
  vz: number
  /** Visual rotation */
  rotation: number
  rotationSpeed: number
  /** Status */
  moving: boolean
  flying: boolean   // in the air (parabolic arc)
  flipped: boolean
  ringOut: boolean
  landedOnId: string | null  // id of disc this one landed on
  /** Owner */
  owner: "player" | "opponent"
  /** Stats */
  stats: TazoStats
  archetype: TazoArchetype
  /** Visual */
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

export type ImpactType = "land" | "flip_hit" | "flip_miss" | "ringout" | "capture" | "deflect"

export interface ImpactEvent {
  type: ImpactType
  x: number
  z: number
  intensity: number
}

export interface SimResult {
  discs: DiscState[]
  impacts: ImpactEvent[]
  landedDiscId: string | null   // disc that just landed this step
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

// ─── Launch calculation ───

export function calculateLaunchVelocity(
  drag: DragState,
  stats: TazoStats
): { vx: number; vy: number; vz: number } {
  const dx = drag.startX - drag.currentX
  const dz = drag.startZ - drag.currentZ
  const dist = Math.sqrt(dx * dx + dz * dz)

  if (dist < 0.1) return { vx: 0, vy: 0, vz: 0 }

  // Direction is from start (where finger pressed) to current (pulled back)
  // So disc goes OPPOSITE direction of drag: from current toward start
  const angle = Math.atan2(dz, dx) // direction finger pulled
  // Disc goes opposite of finger drag (slingshot mechanic)
  const launchAngle = angle

  // Speed scales with drag distance and tazo's speed stat
  const baseSpeed = dist * 4.5
  const speedMult = 0.6 + stats.speed / 200 // 0.6–1.1
  const hSpeed = Math.min(baseSpeed * speedMult, MAX_LAUNCH_SPEED)

  // Vertical jump: proportional to drag distance, reduced by weight
  const weightMult = 1.1 - stats.weight / 200 // 1.05–0.6 (heavy = lower jump)
  const vSpeed = dist * JUMP_POWER * weightMult

  return {
    vx: Math.cos(launchAngle) * hSpeed,
    vy: vSpeed,
    vz: Math.sin(launchAngle) * hSpeed,
  }
}

// ─── Trajectory preview ───

export interface TrajectoryPoint {
  x: number
  y: number
  z: number
}

export function calculateTrajectoryPreview(
  startX: number,
  startZ: number,
  drag: DragState,
  stats: TazoStats,
  steps: number = 50
): TrajectoryPoint[] {
  const { vx, vy, vz } = calculateLaunchVelocity(drag, stats)
  if (Math.abs(vx) < 0.01 && Math.abs(vz) < 0.01 && vy < 1) return []

  const dt = 1 / 60
  const points: TrajectoryPoint[] = [{ x: startX, y: 0, z: startZ }]
  let x = startX, y = 0, z = startZ
  let curVx = vx, curVy = vy, curVz = vz

  for (let i = 0; i < steps; i++) {
    curVy -= GRAVITY * dt
    x += curVx * dt
    y += curVy * dt
    z += curVz * dt

    if (y <= 0) {
      // Interpolate landing point at y=0
      if (i > 0) {
        const prev = points[points.length - 1]
        const ratio = prev.y / (prev.y - y)
        const landX = prev.x + (x - prev.x) * ratio
        const landZ = prev.z + (z - prev.z) * ratio
        points.push({ x: landX, y: 0, z: landZ })
      } else {
        points.push({ x, y: 0, z })
      }
      break
    }

    // Check if still in arena
    const dist = Math.sqrt(x * x + z * z)
    if (dist > ARENA_RADIUS) {
      const nx = x / dist, nz = z / dist
      const bx = nx * ARENA_RADIUS
      const bz = nz * ARENA_RADIUS
      points.push({ x: bx, y, z })
      break
    }

    points.push({ x, y, z })
  }

  return points
}

// ─── Landing detection ───

function checkLanding(
  disc: DiscState,
  allDiscs: DiscState[]
): { landed: boolean; targetId: string | null; impactType: ImpactType } {
  // Disc must be near ground level
  if (disc.y > DISC_RADIUS * 1.5) return { landed: false, targetId: null, impactType: "land" }

  // Check if out of arena
  const dist = Math.sqrt(disc.x * disc.x + disc.z * disc.z)
  if (dist > ARENA_RADIUS) {
    return { landed: true, targetId: null, impactType: "ringout" }
  }

  // Check if landing on another disc
  const landingTargets = allDiscs
    .filter(d => d.id !== disc.id && !d.flying && !d.flipped && !d.ringOut)
    .map(d => ({
      disc: d,
      dist: Math.sqrt((disc.x - d.x) ** 2 + (disc.z - d.z) ** 2),
    }))
    .filter(d => d.dist < DISC_RADIUS * 2) // discs overlap
    .sort((a, b) => a.dist - b.dist)

  if (landingTargets.length > 0) {
    return { landed: true, targetId: landingTargets[0].disc.id, impactType: "flip_hit" }
  }

  return { landed: true, targetId: null, impactType: "land" }
}

// ─── Flip resolution ───

function resolveFlip(
  attacker: DiscState,
  defender: DiscState
): { flipped: boolean; impactType: ImpactType } {
  // Attack vs defense comparison with some randomness
  const attackAdvantage = attacker.stats.attack - defender.stats.defense * 0.6
  const randFactor = (Math.random() - 0.5) * 20
  const flipScore = attackAdvantage + randFactor

  if (flipScore >= FLIP_MIN_ATTACK_DIFF) {
    return { flipped: true, impactType: "capture" }
  }
  return { flipped: false, impactType: "deflect" }
}

// ─── Main simulation step ───

export function simulateStep(discs: DiscState[], delta: number): SimResult {
  const dt = Math.min(delta, 0.05) // cap for stability
  const impacts: ImpactEvent[] = []
  let landedDiscId: string | null = null

  const nextDiscs = discs.map(disc => {
    if (!disc.moving && !disc.flying) return { ...disc }

    // Skip already dead discs
    if (disc.flipped || disc.ringOut) {
      return { ...disc, moving: false, flying: false, vx: 0, vy: 0, vz: 0 }
    }

    let { x, y, z, vx, vy, vz, moving, flying } = disc

    if (flying) {
      // Parabolic arc — apply gravity
      vy -= GRAVITY * dt
      x += vx * dt
      z += vz * dt
      y += vy * dt

      // Check if landed
      if (y <= 0) {
        y = 0
        flying = false
        moving = false

        // Landing detection
        const result = checkLanding({ ...disc, x, y, z }, discs)

        if (result.impactType === "ringout") {
          impacts.push({ type: "ringout", x, z, intensity: 6 })
          // Clamp to arena edge
          const dist = Math.sqrt(x * x + z * z)
          const nx = x / dist, nz = z / dist
          x = nx * (ARENA_RADIUS - 0.1)
          z = nz * (ARENA_RADIUS - 0.1)
          return { ...disc, x, y, z, vx: 0, vy: 0, vz: 0, moving: false, flying: false, ringOut: true }
        }

        if (result.targetId) {
          // Landed on another disc — resolve flip
          const target = discs.find(d => d.id === result.targetId)!
          const { flipped, impactType } = resolveFlip(disc, target)

          impacts.push({ type: impactType, x, z, intensity: flipped ? 10 : 5 })

          if (flipped) {
            // Attacker stays on top, defender flips
            landedDiscId = disc.id
            return {
              ...disc, x, y: 0.1, z, vx: 0, vy: 0, vz: 0,
              moving: false, flying: false, landedOnId: result.targetId,
            }
          } else {
            // Deflect: disc bounces off a bit
            const deflectAngle = Math.random() * Math.PI * 2
            const deflectDist = 0.8 + Math.random() * 0.5
            x += Math.cos(deflectAngle) * deflectDist
            z += Math.sin(deflectAngle) * deflectDist
          }
        } else {
          impacts.push({ type: "land", x, z, intensity: 3 })
        }

        return { ...disc, x, y, z, vx: 0, vy: 0, vz: 0, moving: false, flying: false, landedOnId: null }
      }
    } else if (moving) {
      // Legacy horizontal movement (for deflected discs)
      x += vx * dt
      z += vz * dt

      // Simple friction
      const friction = 4.5
      const speed = Math.sqrt(vx * vx + vz * vz)
      if (speed > 0.1) {
        const newSpeed = Math.max(0, speed - friction * dt)
        const ratio = newSpeed / speed
        vx *= ratio
        vz *= ratio
      } else {
        vx = 0; vz = 0; moving = false
      }

      // Arena boundary
      const dist = Math.sqrt(x * x + z * z)
      if (dist > ARENA_RADIUS - DISC_RADIUS) {
        const nx = x / dist, nz = z / dist
        x = nx * (ARENA_RADIUS - DISC_RADIUS)
        z = nz * (ARENA_RADIUS - DISC_RADIUS)
        vx = -vx * 0.3
        vz = -vz * 0.3
      }
    }

    return { ...disc, x, y, z, vx, vy, vz, moving, flying }
  })

  // Apply flip effects: defender gets flipped if attacker captured
  nextDiscs.forEach((d, i) => {
    if (d.landedOnId) {
      const defenderIdx = nextDiscs.findIndex(other => other.id === d.landedOnId)
      if (defenderIdx >= 0) {
        nextDiscs[defenderIdx] = { ...nextDiscs[defenderIdx], flipped: true, moving: false, flying: false }
      }
    }
  })

  return { discs: nextDiscs, impacts, landedDiscId }
}

// ─── Check if all moving/flying discs have stopped ───

export function allStopped(discs: DiscState[]): boolean {
  return discs.every(d => !d.moving && !d.flying)
}

// ─── Get active player/opponent discs ───

export function getActiveDiscs(discs: DiscState[], owner: "player" | "opponent"): DiscState[] {
  return discs.filter(d => d.owner === owner && !d.flipped && !d.ringOut)
}

export function getScore(discs: DiscState[], owner: "player" | "opponent"): number {
  return discs.filter(d => d.owner === owner && d.flipped).length
}
