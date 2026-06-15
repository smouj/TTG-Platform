// ============================================================
import { getWearStatPenalty } from "./wear-system"
// Trading Tazos Game — Battle Game Loop v4
// Betting Slam — high-stakes elimination mechanic.
//
// CORRECT MECHANIC (tazo betting):
//   1. Each player draws 5 random tazos from their deck of 20.
//   2. Both stake 1 tazo face-down at center as a BET.
//   3. Coin flip determines who slams first.
//   4. Slammer picks a launcher tazo from their hand.
//   5. Launcher falls from above, tries to flip opponent's staked tazo.
//   6. FLIP → capture rival's tazo (+1 to score), keep yours.
//   7. MISS → your thrown tazo becomes staked (lost from hand).
//   8. When a player's hand runs out, draw 5 more from deck.
//   9. Win when opponent has NO tazos remaining (elimination).
// ============================================================

// ────────────────────────────────────────
// Tazo finish & creature variants (shared)
// ────────────────────────────────────────

export type TazoFinish =
  | "normal"
  | "matte"
  | "glossy"
  | "holo"
  | "foil"
  | "aurora"
  | "cracked_ice"
  | "glitter"
  | "lenticular"
  | "oil_slick"
  | "pearlescent"
  | "prismatic"
  | "rainbow"
  | "stardust"
  | "chrome"
  | "gold"
  | "rainbow"
  | "glitter"
  | "stardust"
  | "aurora"
  | "cracked_ice"
  | "oil_slick"
  | "lenticular"
  | "pearlescent"

export type TazoCreatureVariant =
  | "standard"
  | "shiny"
  | "shadow"
  | "golden"
  | "promo"
  | "first_edition"
  | "misprint"

// ────────────────────────────────────────
// Tazo Card (deck / lobby / API)
// ────────────────────────────────────────

export interface TazoCard {
  id: string
  name: string
  slug: string
  franchise: "minimon" | "cybermon" | "dracobell"
  imageUrl: string | null
  shinyImageUrl?: string | null
  /** Vertical slam impact force */
  attack: number
  /** Resistance to being flipped */
  defense: number
  /** Staying in circle after impact */
  resistance: number
  /** Mass → more slam force, harder to lift */
  weight: number
  /** Auto-recovery from wobble */
  stability: number
  /** Torque on impact (spin transfer) */
  spin: number
  /** Reticle precision & tilt accuracy */
  control: number
  /** Rebound after slam (low = sticks, high = bounces away) */
  bounce: number
  /** Timing window for perfect slam */
  precision: number
  role?: string | null
  rarity?: string
  finish?: TazoFinish
  creatureVariant?: TazoCreatureVariant
  /** User-specific wear level 0-100 (affects stats) */
  wear?: number
}

// ────────────────────────────────────────
// Staked Tazo (face-down, waiting to be flipped)
// ────────────────────────────────────────

export type StakeState =
  | "face_down"        // Waiting to be hit
  | "wobbling"         // Hit but didn't flip — tense moment
  | "half_flip"        // Almost flipped, might recover
  | "face_up"          // Successfully flipped!
  | "out_of_circle"    // Knocked out of ring — doesn't count
  | "secured"          // Your own tazo flipped = safe
  | "captured"         // Rival tazo flipped = you captured it

export interface StakedTazo {
  id: string
  tazoName: string
  franchise: string
  imageUrl: string
  backImageUrl: string
  owner: "player" | "opponent"
  /** Position in world coords (x, y=table_top, z) */
  position: [number, number, number]
  state: StakeState
  wobbleIntensity: number   // 0-1, decays over time
  /** Whether this tazo has already been scored this round */
  scored: boolean
}

// ────────────────────────────────────────
// Airborne Launcher Tazo
// ────────────────────────────────────────

export type LauncherState =
  | "idle"          // Not visible
  | "aiming"        // Suspended above, reticle active
  | "charging"      // Rising higher as player charges
  | "falling"       // In freefall toward circle
  | "impacting"     // Contact flash frame
  | "landed"        // On table, resolving

export interface AirborneTazo {
  id: string
  tazoName: string
  franchise: string
  imageUrl: string
  backImageUrl: string
  finish?: string
  state: LauncherState
  /** World position (y = height above table) */
  position: [number, number, number]
  /** Current tilt [pitch, yaw, roll] in radians */
  tilt: [number, number, number]
  /** Spin angular velocity [x, y, z] */
  angularVelocity: [number, number, number]
  /** Current charge level 0-1 */
  charge: number
  /** Landing target (x, z) */
  targetX: number
  targetZ: number
  owner: "player" | "opponent"
}

