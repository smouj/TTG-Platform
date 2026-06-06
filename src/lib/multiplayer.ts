"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"

export type MultiplayerState = "idle" | "connecting" | "queued" | "matched" | "playing" | "disconnected"

export interface OpponentInfo {
  userId: string
  name: string
}

interface TurnAction {
  aimX: number
  aimY: number
  power: number
  tazoId: string
}

function getWsUrl(token: string) {
  const configured = process.env.NEXT_PUBLIC_WS_URL
  if (configured) return `${configured.replace(/\/$/, "")}?token=${encodeURIComponent(token)}`
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`
}

export function useMultiplayer() {
  const { token, user } = useAuth()
  const [state, setState] = useState<MultiplayerState>("idle")
  const [queuePosition, setQueuePosition] = useState(0)
  const [opponent, setOpponent] = useState<OpponentInfo | null>(null)
  const [roomId, setRoomId] = useState<string | null>(null)
  const [yourSide, setYourSide] = useState<"player" | "opponent">("player")
  const [lastTurnData, setLastTurnData] = useState<TurnAction | null>(null)
  const [lastTurnResult, setLastTurnResult] = useState<any>(null)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef(0)
  const connectRef = useRef<() => void>(() => {})

  const connect = useCallback(() => {
    if (!token || !user) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setState("connecting")
    const ws = new WebSocket(getWsUrl(token))
    wsRef.current = ws

    ws.onopen = () => {
      reconnectRef.current = 0
      setState("idle")
    }

    ws.onmessage = (event) => {
      let msg: { type: string; payload: any }
      try {
        msg = JSON.parse(event.data)
      } catch {
        return
      }

      switch (msg.type) {
        case "connected":
          setState("idle")
          break
        case "queue_status":
          setQueuePosition(msg.payload.position)
          setState("queued")
          break
        case "queue_left":
          setState("idle")
          setQueuePosition(0)
          break
        case "match_found":
          setOpponent(msg.payload.opponent)
          setRoomId(msg.payload.roomId)
          setYourSide(msg.payload.yourSide)
          setState("matched")
          break
        case "turn_received":
          setLastTurnData(msg.payload)
          break
        case "turn_result":
          setLastTurnResult(msg.payload)
          break
        case "game_over":
          setState("idle")
          setOpponent(null)
          setRoomId(null)
          break
        case "opponent_disconnected":
          setState("disconnected")
          break
      }
    }

    ws.onclose = () => {
      setState("disconnected")
      // Exponential backoff reconnect
      const delay = Math.min(1000 * Math.pow(2, reconnectRef.current), 30000)
      reconnectRef.current += 1
      setTimeout(() => connectRef.current(), delay)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [token, user])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    const timer = token ? window.setTimeout(() => connect(), 0) : null
    return () => {
      if (timer !== null) window.clearTimeout(timer)
      wsRef.current?.close()
    }
  }, [token, connect])

  const joinQueue = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "join_queue" }))
  }, [])

  const leaveQueue = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "leave_queue" }))
  }, [])

  const sendTurn = useCallback((data: TurnAction) => {
    wsRef.current?.send(JSON.stringify({ type: "turn_action", payload: data }))
  }, [])

  const sendTurnResult = useCallback((data: any) => {
    wsRef.current?.send(JSON.stringify({ type: "turn_result", payload: data }))
  }, [])

  const sendGameOver = useCallback((data: any) => {
    wsRef.current?.send(JSON.stringify({ type: "game_over", payload: data }))
  }, [])

  return {
    state,
    queuePosition,
    opponent,
    roomId,
    yourSide,
    lastTurnData,
    lastTurnResult,
    joinQueue,
    leaveQueue,
    sendTurn,
    sendTurnResult,
    sendGameOver,
    connect,
  }
}
