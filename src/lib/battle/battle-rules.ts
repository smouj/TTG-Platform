// ============================================================
// Trading Tazos Game — Battle Rules
// Core rules, formulas, and resolution logic.
// Deterministic — uses seeded RNG for reproducibility.
// ============================================================

import type {
  TazoBattleStats,
  TazoPhysicsState,
  CollisionEvent,
  ImpactOutcome,
  ArenaConfig,
} from "./battle-types"

// ---- Seeded RNG ----
export class SeededRNG {
  private state: number
  constructor(seed: number) { this.state = seed }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0xffffffff
    return (this.state >>> 0) / 0xffffffff
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }
  intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
  }
}

// ---- Physics Formulas ----

export function calculateLaunchSpeed(power: number, throwerStats: TazoBattleStats): number {
  const baseSpeed = 200 + power * 500 // 200-700 px/s
  const controlBonus = (throwerStats.control - 50) * 1.5
  const weightPenalty = Math.max(0, (throwerStats.weight - 60) * 0.8)
  return Math.max(100, baseSpeed + controlBonus - weightPenalty)
}

export function calculateAccuracyError(
  power: number,
  horizontalAccuracy: number,
  verticalAccuracy: number,
  throwerStats: TazoBattleStats
): number {
  const baseError = (1 - power) * 15 + power * 40 // more power = more error
  const aimError = ((1 - horizontalAccuracy) + (1 - verticalAccuracy)) * 20
  const precisionBonus = throwerStats.precision * 0.15
  return Math.max(0, baseError + aimError - precisionBonus)
}

export function calculateSpin(power: number, throwerStats: TazoBattleStats): number {
  return (throwerStats.spin * 0.6 + power * 40) * (0.8 + Math.random() * 0.4)
}

export function calculateLaunchAngle(aimX: number, aimY: number, accuracyError: number, rng: SeededRNG): number {
  const baseAngle = Math.atan2(aimY - 300, aimX - 300) // relative to center
  const errorRad = (accuracyError / 100) * (Math.PI / 4) * (rng.next() - 0.5) * 2
  return baseAngle + errorRad
}

// ---- Impact Formulas ----

export function calculateImpactPower(
  throwerStats: TazoBattleStats,
  throwPower: number,
  launchSpeed: number,
  angleBonus: number,
  precisionBonus: number
): number {
  return (
    throwerStats.attack * 0.45 +
    throwerStats.weight * 0.2 +
    throwerStats.spin * 0.15 +
    throwPower * 35 +
    angleBonus +
    precisionBonus
  )
}

export function calculateDefensePower(targetStats: TazoBattleStats): number {
  return (
    targetStats.defense * 0.35 +
    targetStats.resistance * 0.35 +
    targetStats.weight * 0.15 +
    targetStats.stability * 0.25
  )
}

export function resolveImpactOutcome(
  impactPower: number,
  defensePower: number,
  impactPoint: CollisionEvent["impactPoint"],
  remainingEnergy: number,
  rng: SeededRNG
): ImpactOutcome {
  const flipScore = impactPower - defensePower

  // Edge hits are more likely to flip
  const edgeMultiplier = impactPoint === "edge" ? 1.4 : impactPoint === "side" ? 1.2 : 1.0

  // Weak hits do nothing
  if (flipScore < -20) return "no_effect"

  // Ring out check (very high power + edge hit)
  if (flipScore > 60 && impactPoint === "edge" && remainingEnergy > 50) {
    return rng.next() < 0.3 ? "ring_out" : "heavy_push"
  }

  // Flip check
  const flipChance = Math.min(0.85, Math.max(0.05, (flipScore * edgeMultiplier) / 120))
  if (rng.next() < flipChance) return "flip"

  // Heavy push
  if (flipScore > 30) return "heavy_push"

  // Push
  if (flipScore > 10) return "push"

  // Stack check (very specific case)
  if (Math.abs(flipScore) < 8 && rng.next() < 0.1) return "stack"

  // Chain rebound check
  if (remainingEnergy > 30 && rng.next() < 0.4) return "chain_rebound"

  return "push"
}

// ---- Energy & Rebound ----

export function calculateCollisionCost(outcome: ImpactOutcome): number {
  switch (outcome) {
    case "no_effect": return 15
    case "push": return 25
    case "heavy_push": return 40
    case "flip": return 50
    case "ring_out": return 45
    case "chain_rebound": return 20
    case "stack": return 30
  }
}

export function calculateReboundEnergy(
  initialEnergy: number,
  collisionCost: number,
  throwerStats: TazoBattleStats
): number {
  const bounceBonus = throwerStats.bounce * 0.15
  return Math.max(0, initialEnergy - collisionCost + bounceBonus)
}

// ---- Position Updates ----

export function applyPush(
  physics: TazoPhysicsState,
  directionX: number,
  directionY: number,
  power: number
): TazoPhysicsState {
  const pushForce = power * 0.08
  return {
    ...physics,
    velocityX: physics.velocityX + directionX * pushForce,
    velocityY: physics.velocityY + directionY * pushForce,
    tilt: Math.min(45, physics.tilt + pushForce * 5),
    isStacked: physics.stackLevel > 0,
  }
}

export function applyFlip(physics: TazoPhysicsState): TazoPhysicsState {
  return {
    ...physics,
    face: physics.face === "front" ? "back" : "front",
    tilt: 90,
    spinVelocity: physics.spinVelocity * 1.5,
    isStacked: false,
    stackLevel: 0,
  }
}