// ────────────────────────────────────────
// Slam Parameters (player input)
// ────────────────────────────────────────

export interface SlamParams {
  tazoId: string
  /** Where the tazo will land — normalized -1..1 in arena space */
  impactX: number
  impactZ: number
  /** Vertical force 0..1 (height + downward speed) */
  verticalForce: number
  /** Timing accuracy 0..1 (1 = perfect release window) */
  timingAccuracy: number
  /** Tilt direction */
  tilt: TiltDirection
  /** Tilt intensity 0..1 */
  tiltIntensity: number
  /** Spin intensity 0..1 */
  spinIntensity: number
  /** Aim precision 0..1 */
  aimPrecision: number
}

export type TiltDirection = "flat" | "forward" | "backward" | "left" | "right"

// ────────────────────────────────────────
// Game Phases
// ────────────────────────────────────────

export type GameState =
  | "lobby"              // Mode select, deck setup
  | "intro"              // Camera flyover, opponent reveal
  | "round_start"        // Round begins, draw 5 from deck
  | "betting"            // Both players secretly select tazo to bet
  | "stakes_reveal"      // Reveal both staked tazos at center
  | "coin_flip"          // Random flip to determine who slams first
  | "player_aim"         // Player positions reticle over circle
  | "player_charge"      // Player holds to charge vertical force
  | "player_tilt"        // Player adjusts tilt & spin
  | "slamming"           // Tazo falls — gravity animation
  | "impact"             // Contact! Physics resolves
  | "resolve_impact"     // Show result: flip / wobble / miss
  | "opponent_aim"       // AI aims
  | "opponent_slam"      // AI slams
  | "turn_transition"    // Pass turn to next player
  | "round_end"          // Draw new hand, next round
  | "match_end"          // Final results
  | "paused"

// ────────────────────────────────────────
// Game Mode & Difficulty
// ────────────────────────────────────────

export type PlayMode = "practice" | "pvp_ranked" | "pvp_friend"
export type AIDifficulty = "novice" | "skilled" | "master"

// ────────────────────────────────────────
// Arena Config (vertical slam)
// ────────────────────────────────────────

export interface Arena3DConfig {
  /** Arena bowl radius in world units */
  radius: number
  /** Gravity acceleration for falling tazos (units/s²) */
  gravity: number
  /** How much velocity is lost on impact with table */
  impactDamping: number
  /** Ring-out distance from center */
  ringOutThreshold: number
  /** Minimum force to trigger any effect */
  minFlipForce: number
  /** Max launch height (world units) */
  maxLaunchHeight: number
  /** Friction when tazo slides on table after impact */
  tableFriction: number
}

export const DEFAULT_ARENA_3D: Arena3DConfig = {
  radius: 4.2,
  gravity: 22,
  impactDamping: 0.35,
  ringOutThreshold: 4.2,
  minFlipForce: 0.18,
  maxLaunchHeight: 7,
  tableFriction: 0.88,
}

// ────────────────────────────────────────
// Player State
// ────────────────────────────────────────

export interface PlayerGameState {
  id: "player" | "opponent"
  name: string
  deck: TazoCard[]
  score: number
  maxScore: number
  tazosRemaining: number
  captured: number
  currentTazo: TazoCard | null
  isAI: boolean
  aiDifficulty?: AIDifficulty
}

// ────────────────────────────────────────
// Round / Match Results
// ────────────────────────────────────────

export interface ImpactResult {
  flipped: string[]        // Tazo ids flipped face-up
  wobbled: string[]        // Wobbled but stayed down
  ringOut: string[]        // Knocked out of circle
  doubleFlip: boolean      // Both staked tazos flipped
  badLanding: boolean      // Launcher landed badly
  impactForce: number      // 0-1 actual force at contact
  edgeBonus: number        // Multiplier for edge hit
  description: string
  /** Whether the thrower's tazo becomes staked (lost it) */
  lostLauncher: boolean
  /** Whether the opponent's staked tazo was captured */
  opponentCaptured: boolean
}

export interface RoundResult {
  roundNumber: number
  throwerId: "player" | "opponent"
  throwerWonCoinFlip: boolean
  impact: ImpactResult
  playerScore: number
  opponentScore: number
  playerTazosLeft: number
  opponentTazosLeft: number
}

