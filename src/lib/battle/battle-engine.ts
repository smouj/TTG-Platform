// ============================================================
// Trading Tazos Game — Battle Engine
// Core state machine orchestrating the physical tazo battle.
// Deterministic via seeded RNG. Render-agnostic (2D/3D).
// ============================================================

import type {
  BattlePhase,
  BattlePlayer,
  BattleFieldTazo,
  BattleTurn,
  BattleReplay,
  BattleFinalResult,
  ArenaConfig,
  GameModeConfig,
  ThrowInput,
  ThrowResult,
  CollisionEvent,
  TazoPhysicsState,
  TazoBattleStats,
} from "./battle-types"
import { DEFAULT_ARENA, DEFAULT_GAME_MODE, deriveBattleStats } from "./battle-types"
import {
  SeededRNG,
  calculateLaunchSpeed,
  calculateAccuracyError,
  calculateSpin,
  calculateLaunchAngle,
  calculateImpactPower,
  calculateDefensePower,
  resolveImpactOutcome,
  calculateCollisionCost,
  calculateReboundEnergy,
  applyPush,
  applyFlip,
  runPhysicsSimulation,
  detectCollision,
  determineImpactPoint,
  generateTurnDescription,
} from "./battle-rules"

// ---- Engine State ----

export interface BattleState {
  phase: BattlePhase
  arena: ArenaConfig
  gameMode: GameModeConfig
  player: BattlePlayer
  opponent: BattlePlayer
  currentPlayerId: "player" | "opponent"
  turnNumber: number
  selectedTazoId: string | null

  // Aim phase state
  aimPhase: {
    horizontalAimValue: number
    horizontalAccuracy: number
    verticalAimValue: number
    verticalAccuracy: number
    powerValue: number
    powerAccuracyPenalty: number
  } | null

  // Penalty placement
  pendingPlacementTazoId: string | null
  placementController: "player" | "opponent" | null

  // History
  turns: BattleTurn[]
  fieldStateHistory: TazoPhysicsState[][]

  // Result
  finalResult: BattleFinalResult | null

  // RNG
  rng: SeededRNG
  battleId: string
}

// ---- Engine Functions ----

type BattleInputTazo = {
  id: string
  name: string
  slug: string
  franchise: string
  imageUrl: string | null
  attack: number
  defense: number
  resistance: number
  weight: number
  stability: number
  spin: number
  control: number
  bounce: number
  precision: number
  role?: string | null
  stackable?: boolean
  maxStackOn?: number
}

export function createBattleState(
  playerTazos: BattleInputTazo[],
  opponentTazos: BattleInputTazo[],
  options?: {
    arena?: Partial<ArenaConfig>
    gameMode?: Partial<GameModeConfig>
    seed?: number
  }
): BattleState {
  const arena = { ...DEFAULT_ARENA, ...options?.arena }
  const gameMode = { ...DEFAULT_GAME_MODE, ...options?.gameMode }
  const seed = options?.seed ?? Date.now()
  const rng = new SeededRNG(seed)

  function buildFieldTazo(
    t: BattleInputTazo,
    owner: "player" | "opponent",
    fieldIndex: number
  ): BattleFieldTazo {
    const stats = deriveBattleStats(t)
    const angle = (fieldIndex / 5) * Math.PI * 2
    const dist = arena.radius * 0.55
    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      franchise: t.franchise,
      imageUrl: t.imageUrl,
      role: t.role,
      stackable: t.stackable ?? true,
      maxStackOn: t.maxStackOn ?? 1,
      stats,
      state: "on_field",
      physics: {
        x: arena.centerX + Math.cos(angle) * dist + rng.range(-15, 15),
        y: arena.centerY + Math.sin(angle) * dist + rng.range(-15, 15),
        z: 0,
        radius: 24,
        thickness: 3,
        rotation: rng.range(0, Math.PI * 2),
        tilt: 0,
        velocityX: 0,
        velocityY: 0,
        velocityZ: 0,
        angularVelocity: 0,
        spinVelocity: 0,
        face: "front",
        isStacked: false,
        stackLevel: 0,
      },
      owner,
    }
  }

  const handTazos = playerTazos.slice(gameMode.maxTazosPerPlayer).map((t, i) => ({
    ...buildFieldTazo(t, "player", i),
    state: "in_hand" as const,
    physics: createHandPhysics(),
  }))

  const fieldTazosPlayer = playerTazos.slice(0, gameMode.maxTazosPerPlayer).map((t, i) =>
    buildFieldTazo(t, "player", i)
  )
  const fieldTazosOpponent = opponentTazos.slice(0, gameMode.maxTazosPerPlayer).map((t, i) =>
    buildFieldTazo(t, "opponent", i + gameMode.maxTazosPerPlayer)
  )

  return {
    phase: "field_placement",
    arena,
    gameMode,
    player: {
      id: "player",
      name: "You",
      hand: handTazos,
      field: fieldTazosPlayer,
      captured: [],
    },
    opponent: {
      id: "opponent",
      name: "Rival",
      hand: [],
      field: fieldTazosOpponent,
      captured: [],
    },
    currentPlayerId: "player",
    turnNumber: 0,
    selectedTazoId: null,
    aimPhase: null,
    pendingPlacementTazoId: null,
    placementController: null,
    turns: [],
    fieldStateHistory: [],
    finalResult: null,
    rng,
    battleId: `battle-${seed}-${Date.now()}`,
  }
}

