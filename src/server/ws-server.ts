// ============================================================
// TTG Multiplayer WebSocket Server
// Matchmaking + room-based PvP relay.
// Bun-native — no extra deps beyond 'ws'.
// ============================================================

import { WebSocketServer, WebSocket } from "ws"
import jwt from "jsonwebtoken"
import { createServer } from "http"

const JWT_SECRET_ENV = process.env.JWT_SECRET
if (!JWT_SECRET_ENV) {
  console.error("FATAL: JWT_SECRET environment variable is required")
  process.exit(1)
}
const JWT_SECRET = JWT_SECRET_ENV
const PORT = parseInt(process.env.WS_PORT || "3001")
const HEARTBEAT_MS = 15000

interface Player {
  ws: WebSocket
  userId: string
  name: string
  joinedAt: number
  alive: boolean
}

interface Room {
  id: string
  players: [Player, Player]
  createdAt: number
  gameState: "waiting" | "playing" | "finished"
}

const queue: Player[] = []
const waitingRooms = new Map<string, Player>()
const rooms = new Map<string, Room>()
const connections = new Map<WebSocket, Player>()

function isOpen(player: Player): boolean {
  return connections.get(player.ws) === player && player.ws.readyState === WebSocket.OPEN
}

function broadcast(ws: WebSocket, msg: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

function makeRoom(p1: Player, p2: Player, roomId?: string): Room {
  const id = roomId || `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const room: Room = { id, players: [p1, p2], createdAt: Date.now(), gameState: "waiting" }
  removeFromQueue(p1)
  removeFromQueue(p2)
  removeWaitingRoomsForPlayer(p1)
  removeWaitingRoomsForPlayer(p2)
  rooms.set(id, room)

  // Notify both players
  for (const p of [p1, p2]) {
    const opponent = p === p1 ? p2 : p1
    broadcast(p.ws, {
      type: "match_found",
      payload: {
        roomId: id,
        opponent: { userId: opponent.userId, name: opponent.name },
        yourSide: p === p1 ? "player" : "opponent",
      },
    })
  }

  log(`⚔️  Match: ${p1.name} vs ${p2.name} [${id}]`)
  return room
}

function removeFromQueue(player: Player) {
  let idx = queue.indexOf(player)
  while (idx >= 0) {
    queue.splice(idx, 1)
    idx = queue.indexOf(player)
  }
}

function removeWaitingRoomsForPlayer(player: Player) {
  for (const [id, waiting] of waitingRooms) {
    if (waiting === player) waitingRooms.delete(id)
  }
}

function isInRoom(player: Player): boolean {
  for (const room of rooms.values()) {
    if (room.players.includes(player)) return true
  }
  return false
}

function cleanupPlayer(player: Player) {
  const wasConnected = connections.delete(player.ws)
  if (!wasConnected) return

  // Remove from queue
  removeFromQueue(player)

  // Remove from waiting direct room
  removeWaitingRoomsForPlayer(player)

  // Remove from room
  for (const [id, room] of rooms) {
    const idx = room.players.indexOf(player)
    if (idx >= 0) {
      const opponent = room.players[1 - idx]
      if (room.gameState !== "finished") {
        broadcast(opponent.ws, {
          type: "opponent_disconnected",
          payload: { message: "Your opponent disconnected" },
        })
      }
      rooms.delete(id)
      log(`🚪 Room ${id} closed — ${player.name} disconnected`)
      break
    }
  }

}

function disconnectExistingUser(userId: string) {
  for (const existing of connections.values()) {
    if (existing.userId !== userId) continue

    cleanupPlayer(existing)
    if (existing.ws.readyState === WebSocket.OPEN || existing.ws.readyState === WebSocket.CONNECTING) {
      existing.ws.close(4000, "Connected from another session")
    }
  }
}

function tryMatch() {
  while (queue.length >= 2) {
    const p1 = queue.shift()!
    const p2 = queue.shift()!
    if (!isOpen(p1) || !isOpen(p2)) continue
    if (p1.userId === p2.userId) {
      broadcast(p1.ws, { type: "queue_error", payload: { message: "Cannot match against yourself" } })
      broadcast(p2.ws, { type: "queue_error", payload: { message: "Cannot match against yourself" } })
      continue
    }
    makeRoom(p1, p2)
  }
}

function verifyToken(token: string): { userId: string; name: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { id: string; name: string }
    return { userId: decoded.id, name: decoded.name }
  } catch {
    return null
  }
}


// ---- Turn Validation ----

interface SlamPayload {
  tazoId?: string
  verticalForce?: number
  timingAccuracy?: number
  tiltIntensity?: number
  spinIntensity?: number
  aimPrecision?: number
  impactX?: number
  impactZ?: number
  tilt?: string
}

interface ValidatedSlam {
  valid: boolean
  warnings: string[]
}

function validateSlam(payload: SlamPayload): ValidatedSlam {
  const warnings: string[] = []

  const clamp = (v: number | undefined, min: number, max: number, name: string, def: number): number => {
    if (typeof v !== "number" || isNaN(v) || !isFinite(v)) return def
    if (v < min || v > max) {
      warnings.push(`${name}: ${v.toFixed(2)} clamped to [${min}, ${max}]`)
      return Math.max(min, Math.min(max, v))
    }
    return v
  }

  clamp(payload.verticalForce ?? 0.5, 0, 1, "verticalForce", 0.5)
  clamp(payload.timingAccuracy ?? 0.5, 0, 1, "timingAccuracy", 0.5)
  clamp(payload.tiltIntensity ?? 0, 0, 1, "tiltIntensity", 0)
  clamp(payload.spinIntensity ?? 0, 0, 1, "spinIntensity", 0)
  clamp(payload.aimPrecision ?? 0.5, 0, 1, "aimPrecision", 0.5)
  clamp(payload.impactX ?? 0, -2, 2, "impactX", 0)
  clamp(payload.impactZ ?? 0, -2, 2, "impactZ", 0)

  if (payload.tilt && !["flat", "forward", "backward", "left", "right"].includes(payload.tilt)) {
    warnings.push(`tilt: "${payload.tilt}" invalid (expected flat/forward/backward/left/right)`)
  }

  return { valid: warnings.length === 0, warnings }
}

function log(msg: string) {
  console.log(`[WS] ${new Date().toISOString().slice(11, 19)} ${msg}`)
}

// ---- Server ----

const wss = new WebSocketServer({ port: PORT })

wss.on("listening", () => {
  log(`Multiplayer server listening on port ${PORT}`)
  if (typeof process.send === "function") process.send("ready");
})

wss.on("error", (err) => {
  log(`⚠️ WSS server error: ${err.message}`)
})

wss.on("connection", (ws, req) => {
  // Auth via query param
  const url = new URL(req.url || "/", `http://${req.headers.host}`)
  const token = url.searchParams.get("token") || ""

  const user = verifyToken(token)
  if (!user) {
    ws.close(4001, "Unauthorized")
    return
  }

  disconnectExistingUser(user.userId)

  const player: Player = {
    ws,
    userId: user.userId,
    name: user.name,
    joinedAt: Date.now(),
    alive: true,
  }

  connections.set(ws, player)
  log(`🔌 ${player.name} connected (${connections.size} online)`)

  // Heartbeat
  let pingInterval: ReturnType<typeof setInterval>
  ws.on("pong", () => { player.alive = true })
  pingInterval = setInterval(() => {
    if (!player.alive) {
      ws.terminate()
      return
    }
    player.alive = false
    ws.ping()
  }, HEARTBEAT_MS)

  ws.on("message", (raw) => {
    let msg: { type: string; payload?: any }
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    switch (msg.type) {
      case "join_queue": {
        if (isInRoom(player)) {
          broadcast(ws, { type: "queue_error", payload: { message: "Already in a game" } })
          break
        }
        if (queue.includes(player)) break
        if (queue.some((p) => p.userId === player.userId)) {
          broadcast(ws, { type: "queue_error", payload: { message: "Already in queue" } })
          break
        }
        removeWaitingRoomsForPlayer(player)
        queue.push(player)
        broadcast(ws, { type: "queue_status", payload: { position: queue.length } })
        log(`🎯 ${player.name} joined queue (${queue.length} waiting)`)
        tryMatch()
        break
      }

      case "leave_queue": {
        const idx = queue.indexOf(player)
        if (idx >= 0) queue.splice(idx, 1)
        broadcast(ws, { type: "queue_left", payload: {} })
        break
      }

      case "join_room": {
        const rawRoomId = String(msg.payload?.roomId || "").trim().toUpperCase()
        if (!rawRoomId) {
          broadcast(ws, { type: "room_error", payload: { message: "roomId required" } })
          break
        }
        if (!/^[A-Z0-9]{4,12}$/.test(rawRoomId)) {
          broadcast(ws, { type: "room_error", payload: { message: "Room code must be 4-12 letters or numbers" } })
          break
        }
        if (isInRoom(player)) {
          broadcast(ws, { type: "room_error", payload: { message: "Already in a game" } })
          break
        }
        removeFromQueue(player)

        const waiting = waitingRooms.get(rawRoomId)
        if (waiting === player) {
          broadcast(ws, { type: "room_waiting", payload: { roomId: rawRoomId } })
          break
        }
        if (!waiting || !isOpen(waiting)) {
          removeWaitingRoomsForPlayer(player)
          waitingRooms.set(rawRoomId, player)
          broadcast(ws, { type: "room_waiting", payload: { roomId: rawRoomId } })
          log(`🏠 ${player.name} waiting in room ${rawRoomId}`)
          break
        }

        if (waiting.userId === player.userId) {
          broadcast(ws, { type: "room_error", payload: { message: "Cannot join your own room" } })
          break
        }

        waitingRooms.delete(rawRoomId)
        makeRoom(waiting, player, rawRoomId)
        break
      }

      case "turn_action": {
        // Validate slam parameters before relay
        const action = msg.payload || {}
        const validation = validateSlam(action.slamParams || action)
        if (validation.warnings.length > 0) {
          log(`⚠️ Rejected suspicious slam from ${player.name}: ${validation.warnings.join(", ")}`)
          broadcast(ws, { type: "turn_error", payload: { message: "Invalid turn data", warnings: validation.warnings } })
          break
        }
        // Find player's room and relay to opponent
        let foundRoom = false
        for (const [id, room] of rooms) {
          const idx = room.players.indexOf(player)
          if (idx >= 0) {
            room.gameState = "playing"
            const opponent = room.players[1 - idx]
            broadcast(opponent.ws, { type: "turn_received", payload: msg.payload })
            foundRoom = true
            break
          }
        }
        if (!foundRoom) {
          broadcast(ws, { type: "turn_error", payload: { message: "Not in a game" } })
        }
        break
      }

      case "turn_result": {
        // Relay turn result to opponent
        let foundRoom = false
        for (const [, room] of rooms) {
          const idx = room.players.indexOf(player)
          if (idx >= 0) {
            const opponent = room.players[1 - idx]
            broadcast(opponent.ws, { type: "turn_result", payload: msg.payload })
            foundRoom = true
            break
          }
        }
        if (!foundRoom) {
          broadcast(ws, { type: "turn_error", payload: { message: "Not in a game" } })
        }
        break
      }

      case "game_over": {
        for (const [id, room] of rooms) {
          if (room.players.includes(player)) {
            room.gameState = "finished"
            const opp = room.players.find((p) => p !== player)
            if (opp) broadcast(opp.ws, { type: "game_over", payload: msg.payload })
            rooms.delete(id)
            log(`🏁 Game over in room ${id}`)
            break
          }
        }
        break
      }
    }
  })

  ws.on("close", () => {
    clearInterval(pingInterval)
    cleanupPlayer(player)
    log(`🔌 ${player.name} disconnected (${connections.size} online)`)
  })

  ws.on("error", (err) => {
    log(`⚠️ WS error for ${player.name}: ${err.message}`)
    clearInterval(pingInterval)
    cleanupPlayer(player)
    try { ws.close() } catch {}
  })

  // Welcome
  broadcast(ws, { type: "connected", payload: { userId: player.userId, name: player.name } })
})

// ---- Status API (embedded HTTP) ----
const statusServer = createServer((_req, res) => {
  if (_req.url === "/status") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(
      JSON.stringify({
        activeRooms: rooms.size,
        queueLength: queue.length,
        connectedClients: connections.size,
        uptime: process.uptime(),
      })
    )
  } else {
    res.writeHead(404)
    res.end("Not found")
  }
})
statusServer.listen(PORT + 1)
log(`Status HTTP on port ${PORT + 1}`)

// Graceful shutdown
process.on("SIGTERM", () => {
  log("Shutting down...")
  wss.close()
  statusServer.close()
  process.exit(0)
})
