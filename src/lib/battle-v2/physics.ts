// ============================================================
// Arena Slam v2 — Realistic Field Physics (v4.1)
//
// Rectangular field (soccer/futsal proportions)
// Realistic disc collision — both discs react naturally
// Roughness zones affect movement and flip probability
// Settle detection for physics-driven scoring
// Flip by real orientation, not formula
// ============================================================

export const FIELD_LENGTH = 14.0   // Z axis — front-to-back (long side)
export const FIELD_WIDTH = 8.0    // X axis — lateral (short side)
export const FIELD_HALF_L = FIELD_LENGTH / 2  // 7.0
export const FIELD_HALF_W = FIELD_WIDTH / 2   // 4.0
export const CENTER_LINE_Z = 0.0

export const DISC_RADIUS = 0.45
export const DISC_VISUAL_RADIUS = 0.55  // visual scale slightly larger than physics collider
export const DISC_THICKNESS = 0.06
export const MAX_LAUNCH_SPEED = 16.0
export const GRAVITY = 28.0
export const JUMP_POWER = 11.0
export const MIN_LAUNCH_SPEED = 2.0

// Settle detection
export const SETTLE_TIME_MS = 400    // must be stable this long to count as "settled"
export const SETTLE_SPEED_MAX = 0.15 // below this speed = "not moving"
export const SETTLE_ANGULAR_MAX = 0.3

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

// Face state based on disc normal
export type DiscFaceState = "face_down" | "face_up" | "sideways" | "wobbling"

export interface DiscState {
  id: string
  name: string
  x: number; y: number; z: number
  vx: number; vy: number; vz: number
  rotation: number       // yaw rotation (spin)
  rotationSpeed: number
  tiltX: number          // pitch tilt
  tiltZ: number          // roll tilt
  wobbleAngle: number
  wobbleSpeed: number
  wobbleAxis: number
  moving: boolean
  flying: boolean
  flipped: boolean        // permanently flipped (face up)
  faceState: DiscFaceState
  ringOut: boolean
  landedOnId: string | null
  owner: "player" | "opponent"
  stats: TazoStats
  archetype: TazoArchetype
  franchise?: string
  imageUrl?: string
  backImageUrl?: string
  finish?: string
  // Settle tracking
  settleTimer: number     // ms spent in stable state (reset on movement)
  settled: boolean        // fully settled
  captured: boolean       // captured (permanently flipped + settled)
}

export interface DragState {
  startX: number; startZ: number
  currentX: number; currentZ: number
  active: boolean
}

export type ImpactType = "land" | "flip_hit" | "glancing_hit" | "ringout" | "collision" | "wobble" | "settle_complete" | "capture"

export interface ImpactEvent {
  type: ImpactType
  x: number; z: number
  intensity: number
}

export interface TrajectoryPoint { x: number; y: number; z: number }

export interface SimResult {
  discs: DiscState[]
  impacts: ImpactEvent[]
  landedDiscId: string | null
}

// ─── Field Helpers ───

export function isInField(x: number, z: number, margin: number = 0): boolean {
  return x > -FIELD_HALF_W + margin && x < FIELD_HALF_W - margin &&
         z > -FIELD_HALF_L + margin && z < FIELD_HALF_L - margin
}

export function isInPlayerHalf(x: number, z: number): boolean {
  return isInField(x, z) && z > CENTER_LINE_Z
}

export function isInOpponentHalf(x: number, z: number): boolean {
  return isInField(x, z) && z < CENTER_LINE_Z
}

export function clampToField(x: number, z: number, margin: number = DISC_RADIUS): [number, number] {
  return [
    Math.max(-FIELD_HALF_W + margin, Math.min(FIELD_HALF_W - margin, x)),
    Math.max(-FIELD_HALF_L + margin, Math.min(FIELD_HALF_L - margin, z))
  ]
}

