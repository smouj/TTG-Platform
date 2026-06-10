"use client"

// Friend Battle + Ranked — PvP via WebSocket
// URL pattern: /game/friend/[roomId]
//   - "new" → create room UI
//   - "ranked" → ranked matchmaking queue
//   - "ABCD" → join that room

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { usePvPWebSocket } from "@/lib/battle/use-pvp-websocket"
import BattleView from "@/components/game/battle-view"
import { Disc3, Users, Copy, Check, ArrowLeft, Zap, Swords, Timer } from "lucide-react"

function randomRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export default function FriendPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuth()
  const pvp = usePvPWebSocket(token)
  const roomId = (params.roomId as string)?.toUpperCase() || ""

  const [copied, setCopied] = useState(false)
  const [localRoomCode, setLocalRoomCode] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [mode, setMode] = useState<"create" | "join" | "waiting" | "battle" | "ranked">("create")

  // Init: if URL has room code, join it; otherwise show create UI
  useEffect(() => {
    if (!roomId || roomId === "new") {
      setMode("create")
    } else if (roomId === "ranked") {
      setMode("ranked")
      // Auto-join queue after connection
      setTimeout(() => {
        if (pvp.state.status === "connected") pvp.joinQueue()
      }, 1500)
    } else {
      setMode("join")
      setJoinCode(roomId)
    }
  }, [roomId])

  // Auto-join queue when connected in ranked mode
  useEffect(() => {
    if (mode === "ranked" && pvp.state.status === "connected") {
      pvp.joinQueue()
    }
  }, [mode, pvp.state.status])

  // Handle WebSocket state changes
  useEffect(() => {
    if (pvp.state.status === "waiting_room") {
      setMode("waiting")
      if (pvp.state.roomId && roomId !== pvp.state.roomId) {
        router.replace(`/game/friend/${pvp.state.roomId}`)
      }
    }
    if (pvp.state.status === "matched") {
      setMode("battle")
    }
    if (pvp.state.status === "queued" && mode === "ranked") {
      // Stay in ranked mode, show queue position
    }
  }, [pvp.state.status, pvp.state.roomId, roomId, router, mode])

  const handleCreate = useCallback(() => {
    const code = randomRoomCode()
    setLocalRoomCode(code)
    pvp.joinRoom(code)
    // Update URL
    router.replace(`/game/friend/${code}`)
  }, [pvp, router])

  const handleJoin = useCallback(() => {
    if (joinCode.length < 4) return
    pvp.joinRoom(joinCode.toUpperCase())
  }, [joinCode, pvp])

  const handleCopy = useCallback(() => {
    const code = pvp.state.roomId || localRoomCode
    if (code) {
      navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [pvp.state.roomId, localRoomCode])

  // ── Create Room UI ──
  if (mode === "create") return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-[#FFCC00] border-3 border-[#1a1a1a] mb-3"
            style={{ boxShadow: "4px 4px 0 #1a1a1a" }}>
            <Users className="w-7 h-7 text-[#1a1a1a]" />
          </div>
          <h1 className="text-xl font-black text-[#1a1a1a] uppercase">Friend Battle</h1>
          <p className="text-xs font-bold text-[#1a1a1a]/40 mt-1">Room code duel with a friend</p>
        </div>

        <div className="space-y-3">
          <button onClick={handleCreate}
            disabled={pvp.state.status === "connecting" || pvp.state.status === "waiting_room"}
            className="w-full py-4 font-black text-sm uppercase text-[#1a1a1a] bg-[#FFCC00] border-3 border-[#1a1a1a] transition-all disabled:opacity-50"
            style={{ boxShadow: "5px 5px 0 #1a1a1a" }}>
            <Users className="w-4 h-4 inline mr-2" /> Create Room
          </button>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-[3px] bg-[#1a1a1a]/10" />
            <span className="text-[8px] font-black text-[#1a1a1a]/30 uppercase">or join existing</span>
            <div className="flex-1 h-[3px] bg-[#1a1a1a]/10" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
              maxLength={4}
              className="flex-1 px-4 py-3 font-mono text-lg font-black text-[#1a1a1a] bg-white border-3 border-[#1a1a1a] uppercase tracking-[0.3em] placeholder:text-[#1a1a1a]/20 outline-none"
              style={{ boxShadow: "3px 3px 0 #1a1a1a" }}
            />
            <button onClick={handleJoin}
              disabled={joinCode.length < 4 || pvp.state.status !== "connected"}
              className="px-6 py-3 font-black text-sm uppercase text-white bg-[#1a1a1a] border-3 border-[#1a1a1a] disabled:opacity-30 transition-all"
              style={{ boxShadow: "3px 3px 0 #1a1a1a" }}>
              Join
            </button>
          </div>
        </div>

        {pvp.state.status === "connecting" && (
          <p className="text-center text-xs font-bold text-[#1a1a1a]/30 animate-pulse">Connecting to server...</p>
        )}
        {pvp.state.error && (
          <p className="text-center text-xs font-bold text-[#E3350D]">{pvp.state.error}</p>
        )}
      </div>
    </div>
  )

  // ── Waiting Room UI ──
  if (mode === "waiting") return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <Disc3 className="w-16 h-16 mx-auto animate-spin text-[#FFCC00]" />

        <div className="space-y-2">
          <h2 className="text-lg font-black text-[#1a1a1a] uppercase">Waiting for Opponent</h2>
          <p className="text-xs font-bold text-[#1a1a1a]/40">Share this code with your friend</p>
        </div>

        {/* Room code display */}
        <div className="inline-flex items-center gap-3 px-8 py-4 bg-[#FFCC00] border-3 border-[#1a1a1a]"
          style={{ boxShadow: "6px 6px 0 #1a1a1a" }}>
          <span className="text-[10px] font-black text-[#1a1a1a]/40 uppercase tracking-wider">ROOM</span>
          <span className="text-2xl font-black text-[#1a1a1a] tracking-[0.3em] font-mono">
            {pvp.state.roomId || localRoomCode}
          </span>
          <button onClick={handleCopy}
            className="p-1 hover:bg-[#1a1a1a]/10 transition-colors">
            {copied ? <Check className="w-4 h-4 text-[#22C55E]" /> : <Copy className="w-4 h-4 text-[#1a1a1a]/40" />}
          </button>
        </div>

        <p className="text-[10px] font-bold text-[#1a1a1a]/30">
          {copied ? "Copied!" : "Click to copy"}
        </p>

        <button onClick={() => { pvp.disconnect(); setMode("create"); router.push("/game/friend/new") }}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#1a1a1a]/30 hover:text-[#E3350D] uppercase tracking-wider">
          <ArrowLeft className="w-3 h-3" /> Back
        </button>
      </div>
    </div>
  )

  // ── Ranked Queue UI ──
  if (mode === "ranked") return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-[#FF004D] border-3 border-[#1a1a1a] mb-3"
          style={{ boxShadow: "4px 4px 0 #1a1a1a" }}>
          <Swords className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-xl font-black text-[#1a1a1a] uppercase">Ranked PvP</h1>
        <p className="text-xs font-bold text-[#1a1a1a]/40">
          {pvp.state.status === "queued"
            ? `Searching for opponent... #${pvp.state.queuePosition} in queue`
            : pvp.state.status === "connecting"
            ? "Connecting to matchmaking..."
            : "Elo-ranked matchmaking"}
        </p>

        {pvp.state.status === "queued" && (
          <>
            <div className="flex items-center justify-center gap-2">
              <Disc3 className="w-8 h-8 animate-spin text-[#FF004D]" />
              <Timer className="w-5 h-5 text-[#1a1a1a]/40" />
            </div>
            <p className="text-[10px] font-bold text-[#1a1a1a]/30">
              {pvp.state.queuePosition <= 1 ? "You&apos;re next!" : `${pvp.state.queuePosition} players ahead of you`}
            </p>
          </>
        )}

        {pvp.state.status === "connected" && !pvp.state.queuePosition && (
          <button onClick={() => pvp.joinQueue()}
            className="w-full py-4 font-black text-sm uppercase text-white bg-[#FF004D] border-3 border-[#1a1a1a] transition-all hover:bg-[#E3350D]"
            style={{ boxShadow: "5px 5px 0 #1a1a1a" }}>
            <Zap className="w-4 h-4 inline mr-2" /> Find Match
          </button>
        )}

        <button onClick={() => { pvp.leaveQueue(); pvp.disconnect(); router.push("/app/battle"); }}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#1a1a1a]/30 hover:text-[#E3350D] uppercase tracking-wider">
          <ArrowLeft className="w-3 h-3" /> Back to Lobby
        </button>
      </div>
    </div>
  )

  // ── Battle Mode (PvP) ──
  if (mode === "battle") return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <BattleView pvp={pvp} />
      <div className="fixed top-4 right-4 z-50 px-3 py-1.5 bg-[#FFCC00] border-2 border-[#1a1a1a]"
        style={{ boxShadow: "2px 2px 0px #1a1a1a" }}>
        <span className="text-[9px] font-black text-[#1a1a1a]/40 uppercase tracking-wider">Room</span>
        <span className="ml-1.5 text-xs font-black text-[#1a1a1a] uppercase tracking-[0.1em]">
          {pvp.state.roomId}
        </span>
      </div>
    </div>
  )

  // Fallback
  return (
    <div className="flex items-center justify-center py-28">
      <Disc3 className="w-12 h-12 animate-spin text-[#FFCC00]" />
    </div>
  )
}