function createHandPhysics(): TazoPhysicsState {
  return {
    x: 0, y: 0, z: 0,
    radius: 24, thickness: 3,
    rotation: 0, tilt: 0,
    velocityX: 0, velocityY: 0, velocityZ: 0,
    angularVelocity: 0, spinVelocity: 0,
    face: "front",
    isStacked: false, stackLevel: 0,
  }
}

// ---- Phase Transitions ----

export function startTurn(state: BattleState): BattleState {
  return {
    ...state,
    phase: "select_thrower",
    turnNumber: state.turnNumber + 1,
    selectedTazoId: null,
    aimPhase: null,
    pendingPlacementTazoId: null,
    placementController: null,
  }
}

export function selectThrower(state: BattleState, tazoId: string): BattleState {
  const allTazos = getCurrentPlayerHand(state)
  const tazo = allTazos.find(t => t.id === tazoId)
  if (!tazo) return state

  return {
    ...state,
    phase: "aim_horizontal",
    selectedTazoId: tazoId,
    aimPhase: null,
  }
}

export function setHorizontalAim(state: BattleState, value: number): BattleState {
  if (state.phase !== "aim_horizontal") return state
  const accuracy = calculateTimingAccuracy(value, 0.5)
  return {
    ...state,
    phase: "aim_vertical",
    aimPhase: {
      horizontalAimValue: value,
      horizontalAccuracy: accuracy,
      verticalAimValue: 0,
      verticalAccuracy: 0,
      powerValue: 0,
      powerAccuracyPenalty: 0,
    },
  }
}

export function setVerticalAim(state: BattleState, value: number): BattleState {
  if (state.phase !== "aim_vertical" || !state.aimPhase) return state
  const accuracy = calculateTimingAccuracy(value, 0.5)
  return {
    ...state,
    phase: "charge_power",
    aimPhase: {
      ...state.aimPhase,
      verticalAimValue: value,
      verticalAccuracy: accuracy,
    },
  }
}

export function setPower(state: BattleState, value: number): BattleState {
  if (state.phase !== "charge_power" || !state.aimPhase) return state
  const penalty = value * 25 // higher power = more accuracy penalty
  return {
    ...state,
    phase: "charge_power",
    aimPhase: {
      ...state.aimPhase,
      powerValue: value,
      powerAccuracyPenalty: penalty,
    },
  }
}