export interface MatchResult {
  winner: "player" | "opponent" | "draw"
  victoryType: "elimination" | "tko" | "forfeit" | "draw"
  playerScore: number
  opponentScore: number
  playerRemaining: number
  opponentRemaining: number
  rounds: RoundResult[]
  totalTurns: number
  playerCaptures: number
  opponentCaptures: number
  xpEarned: number
  summary: string
}

export interface MatchConfig {
  mode: PlayMode
  aiDifficulty: AIDifficulty
  arena: Arena3DConfig
  scoreToWin: number     // Default 5
  playerDeck: TazoCard[]
  opponentDeck: TazoCard[]
}

// ────────────────────────────────────────
// Match Factory
// ────────────────────────────────────────

export function createMatch(config: MatchConfig) {
  const playerDeck = config.playerDeck
  const opponentDeck = config.opponentDeck

  return {
    state: "lobby" as GameState,
    config,
    player: {
      id: "player" as const,
      name: "You",
      deck: playerDeck,
      score: 0,
      maxScore: config.scoreToWin,
      tazosRemaining: playerDeck.length,
      captured: 0,
      currentTazo: null,
      isAI: false,
    },
    opponent: {
      id: "opponent" as const,
      name: config.mode === "practice"
        ? `AI (${config.aiDifficulty})`
        : "Opponent",
      deck: opponentDeck,
      score: 0,
      maxScore: config.scoreToWin,
      tazosRemaining: opponentDeck.length,
      captured: 0,
      currentTazo: null,
      isAI: config.mode === "practice",
      aiDifficulty: config.aiDifficulty,
    },
    currentRound: 0,
    stakedTazos: [] as StakedTazo[],
    airborneTazo: null as AirborneTazo | null,
    roundHistory: [] as RoundResult[],
    turnNumber: 0,
  }
}

// ────────────────────────────────────────
// Back-Art URLs
// ────────────────────────────────────────

const BACK_ARTS: Record<string, string> = {
  minimon: "/tazos-artgen/backs/minimon-back.png",
  cybermon: "/tazos-artgen/backs/cybermon-back.png",
  dracobell: "/tazos-artgen/backs/dracobell-back.png",
}

