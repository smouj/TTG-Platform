"use strict";
// ============================================================
// TTG Multiplayer WebSocket Server
// Matchmaking + room-based PvP relay.
// Bun-native — no extra deps beyond 'ws'.
// ============================================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_1 = require("http");
const JWT_SECRET_ENV = process.env.JWT_SECRET;
if (!JWT_SECRET_ENV) {
    console.error("FATAL: JWT_SECRET environment variable is required");
    process.exit(1);
}
const JWT_SECRET = JWT_SECRET_ENV;
const PORT = parseInt(process.env.WS_PORT || "3001");
const HEARTBEAT_MS = 15000;
const queue = [];
const waitingRooms = new Map();
const rooms = new Map();
const connections = new Map();
function broadcast(ws, msg) {
    if (ws.readyState === ws_1.WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
    }
}
function makeRoom(p1, p2, roomId) {
    const id = roomId || `room_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const room = { id, players: [p1, p2], createdAt: Date.now(), gameState: "waiting" };
    rooms.set(id, room);
    // Notify both players
    for (const p of [p1, p2]) {
        const opponent = p === p1 ? p2 : p1;
        broadcast(p.ws, {
            type: "match_found",
            payload: {
                roomId: id,
                opponent: { userId: opponent.userId, name: opponent.name },
                yourSide: p === p1 ? "player" : "opponent",
            },
        });
    }
    log(`⚔️  Match: ${p1.name} vs ${p2.name} [${id}]`);
    return room;
}
function cleanupPlayer(player) {
    // Remove from queue
    const qIdx = queue.indexOf(player);
    if (qIdx >= 0)
        queue.splice(qIdx, 1);
    // Remove from waiting direct room
    for (const [id, waiting] of waitingRooms) {
        if (waiting === player) {
            waitingRooms.delete(id);
            break;
        }
    }
    // Remove from room
    for (const [id, room] of rooms) {
        const idx = room.players.indexOf(player);
        if (idx >= 0) {
            const opponent = room.players[1 - idx];
            if (room.gameState !== "finished") {
                broadcast(opponent.ws, {
                    type: "opponent_disconnected",
                    payload: { message: "Your opponent disconnected" },
                });
            }
            rooms.delete(id);
            log(`🚪 Room ${id} closed — ${player.name} disconnected`);
            break;
        }
    }
    connections.delete(player.ws);
}
function tryMatch() {
    while (queue.length >= 2) {
        const p1 = queue.shift();
        const p2 = queue.shift();
        makeRoom(p1, p2);
    }
}
function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return { userId: decoded.id, name: decoded.name };
    }
    catch {
        return null;
    }
}
function validateSlam(payload) {
    const warnings = [];
    const clamp = (v, min, max, name, def) => {
        if (typeof v !== "number" || isNaN(v) || !isFinite(v))
            return def;
        if (v < min || v > max) {
            warnings.push(`${name}: ${v.toFixed(2)} clamped to [${min}, ${max}]`);
            return Math.max(min, Math.min(max, v));
        }
        return v;
    };
    clamp(payload.verticalForce ?? 0.5, 0, 1, "verticalForce", 0.5);
    clamp(payload.timingAccuracy ?? 0.5, 0, 1, "timingAccuracy", 0.5);
    clamp(payload.tiltIntensity ?? 0, 0, 1, "tiltIntensity", 0);
    clamp(payload.spinIntensity ?? 0, 0, 1, "spinIntensity", 0);
    clamp(payload.aimPrecision ?? 0.5, 0, 1, "aimPrecision", 0.5);
    clamp(payload.impactX ?? 0, -2, 2, "impactX", 0);
    clamp(payload.impactZ ?? 0, -2, 2, "impactZ", 0);
    if (payload.tilt && !["flat", "forward", "backward"].includes(payload.tilt)) {
        warnings.push(`tilt: "${payload.tilt}" invalid (expected flat/forward/backward)`);
    }
    return { valid: warnings.length === 0, warnings };
}
function log(msg) {
    console.log(`[WS] ${new Date().toISOString().slice(11, 19)} ${msg}`);
}
// ---- Server ----
const wss = new ws_1.WebSocketServer({ port: PORT });
wss.on("listening", () => {
    log(`Multiplayer server listening on port ${PORT}`);
    if (typeof process.send === "function") process.send("ready");
});
wss.on("connection", (ws, req) => {
    // Auth via query param
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    const token = url.searchParams.get("token") || "";
    const user = verifyToken(token);
    if (!user) {
        ws.close(4001, "Unauthorized");
        return;
    }
    const player = {
        ws,
        userId: user.userId,
        name: user.name,
        joinedAt: Date.now(),
        alive: true,
    };
    connections.set(ws, player);
    log(`🔌 ${player.name} connected (${connections.size} online)`);
    // Heartbeat
    let pingInterval;
    ws.on("pong", () => { player.alive = true; });
    pingInterval = setInterval(() => {
        if (!player.alive) {
            ws.terminate();
            return;
        }
        player.alive = false;
        ws.ping();
    }, HEARTBEAT_MS);
    ws.on("message", (raw) => {
        let msg;
        try {
            msg = JSON.parse(raw.toString());
        }
        catch {
            return;
        }
        switch (msg.type) {
            case "join_queue": {
                if (queue.includes(player))
                    break;
                queue.push(player);
                broadcast(ws, { type: "queue_status", payload: { position: queue.length } });
                log(`🎯 ${player.name} joined queue (${queue.length} waiting)`);
                tryMatch();
                break;
            }
            case "leave_queue": {
                const idx = queue.indexOf(player);
                if (idx >= 0)
                    queue.splice(idx, 1);
                broadcast(ws, { type: "queue_left", payload: {} });
                break;
            }
            case "join_room": {
                const rawRoomId = String(msg.payload?.roomId || "").trim().toUpperCase();
                if (!rawRoomId) {
                    broadcast(ws, { type: "room_error", payload: { message: "roomId required" } });
                    break;
                }
                const waiting = waitingRooms.get(rawRoomId);
                if (!waiting || waiting === player || waiting.ws.readyState !== ws_1.WebSocket.OPEN) {
                    waitingRooms.set(rawRoomId, player);
                    broadcast(ws, { type: "room_waiting", payload: { roomId: rawRoomId } });
                    log(`🏠 ${player.name} waiting in room ${rawRoomId}`);
                    break;
                }
                waitingRooms.delete(rawRoomId);
                makeRoom(waiting, player, rawRoomId);
                break;
            }
            case "turn_action": {
                // Validate slam parameters before relay
                const validation = validateSlam(msg.payload || {});
                if (validation.warnings.length > 0) {
                    log(`⚠️ Suspicious slam from ${player.name}: ${validation.warnings.join(", ")}`);
                }
                // Find player's room and relay to opponent
                for (const [id, room] of rooms) {
                    const idx = room.players.indexOf(player);
                    if (idx >= 0) {
                        room.gameState = "playing";
                        const opponent = room.players[1 - idx];
                        broadcast(opponent.ws, { type: "turn_received", payload: msg.payload });
                        break;
                    }
                }
                break;
            }
            case "turn_result": {
                // Relay turn result to opponent
                for (const [, room] of rooms) {
                    const idx = room.players.indexOf(player);
                    if (idx >= 0) {
                        const opponent = room.players[1 - idx];
                        broadcast(opponent.ws, { type: "turn_result", payload: msg.payload });
                        break;
                    }
                }
                break;
            }
            case "game_over": {
                for (const [id, room] of rooms) {
                    if (room.players.includes(player)) {
                        room.gameState = "finished";
                        const opp = room.players.find((p) => p !== player);
                        if (opp)
                            broadcast(opp.ws, { type: "game_over", payload: msg.payload });
                        rooms.delete(id);
                        log(`🏁 Game over in room ${id}`);
                        break;
                    }
                }
                break;
            }
        }
    });
    ws.on("close", () => {
        clearInterval(pingInterval);
        cleanupPlayer(player);
        log(`🔌 ${player.name} disconnected (${connections.size - 1} online)`);
    });
    ws.on("error", (err) => {
        log(`⚠️ WS error for ${player.name}: ${err.message}`);
        ws.close();
    });
    // Welcome
    broadcast(ws, { type: "connected", payload: { userId: player.userId, name: player.name } });
});
// ---- Status API (embedded HTTP) ----
const statusServer = (0, http_1.createServer)((_req, res) => {
    if (_req.url === "/status" || _req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            activeRooms: rooms.size,
            queueLength: queue.length,
            connectedClients: connections.size,
            uptime: process.uptime(),
        }));
    }
    else {
        res.writeHead(404);
        res.end("Not found");
    }
});
statusServer.listen(PORT + 1);
log(`Status HTTP on port ${PORT + 1}`);
// Graceful shutdown
process.on("SIGTERM", () => {
    log("Shutting down...");
    wss.close();
    statusServer.close();
    process.exit(0);
});
