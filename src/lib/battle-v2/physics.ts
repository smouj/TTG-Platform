// ============================================================
// Trading Tazos Game — Arena Slam v2 Physics Engine
//
// Arcade physics for drag-release tazo gameplay:
//   - Velocity from drag vector
//   - Friction deceleration on arena surface
//   - Circle-line collision (tazo vs arena boundary)
//   - Disc-disc collision with momentum transfer
//   - Flip detection on impact threshold
//   - Bounce off arena walls
//   - Spin curve modifier
//
// Not realistic physics — arcade feel.
// The player must understand WHY they missed.
// ============================================================

// ─── Constants ───

/** Arena radius in game units */
export const ARENA_RADIUS = 3.5

/** Friction coefficient — higher = faster stop */
export const FRICTION = 2.8

/** Minimum speed below which a disc is considered stopped */
export const STOP_THRESHOLD = 0.05

/** Maximum drag distance (game units) — caps force */
export const MAX_DRAG_DISTANCE = 3.0

/** Maximum launch speed (game units/second) */
export const MAX_LAUNCH_SPEED = 18.0

/** Minimum launch speed — prevents tiny flicks */
export const MIN_LAUNCH_SPEED = 2.0

/** Collision coefficient of restitution (bounciness) */
export const RESTITUTION = 0.65

/** Flip threshold — impact speed above which a disc can flip */
export const FLIP_THRESHOLD = 4.5

/** Capture threshold — impact speed above which a flip counts as capture */
export const CAPTURE_THRESHOLD = 6.0

/** Wall bounce factor */
export const WALL_BOUNCE = 0.7

/** Spin curve factor — how much spin deflects trajectory (radians per unit distance) */
export const SPIN_CURVE = 0.12

/** Disc physical radius in game units */
export const DISC_RADIUS = 0.42

/** Time step for physics simulation */
export const PHYSICS_DT = 1 / 60

// ─── Types ───

export type TazoArchetype =
  | "heavy"      // More impact, less control
  | "technical"  // More precision, less force
  | "spinner"    // Curves and edge hits
  | "bouncer"    // Strong bounces
  | "defender"   // Hard to flip
  | "balanced"   // Easy for beginners

export interface TazoStats {
  attack: number     // 0-100, flip power
  defense: number    // 0-100, resistance to flip
  precision: number  // 0-100, reduces deviation
  weight: number     // 0-100, momentum multiplier
  spin: number       // 0-100, curve amount
  bounce: number     // 0-100, wall and disc bounce
  control: number    // 0-100, aim tightness
  stability: number  // 0-100, knockback resistance
}

export interface DiscState {
  id: string
  name: string
  /** Position [x, z] on the arena surface */
  x: number
  z: number
  /** Velocity [vx, vz] */
  vx: number
  vz: number
  /** Rotation angle in radians (visual spin) */
  rotation: number
  /** Rotation speed in rad/s */
  rotationSpeed: number
  /** Whether this disc is moving */
  moving: boolean
  /** Whether this disc has been flipped (captured) */
  flipped: boolean
  /** Whether this disc left the arena ring */
  ringOut: boolean
  /** Owner: "player" | "opponent" */
  owner: "player" | "opponent"
  /** Tazo stats */
  stats: TazoStats
  archetype: TazoArchetype
  /** Visual: franchise slug for 3D rendering */
  franchise?: string
  /** Visual: front image URL */
  imageUrl?: string
  /** Visual: back art URL override */
  backImageUrl?: string
  /** Visual: finish for border effects */
  finish?: string
}

export interface DragState {
  /** Start position of drag in game units [x, z] */
  startX: number
  startZ: number
  /** Current drag position [x, z] */
  currentX: number
  currentZ: number
  /** Whether currently dragging */
  active: boolean
}

export interface SlamResult {
  /** The disc that was launched */
  launcherId: string
  /** Discs that were flipped (captured) */
  captured: string[]
  /** Discs that were knocked out of the arena */
  ringOuts: string[]
  /** Impact events for VFX */
  impacts: ImpactEvent[]
}

