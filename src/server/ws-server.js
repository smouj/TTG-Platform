// ============================================================
// TTG Multiplayer WebSocket Server (Node.js)
// Matchmaking + room-based PvP relay.
// Zero external deps except ws.
// JWT verified with native crypto — no jsonwebtoken needed.
// ============================================================
/* eslint-disable @typescript-eslint/no-require-imports */

const { Server: WebSocketServer } = require("ws")
const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

// Load .env from project root (no dotenv dependency needed)
function loadEnv() {
  const envPath = path.join(__dirname, "..", "..", ".env")
  try {
    const content = fs.readFileSync(envPath, "utf8")
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx === -1) continue
      const key = trimmed.substring(0, eqIdx).trim()
      let value = trimmed.substring(eqIdx + 1).trim()
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch (_) {
    // .env file optional in production if env vars are set by PM2
  }
}
loadEnv()

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error("[WS] FATAL: JWT_SECRET environment variable is required")
  process.exit(1)
}
const PORT = parseInt(process.env.WS_PORT || "3001")
const HEARTBEAT_MS = 15000
const START_TIME = Date.now()

// ─── Timestamped logger ────────────────────────────────────
function log(msg) {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19)
  console.log(`[${ts}] ${msg}`)
}

// ─── Native JWT verify (HS256 only) ─────────────────────────
function base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/")
  while (str.length % 4) str += "="
  return JSON.parse(Buffer.from(str, "base64").toString("utf8"))
}

function verifyToken(token) {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const [headerB64, payloadB64, sigB64] = parts
    const header = base64UrlDecode(headerB64)
    if (header.alg !== "HS256") return null
    const data = `${headerB64}.${payloadB64}`
    const expected = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("base64url")
    if (sigB64 !== expected) return null
    const payload = base64UrlDecode(payloadB64)
    if (payload.exp && payload.exp * 1000 < Date.now()) return null
    return { userId: payload.id, name: payload.name }
  } catch { return null }
}

// ─── State ──────────────────────────────────────────────────
const queue = []
const waitingRooms = new Map()
const rooms = new Map()
const connections = new Map()

function send(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg))
}

function makeRoom(p1, p2, roomId) {
  const id = roomId || `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const room = {
    id, players: [p1, p2], createdAt: Date.now(),
    // ── Authoritative game state ──
    auth: {
      phase: "lobby",        // lobby | betting | playing | finished
      currentTurn: null,      // userId of player whose turn it is
      turnNumber: 0,
      roundNumber: 0,
      scores: { player: 0, opponent: 0 },
      playerIds: [p1.userId, p2.userId],
      playerBets: {},         // { userId: tazoId }
      readyCount: 0,
    },
  }
  rooms.set(id, room)
  for (const p of [p1, p2]) {
    const opp = p === p1 ? p2 : p1
    const yourSide = p === p1 ? "player" : "opponent"
    send(p.ws, { type: "match_found", payload: { roomId: id, opponent: { userId: opp.userId, name: opp.name }, yourSide } })
  }
  log(`[WS] Match: ${p1.name} vs ${p2.name} [${id}]`)
  return room
}

function cleanupPlayer(player) {
  const qIdx = queue.indexOf(player)
  if (qIdx >= 0) queue.splice(qIdx, 1)
  for (const [id, waiting] of waitingRooms) {
    if (waiting === player) {
      waitingRooms.delete(id)
      break
    }
  }
  for (const [id, room] of rooms) {
    const idx = room.players.indexOf(player)
    if (idx >= 0) {
      const opp = room.players[1 - idx]
      if (room.auth.phase !== "finished") send(opp.ws, { type: "opponent_disconnected", payload: { message: "Your opponent disconnected" } })
      rooms.delete(id)
      break
    }
  }
  connections.delete(player.ws)
}

function tryMatch() {
  while (queue.length >= 2) makeRoom(queue.shift(), queue.shift())
}

// ─── Server ─────────────────────────────────────────────────
let wss
try {
  wss = new WebSocketServer({ port: PORT })
  log(`[WS] Multiplayer server on port ${PORT}`)
} catch (err) {
  if (err.code === 'EADDRINUSE') {
    console.error(`[WS] FATAL: Port ${PORT} already in use. Exiting so PM2 can retry.`)
    process.exit(1)
  }
  throw err
}

wss.on("connection", (ws, req) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`)
  const token = url.searchParams.get("token") || ""
  const user = verifyToken(token)
  if (!user) { ws.close(4001, "Unauthorized"); return }

  const player = { ws, userId: user.userId, name: user.name, joinedAt: Date.now(), alive: true }
  connections.set(ws, player)
  log(`[WS] ${player.name} connected (${connections.size} online)`)

  let alive = true
  const pingTimer = setInterval(() => {
    if (!alive) { ws.terminate(); return }
    alive = false
    ws.ping()
  }, HEARTBEAT_MS)

  ws.on("pong", () => { alive = true })

  ws.on("message", (raw) => {
    let msg
    try { msg = JSON.parse(raw.toString()) } catch { return }

    switch (msg.type) {
      case "join_queue":
        if (!queue.includes(player)) {
          queue.push(player)
          send(ws, { type: "queue_status", payload: { position: queue.length } })
          tryMatch()
        }
        break
      case "leave_queue":
        const idx = queue.indexOf(player)
        if (idx >= 0) queue.splice(idx, 1)
        send(ws, { type: "queue_left" })
        break
      case "join_room": {
        const roomId = String(msg.payload?.roomId || "").trim().toUpperCase()
        if (!roomId) {
          send(ws, { type: "room_error", payload: { message: "roomId required" } })
          break
        }
        const waiting = waitingRooms.get(roomId)
        if (!waiting || waiting === player || waiting.ws.readyState !== 1) {
          waitingRooms.set(roomId, player)
          send(ws, { type: "room_waiting", payload: { roomId } })
          break
        }
        waitingRooms.delete(roomId)
        makeRoom(waiting, player, roomId)
        break
      }
      case "turn_action":
        for (const [, room] of rooms) {
          const idx = room.players.indexOf(player)
          if (idx < 0) continue
          const a = room.auth

          // ── Authoritative validation ──
          // Accept game_start to transition from lobby to betting
          if (msg.payload?.phase === "game_start" && a.phase === "lobby") {
            a.phase = "betting"
            send(room.players[1 - idx].ws, { type: "turn_received", payload: { phase: "game_start" } })
            break
          }

          // Bet placement during betting phase
          if (msg.payload?.phase === "place_bet" && a.phase === "betting") {
            a.playerBets[player.userId] = msg.payload.betTazoId
            // When both bets are in, randomly choose who goes first
            if (Object.keys(a.playerBets).length >= 2) {
              const goFirst = Math.random() < 0.5 ? a.playerIds[0] : a.playerIds[1]
              a.currentTurn = goFirst
              a.phase = "playing"
              a.roundNumber = 1
              a.turnNumber = 1
              const goFirstPlayer = room.players.find(p => p.userId === goFirst)
              const goSecondPlayer = room.players.find(p => p.userId !== goFirst)
              if (goFirstPlayer) send(goFirstPlayer.ws, { type: "turn_received", payload: { phase: "your_turn", round: 1, turn: 1 } })
              if (goSecondPlayer) send(goSecondPlayer.ws, { type: "turn_received", payload: { phase: "opponent_turn", round: 1, turn: 1 } })
            }
            break
          }

          // Slam action during playing phase — only currentTurn player can act
          if (msg.payload?.phase === "slam" && a.phase === "playing") {
            if (a.currentTurn !== player.userId) {
              send(ws, { type: "room_error", payload: { message: "Not your turn" } })
              break
            }
            // Relay to opponent
            send(room.players[1 - idx].ws, { type: "turn_received", payload: msg.payload })
            // Switch turn to opponent
            a.currentTurn = a.currentTurn === a.playerIds[0] ? a.playerIds[1] : a.playerIds[0]
            a.turnNumber++
            break
          }

          // Fallback: relay (for non-authoritative messages)
          send(room.players[1 - idx].ws, { type: "turn_received", payload: msg.payload })
          break
        }
        break
      case "turn_result":
        for (const [, room] of rooms) {
          const idx = room.players.indexOf(player)
          if (idx >= 0) { send(room.players[1 - idx].ws, { type: "turn_result", payload: msg.payload }); break }
        }
        break
      case "game_over":
        for (const [id, room] of rooms) {
          if (room.players.includes(player)) {
            room.auth.phase = "finished"
            const opp = room.players.find(p => p !== player)
            if (opp) send(opp.ws, { type: "game_over", payload: msg.payload })
            rooms.delete(id)
            break
          }
        }
        break
    }
  })

  ws.on("close", () => {
    clearInterval(pingTimer)
    cleanupPlayer(player)
    log(`[WS] ${player.name} disconnected`)
  })

  send(ws, { type: "connected", payload: { userId: player.userId, name: player.name } })
})