export function executeThrow(state: BattleState): BattleState {
  if (!state.selectedTazoId || !state.aimPhase) return state

  const thrower = findTazoById(state, state.selectedTazoId)
  if (!thrower) return state

  const aim = state.aimPhase

  // Calculate throw parameters
  const launchSpeed = calculateLaunchSpeed(aim.powerValue, thrower.stats)
  const accuracyError = calculateAccuracyError(
    aim.horizontalAccuracy,
    aim.verticalAccuracy,
    aim.powerValue,
    thrower.stats
  )
  const spin = calculateSpin(aim.powerValue, thrower.stats)

  // Calculate landing position
  const targetX = state.arena.centerX + (aim.horizontalAimValue - 0.5) * state.arena.radius * 1.3
  const targetY = state.arena.centerY + (aim.verticalAimValue - 0.5) * state.arena.radius * 1.3
  const errorOffsetX = (accuracyError / 100) * state.arena.radius * (state.rng.next() - 0.5)
  const errorOffsetY = (accuracyError / 100) * state.arena.radius * (state.rng.next() - 0.5)

  const finalX = targetX + errorOffsetX
  const finalY = targetY + errorOffsetY
  const launchAngle = calculateLaunchAngle(targetX, targetY, accuracyError, state.rng)

  // Check if out of bounds
  const dx = finalX - state.arena.centerX
  const dy = finalY - state.arena.centerY
  const distFromCenter = Math.sqrt(dx * dx + dy * dy)
  const outOfBounds = distFromCenter > state.arena.radius - thrower.physics.radius

  // Clamp if out of bounds
  const clampedX = outOfBounds
    ? state.arena.centerX + (dx / distFromCenter) * (state.arena.radius + 20)
    : finalX
  const clampedY = outOfBounds
    ? state.arena.centerY + (dy / distFromCenter) * (state.arena.radius + 20)
    : finalY

  const throwInput: ThrowInput = {
    tazoId: state.selectedTazoId,
    aimX: aim.horizontalAimValue,
    aimY: aim.verticalAimValue,
    horizontalAccuracy: aim.horizontalAccuracy,
    verticalAccuracy: aim.verticalAccuracy,
    power: aim.powerValue,
    releaseTiming: 0.5,
  }

  // Resolve impacts
  const fieldTazos = getAllFieldTazos(state).filter(t => t.id !== state.selectedTazoId)
  let remainingEnergy = 100 + thrower.stats.bounce * 0.3
  const collisionEvents: CollisionEvent[] = []
  const impactedTazos: string[] = []
  const flippedTazos: string[] = []
  const capturedTazos: string[] = []
  let stackedOn: string | undefined

  // Check collisions with each field tazo
  for (const target of fieldTazos) {
    if (remainingEnergy <= 15) break

    const distToTarget = Math.sqrt(
      (finalX - target.physics.x) ** 2 + (finalY - target.physics.y) ** 2
    )
    const collisionRange = thrower.physics.radius + target.physics.radius + 10

    if (distToTarget < collisionRange) {
      const impactPoint = determineImpactPoint(
        Math.atan2(target.physics.y - finalY, target.physics.x - finalX),
        target.physics.rotation
      )

      const impactPower = calculateImpactPower(
        thrower.stats,
        aim.powerValue
      )
      const defensePower = calculateDefensePower(target.stats)

      const outcome = resolveImpactOutcome(
        impactPower, defensePower, impactPoint, remainingEnergy, state.rng
      )

      const collisionCost = calculateCollisionCost(outcome)
      const prevEnergy = remainingEnergy
      remainingEnergy = calculateReboundEnergy(remainingEnergy, collisionCost, thrower.stats)

      const event: CollisionEvent = {
        sourceTazoId: state.selectedTazoId,
        targetTazoId: target.id,
        impactPoint,
        impactPower: Math.round(impactPower),
        defensePower: Math.round(defensePower),
        outcome,
        remainingEnergy: Math.round(remainingEnergy),
      }

      collisionEvents.push(event)
      impactedTazos.push(target.id)

      if (outcome === "flip") {
        flippedTazos.push(target.id)
        capturedTazos.push(target.id)
      } else if (outcome === "ring_out") {
        capturedTazos.push(target.id)
      } else if (outcome === "stack") {
        stackedOn = target.id
      }
    }
  }

  // Determine final state
  let finalState: ThrowResult["finalState"]
  if (outOfBounds) {
    finalState = "out_of_bounds"
  } else if (capturedTazos.length > 0) {
    finalState = "captured"
  } else {
    finalState = "on_field"
  }

  const throwResult: ThrowResult = {
    throwerId: state.selectedTazoId,
    finalX: clampedX,
    finalY: clampedY,
    finalZ: 0,
    launchAngle,
    launchSpeed: Math.round(launchSpeed),
    spin: Math.round(spin),
    accuracyError: Math.round(accuracyError),
    impactedTazos,
    flippedTazos,
    capturedTazos,
    outOfBounds,
    stackedOn,
    finalState,
  }

  // Build field state snapshots
  const fieldStateBefore = getAllFieldTazos(state).map(t => ({ ...t.physics }))
  const throwerPhysicsAfter: TazoPhysicsState = {
    x: clampedX,
    y: clampedY,
    z: 0,
    radius: thrower.physics.radius,
    thickness: thrower.physics.thickness,
    rotation: state.rng.range(0, Math.PI * 2),
    tilt: 0,
    velocityX: 0,
    velocityY: 0,
    velocityZ: 0,
    angularVelocity: 0,
    spinVelocity: spin * 0.3,
    face: "front",
    isStacked: !!stackedOn,
    stackLevel: stackedOn ? 1 : 0,
  }

  // Generate description with full detail
  const impactedNames = impactedTazos.map(id => findTazoById(state, id)?.name ?? "?").filter(Boolean)
  const flippedNames = flippedTazos.map(id => findTazoById(state, id)?.name ?? "?").filter(Boolean)
  const capturedNames = capturedTazos.map(id => findTazoById(state, id)?.name ?? "?").filter(Boolean)

  // Self-flip check: very high power + bad accuracy = thrower can flip itself
  const selfFlipChance = aim.powerValue * (accuracyError / 100) * 0.15
  const selfFlipped = !outOfBounds && capturedTazos.length === 0 && state.rng.next() < selfFlipChance

  // Combo bonus: 2+ captures in one throw
  const comboCount = capturedTazos.length >= 2 ? capturedTazos.length : 0

  const description = generateTurnDescription(
    thrower.name, impactedNames, flippedNames, capturedNames,
    outOfBounds, finalState,
    collisionEvents.map(e => ({ impactPoint: e.impactPoint, impactPower: e.impactPower, defensePower: e.defensePower })),
    selfFlipped,
    comboCount || undefined
  )

  const turn: BattleTurn = {
    turnNumber: state.turnNumber,
    playerId: state.currentPlayerId,
    phase: state.phase,
    selectedTazoId: state.selectedTazoId,
    aimPhase: aim,
    throwInput,
    throwResult,
    collisionEvents,
    capturedTazos,
    fieldStateBefore,
    fieldStateAfter: getAllFieldTazos(state).map(t => ({ ...t.physics })),
    description,
  }

  // Apply results
  let newState = { ...state, turns: [...state.turns, turn] }

  // Move captured tazos
  for (const id of capturedTazos) {
    newState = captureTazo(newState, id)
  }

  // Handle thrown tazo
  if (outOfBounds) {
    newState = {
      ...newState,
      phase: "opponent_place_penalty",
      pendingPlacementTazoId: state.selectedTazoId,
      placementController: state.currentPlayerId === "player" ? "opponent" : "player",
    }
  } else if (finalState === "captured" || selfFlipped) {
    // Captured something OR self-flipped — thrower returns to hand (but self-flipped tazo also stays as vulnerable)
    if (selfFlipped) {
      // Self-flipped: tazo stays on field flipped (vulnerable)
      const selfFlippedPhysics: TazoPhysicsState = {
        ...throwerPhysicsAfter,
        face: "back",
        tilt: 90,
        spinVelocity: aim.powerValue * 30,
      }
      newState = placeTazoOnField(newState, state.selectedTazoId, selfFlippedPhysics)
    } else {
      newState = returnTazoToHand(newState, state.selectedTazoId)
      // Combo bonus: if 2+ captures, grant extra energy marker (future: extra turn/points)
    }
    newState = { ...newState, phase: "turn_end" }
  } else {
    // Stays on field
    newState = placeTazoOnField(newState, state.selectedTazoId, throwerPhysicsAfter)
    newState = { ...newState, phase: "turn_end" }
  }

  return newState
}