export interface ImpactEvent {
  x: number
  z: number
  speed: number
  type: "flip" | "capture" | "ringout" | "bounce" | "hit"
}

// ─── Archetype defaults ───

export const ARCHETYPE_STATS: Record<TazoArchetype, Partial<TazoStats>> = {
  heavy:     { attack: 80, defense: 60, precision: 30, weight: 90, spin: 20, bounce: 30, control: 25, stability: 75 },
  technical: { attack: 45, defense: 50, precision: 85, weight: 40, spin: 35, bounce: 40, control: 80, stability: 50 },
  spinner:   { attack: 50, defense: 40, precision: 60, weight: 50, spin: 90, bounce: 50, control: 55, stability: 40 },
  bouncer:   { attack: 55, defense: 35, precision: 50, weight: 55, spin: 40, bounce: 90, control: 45, stability: 30 },
  defender:  { attack: 30, defense: 90, precision: 55, weight: 70, spin: 25, bounce: 20, control: 60, stability: 85 },
  balanced:  { attack: 50, defense: 50, precision: 50, weight: 50, spin: 50, bounce: 50, control: 50, stability: 50 },
}

// ─── Physics Functions ───

/**
 * Calculate launch velocity from drag vector.
 * Direction = opposite of drag (pull back to shoot forward).
 * Speed = proportional to drag distance, capped.
 */
export function calculateLaunchVelocity(
  drag: DragState,
  launcherStats: TazoStats
): { vx: number; vz: number } {
  // Vector from current to start = launch direction (opposite of drag)
  const dx = drag.startX - drag.currentX
  const dz = drag.startZ - drag.currentZ
  const distance = Math.sqrt(dx * dx + dz * dz)

  if (distance < 0.1) {
    return { vx: 0, vz: 0 }
  }

  // Normalize
  const nx = dx / distance
  const nz = dz / distance

  // Speed: clamped by drag distance
  const clampedDist = Math.min(distance, MAX_DRAG_DISTANCE)
  const speedFactor = clampedDist / MAX_DRAG_DISTANCE

  // Weight affects max speed (heavier = slightly slower but more impact)
  const weightFactor = 0.7 + (launcherStats.weight / 100) * 0.6 // 0.7-1.3

  // Control reduces deviation (handled elsewhere)
  let speed = MIN_LAUNCH_SPEED + (MAX_LAUNCH_SPEED - MIN_LAUNCH_SPEED) * speedFactor * weightFactor

  // Apply spin curve — deflects the trajectory based on spin stat
  const spinAmount = (launcherStats.spin / 100) * SPIN_CURVE * speedFactor
  const angle = Math.atan2(nz, nx) + spinAmount * (nx > 0 ? 1 : -1)

  return {
    vx: Math.cos(angle) * speed,
    vz: Math.sin(angle) * speed,
  }
}

/**
 * Calculate trajectory preview points for drag line.
 * Returns an array of [x, z] positions showing predicted path.
 */
export function calculateTrajectoryPreview(
  startX: number,
  startZ: number,
  drag: DragState,
  stats: TazoStats,
  steps: number = 30
): Array<[number, number]> {
  const { vx, vz } = calculateLaunchVelocity(drag, stats)
  const points: Array<[number, number]> = [[startX, startZ]]

  let px = startX
  let pz = startZ
  let pvx = vx
  let pvz = vz

  for (let i = 0; i < steps; i++) {
    const dt = PHYSICS_DT * 3 // Faster preview
    pvx -= pvx * FRICTION * dt
    pvz -= pvz * FRICTION * dt

    px += pvx * dt
    pz += pvz * dt

    // Wall bounce
    const dist = Math.sqrt(px * px + pz * pz)
    if (dist > ARENA_RADIUS - DISC_RADIUS) {
      // Reflect velocity
      const nx = px / dist
      const nz = pz / dist
      const dot = pvx * nx + pvz * nz
      pvx -= 2 * dot * nx * WALL_BOUNCE
      pvz -= 2 * dot * nz * WALL_BOUNCE
      // Push back inside
      px = nx * (ARENA_RADIUS - DISC_RADIUS - 0.01)
      pz = nz * (ARENA_RADIUS - DISC_RADIUS - 0.01)
    }

    const speed = Math.sqrt(pvx * pvx + pvz * pvz)
    if (speed < STOP_THRESHOLD) break

    points.push([px, pz])
  }

  return points
}

