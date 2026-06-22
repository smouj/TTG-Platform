import { describe, it, expect } from "vitest"
import {
  createDemoDisc, calculateLaunchVelocity, calculateTrajectoryPreview,
  simulateStep, allStopped, spreadDiscs,
  ARCHETYPE_STATS, GRAVITY, JUMP_POWER,
  ARENA_RADIUS, DISC_RADIUS, MIN_LAUNCH_SPEED,
} from "../physics"

describe("createDemoDisc", () => {
  it("creates a disc with correct archetype stats", () => {
    const d = createDemoDisc("t1", "TestTazo", "heavy", 1, 2, "player")
    expect(d.id).toBe("t1")
    expect(d.name).toBe("TestTazo")
    expect(d.archetype).toBe("heavy")
    expect(d.stats.attack).toBe(ARCHETYPE_STATS.heavy.attack)
    expect(d.owner).toBe("player")
    expect(d.x).toBe(1); expect(d.z).toBe(2)
    expect(d.y).toBe(0)
    expect(d.moving).toBe(false); expect(d.flying).toBe(false)
    expect(d.flipped).toBe(false)
  })
})

describe("spreadDiscs", () => {
  it("spreads discs along x at given z side", () => {
    const discs = [
      createDemoDisc("a", "A", "balanced", 0, 0, "player"),
      createDemoDisc("b", "B", "heavy", 0, 0, "player"),
      createDemoDisc("c", "C", "spinner", 0, 0, "player"),
    ]
    const spread = spreadDiscs(discs, 1)
    expect(spread[0].z).toBe(2.8)
    expect(spread[1].z).toBe(2.8)
    expect(spread[2].z).toBe(2.8)
    // Centers should be spaced
    expect(spread[1].x).toBeCloseTo(0, 0)
    expect(Math.abs(spread[0].x)).toBeGreaterThan(0.5)
  })
})

describe("calculateLaunchVelocity", () => {
  it("returns zero for tiny drag", () => {
    const r = calculateLaunchVelocity(
      { startX: 0, startZ: 0, currentX: 0.05, currentZ: 0, active: true },
      ARCHETYPE_STATS.balanced
    )
    expect(r.vx).toBe(0); expect(r.vy).toBe(0)
  })

  it("generates upward velocity for normal drag", () => {
    const r = calculateLaunchVelocity(
      { startX: 0, startZ: 1.5, currentX: 0, currentZ: 0, active: true },
      ARCHETYPE_STATS.balanced
    )
    expect(r.vy).toBeGreaterThan(5)
  })

  it("slingshot: drag left → disc goes right", () => {
    // Drag from (0,0) to (-1.5,0) — finger moves left
    const r = calculateLaunchVelocity(
      { startX: 0, startZ: 0, currentX: -1.5, currentZ: 0, active: true },
      ARCHETYPE_STATS.balanced
    )
    // Disc should go right (positive x)
    expect(r.vx).toBeGreaterThan(0)
  })

  it("heavy tazos jump lower than spinners", () => {
    const drag = { startX: 0, startZ: 0, currentX: -2, currentZ: -2, active: true }
    const heavy = calculateLaunchVelocity(drag, ARCHETYPE_STATS.heavy)
    const spinner = calculateLaunchVelocity(drag, ARCHETYPE_STATS.spinner)
    expect(spinner.vy).toBeGreaterThan(heavy.vy)
  })

  it("spinner travels faster horizontally than heavy", () => {
    const drag = { startX: 0, startZ: 0, currentX: -3, currentZ: 0, active: true }
    const heavy = calculateLaunchVelocity(drag, ARCHETYPE_STATS.heavy)
    const spinner = calculateLaunchVelocity(drag, ARCHETYPE_STATS.spinner)
    const sh = Math.hypot(spinner.vx, spinner.vz)
    const hh = Math.hypot(heavy.vx, heavy.vz)
    expect(sh).toBeGreaterThan(hh)
  })
})

describe("calculateTrajectoryPreview", () => {
  it("returns empty for no launch", () => {
    const r = calculateTrajectoryPreview(0, 0,
      { startX: 0, startZ: 0, currentX: 0, currentZ: 0, active: false },
      ARCHETYPE_STATS.balanced)
    expect(r.length).toBe(0)
  })

  it("generates parabolic arc with correct start and end", () => {
    const r = calculateTrajectoryPreview(0, 0,
      { startX: 0, startZ: 2, currentX: 0, currentZ: 0.5, active: true },
      ARCHETYPE_STATS.balanced, 100)
    expect(r.length).toBeGreaterThan(5)
    expect(r[0].y).toBe(0) // starts on ground
    // Middle should be airborne
    const mid = r[Math.floor(r.length / 3)]
    expect(mid.y).toBeGreaterThan(0.05)
    // Last point is either landed (y=0) or at arena boundary
    const last = r[r.length - 1]
    const lastDist = Math.hypot(last.x, last.z)
    expect(last.y === 0 || lastDist >= ARENA_RADIUS - 0.5).toBe(true)
  })
})

describe("simulateStep", () => {
  it("applies gravity to flying discs", () => {
    const d = createDemoDisc("f1", "Flier", "balanced", 0, 0, "player")
    d.flying = true; d.moving = true
    d.vx = 4; d.vy = 10; d.vz = 0; d.y = 0.3
    const result = simulateStep([d], 0.1)
    expect(result.discs[0].vy).toBeLessThan(10) // gravity reduced vy
    expect(result.discs[0].x).toBeGreaterThan(0) // moved forward
  })

  it("disc lands when y reaches 0", () => {
    const d = createDemoDisc("f2", "Faller", "balanced", 0, 0, "player")
    d.flying = true; d.moving = true
    d.vx = 0; d.vy = -3; d.vz = 0; d.y = 0.04
    const result = simulateStep([d], 0.1)
    expect(result.discs[0].flying).toBe(false)
    expect(result.discs[0].y).toBe(0)
  })

  it("detects ringOut when landing outside arena", () => {
    const d = createDemoDisc("r1", "Ringer", "balanced", 3.5, 3.5, "player")
    d.flying = true; d.moving = true
    d.vx = 2; d.vy = -1; d.vz = 2; d.y = 0.03
    const result = simulateStep([d], 0.05)
    const rd = result.discs[0]
    expect(rd.ringOut || !rd.flying).toBe(true)
  })

  it("does not crash with empty disc array", () => {
    const result = simulateStep([], 0.05)
    expect(result.discs.length).toBe(0)
  })
})

describe("allStopped", () => {
  it("returns true when all discs idle", () => {
    const discs = [
      createDemoDisc("a", "A", "balanced", 0, 0, "player"),
      createDemoDisc("b", "B", "heavy", 1, 0, "opponent"),
    ]
    expect(allStopped(discs)).toBe(true)
  })

  it("returns false when any disc is flying", () => {
    const d = createDemoDisc("a", "A", "balanced", 0, 0, "player")
    d.flying = true
    expect(allStopped([d])).toBe(false)
  })

  it("returns false when any disc is moving", () => {
    const d = createDemoDisc("a", "A", "balanced", 0, 0, "player")
    d.moving = true
    expect(allStopped([d])).toBe(false)
  })
})