export function isInOwnerZone(x: number, z: number, owner: "player" | "opponent"): boolean {
  if (!isInField(x, z, DISC_RADIUS)) return false
  return owner === "player" ? z > CENTER_LINE_Z + 0.8 : z < CENTER_LINE_Z - 0.8
}

// ─── Positioning validation ───

export function validatePosition(
  x: number, z: number, owner: "player" | "opponent",
  existingDiscs: Array<{ x: number; z: number; owner: string }>,
  minSeparation: number = DISC_RADIUS * 2.2
): { valid: boolean; reason: string } {
  if (!isInField(x, z, 0.5)) return { valid: false, reason: "Fuera del campo" }
  if (owner === "player" && z < CENTER_LINE_Z + 0.6) return { valid: false, reason: "Cruza línea central" }
  if (owner === "opponent" && z > CENTER_LINE_Z - 0.6) return { valid: false, reason: "Cruza línea central" }
  
  const sameOwner = existingDiscs.filter(d => d.owner === owner)
  for (const d of sameOwner) {
    if (Math.hypot(x - d.x, z - d.z) < minSeparation) {
      return { valid: false, reason: "Demasiado cerca de otro tazo" }
    }
  }
  return { valid: true, reason: "" }
}

// ─── Face state detection by real orientation ───

export function detectFaceState(tiltX: number, tiltZ: number, speed: number, wobble: number): DiscFaceState {
  // tiltX ≈ pitch, tiltZ ≈ roll. Both near 0 = face up or face down.
  // We need to track a "base tilt" — but without a full quaternion, we approximate:
  // face_down: tiltX near 0, tiltZ near PI (or vice versa) — back normal up
  // face_up: tiltX near 0, tiltZ near 0 (or PI*2) — front normal up
  const totalTilt = Math.abs(tiltX) + Math.abs(tiltZ)
  if (speed > SETTLE_SPEED_MAX || wobble > SETTLE_ANGULAR_MAX) return "wobbling"
  if (totalTilt < 0.4) return "face_up"       // disc lying flat face-up
  if (totalTilt > 2.7 && totalTilt < 3.6) return "face_down"  // disc inverted (back up)
  return "sideways"
}

// ─── Roughness ───

export function floorRoughness(x: number, z: number): number {
  const absZ = Math.abs(z)
  const microVar = 1.0 + (Math.sin(x * 19.7 + z * 31.3) * 0.025)
  if (absZ < 1.5) return 1.0 * microVar          // smooth center
  else if (absZ < 3.5) return 0.78 * microVar     // medium
  else if (absZ < 5.0) return 0.6 * microVar      // rough
  else return 0.5 * microVar                       // very rough edges
}

// ─── Helpers ───

export function createDemoDisc(
  id: string, name: string, archetype: TazoArchetype,
  x: number, z: number, owner: "player" | "opponent", franchise = "minimon",
): DiscState {
  const stats = ARCHETYPE_STATS[archetype]
  return {
    id, name, x, y: 0, z, vx: 0, vy: 0, vz: 0,
    rotation: 0, rotationSpeed: 0, tiltX: 0, tiltZ: 0,
    wobbleAngle: 0, wobbleSpeed: 0, wobbleAxis: 0,
    moving: false, flying: false, flipped: false,
    faceState: "face_down", ringOut: false, landedOnId: null,
    owner, stats, archetype, franchise,
    settleTimer: 0, settled: true, captured: false,
  }
}

// ─── Launch ───

export function calculateLaunchVelocity(drag: DragState, stats: TazoStats) {
  const dx = drag.startX - drag.currentX
  const dz = drag.startZ - drag.currentZ
  const dist = Math.sqrt(dx * dx + dz * dz)
  if (dist < 0.12) return { vx: 0, vy: 0, vz: 0 }
  const angle = Math.atan2(dz, dx)
  const baseSpeed = dist * 5.0
  const speedMult = 0.55 + stats.speed / 180
  const hSpeed = Math.min(baseSpeed * speedMult, MAX_LAUNCH_SPEED)
  const weightMult = 1.15 - stats.weight / 180
  return {
    vx: Math.cos(angle) * hSpeed,
    vy: dist * JUMP_POWER * weightMult,
    vz: Math.sin(angle) * hSpeed,
  }
}

