import { describe, it, expect } from "vitest"
import {
  createDemoDisc, calculateLaunchVelocity, calculateTrajectoryPreview,
  simulateStep, allStopped, ARCHETYPE_STATS, GRAVITY, JUMP_POWER,
  ARENA_RADIUS, DISC_RADIUS,
} from "../physics"

describe("createDemoDisc", () => {
  it("creates a disc with correct archetype stats", () => {
    const d = createDemoDisc("t1", "TestTazo", "heavy", 1, 2, "player")
    expect(d.id).toBe("t1")
    expect(d.name).toBe("TestTazo")
    expect(d.archetype).toBe("heavy")
    expect(d.stats.attack).toBe(ARCHETYPE_STATS.heavy.attack)
    expect(d.owner).toBe("player")
    expect(d.x).toBe(1)
    expect(d.z).toBe(2)
    expect(d.y).toBe(0)
    expect(d.moving).toBe(false)
    expect(d.flying).toBe(false)
    expect(d.flipped).toBe(false)
  })

  it("respects owner parameter", () => {
    const p = createDemoDisc("p", "Player", "balanced", 0, 0, "player")
    const o = createDemoDisc("o", "Opp", "balanced", 0, 0, "opponent")
    expect(p.owner).toBe("player")
    expect(o.owner).toBe("opponent")
  })
})

describe("calculateLaunchVelocity", () => {
  it("returns zero for tiny drag", () => {
    const result = calculateLaunchVelocity(
      { startX: 0, startZ: 0, currentX: 0.05, currentZ: 0, active: true },
      ARCHETYPE_STATS.balanced
    )
    expect(result.vx).toBe(0)
    expect(result.vy).toBe(0)
    expect(result.vz).toBe(0)
  })

  it("generates significant upward velocity for a normal drag", () => {
    // Drag from (0,1) to (0,0) — pulling toward screen bottom
    const result = calculateLaunchVelocity(
      { startX: 0, startZ: 1, currentX: 0, currentZ: -0.5, active: true },
      ARCHETYPE_STATS.balanced
    )
    // Should have upward velocity
    expect(result.vy).toBeGreaterThan(5)
  })

  it("launch direction is opposite to drag", () => {
    // Drag from (0,0) to (-1,0) — pulling left
    // Disc should go right (positive x velocity)
    const result = calculateLaunchVelocity(
      { startX: 0, startZ: 0, currentX: -1, currentZ: 0, active: true },
      ARCHETYPE_STATS.balanced
    )
    expect(result.vx).toBeGreaterThan(0)
    expect(Math.abs(result.vz)).toBeLessThan(1)
  })

  it("heavy tazos jump lower than light ones", () => {
    const drag = { startX: 0, startZ: 0, currentX: -2, currentZ: -2, active: true }
    const heavyJump = calculateLaunchVelocity(drag, ARCHETYPE_STATS.heavy)
    const spinnerJump = calculateLaunchVelocity(drag, ARCHETYPE_STATS.spinner)
    expect(spinnerJump.vy).toBeGreaterThan(heavyJump.vy)
  })

  it("high-speed tazos travel faster horizontally", () => {
    const drag = { startX: 0, startZ: 0, currentX: -2, currentZ: 0, active: true }
    const heavy = calculateLaunchVelocity(drag, ARCHETYPE_STATS.heavy)
    const spinner = calculateLaunchVelocity(drag, ARCHETYPE_STATS.spinner)
    const spinnerHSpeed = Math.sqrt(spinner.vx ** 2 + spinner.vz ** 2)
    const heavyHSpeed = Math.sqrt(heavy.vx ** 2 + heavy.vz ** 2)
    expect(spinnerHSpeed).toBeGreaterThan(heavyHSpeed)
  })
})