export function applyPhysicsStep(
  physics: TazoPhysicsState,
  arena: ArenaConfig,
  dt: number
): TazoPhysicsState {
  // Apply friction
  const newVx = physics.velocityX * arena.friction
  const newVy = physics.velocityY * arena.friction

  // Apply velocity
  let newX = physics.x + newVx * dt
  let newY = physics.y + newVy * dt

  // Clamp to arena bounds
  const dx = newX - arena.centerX
  const dy = newY - arena.centerY
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist > arena.radius - physics.radius) {
    // Bounce off arena wall
    const nx = dx / dist
    const ny = dy / dist
    newX = arena.centerX + nx * (arena.radius - physics.radius)
    newY = arena.centerY + ny * (arena.radius - physics.radius)
    return {
      ...physics,
      x: newX,
      y: newY,
      velocityX: -newVx * arena.bounceFactor,
      velocityY: -newVy * arena.bounceFactor,
      spinVelocity: physics.spinVelocity * 0.7,
    }
  }

  // Decay spin
  const newSpin = physics.spinVelocity * 0.95
  // Decay tilt back toward flat
  const newTilt = physics.tilt * 0.9

  return {
    ...physics,
    x: newX,
    y: newY,
    velocityX: newVx,
    velocityY: newVy,
    spinVelocity: Math.abs(newSpin) < 0.1 ? 0 : newSpin,
    tilt: Math.abs(newTilt) < 0.5 ? 0 : newTilt,
  }
}

// ---- Collision Detection ----

export function detectCollision(
  a: TazoPhysicsState,
  b: TazoPhysicsState
): { collided: boolean; overlap: number; nx: number; ny: number } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  const minDist = a.radius + b.radius

  if (dist < minDist && dist > 0) {
    return {
      collided: true,
      overlap: minDist - dist,
      nx: dx / dist,
      ny: dy / dist,
    }
  }

  return { collided: false, overlap: 0, nx: 0, ny: 0 }
}

export function determineImpactPoint(
  collisionAngle: number,
  tazoAngle: number
): CollisionEvent["impactPoint"] {
  const diff = Math.abs(collisionAngle - tazoAngle) % (Math.PI * 2)
  const normalizedDiff = Math.min(diff, Math.PI * 2 - diff)

  if (normalizedDiff < Math.PI / 6) return "center"
  if (normalizedDiff < Math.PI / 3) return "side"
  return "edge"
}

// ---- Simulation Runner ----

export interface SimulationStep {
  time: number
  physics: TazoPhysicsState[]
  collisions: CollisionEvent[]
}

export function runPhysicsSimulation(
  initialState: TazoPhysicsState[],
  arena: ArenaConfig,
  maxSteps: number = 300,
  dt: number = 0.016, // ~60fps
  rng: SeededRNG
): SimulationStep[] {
  const steps: SimulationStep[] = []
  let state = initialState.map(p => ({ ...p }))
  let time = 0

  for (let i = 0; i < maxSteps; i++) {
    time += dt
    const collisions: CollisionEvent[] = []

    // Apply physics to each tazo
    state = state.map(p => applyPhysicsStep(p, arena, dt))

    // Check for collisions between moving tazos and stationary ones
    for (let a = 0; a < state.length; a++) {
      for (let b = a + 1; b < state.length; b++) {
        const coll = detectCollision(state[a], state[b])
        if (coll.collided) {
          // Separate overlapping tazos
          state[a] = {
            ...state[a],
            x: state[a].x - coll.nx * coll.overlap * 0.5,
            y: state[a].y - coll.ny * coll.overlap * 0.5,
          }
          state[b] = {
            ...state[b],
            x: state[b].x + coll.nx * coll.overlap * 0.5,
            y: state[b].y + coll.ny * coll.overlap * 0.5,
          }
        }
      }
    }

    // Stop simulation if all velocities are near zero
    const allStopped = state.every(
      p => Math.abs(p.velocityX) < 0.01 && Math.abs(p.velocityY) < 0.01
    )

    steps.push({ time, physics: state.map(p => ({ ...p })), collisions })

    if (allStopped && i > 10) break
  }

  return steps
}

// ---- Description Generator ----

export function generateTurnDescription(
  throwerName: string,
  impactedNames: string[],
  flippedNames: string[],
  capturedNames: string[],
  outOfBounds: boolean,
  finalState: string
): string {
  const parts: string[] = []

  if (flippedNames.length > 0) {
    if (flippedNames.length === 1) {
      parts.push(`${throwerName} struck ${flippedNames[0]} and flipped it`)
    } else {
      parts.push(`${throwerName} struck and flipped ${flippedNames.length} tazos: ${flippedNames.join(", ")}`)
    }
  } else if (impactedNames.length > 0) {
    if (impactedNames.length === 1) {
      parts.push(`${throwerName} hit ${impactedNames[0]} but it held firm`)
    } else {
      parts.push(`${throwerName} hit ${impactedNames.length} tazos but none flipped`)
    }
  } else {
    parts.push(`${throwerName} didn't hit any tazo`)
  }

  if (outOfBounds) {
    parts.push("The tazo flew out of the arena. Opponent will decide where to place it.")
  } else if (finalState === "on_field") {
    parts.push("The thrown tazo stays on the field where it landed.")
  }

  if (capturedNames.length > 0) {
    parts.push(`Captured: ${capturedNames.join(", ")}!`)
  }

  return parts.join(" ")
}
