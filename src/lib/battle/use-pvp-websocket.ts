// ============================================================
// usePvPWebSocket — React hook for TTG WebSocket multiplayer
//
// Connects to ws-server at /ws with JWT auth.
// Handles: rooms, matchmaking, turn relay, reconnection.
// ============================================================
"use client"

import { useEffect, useRef, useCallback, useState } from "react"

// ─── Message types ───
export interface WsConnected { type: "connected"; payload: { userId: string; name: string } }
export interface WsQueueStatus { type: "queue_status"; payload: { position: number } }
export interface WsQueueLeft { type: "queue_left" }
export interface WsMatchFound { type: "match_found"; payload: { roomId: string; opponent: { userId: string; name: string }; yourSide: "player" | "opponent" } }
export interface WsRoomWaiting { type: "room_waiting"; payload: { roomId: string } }
export interface WsRoomError { type: "room_error"; payload: { message: string } }
export interface WsTurnReceived { type: "turn_received"; payload: TurnAction }
export interface WsTurnResult { type: "turn_result"; payload: TurnResultPayload }
export interface WsTurnError { type: "turn_error"; payload: { message: string; warnings?: string[] } }
export interface WsGameOver { type: "game_over"; payload: any }
export interface WsOpponentDisconnected { type: "opponent_disconnected"; payload: { message: string } }

export type WsIncoming =
  | WsConnected | WsQueueStatus | WsQueueLeft | WsMatchFound
  | WsRoomWaiting | WsRoomError | WsTurnReceived | WsTurnResult
  | WsTurnError | WsGameOver | WsOpponentDisconnected

export interface TurnAction {
  phase: string
  betTazoId?: string
  slamParams?: {
    tazoId: string
    impactX: number
    impactZ: number
    verticalForce: number
    timingAccuracy: number
    tilt: string
    tiltIntensity: number
    spinIntensity: number
    aimPrecision: number
  }
}

export interface TurnResultPayload {
  winner?: "player" | "opponent" | "draw"
  score?: string
  gameOver?: boolean
  impactDescription?: string
}

export interface PvPState {
  status: "disconnected" | "connecting" | "connected" | "queued" | "waiting_room" | "matched" | "in_game" | "finished"
  roomId: string | null
  opponent: { userId: string; name: string } | null
  yourSide: "player" | "opponent" | null
  queuePosition: number
  error: string | null
  lastOpponentAction: TurnAction | null
  lastOpponentResult: TurnResultPayload | null
}

const WS_INITIAL: PvPState = {
  status: "disconnected",
  roomId: null, opponent: null, yourSide: null,
  queuePosition: 0, error: null,
  lastOpponentAction: null, lastOpponentResult: null,
}

export interface PvPWebSocket {
  state: PvPState
  joinQueue: () => void
  leaveQueue: () => void
  joinRoom: (roomId: string) => void
  createRoom: () => string  // returns room code to share
  sendTurnAction: (action: TurnAction) => void
  sendTurnResult: (result: TurnResultPayload) => void
  sendGameOver: (payload: any) => void
  disconnect: () => void
}

function randomRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no 0/O/1/I to avoid confusion
  let code = ""
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function usePvPWebSocket(token: string | null): PvPWebSocket {
  const [state, setState] = useState<PvPState>({ ...WS_INITIAL })
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const mountedRef = useRef(true)
  const manualDisconnectRef = useRef(false)
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  const connect = useCallback(() => {
    if (!token || !mountedRef.current) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    if (wsRef.current?.readyState === WebSocket.CONNECTING) return

    manualDisconnectRef.current = false
    clearTimeout(reconnectTimer.current)
    setState(s => ({ ...s, status: "connecting", error: null }))

    const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = typeof window !== "undefined" ? window.location.host : "localhost:3000"
    const url = `${protocol}//${host}/ws?token=${encodeURIComponent(token)}`

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (wsRef.current !== ws) return
        if (!mountedRef.current) { ws.close(); return }
        setState(s => ({ ...s, status: "connected" }))
      }

      ws.onmessage = (event) => {
        if (wsRef.current !== ws) return
        if (!mountedRef.current) return
        let msg: WsIncoming
        try { msg = JSON.parse(event.data) } catch { return }

        setState(s => {
          const next = { ...s }
          switch (msg.type) {
            case "connected":
              next.status = "connected"
              break
            case "queue_status":
              next.status = "queued"
              next.queuePosition = msg.payload.position
              break
            case "queue_left":
              next.status = "connected"
              next.queuePosition = 0
              break
            case "match_found":
              next.status = "matched"
              next.roomId = msg.payload.roomId
              next.opponent = msg.payload.opponent
              next.yourSide = msg.payload.yourSide
              break
            case "room_waiting":
              next.status = "waiting_room"
              next.roomId = msg.payload.roomId
              break
            case "room_error":
              next.error = msg.payload.message
              next.status = "connected"
              break
            case "turn_received":
              next.status = "in_game"
              next.lastOpponentAction = msg.payload
              break
            case "turn_result":
              next.lastOpponentResult = msg.payload
              break
            case "turn_error":
              next.error = msg.payload.message
              break
            case "game_over":
              next.status = "finished"
              break
            case "opponent_disconnected":
              next.error = msg.payload.message
              next.status = "finished"
              break
          }
          return next
        })
      }

      ws.onerror = () => {
        if (wsRef.current !== ws) return
        if (!mountedRef.current) return
        setState(s => ({ ...s, status: "disconnected", error: "Connection error" }))
      }

      ws.onclose = () => {
        if (wsRef.current !== ws) return
        if (!mountedRef.current) return
        wsRef.current = null
        setState(s => ({ ...s, status: "disconnected" }))
        // Auto-reconnect after 3s if not finished
        if (!manualDisconnectRef.current && stateRef.current.status !== "finished") {
          reconnectTimer.current = setTimeout(() => connect(), 3000)
        }
      }
    } catch {
      setState(s => ({ ...s, status: "disconnected", error: "Failed to connect" }))
    }
  }, [token])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      manualDisconnectRef.current = true
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const joinQueue = useCallback(() => send({ type: "join_queue" }), [send])
  const leaveQueue = useCallback(() => send({ type: "leave_queue" }), [send])
  const joinRoom = useCallback((roomId: string) => {
    send({ type: "join_room", payload: { roomId } })
  }, [send])
  const createRoom = useCallback((): string => {
    const code = randomRoomCode()
    send({ type: "join_room", payload: { roomId: code } })
    return code
  }, [send])
  const sendTurnAction = useCallback((action: TurnAction) => {
    send({ type: "turn_action", payload: action })
  }, [send])
  const sendTurnResult = useCallback((result: TurnResultPayload) => {
    send({ type: "turn_result", payload: result })
  }, [send])
  const sendGameOver = useCallback((payload: any) => {
    send({ type: "game_over", payload })
    setState(s => ({ ...s, status: "finished" }))
  }, [send])
  const disconnect = useCallback(() => {
    manualDisconnectRef.current = true
    clearTimeout(reconnectTimer.current)
    const ws = wsRef.current
    wsRef.current = null
    ws?.close()
    setState({ ...WS_INITIAL })
  }, [])

  return {
    state, joinQueue, leaveQueue, joinRoom, createRoom,
    sendTurnAction, sendTurnResult, sendGameOver, disconnect,
  }
}