/**
 * Simulate one physics step for all discs.
 * Returns updated disc states and impact events.
 */
export function simulateStep(
  discs: DiscState[],
  dt: number = PHYSICS_DT
): { discs: DiscState[]; impacts: ImpactEvent[] } {
  const impacts: ImpactEvent[] = []
  const newDiscs = discs.map(d => ({ ...d }))

  // Update each disc
  for (const disc of newDiscs) {
    if (!disc.moving || disc.flipped || disc.ringOut) continue

    const speed = Math.sqrt(disc.vx * disc.vx + disc.vz * disc.vz)

    // Apply friction
    disc.vx -= disc.vx * FRICTION * dt
    disc.vz -= disc.vz * FRICTION * dt

    // Apply spin curve (slight deflection over time)
    if (disc.rotationSpeed !== 0) {
      const curveAmount = disc.stats.spin / 100 * SPIN_CURVE * dt
      const angle = Math.atan2(disc.vz, disc.vx)
      const newAngle = angle + curveAmount * Math.sign(disc.rotationSpeed)
      const newSpeed = Math.sqrt(disc.vx * disc.vx + disc.vz * disc.vz)
      disc.vx = Math.cos(newAngle) * newSpeed
      disc.vz = Math.sin(newAngle) * newSpeed
    }

    // Move
    disc.x += disc.vx * dt
    disc.z += disc.vz * dt

    // Rotation visual
    disc.rotation += disc.rotationSpeed * dt
    disc.rotationSpeed *= (1 - 0.5 * dt) // Spin decay

    // Arena boundary — bounce
    const dist = Math.sqrt(disc.x * disc.x + disc.z * disc.z)
    if (dist > ARENA_RADIUS - DISC_RADIUS) {
      const nx = disc.x / dist
      const nz = disc.z / dist
      const dot = disc.vx * nx + disc.vz * nz
      disc.vx -= 2 * dot * nx * WALL_BOUNCE
      disc.vz -= 2 * dot * nz * WALL_BOUNCE

      // Bounce stat affects energy retention
      const bounceFactor = 0.3 + (disc.stats.bounce / 100) * 0.6 // 0.3-0.9
      disc.vx *= bounceFactor
      disc.vz *= bounceFactor

      // Push back inside
      disc.x = nx * (ARENA_RADIUS - DISC_RADIUS - 0.01)
      disc.z = nz * (ARENA_RADIUS - DISC_RADIUS - 0.01)

      impacts.push({ x: disc.x, z: disc.z, speed, type: "bounce" })
    }

    // Check if stopped
    const newSpeed = Math.sqrt(disc.vx * disc.vx + disc.vz * disc.vz)
    if (newSpeed < STOP_THRESHOLD) {
      disc.vx = 0
      disc.vz = 0
      disc.moving = false
      disc.rotationSpeed = 0
    }
  }

  // Disc-disc collisions
  for (let i = 0; i < newDiscs.length; i++) {
    for (let j = i + 1; j < newDiscs.length; j++) {
      const a = newDiscs[i]
      const b = newDiscs[j]

      if (a.flipped && b.flipped) continue
      if (a.ringOut || b.ringOut) continue

      const dx = b.x - a.x
      const dz = b.z - a.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      const minDist = DISC_RADIUS * 2

      if (dist < minDist && dist > 0.01) {
        // Collision normal
        const nx = dx / dist
        const nz = dz / dist

        // Relative velocity
        const dvx = a.vx - b.vx
        const dvz = a.vz - b.vz
        const relSpeed = Math.sqrt(dvx * dvx + dvz * dvz)

        // Impact speed along collision normal
        const impactSpeed = Math.abs(dvx * nx + dvz * nz)

        // Separate discs
        const overlap = minDist - dist
        a.x -= nx * overlap * 0.5
        a.z -= nz * overlap * 0.5
        b.x += nx * overlap * 0.5
        b.z += nz * overlap * 0.5

        // Weight factors (heavier = more momentum transfer)
        const aWeight = 0.5 + (a.stats.weight / 100) * 0.5 // 0.5-1.0
        const bWeight = 0.5 + (b.stats.weight / 100) * 0.5

        // Elastic collision with restitution
        const j = -(1 + RESTITUTION) * impactSpeed / (1/aWeight + 1/bWeight)

        a.vx += j * nx / aWeight
        a.vz += j * nz / aWeight
        b.vx -= j * nx / bWeight
        b.vz -= j * nz / bWeight

        // Transfer spin
        a.rotationSpeed += relSpeed * 0.3 * (a.stats.spin / 100)
        b.rotationSpeed += relSpeed * 0.3 * (b.stats.spin / 100)

        // Both discs are now moving
        a.moving = true
        b.moving = true

        // Check flip — the disc being hit (b) can flip if impact is strong enough
        // Attack of launcher vs defense of target
        const attackPower = a.stats.attack / 100 * impactSpeed
        const defensePower = b.stats.defense / 100 * FLIP_THRESHOLD
        const stabilityPower = b.stats.stability / 100 * 2.0

        if (impactSpeed > FLIP_THRESHOLD && attackPower > defensePower * 0.5) {
          // Flip!
          if (impactSpeed > CAPTURE_THRESHOLD && attackPower > defensePower) {
            b.flipped = true
            impacts.push({ x: b.x, z: b.z, speed: impactSpeed, type: "capture" })
          } else {
            impacts.push({ x: b.x, z: b.z, speed: impactSpeed, type: "flip" })
          }
        } else {
          impacts.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, speed: impactSpeed, type: "hit" })
        }

        // Also check the other direction (if b is moving and hits a)
        const bAttackPower = b.stats.attack / 100 * impactSpeed
        const aDefensePower = a.stats.defense / 100 * FLIP_THRESHOLD
        const aStability = a.stats.stability / 100 * 2.0

        if (impactSpeed > FLIP_THRESHOLD && bAttackPower > aDefensePower * 0.5) {
          if (impactSpeed > CAPTURE_THRESHOLD && bAttackPower > aDefensePower) {
            a.flipped = true
            impacts.push({ x: a.x, z: a.z, speed: impactSpeed, type: "capture" })
          } else {
            impacts.push({ x: a.x, z: a.z, speed: impactSpeed, type: "flip" })
          }
        }
      }
    }
  }

  return { discs: newDiscs, impacts }
}

/**
 * Check if all discs have stopped moving.
 */
export function allStopped(discs: DiscState[]): boolean {
  return discs.every(d => !d.moving || d.flipped || d.ringOut)
}

/**
 * Create a demo disc for prototyping.
 */
export function createDemoDisc(
  id: string,
  name: string,
  archetype: TazoArchetype,
  x: number,
  z: number,
  owner: "player" | "opponent",
  franchise: string = "minimon",
  imageUrl?: string,
): DiscState {
  const baseStats: TazoStats = {
    attack: 50, defense: 50, precision: 50, weight: 50,
    spin: 50, bounce: 50, control: 50, stability: 50,
  }
  const archetypeOverride = ARCHETYPE_STATS[archetype]
  const stats = { ...baseStats, ...archetypeOverride }

  return {
    id,
    name,
    x,
    z,
    vx: 0,
    vz: 0,
    rotation: 0,
    rotationSpeed: 0,
    moving: false,
    flipped: false,
    ringOut: false,
    owner,
    stats,
    archetype,
    franchise,
    imageUrl,
  }
}