// ─── Trajectory preview ───

export function calculateTrajectoryPreview(
  startX: number, startZ: number, drag: DragState, stats: TazoStats, steps = 70
): TrajectoryPoint[] {
  const { vx, vy, vz } = calculateLaunchVelocity(drag, stats)
  if (Math.abs(vx) < 0.01 && Math.abs(vz) < 0.01 && vy < 1) return []
  const dt = 1 / 60
  const points: TrajectoryPoint[] = [{ x: startX, y: 0, z: startZ }]
  let x = startX, y = 0, z = startZ
  let cvx = vx, cvy = vy, cvz = vz
  for (let i = 0; i < steps; i++) {
    cvy -= GRAVITY * dt; x += cvx * dt; y += cvy * dt; z += cvz * dt
    if (!isInField(x, z, 0.2)) {
      const [cx, cz] = clampToField(x, z, 0.2); x = cx; z = cz
      points.push({ x, y, z }); break
    }
    if (y <= 0) {
      const prev = points.length > 0 ? points[points.length - 1] : points[0]
      const ratio = prev.y / Math.max(prev.y - y, 0.001)
      points.push({ x: prev.x + (x - prev.x) * ratio, y: 0, z: prev.z + (z - prev.z) * ratio })
      break
    }
    points.push({ x, y, z })
  }
  return points
}

// ─── Collision detection ───

function detectCollision(attacker: DiscState, lx: number, lz: number, allDiscs: DiscState[]) {
  const best = allDiscs
    .filter(d => d.id !== attacker.id && !d.flying && !d.captured && !d.ringOut)
    .map(d => ({ id: d.id, dist: Math.hypot(lx - d.x, lz - d.z), dx: d.x - lx, dz: d.z - lz, isEnemy: d.owner !== attacker.owner }))
    .filter(d => d.dist < DISC_RADIUS * 2.8)
    .sort((a, b) => a.dist - b.dist)[0]
  if (!best) return { collided: false, targetId: "", impactType: "land" as ImpactType, intensity: 0, collisionNX: 0, collisionNZ: 0 }
  const nx = best.dx / (best.dist || 0.001), nz = best.dz / (best.dist || 0.001)
  const intensity = attacker.stats.weight / 100 * Math.hypot(attacker.vx, attacker.vz) * 4.5
  const overlap = (DISC_RADIUS * 2.0 - best.dist) / (DISC_RADIUS * 2.0)
  let impactType: ImpactType = "land"
  if (overlap > 0.6 && best.isEnemy) impactType = "flip_hit"
  else if (overlap > 0.3 && best.isEnemy) impactType = "glancing_hit"
  else if (best.isEnemy) impactType = "wobble"
  else impactType = "collision"
  return { collided: true, targetId: best.id, impactType, intensity, collisionNX: nx, collisionNZ: nz }
}

// ─── Realistic collision response ───
// Both discs react. Flip is detected by real orientation later, not here.