export function opponentPlaceTazo(state: BattleState, x: number, y: number): BattleState {
  if (state.phase !== "opponent_place_penalty" || !state.pendingPlacementTazoId) return state

  // Validate position is within arena
  const dx = x - state.arena.centerX
  const dy = y - state.arena.centerY
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist > state.arena.radius - 24) return state // invalid position

  // Check not stacking on another tazo manually
  const fieldTazos = getAllFieldTazos(state).filter(t => t.id !== state.pendingPlacementTazoId)
  const isOnTop = fieldTazos.some(t => {
    const d = Math.sqrt((x - t.physics.x) ** 2 + (y - t.physics.y) ** 2)
    return d < t.physics.radius * 0.5
  })
  if (isOnTop) return state // cannot manually place on top

  const newState = placeTazoOnField(state, state.pendingPlacementTazoId, {
    x, y, z: 0, radius: 24, thickness: 3,
    rotation: state.rng.range(0, Math.PI * 2), tilt: 0,
    velocityX: 0, velocityY: 0, velocityZ: 0,
    angularVelocity: 0, spinVelocity: 0,
    face: "front",
    isStacked: false, stackLevel: 0,
  })

  return {
    ...newState,
    phase: "turn_end",
    pendingPlacementTazoId: null,
    placementController: null,
  }
}