// ─── Deterministic pseudo-random (seed-based, no Math.random) ───
let _seed = Date.now()
export function seedRNG(s: number) { _seed = s >>> 0 }
function rng(): number {
  _seed = (_seed * 1103515245 + 12345) >>> 0
  return (_seed & 0x7fffffff) / 0x7fffffff
}
export function simulateSlam(
  launcher: TazoCard,
  slam: SlamParams,
  staked: StakedTazo[],
  arena: Arena3DConfig,
  thrower: "player" | "opponent",
  defenders?: Map<string, TazoCard>
): { staked: StakedTazo[]; result: ImpactResult } {
  const {
    impactX, impactZ, verticalForce,
    timingAccuracy, tilt, tiltIntensity,
    spinIntensity, aimPrecision,
  } = slam

  // Scale stats by aimPrecision (affected by tazo.precision stat)
  // Apply wear penalty: damaged tazos have reduced stats
  const wearTier = launcher.wear && launcher.wear > 0
    ? launcher.wear <= 15 ? 'light_play' : launcher.wear <= 40 ? 'played' : launcher.wear <= 70 ? 'heavy_play' : 'damaged'
    : null
  const wearPenalty = (() => {
    if (!wearTier) return { attack: 0, defense: 0, stability: 0, precision: 0, control: 0 }
    const T: Record<string, any> = {
      light_play: { attack: 0.02, defense: 0.02, stability: 0.01, precision: 0, control: 0.01 },
      played: { attack: 0.05, defense: 0.05, stability: 0.03, precision: 0.02, control: 0.02 },
      heavy_play: { attack: 0.12, defense: 0.10, stability: 0.06, precision: 0.05, control: 0.05 },
      damaged: { attack: 0.20, defense: 0.18, stability: 0.12, precision: 0.10, control: 0.08 },
    }
    return T[wearTier] || { attack: 0, defense: 0, stability: 0, precision: 0, control: 0 }
  })()
  const effectiveAttack = launcher.attack * (1 - wearPenalty.attack) * aimPrecision
  const effectiveSpin = launcher.spin * (1 - wearPenalty.precision) * aimPrecision

  // ── 1. AIM: Apply precision error ──
  const aimError = (1 - aimPrecision) * 0.55
  const actualX = impactX + (rng() - 0.5) * aimError
  const actualZ = impactZ + (rng() - 0.5) * aimError

  // ── 2. FORCE: Timing affects effective force ──
  const timingMultiplier = 0.4 + timingAccuracy * 0.6  // 0.4-1.0
  const effectiveForce = verticalForce * timingMultiplier

  // ── 3. Calculate slam power ──
  //   attack: raw impact stat of launcher
  //   weight: adds momentum proportional to mass
  //   effectiveForce: player's charge + timing
  const launcherMass = 0.7 + launcher.weight / 250
  const launchHeight = arena.maxLaunchHeight * (0.2 + effectiveForce * 0.8)
  const impactVelocityY = Math.sqrt(2 * arena.gravity * launchHeight)
  const slamPower = (impactVelocityY * launcherMass) / 30  // Normalize to ~0-1

  // ── 4. TILT: Affects edge-hit chance ──
  const isEdgeAttack = tilt !== "flat" && tiltIntensity > 0.25
  const edgeChance = isEdgeAttack ? 0.35 + tiltIntensity * 0.45 : 0.1
  const hitsEdge = rng() < edgeChance

  // ── 5. SPIN: Adds torque, increases chaos ──
  const spinTorque = spinIntensity * launcher.spin / 100

  // ── 6. Process each staked tazo ──
  const flipped: string[] = []
  const wobbled: string[] = []
  const ringOut: string[] = []
  const newStaked = staked.map(st => {
    if (st.state === "secured" || st.state === "captured") return st

    // Distance from impact point to staked tazo center
    const dx = actualX - st.position[0]
    const dz = actualZ - st.position[2]
    const dist = Math.sqrt(dx * dx + dz * dz)

    // Impact degrades with distance
    const distFalloff = Math.max(0, 1 - dist / 0.9)  // 0 at >0.9 units
    if (distFalloff < 0.05) return st  // Too far, no effect

    // ── Flip Score ──
    const edgeBonus = (hitsEdge && dist < 0.55) ? 1.5 : 0.85
    const distBonus = 1 - dist * 0.5   // Closer = more flip
    const spinBonus = 1 + spinTorque * 0.4

    // Attacker stats
    const attackFactor = launcher.attack / 100  // 0-1
    const weightFactor = launcher.weight / 100   // 0-1

    // Defender stats — use actual tazo stats + wear
    const ownTazo = st.owner === thrower
    const defender = defenders?.get(st.id)
    let defenseFactor: number
    let resistFactor: number
    let stabilityFactor: number
    let weightPenaltyFactor: number

    if (defender) {
      // Apply wear to defender stats
      const defenderWear = getWearStatPenalty(defender.wear || 0)
      const defDefense = (defender.defense || 50) * (1 - defenderWear.defense)
      const defResist = (defender.resistance || 50) * (1 - defenderWear.resistance)
      const defStability = (defender.stability || 50) * (1 - defenderWear.stability)
      const defWeight = (defender.weight || 50) / 100

      defenseFactor = ownTazo ? 0.65 : (1 - defDefense / 100)
      resistFactor = 1 - defResist / 100
      stabilityFactor = 1 - defStability / 100
      weightPenaltyFactor = defWeight * 0.05  // Heavier = harder to flip (0-0.05)
    } else {
      // Fallback: balanced defaults when defender stats unavailable
      defenseFactor = ownTazo ? 0.65 : 0.80
      resistFactor = 0.85
      stabilityFactor = 0.40
      weightPenaltyFactor = 0
    }

    const flipScore =
      (slamPower * 0.35) +
      (attackFactor * 0.20) +
      (weightFactor * 0.12) +
      (edgeBonus * 0.15) +
      (distBonus * 0.08) +
      (spinBonus * 0.10) -
      (defenseFactor * 0.08) -
      (resistFactor * 0.06) -
      (stabilityFactor * 0.06) -
      weightPenaltyFactor  // Heavier defenders resist flips slightly more

    // ── Bounce check (knock out of circle) ──
    const bounceChance = launcher.bounce / 120 + slamPower * 0.15
    let knockedOut = false
    if (slamPower > 0.4 && rng() < bounceChance) {
      const stDistFromCenter = Math.sqrt(
        st.position[0] ** 2 + st.position[2] ** 2
      )
      const pushDist = slamPower * 1.2
      const newDist = stDistFromCenter + pushDist
      if (newDist > arena.ringOutThreshold) {
        knockedOut = true
      }
    }

    // ── Resolve ──
    const threshold = 0.32  // Flip threshold
    const wobbleThreshold = 0.18

    if (knockedOut) {
      ringOut.push(st.id)
      return { ...st, state: "out_of_circle" as StakeState, wobbleIntensity: 0 }
    }

    if (flipScore > threshold) {
      // FLIPPED!
      flipped.push(st.id)
      const newState: StakeState = st.owner === thrower ? "secured" : "captured"
      return { ...st, state: newState, wobbleIntensity: 0, scored: true }
    }

    if (flipScore > wobbleThreshold) {
      // WOBBLED — tense but stays face-down
      wobbled.push(st.id)
      return {
        ...st,
        state: "wobbling" as StakeState,
        wobbleIntensity: flipScore * 1.5,
      }
    }

    // MISS — barely moved
    return { ...st, wobbleIntensity: 0 }
  })

  // ── 7. Bad landing check ──
  const badLanding =
    effectiveForce < 0.2 ||
    (tiltIntensity > 0.75 && rng() < 0.3) ||
    (timingAccuracy < 0.25 && rng() < 0.4)

  // ── 8. Build result ──
  const doubleFlip = flipped.length >= 2
  const opponentCaptured = flipped.some(id => {
    const st = staked.find(s => s.id === id)
    return st && st.owner !== thrower
  })
  // Launcher is lost if no tazo was flipped at all
  const lostLauncher = flipped.length === 0 && !badLanding

  const result: ImpactResult = {
    flipped,
    wobbled,
    ringOut,
    doubleFlip,
    badLanding,
    impactForce: slamPower,
    edgeBonus: hitsEdge ? 1.5 : 1.0,
    lostLauncher: lostLauncher && !badLanding,
    opponentCaptured,
    description: doubleFlip
      ? "DOUBLE FLIP!"
      : flipped.length === 1
        ? (opponentCaptured ? "CAPTURED!" : "SECURED!")
        : wobbled.length > 0
          ? "WOBBLE..."
          : ringOut.length > 0
            ? "RING OUT"
            : badLanding
              ? "BAD LANDING"
              : "MISS — Lost it!",
  }

  return { staked: newStaked, result }
}