function resolveCollision(
  attacker: DiscState, defender: DiscState,
  nx: number, nz: number, intensity: number
): { attacker: Partial<DiscState>; defender: Partial<DiscState> } {
  const aM = attacker.stats.weight / 100, dM = defender.stats.weight / 100
  const restitution = 0.35
  const transferRatio = (aM * (1 + restitution)) / (aM + dM)
  const roughness = floorRoughness(defender.x, defender.z)
  const groundResist = (1.0 - roughness) * dM * 0.8

  const defVx = attacker.vx * transferRatio
  const defVz = attacker.vz * transferRatio
  const attVx = attacker.vx * (1.0 - transferRatio * 0.7)
  const attVz = attacker.vz * (1.0 - transferRatio * 0.7)

  // Tilt from impact (visual wobble → real tilt)
  const tiltIntensity = Math.min(intensity / 6, 2.5)
  const impactTilt = tiltIntensity * 0.4
  const impactTiltDir = Math.atan2(nz, nx)

  return {
    attacker: {
      vx: attVx, vy: attacker.vy > 0 ? attacker.vy * 0.3 : 0, vz: attVz,
      moving: true, flying: attacker.vy > 0.3,
      wobbleAngle: 0.15, wobbleSpeed: intensity * 0.2, wobbleAxis: impactTiltDir,
      tiltX: Math.cos(impactTiltDir) * impactTilt * 0.5,
      tiltZ: Math.sin(impactTiltDir) * impactTilt * 0.5,
      faceState: "wobbling", settled: false, settleTimer: 0,
    },
    defender: {
      vx: defVx * (1.0 - groundResist), vz: defVz * (1.0 - groundResist),
      moving: true,
      wobbleAngle: tiltIntensity * 0.35, wobbleSpeed: intensity * 0.25, wobbleAxis: impactTiltDir + Math.PI,
      tiltX: Math.cos(impactTiltDir + Math.PI) * impactTilt,
      tiltZ: Math.sin(impactTiltDir + Math.PI) * impactTilt,
      faceState: "wobbling", settled: false, settleTimer: 0,
    }
  }
}

// ─── Overlap resolution ───

function resolveDiscOverlaps(discs: DiscState[]): DiscState[] {
  const result = discs.map(d => ({ ...d }))
  for (let iter = 0; iter < 3; iter++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i], b = result[j]
        if (a.flying || a.captured || a.ringOut || b.flying || b.captured || b.ringOut) continue
        const dx = b.x - a.x, dz = b.z - a.z, dist = Math.hypot(dx, dz)
        if (dist < DISC_RADIUS * 2.0 && dist > 0.001) {
          const overlap = (DISC_RADIUS * 2.0 - dist) * 0.51
          const nx = dx / dist, nz = dz / dist
          a.x -= nx * overlap; a.z -= nz * overlap
          b.x += nx * overlap; b.z += nz * overlap
          ;[a.x, a.z] = clampToField(a.x, a.z)
          ;[b.x, b.z] = clampToField(b.x, b.z)
        }
      }
    }
  }
  return result
}

// ─── Main simulation step ───

