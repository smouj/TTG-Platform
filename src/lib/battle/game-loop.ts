// ============================================================
// Trading Tazos Game — Battle Game Loop v3
// Vertical Slam Throw mechanics (tazo real physics).
//
// CORRECT MECHANIC (not air hockey / chapas):
//   1. Both players stake 1 tazo face-down in the center circle.
//   2. On your turn, pick a launcher tazo from your deck.
//   3. The launcher appears in the air ABOVE the circle.
//   4. Aim reticle → charge vertical force → adjust tilt & spin.
//   5. Release → tazo falls from above, slams vertically.
//   6. Impact tries to flip face-down staked tazos face-up.
//   7. Flip your own = secure (+1pt). Flip rival = capture (+2pts).
//   8. First to 5 points wins.
// ============================================================

// ────────────────────────────────────────
// Tazo finish & creature variants (shared)
// ────────────────────────────────────────

export type TazoFinish =
  | "normal"
  | "matte"
  | "glossy"
  | "holo"
  | "reverse_holo"
  | "foil"
  | "prismatic"
  | "metallic"
  | "chrome"
  | "gold"
  | "rainbow"
  | "glitter"

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
  | "round_start"        // Round begins
  | "placing_stakes"     // Both players select tazo to stake
  | "player_aim"         // Player positions reticle over circle
  | "player_charge"      // Player holds to charge vertical force
  | "player_tilt"        // Player adjusts tilt & spin
  | "slamming"           // Tazo falls — gravity animation
  | "impact"             // Contact! Physics resolves
  | "resolve_impact"     // Show result: flip / wobble / miss
  | "opponent_aim"       // AI aims
  | "opponent_slam"      // AI slams
  | "round_end"          // Score update, next round
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
}

export interface RoundResult {
  roundNumber: number
  throwerId: "player" | "opponent"
  impact: ImpactResult
  playerScore: number
  opponentScore: number
}

