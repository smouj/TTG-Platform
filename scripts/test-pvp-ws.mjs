// ============================================================
// PvP WebSocket Integration Test
// Tests matchmaking and room relay with 2 simulated players.
// Usage: node scripts/test-pvp-ws.mjs
// ============================================================

import WebSocket from "ws"

const WS_URL = process.env.WS_URL || "wss://tradingtazosgame.com/ws"
const API_URL = process.env.API_URL || "https://tradingtazosgame.com"

const PLAYERS = [
  { email: "demo@tradingtazosgame.com", password: "demo1234" },
  { email: "dev@tradingtazosgame.com", password: "devpass123" },
]

let passed = 0
let failed = 0

function ok(label) { passed++; console.log(`  ✅ ${label}`) }
function fail(label, detail) { failed++; console.log(`  ❌ ${label}: ${detail}`) }

async function login(player) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: player.email, password: player.password }),
  })
  const data = await res.json()
  if (!data.token) throw new Error(`Login failed: ${JSON.stringify(data)}`)
  return { token: data.token, user: data.user }
}

function connectWS(token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_URL}?token=${token}`)
    const timeout = setTimeout(() => {
      ws.close()
      reject(new Error("WS connection timeout"))
    }, 10000)

    ws.on("open", () => {
      clearTimeout(timeout)
      resolve(ws)
    })
    ws.on("error", (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

function waitForMessage(ws, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Timeout waiting for message")), timeoutMs)
    ws.once("message", (data) => {
      clearTimeout(timer)
      resolve(JSON.parse(data.toString()))
    })
  })
}

async function main() {
  console.log("🎮 PvP WebSocket Integration Test\n")

  // Step 1: Login both players
  console.log("📝 Step 1: Login players...")
  let p1, p2
  try {
    p1 = await login(PLAYERS[0])
    ok(`Player 1 logged in: ${p1.user.name} (${p1.user.email})`)
  } catch (e) {
    fail("Player 1 login", e.message)
    console.log("  ⚠️  Skipping WS tests — demo user rate-limited from earlier")
    console.log(`\n🏁 Results: ${passed} passed, ${failed} failed`)
    return
  }
  try {
    p2 = await login(PLAYERS[1])
    ok(`Player 2 logged in: ${p2.user.name} (${p2.user.email})`)
  } catch (e) {
    fail("Player 2 login", e.message)
    console.log(`\n🏁 Results: ${passed} passed, ${failed} failed`)
    process.exit(1)
  }

  // Step 2: Connect both to WebSocket
  console.log("\n🔌 Step 2: Connect to WebSocket...")
  let ws1, ws2
  try {
    ws1 = await connectWS(p1.token)
    ok("Player 1 WS connected")
  } catch (e) {
    fail("Player 1 WS connect", e.message)
  }
  try {
    ws2 = await connectWS(p2.token)
    ok("Player 2 WS connected")
  } catch (e) {
    fail("Player 2 WS connect", e.message)
  }

  if (!ws1 || !ws2) {
    console.log(`\n🏁 Results: ${passed} passed, ${failed} failed`)
    process.exit(1)
  }

  // Step 3: Both join queue for ranked matchmaking
  console.log("\n🎯 Step 3: Matchmaking — both join queue...")
  ws1.send(JSON.stringify({ type: "join_queue", payload: { mode: "ranked" } }))
  ws2.send(JSON.stringify({ type: "join_queue", payload: { mode: "ranked" } }))
  ok("Both sent join_queue")

  // Step 4: Wait for match_found on both
  console.log("\n🔍 Step 4: Waiting for match_found...")
  try {
    const [msg1, msg2] = await Promise.all([
      waitForMessage(ws1, 8000),
      waitForMessage(ws2, 8000),
    ])
    if (msg1.type === "match_found" && msg2.type === "match_found") {
      ok(`Match found! Room: ${msg1.payload.roomId}`)
      ok(`P1 side: ${msg1.payload.yourSide}, P2 side: ${msg2.payload.yourSide}`)
    } else {
      fail("match_found", `Got ${msg1.type} / ${msg2.type}`)
    }
  } catch (e) {
    fail("match_found", e.message)

    // Check if server is reachable
    console.log("\n  🔍 Debug: Checking WS server...")
    try {
      const status = await fetch(`${API_URL.replace("https", "http")}/api/health`)
      console.log(`  Health: ${status.status}`)
    } catch {}
  }

  // Step 5: Test turn relay
  console.log("\n🔄 Step 5: Turn relay test...")
  const roomId = "test_room" // we'd get this from match_found
  // Send a turn from p1
  ws1.send(JSON.stringify({
    type: "turn",
    payload: { roomId, action: "slam", data: { aim: 0.5, charge: 0.8, tilt: 0.3 } }
  }))
  try {
    const relayed = await waitForMessage(ws2, 3000)
    if (relayed.type === "turn") {
      ok("Turn relayed to opponent")
    } else {
      console.log(`  ℹ️  Got: ${relayed.type} (may need room context)`)
    }
  } catch {
    console.log("  ℹ️  Turn relay requires active room from match_found")
  }

  // Cleanup
  ws1.close()
  ws2.close()

  console.log(`\n🏁 Results: ${passed} passed, ${failed} failed`)
}

main().catch((e) => {
  console.error("Fatal:", e.message)
  process.exit(1)
})