export function simulateStep(discs: DiscState[], delta: number): SimResult {
  const dt = Math.min(delta, 0.033)
  const impacts: ImpactEvent[] = []
  let landedDiscId: string | null = null
  const defenderPatches = new Map<string, { patch: Partial<DiscState>; impactType: ImpactType; intensity: number }>()

  const stepped = discs.map(disc => {
    if (disc.captured || disc.ringOut) {
      return { ...disc, moving: false, flying: false, vx: 0, vy: 0, vz: 0, wobbleAngle: 0, wobbleSpeed: 0, settled: true }
    }

    // Idle disc: decay wobble, track settle
    if (!disc.moving && !disc.flying) {
      let { wobbleAngle: wa, wobbleSpeed: ws, tiltX, tiltZ, settleTimer, settled } = disc
      const isWobbling = (wa > 0.005 || ws > 0.01 || Math.abs(tiltX) > 0.02 || Math.abs(tiltZ) > 0.02)
      
      if (isWobbling) {
        wa *= 0.93; ws *= 0.88
        tiltX *= 0.92; tiltZ *= 0.92
        settleTimer = 0
        settled = false
        const faceState = detectFaceState(tiltX, tiltZ, Math.hypot(disc.vx, disc.vz), wa)
        return { ...disc, wobbleAngle: wa, wobbleSpeed: ws, tiltX, tiltZ, settleTimer, settled, faceState }
      } else {
        // Stable — accumulate settle timer
        const newTimer = settleTimer + delta * 1000
        const isSettled = newTimer >= SETTLE_TIME_MS
        const faceState = detectFaceState(tiltX, tiltZ, 0, 0)
        
        if (faceState === "face_up" && disc.faceState !== "face_up" && isSettled) {
          // Disc settled face-up = possible capture
          impacts.push({ type: "capture", x: disc.x, z: disc.z, intensity: 8 })
        }
        
        return { ...disc, wobbleAngle: 0, wobbleSpeed: 0, tiltX: Math.abs(tiltX) < 0.01 ? 0 : tiltX, tiltZ: Math.abs(tiltZ) < 0.01 ? 0 : tiltZ, settleTimer: newTimer, settled: isSettled, faceState }
      }
    }

    let { x, y, z, vx, vy, vz, moving, flying, wobbleAngle: wa, wobbleSpeed: ws, tiltX, tiltZ, settled, settleTimer } = disc

    if (flying) {
      vy -= GRAVITY * dt; x += vx * dt; z += vz * dt; y += vy * dt
      if (!isInField(x, z, 0.1)) {
        const [cx, cz] = clampToField(x, z, 0.1); x = cx; z = cz; vx *= 0.25; vz *= 0.25
      }
      if (y <= 0) {
        y = 0; flying = false; [x, z] = clampToField(x, z, 0.05)
        if (!isInField(x, z, 0.05)) {
          impacts.push({ type: "ringout", x, z, intensity: 6 })
          return { ...disc, x, y, z, vx: 0, vy: 0, vz: 0, moving: false, flying: false, ringOut: true, wobbleAngle: 0, wobbleSpeed: 0, settleTimer: 0, settled: false, tiltX: 0, tiltZ: 0 } as DiscState
        }
        const collision = detectCollision(disc, x, z, discs)
        if (collision.collided) {
          const def = discs.find(d => d.id === collision.targetId)
          if (def && collision.impactType !== "collision") {
            const { attacker: aP, defender: dP } = resolveCollision(disc, def, collision.collisionNX, collision.collisionNZ, collision.intensity)
            impacts.push({ type: collision.impactType, x, z, intensity: collision.intensity })
            const [ox, oz] = clampToField(x + collision.collisionNX * -0.3, z + collision.collisionNZ * -0.3)
            // Apply defender response by storing in a side-channel Map
            defenderPatches.set(collision.targetId, { patch: dP, impactType: collision.impactType, intensity: collision.intensity })
            return { ...disc, x: ox, y, z: oz, vx: aP.vx ?? 0, vy: aP.vy ?? 0, vz: aP.vz ?? 0, moving: aP.moving ?? false, flying: aP.flying ?? false, wobbleAngle: aP.wobbleAngle ?? 0.15, wobbleSpeed: aP.wobbleSpeed ?? 2, wobbleAxis: aP.wobbleAxis ?? 0, tiltX: aP.tiltX ?? 0, tiltZ: aP.tiltZ ?? 0, faceState: aP.faceState ?? "wobbling", settled: false, settleTimer: 0, landedOnId: collision.targetId }
          }
          impacts.push({ type: "land", x, z, intensity: 2 })
          return { ...disc, x, y, z, vx: vx * 0.25, vy: 0, vz: vz * 0.25, moving: Math.hypot(vx, vz) * 0.25 > 0.5, flying: false, wobbleAngle: 0.08, wobbleSpeed: 1.5, wobbleAxis: Math.atan2(collision.collisionNZ, collision.collisionNX), tiltX: 0, tiltZ: 0, faceState: "wobbling", settled: false, settleTimer: 0, landedOnId: null }
        }
        impacts.push({ type: "land", x, z, intensity: 2 })
        return { ...disc, x, y, z, vx: 0, vy: 0, vz: 0, moving: false, flying: false, wobbleAngle: 0, wobbleSpeed: 0, tiltX: 0, tiltZ: 0, faceState: "face_down", settled: false, settleTimer: 0, landedOnId: null }
      }
    } else if (moving) {
      x += vx * dt; z += vz * dt
      for (const od of discs.filter(d => d.id !== disc.id && !d.flying && !d.captured && !d.ringOut)) {
        const dx2 = x - od.x, dz2 = z - od.z, dist2 = Math.hypot(dx2, dz2)
        if (dist2 < DISC_RADIUS * 2.0 && dist2 > 0.0001) {
          const nx = dx2 / dist2, nz = dz2 / dist2
          const relVn = vx * nx + vz * nz - (od.vx * nx + od.vz * nz)
          if (relVn > 0) { const imp = relVn * 0.5; vx -= imp * nx; vz -= imp * nz; x -= nx * (DISC_RADIUS * 2.0 - dist2) * 0.55; z -= nz * (DISC_RADIUS * 2.0 - dist2) * 0.55 }
        }
      }
      const roughnessMod = floorRoughness(x, z)
      const friction = 4.5 * (2.0 - roughnessMod)
      const speed = Math.hypot(vx, vz)
      if (speed > 0.05) { const ns = Math.max(0, speed - friction * dt); const ratio = ns / speed; vx *= ratio; vz *= ratio }
      else { vx = 0; vz = 0; moving = false }
      wa *= 0.93; ws *= 0.88; tiltX *= 0.92; tiltZ *= 0.92
      settled = false; settleTimer = 0
      ;[x, z] = clampToField(x, z)
    }
    return { ...disc, x, y, z, vx, vy, vz, moving, flying, wobbleAngle: wa, wobbleSpeed: ws, tiltX, tiltZ, settled, settleTimer, faceState: detectFaceState(tiltX, tiltZ, Math.hypot(vx, vz), wa) } as DiscState
  })

  // Apply defender patches from collision responses
  const withDefenderPatches = (stepped as DiscState[]).map(d => {
    const defPatch = defenderPatches.get(d.id)
    if (!defPatch) return d
    const { patch, impactType } = defPatch
    return {
      ...d,
      vx: patch.vx ?? d.vx,
      vy: patch.vy ?? d.vy,
      vz: patch.vz ?? d.vz,
      moving: patch.moving ?? d.moving,
      flying: patch.flying ?? d.flying,
      wobbleAngle: patch.wobbleAngle ?? d.wobbleAngle,
      wobbleSpeed: patch.wobbleSpeed ?? d.wobbleSpeed,
      wobbleAxis: patch.wobbleAxis ?? d.wobbleAxis,
      tiltX: patch.tiltX ?? d.tiltX,
      tiltZ: patch.tiltZ ?? d.tiltZ,
      faceState: patch.faceState ?? d.faceState,
      settled: patch.settled ?? d.settled,
      settleTimer: patch.settleTimer ?? d.settleTimer,
      // flip_hit with enough intensity directly flips the defender
      flipped: impactType === "flip_hit" && defPatch.intensity > 6
        ? true
        : d.flipped,
    } as DiscState
  })

  // Apply capture: discs that settled face-up become flipped+captured
  const capped: DiscState[] = withDefenderPatches.map(d => {
    if (d.settled && d.faceState === "face_up" && !d.flipped && d.owner !== "player") {
      const capped: DiscState = { ...d, flipped: true, captured: true, wobbleAngle: 0.1, wobbleSpeed: 2, tiltX: 0, tiltZ: 0, faceState: "face_up" as DiscFaceState, settled: true }
      return capped
    }
    return d
  })

  return { discs: resolveDiscOverlaps(capped), impacts, landedDiscId }
}

export function allStopped(discs: DiscState[]): boolean {
  return discs.every(d => !d.moving && !d.flying && d.settled)
}

export function getActiveDiscs(discs: DiscState[], owner: "player" | "opponent"): DiscState[] {
  return discs.filter(d => d.owner === owner && !d.captured && !d.ringOut)
}