export interface MatchResult {
  winner: "player" | "opponent" | "draw"
  victoryType: "points" | "all_captured" | "forfeit" | "draw"
  playerScore: number
  opponentScore: number
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

// ────────────────────────────────────────
// Vertical Slam Simulation
// ────────────────────────────────────────

/**
 * Simulate a vertical slam — tazo falls from above onto face-down staked tazos.
 * Returns the new staked tazo states and the impact result.
 */
export function simulateSlam(
  launcher: TazoCard,
  slam: SlamParams,
  staked: StakedTazo[],
  arena: Arena3DConfig,
  thrower: "player" | "opponent"
): { staked: StakedTazo[]; result: ImpactResult } {
  const {
    impactX, impactZ, verticalForce,
    timingAccuracy, tilt, tiltIntensity,
    spinIntensity, aimPrecision,
  } = slam

  // ── 1. AIM: Apply precision error ──
  const aimError = (1 - aimPrecision) * 0.55
  const actualX = impactX + (Math.random() - 0.5) * aimError
  const actualZ = impactZ + (Math.random() - 0.5) * aimError

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
  const hitsEdge = Math.random() < edgeChance

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

    // Defender stats — own tazos are easier to flip
    const ownTazo = st.owner === thrower
    const defenseFactor = ownTazo ? 0.65 : (1 - 20 / 100)
    const resistFactor = 1 - 15 / 100
    const stabilityFactor = 1 - 60 / 100

    const flipScore =
      (slamPower * 0.35) +
      (attackFactor * 0.20) +
      (weightFactor * 0.12) +
      (edgeBonus * 0.15) +
      (distBonus * 0.08) +
      (spinBonus * 0.10) -
      (defenseFactor * 0.08) -
      (resistFactor * 0.06) -
      (stabilityFactor * 0.06)

    // ── Bounce check (knock out of circle) ──
    const bounceChance = launcher.bounce / 120 + slamPower * 0.15
    let knockedOut = false
    if (slamPower > 0.4 && Math.random() < bounceChance) {
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
    (tiltIntensity > 0.75 && Math.random() < 0.3) ||
    (timingAccuracy < 0.25 && Math.random() < 0.4)

  // ── 8. Build result ──
  const doubleFlip = flipped.length >= 2
  const result: ImpactResult = {
    flipped,
    wobbled,
    ringOut,
    doubleFlip,
    badLanding,
    impactForce: slamPower,
    edgeBonus: hitsEdge ? 1.5 : 1.0,
    description: doubleFlip
      ? "DOUBLE FLIP!"
      : flipped.length === 1
        ? "FLIP!"
        : wobbled.length > 0
          ? "WOBBLE..."
          : ringOut.length > 0
            ? "RING OUT"
            : badLanding
              ? "BAD LANDING"
              : "MISS",
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
    impactX = (Math.random() - 0.5) * 0.4
    impactZ = (Math.random() - 0.5) * 0.4
    verticalForce = 0.35 + Math.random() * 0.35
  } else {
    const target = targets[0]
    impactX = target.position[0] + (Math.random() - 0.5) * 0.2
    impactZ = target.position[2] + (Math.random() - 0.5) * 0.2

    if (difficulty === "master") {
      aimPrecision = 0.85 + Math.random() * 0.15
      timingAccuracy = 0.8 + Math.random() * 0.2
      verticalForce = 0.55 + Math.random() * 0.35
      // Smart tilt: edge attack mostly
      tilt = Math.random() > 0.3 ? "forward" : "flat"
      tiltIntensity = 0.4 + Math.random() * 0.4
      spinIntensity = 0.2 + Math.random() * 0.3
    } else if (difficulty === "skilled") {
      aimPrecision = 0.6 + Math.random() * 0.25
      timingAccuracy = 0.55 + Math.random() * 0.3
      verticalForce = 0.45 + Math.random() * 0.35
      tilt = Math.random() > 0.5 ? "forward" : "flat"
      tiltIntensity = 0.25 + Math.random() * 0.3
      spinIntensity = Math.random() * 0.25
    } else {
      // Novice: mostly random, flat
      aimPrecision = 0.35 + Math.random() * 0.35
      timingAccuracy = 0.3 + Math.random() * 0.4
      verticalForce = 0.25 + Math.random() * 0.5
      tiltIntensity = Math.random() * 0.3
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
// Score calculation from impact
// ────────────────────────────────────────

export function scoreImpact(
  impact: ImpactResult,
  staked: StakedTazo[],
  thrower: "player" | "opponent"
): { playerDelta: number; opponentDelta: number } {
  let playerDelta = 0
  let opponentDelta = 0

  for (const id of impact.flipped) {
    const st = staked.find(s => s.id === id)
    if (!st) continue
    const wasMyTazo = st.owner === thrower
    if (wasMyTazo) {
      // Flipped own tazo = secure it (+1)
      if (thrower === "player") playerDelta += 1
      else opponentDelta += 1
    } else {
      // Flipped rival tazo = capture it (+2)
      if (thrower === "player") playerDelta += 2
      else opponentDelta += 2
    }
  }

  // Double flip bonus
  if (impact.doubleFlip) {
    if (thrower === "player") playerDelta += 1
    else opponentDelta += 1
  }

  return { playerDelta, opponentDelta }
}

// ────────────────────────────────────────
// Match end check
// ────────────────────────────────────────

export function checkMatchEnd(
  playerScore: number,
  opponentScore: number,
  scoreToWin: number,
  playerRemaining: number,
  opponentRemaining: number
): MatchResult | null {
  if (playerScore >= scoreToWin) {
    return {
      winner: "player",
      victoryType: "points",
      playerScore,
      opponentScore,
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
      victoryType: "points",
      playerScore,
      opponentScore,
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
  return [
    {
      id: playerTazo.id,
      tazoName: playerTazo.name,
      franchise: playerTazo.franchise,
      imageUrl: playerTazo.imageUrl || "",
      backImageUrl: BACK_ARTS[playerTazo.franchise] || "",
      owner: "player",
      position: [-0.35, 0.06, 0] as [number, number, number],
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
      position: [0.35, 0.06, 0] as [number, number, number],
      state: "face_down",
      wobbleIntensity: 0,
      scored: false,
    },
  ]
}