// ────────────────────────────────────────
// AI Decision Engine (vertical slam)
// ────────────────────────────────────────

export function generateAISlam(
  aiTazo: TazoCard,
  staked: StakedTazo[],
  arena: Arena3DConfig,
  difficulty: AIDifficulty
): SlamParams {
  // Find rival's staked tazos (not flipped yet)
  const targets = staked.filter(
    s => s.owner === "player" &&
      s.state !== "secured" &&
      s.state !== "captured" &&
      s.state !== "out_of_circle"
  )

  let impactX = 0, impactZ = 0
  let verticalForce = 0.5
  let aimPrecision = 0.7
  let timingAccuracy = 0.6
  let tilt: TiltDirection = "flat"
  let tiltIntensity = 0
  let spinIntensity = 0

  if (targets.length === 0) {
    // No targets — aim for center
    impactX = (rng() - 0.5) * 0.4
    impactZ = (rng() - 0.5) * 0.4
    verticalForce = 0.35 + rng() * 0.35
  } else {
    const target = targets[0]
    impactX = target.position[0] + (rng() - 0.5) * 0.2
    impactZ = target.position[2] + (rng() - 0.5) * 0.2

    // Base precision from tazo stat (0.2-1.0), scaled by difficulty
    const tazoBasePrecision = Math.max(0.2, (aiTazo.precision || 50) / 100)

    if (difficulty === "master") {
      aimPrecision = Math.min(1.0, tazoBasePrecision * 0.55 + 0.35 + rng() * 0.10)
      timingAccuracy = 0.8 + rng() * 0.2
      verticalForce = 0.55 + rng() * 0.35
      // Smart tilt: edge attack mostly
      tilt = rng() > 0.3 ? "forward" : "flat"
      tiltIntensity = 0.4 + rng() * 0.4
      spinIntensity = 0.2 + rng() * 0.3
    } else if (difficulty === "skilled") {
      aimPrecision = Math.min(1.0, tazoBasePrecision * 0.50 + 0.20 + rng() * 0.15)
      timingAccuracy = 0.55 + rng() * 0.3
      verticalForce = 0.45 + rng() * 0.35
      tilt = rng() > 0.5 ? "forward" : "flat"
      tiltIntensity = 0.25 + rng() * 0.3
      spinIntensity = rng() * 0.25
    } else {
      // Novice: mostly random, flat
      aimPrecision = Math.min(1.0, tazoBasePrecision * 0.35 + 0.05 + rng() * 0.15)
      timingAccuracy = 0.3 + rng() * 0.4
      verticalForce = 0.25 + rng() * 0.5
      tiltIntensity = rng() * 0.3
    }
  }

  return {
    tazoId: aiTazo.id,
    impactX, impactZ,
    verticalForce,
    timingAccuracy,
    tilt,
    tiltIntensity,
    spinIntensity,
    aimPrecision,
  }
}