// ─── Status HTTP ─────────────────────────────────────────────
const http = require("http")
let statusServer
try {
  statusServer = http.createServer((req, res) => {
    // Health status on / or /status or /health
    if (req.url === '/' || req.url === '/status' || req.url === '/health') {
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" })
      res.end(JSON.stringify({
        activeRooms: rooms.size,
        queueLength: queue.length,
        connectedClients: connections.size,
        uptime: Math.round(process.uptime()),
        memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        status: "healthy",
      }))
      return
    }
    res.writeHead(404, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ error: "not found" }))
  })
  statusServer.listen(PORT + 1)
  log(`[WS] Status HTTP on port ${PORT + 1}`)
} catch (err) {
  if (err.code === 'EADDRINUSE') {
    console.error(`[WS] FATAL: Status port ${PORT + 1} already in use.`)
  }
  throw err
}

// ─── Signal PM2 we're ready (wait_ready support) ───────────
if (typeof process.send === 'function') {
  process.send('ready')
}

// Periodic health log (every 30 min)
setInterval(() => {
  const mem = process.memoryUsage()
  log(`[WS] Health — uptime ${Math.round(process.uptime()/60)}m, heap ${Math.round(mem.heapUsed/1024/1024)}MB/${Math.round(mem.heapTotal/1024/1024)}MB, rss ${Math.round(mem.rss/1024/1024)}MB, rooms ${rooms.size}, queue ${queue.length}, clients ${connections.size}`)
}, 1800000)

function shutdown(signal) {
  log(`[WS] Shutting down gracefully... (signal: ${signal || 'unknown'})`)
  // 5-second hard timeout — force exit if graceful shutdown hangs
  const forceExit = setTimeout(() => {
    log('[WS] Graceful shutdown timed out — forcing exit')
    process.exit(1)
  }, 5000)
  forceExit.unref()
  try { wss && wss.close(() => { clearTimeout(forceExit); process.exit(0) }) } catch (_) { clearTimeout(forceExit); process.exit(0) }
  try { statusServer && statusServer.close() } catch (_) {}
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
process.on("uncaughtException", (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[WS] Port conflict: ${err.message}`)
    process.exit(1)
  }
  console.error(`[WS] Uncaught: ${err.message}`)
  shutdown('uncaughtException')
})