export function endTurn(state: BattleState): BattleState {
  // Check win conditions based on game mode
  const opponentField = state.opponent.field.filter(t => t.state === "on_field")
  const playerField = state.player.field.filter(t => t.state === "on_field")
  const playerHand = state.player.hand.filter(t => t.state === "in_hand")
  const opponentHand = state.opponent.hand.filter(t => t.state === "in_hand")

  const playerCaptures = state.player.captured.length
  const opponentCaptures = state.opponent.captured.length
  const lastTurn = state.turns[state.turns.length - 1]
  const lastTurnCombo = lastTurn?.capturedTazos?.length ?? 0

  // Classic / Arena: all opponent tazos captured or no tazos left usable
  if (opponentField.length === 0 && opponentHand.length === 0) {
    return {
      ...state,
      phase: "battle_finished",
      finalResult: {
        winner: "player",
        victoryType: "all_captured",
        playerScore: playerCaptures * 10 + (lastTurnCombo >= 2 ? lastTurnCombo * 5 : 0),
        opponentScore: opponentCaptures * 10,
        totalTurns: state.turnNumber,
        playerCaptures,
        opponentCaptures,
        summary: `Victoria! Todos los tazos rivales capturados en ${state.turnNumber} turnos.`,
      },
    }
  }

  if (playerField.length === 0 && playerHand.length === 0) {
    return {
      ...state,
      phase: "battle_finished",
      finalResult: {
        winner: "opponent",
        victoryType: "all_captured",
        playerScore: playerCaptures * 10,
        opponentScore: opponentCaptures * 10 + (lastTurnCombo >= 2 ? lastTurnCombo * 5 : 0),
        totalTurns: state.turnNumber,
        playerCaptures,
        opponentCaptures,
        summary: `Derrota! Todos tus tazos fueron capturados en ${state.turnNumber} turnos.`,
      },
    }
  }

  // Rounds mode: check max rounds
  if (state.gameMode.mode === "rounds" && state.gameMode.maxRounds && state.turnNumber >= state.gameMode.maxRounds) {
    const playerScore = playerCaptures * (state.gameMode.pointsPerCapture ?? 1)
    const opponentScore = opponentCaptures * (state.gameMode.pointsPerCapture ?? 1)
    const winner = playerScore > opponentScore ? "player" : opponentScore > playerScore ? "opponent" : "draw"
    return {
      ...state,
      phase: "battle_finished",
      finalResult: {
        winner,
        victoryType: "rounds",
        playerScore,
        opponentScore,
        totalTurns: state.turnNumber,
        playerCaptures,
        opponentCaptures,
        summary: winner === "draw"
          ? `Empate! ${playerScore}-${opponentScore} tras ${state.turnNumber} turnos.`
          : `${winner === "player" ? "Victoria" : "Derrota"}! ${playerScore}-${opponentScore} en ${state.turnNumber} turnos.`,
      },
    }
  }

  // Switch turns
  const nextPlayer = state.currentPlayerId === "player" ? "opponent" : "player"

  // For opponent AI turn: auto-resolve
  if (nextPlayer === "opponent") {
    return executeAITurn({ ...state, currentPlayerId: "opponent" })
  }

  return startTurn({ ...state, currentPlayerId: "player" })
}

// ---- AI Opponent ----

export function executeAITurn(state: BattleState): BattleState {
  if (state.currentPlayerId !== "opponent") return state

  // Simple AI: pick a random tazo, aim at a random player tazo
  const hand = getCurrentPlayerHand(state)
  if (hand.length === 0) {
    return startTurn({ ...state, currentPlayerId: "player" })
  }

  const thrower = hand[state.rng.intRange(0, hand.length - 1)]
  const aiAimX = state.rng.range(0.2, 0.8)
  const aiAimY = state.rng.range(0.2, 0.8)
  const aiPower = state.rng.range(0.3, 0.75)

  let s = selectThrower(state, thrower.id)
  s = setHorizontalAim(s, aiAimX)
  s = setVerticalAim(s, aiAimY)
  s = setPower(s, aiPower)
  s = executeThrow(s)

  if (s.phase === "opponent_place_penalty") {
    const px = s.arena.centerX + s.rng.range(-s.arena.radius * 0.4, s.arena.radius * 0.4)
    const py = s.arena.centerY + s.rng.range(-s.arena.radius * 0.4, s.arena.radius * 0.4)
    s = opponentPlaceTazo(s, px, py)
  }

  return startTurn({ ...s, currentPlayerId: "player" })
}