// ────────────────────────────────────────
// Score calculation from impact (betting system)
// ────────────────────────────────────────

export function scoreBettingImpact(
  impact: ImpactResult,
  thrower: "player" | "opponent"
): { playerDelta: number; opponentDelta: number; playerLostTazos: number; opponentLostTazos: number } {
  let playerDelta = 0
  let opponentDelta = 0
  let playerLostTazos = 0
  let opponentLostTazos = 0

  // Captures: flipped opponent's staked tazo
  if (impact.opponentCaptured) {
    if (thrower === "player") {
      playerDelta += 1
      opponentLostTazos += 1  // Opponent lost their bet
    } else {
      opponentDelta += 1
      playerLostTazos += 1     // Player lost their bet
    }
  }

  // Launcher lost: thrown tazo becomes staked
  if (impact.lostLauncher) {
    if (thrower === "player") {
      playerLostTazos += 1
    } else {
      opponentLostTazos += 1
    }
  }

  // Bad landing: launcher stays but no effect
  // Double flip: capture both
  if (impact.doubleFlip) {
    if (thrower === "player") {
      playerDelta += 1  // Bonus for flipping both
      opponentLostTazos += 1
    } else {
      opponentDelta += 1
      playerLostTazos += 1
    }
  }

  return { playerDelta, opponentDelta, playerLostTazos, opponentLostTazos }
}

export function scoreImpact(
  impact: ImpactResult,
  staked: StakedTazo[],
  thrower: "player" | "opponent"
): { playerDelta: number; opponentDelta: number } {
  // Legacy compat: redirect to betting scorer
  const r = scoreBettingImpact(impact, thrower)
  return { playerDelta: r.playerDelta, opponentDelta: r.opponentDelta }
}

// ────────────────────────────────────────
// Match end check (elimination system)
// ────────────────────────────────────────

export function checkMatchEnd(
  playerScore: number,
  opponentScore: number,
  playerRemaining: number,
  opponentRemaining: number,
  scoreToWin?: number
): MatchResult | null {
  // 1. Win by TKO (score limit reached) — checked first
  if (scoreToWin && scoreToWin > 0) {
    if (playerScore >= scoreToWin) {
      return {
        winner: "player",
        victoryType: "tko",
        playerScore,
        opponentScore,
        playerRemaining,
        opponentRemaining,
        rounds: [],
        totalTurns: 0,
        playerCaptures: playerScore,
        opponentCaptures: opponentScore,
        xpEarned: 15 + playerScore * 3,
        summary: `Victory! You won ${playerScore}-${opponentScore}!`,
      }
    }
    if (opponentScore >= scoreToWin) {
      return {
        winner: "opponent",
        victoryType: "tko",
        playerScore,
        opponentScore,
        playerRemaining,
        opponentRemaining,
        rounds: [],
        totalTurns: 0,
        playerCaptures: playerScore,
        opponentCaptures: opponentScore,
        xpEarned: 2,
        summary: `${opponentScore}-${playerScore} — better luck next time!`,
      }
    }
  }

  // 2. Win by elimination: opponent has no tazos left
  if (opponentRemaining <= 0) {
    return {
      winner: "player",
      victoryType: "elimination",
      playerScore,
      opponentScore,
      playerRemaining,
      opponentRemaining: 0,
      rounds: [],
      totalTurns: 0,
      playerCaptures: playerScore,
      opponentCaptures: opponentScore,
      xpEarned: 25 + playerScore * 5,
      summary: `ELIMINATION! You captured all ${playerScore} of their tazos!`,
    }
  }
  if (playerRemaining <= 0) {
    return {
      winner: "opponent",
      victoryType: "elimination",
      playerScore,
      opponentScore,
      playerRemaining: 0,
      opponentRemaining,
      rounds: [],
      totalTurns: 0,
      playerCaptures: playerScore,
      opponentCaptures: opponentScore,
      xpEarned: 5,
      summary: `ELIMINATED! You lost all your tazos — ${opponentScore} captured.`,
    }
  }
  return null // Match continues
}