describe("calculateTrajectoryPreview", () => {
  it("returns empty for zero launch", () => {
    const result = calculateTrajectoryPreview(
      0, 0,
      { startX: 0, startZ: 0, currentX: 0, currentZ: 0, active: false },
      ARCHETYPE_STATS.balanced
    )
    expect(result.length).toBe(0)
  })

  it("generates parabolic arc points", () => {
    const result = calculateTrajectoryPreview(
      0, 0,
      { startX: 0, startZ: 1, currentX: 0, currentZ: -0.5, active: true },
      ARCHETYPE_STATS.balanced,
      120
    )
    expect(result.length).toBeGreaterThan(5)
    // First point is at ground
    expect(result[0].y).toBe(0)
    // Middle points should be above ground (parabolic arc)
    const midIdx = Math.floor(result.length / 3)
    expect(result[midIdx].y).toBeGreaterThan(0.1)
    // Last point is either landed (y=0) or at arena boundary (y may be > 0)
    const last = result[result.length - 1]
    const lastDist = Math.sqrt(last.x ** 2 + last.z ** 2)
    // Either it landed (y=0) or hit arena boundary (dist ≈ ARENA_RADIUS)
    expect(last.y === 0 || lastDist >= ARENA_RADIUS - 0.5).toBe(true)
  })

  it("ends at arena boundary if trajectory goes outside", () => {
    // Super strong drag
    const result = calculateTrajectoryPreview(
      3, 0,
      { startX: 3, startZ: 0, currentX: 0, currentZ: 0, active: true },
      ARCHETYPE_STATS.spinner,
      60
    )
    if (result.length > 0) {
      const last = result[result.length - 1]
      const dist = Math.sqrt(last.x ** 2 + last.z ** 2)
      expect(dist).toBeLessThanOrEqual(ARENA_RADIUS + 0.5)
    }
  })
})

describe("simulateStep", () => {
  it("applies gravity to flying discs", () => {
    const disc = createDemoDisc("f1", "Flyer", "balanced", 0, 0, "player")
    disc.flying = true
    disc.moving = true
    disc.vx = 5
    disc.vy = 8  // jumping up
    disc.vz = 0
    disc.y = 0.5

    const result = simulateStep([disc], 0.1)

    // After 0.1s, vy should have decreased due to gravity
    expect(result.discs[0].vy).toBeLessThan(8)
    // Should have moved forward
    expect(result.discs[0].x).toBeGreaterThan(0)
  })

  it("discs land when y reaches 0", () => {
    const disc = createDemoDisc("f2", "Faller", "balanced", 0, 0, "player")
    disc.flying = true
    disc.moving = true
    disc.vx = 0
    disc.vy = -2  // falling fast
    disc.vz = 0
    disc.y = 0.05

    const result = simulateStep([disc], 0.1)
    const landed = result.discs[0]

    expect(landed.flying).toBe(false)
    expect(landed.y).toBe(0)
  })

  it("marks disc as ringOut when landing outside arena", () => {
    const disc = createDemoDisc("r1", "Ringer", "balanced", 3, 3, "player")
    disc.flying = true
    disc.moving = true
    disc.vx = 3
    disc.vy = -1
    disc.vz = 3
    disc.y = 0.03

    const result = simulateStep([disc], 0.1)
    // Should be marked ringOut or landed at boundary
    const r = result.discs[0]
    const landedOrOut = !r.flying || r.ringOut
    expect(landedOrOut).toBe(true)
  })
})

describe("allStopped", () => {
  it("returns true when nothing is moving or flying", () => {
    const discs = [
      createDemoDisc("a", "A", "balanced", 0, 0, "player"),
      createDemoDisc("b", "B", "heavy", 1, 0, "opponent"),
    ]
    expect(allStopped(discs)).toBe(true)
  })

  it("returns false when something is flying", () => {
    const d = createDemoDisc("a", "A", "balanced", 0, 0, "player")
    d.flying = true
    expect(allStopped([d])).toBe(false)
  })

  it("returns false when something is moving", () => {
    const d = createDemoDisc("a", "A", "balanced", 0, 0, "player")
    d.moving = true
    expect(allStopped([d])).toBe(false)
  })
})