// ---- Helpers ----

function getCurrentPlayerHand(state: BattleState): BattleFieldTazo[] {
  const p = state.currentPlayerId === "player" ? state.player : state.opponent
  return p.hand.filter(t => t.state === "in_hand")
}

function getAllFieldTazos(state: BattleState): BattleFieldTazo[] {
  return [
    ...state.player.field.filter(t => t.state === "on_field"),
    ...state.opponent.field.filter(t => t.state === "on_field"),
    ...state.player.hand.filter(t => t.state !== "in_hand"),
    ...state.opponent.hand.filter(t => t.state !== "in_hand"),
  ]
}

function findTazoById(state: BattleState, id: string): BattleFieldTazo | undefined {
  for (const arr of [state.player.hand, state.player.field, state.player.captured,
    state.opponent.hand, state.opponent.field, state.opponent.captured]) {
    const found = arr.find(t => t.id === id)
    if (found) return found
  }
  return undefined
}

function captureTazo(state: BattleState, tazoId: string): BattleState {
  const capturer = state.currentPlayerId
  return updateTazoInState(state, tazoId, (tazo) => {
    if (tazo.owner === "player" && capturer === "opponent") {
      state.opponent.captured.push({ ...tazo, state: "captured" })
      return "opponent_field"
    }
    if (tazo.owner === "opponent" && capturer === "player") {
      state.player.captured.push({ ...tazo, state: "captured" })
      return "opponent_field"
    }
    return "remove"
  })
}

function returnTazoToHand(state: BattleState, tazoId: string): BattleState {
  return updateTazoInState(state, tazoId, (tazo) => {
    const player = tazo.owner === "player" ? state.player : state.opponent
    player.hand.push({ ...tazo, state: "in_hand" })
    return "remove"
  })
}

function placeTazoOnField(state: BattleState, tazoId: string, physics: TazoPhysicsState): BattleState {
  return updateTazoInState(state, tazoId, (tazo) => {
    const owner = tazo.owner === "player" ? state.player : state.opponent
    owner.field.push({ ...tazo, state: "on_field", physics })
    return "remove_from_hand"
  })
}

function updateTazoInState(
  state: BattleState,
  tazoId: string,
  handler: (tazo: BattleFieldTazo) => "remove" | "opponent_field" | "remove_from_hand"
): BattleState {
  const newState = { ...state }
  const players = [newState.player, newState.opponent]

  for (const player of players) {
    const idx = player.hand.findIndex(t => t.id === tazoId)
    if (idx !== -1) {
      const tazo = player.hand[idx]
      const action = handler(tazo)
      if (action === "remove" || action === "remove_from_hand") {
        player.hand = [...player.hand.slice(0, idx), ...player.hand.slice(idx + 1)]
      }
      return newState
    }
    const fidx = player.field.findIndex(t => t.id === tazoId)
    if (fidx !== -1) {
      const tazo = player.field[fidx]
      const action = handler(tazo)
      if (action === "remove") {
        player.field = [...player.field.slice(0, fidx), ...player.field.slice(fidx + 1)]
      }
      return newState
    }
  }
  return newState
}

function calculateTimingAccuracy(value: number, target: number): number {
  const diff = Math.abs(value - target)
  if (diff < 0.05) return 0.98
  if (diff < 0.1) return 0.9
  if (diff < 0.15) return 0.8
  if (diff < 0.2) return 0.65
  if (diff < 0.3) return 0.5
  return 0.3
}

// ---- Replay Export ----

export function exportReplay(state: BattleState): BattleReplay {
  return {
    battleId: state.battleId,
    seed: state.battleId,
    players: [state.player, state.opponent],
    turns: state.turns,
    finalResult: state.finalResult ?? {
      winner: "draw",
      victoryType: "rounds",
      playerScore: 0,
      opponentScore: 0,
      totalTurns: state.turnNumber,
      playerCaptures: state.player.captured.length,
      opponentCaptures: state.opponent.captured.length,
      summary: "Battle in progress",
    },
  }
}