export function checkMatchEndLegacy(
  playerScore: number,
  opponentScore: number,
  scoreToWin: number,
  playerRemaining: number,
  opponentRemaining: number
): MatchResult | null {
  if (playerScore >= scoreToWin) {
    return {
      winner: "player",
      victoryType: "tko",
      playerScore,
      opponentScore,
      playerRemaining,
      opponentRemaining,
      rounds: [],
      totalTurns: 0,
      playerCaptures: playerScore,
      opponentCaptures: opponentScore,
      xpEarned: 15 + playerScore * 3,
      summary: `Victory! You won ${playerScore}-${opponentScore}!`,
    }
  }
  if (opponentScore >= scoreToWin) {
    return {
      winner: "opponent",
      victoryType: "tko",
      playerScore,
      opponentScore,
      playerRemaining,
      opponentRemaining,
      rounds: [],
      totalTurns: 0,
      playerCaptures: playerScore,
      opponentCaptures: opponentScore,
      xpEarned: 2,
      summary: `${opponentScore}-${playerScore} — better luck next time!`,
    }
  }
  return null // Match continues
}

// ────────────────────────────────────────
// Coin flip utility
// ────────────────────────────────────────

export function coinFlip(): "player" | "opponent" {
  return rng() < 0.5 ? "player" : "opponent"
}

// ────────────────────────────────────────
// Draw hand from deck
// ────────────────────────────────────────

export function drawHand(deck: TazoCard[], count: number = 5): { hand: TazoCard[]; remaining: TazoCard[] } {
  const shuffled = [...deck].sort(() => rng() - 0.5)
  const hand = shuffled.slice(0, Math.min(count, shuffled.length))
  const remaining = shuffled.slice(Math.min(count, shuffled.length))
  return { hand, remaining }
}

// ────────────────────────────────────────
// Utility: create airborne tazo
// ────────────────────────────────────────

export function createAirborneTazo(
  tazo: TazoCard,
  owner: "player" | "opponent",
  arena: Arena3DConfig
): AirborneTazo {
  return {
    id: tazo.id,
    tazoName: tazo.name,
    franchise: tazo.franchise,
    imageUrl: tazo.imageUrl || "",
    backImageUrl: BACK_ARTS[tazo.franchise] || "",
    finish: tazo.finish,
    state: "aiming",
    position: [0, arena.maxLaunchHeight * 0.5, -arena.radius * 0.55],
    tilt: [0, 0, 0],
    angularVelocity: [0, 0, 0],
    charge: 0,
    targetX: 0,
    targetZ: 0,
    owner,
  }
}

// ────────────────────────────────────────
// Utility: place staked tazos
// ────────────────────────────────────────

export function placeStakedTazos(
  playerTazo: TazoCard,
  opponentTazo: TazoCard
): StakedTazo[] {
  // Separation: tazos have visual radius ~0.38, need >0.76 between centers
  // Place at safe distance with slight Z offset for depth
  const STAKE_X = 0.55
  return [
    {
      id: playerTazo.id,
      tazoName: playerTazo.name,
      franchise: playerTazo.franchise,
      imageUrl: playerTazo.imageUrl || "",
      backImageUrl: BACK_ARTS[playerTazo.franchise] || "",
      owner: "player",
      position: [-STAKE_X, 0.045, 0.08] as [number, number, number],
      state: "face_down",
      wobbleIntensity: 0,
      scored: false,
    },
    {
      id: opponentTazo.id,
      tazoName: opponentTazo.name,
      franchise: opponentTazo.franchise,
      imageUrl: opponentTazo.imageUrl || "",
      backImageUrl: BACK_ARTS[opponentTazo.franchise] || "",
      owner: "opponent",
      position: [STAKE_X, 0.047, -0.08] as [number, number, number],
      state: "face_down",
      wobbleIntensity: 0,
      scored: false,
    },
  ]
}
