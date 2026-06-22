"use client"

// ============================================================
// BattlePlayV2 — Connects real API deck data to ArenaSlamV2
//
// Reads sessionStorage (battle_mode, battle_deckId, battle_difficulty)
// Fetches user's deck from /api/decks, maps tazos to DiscState,
// generates opponent discs based on difficulty, renders ArenaSlamV2.
// ============================================================

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import ArenaSlamV2 from "./arena-slam-v2"
import {
  type DiscState,
  type TazoArchetype,
  type TazoStats,
} from "@/lib/battle-v2/physics"

// ─── Map 9-stat tazos to V2 archetypes ───
interface RawTazo {
  id: string
  name: string
  slug?: string
  franchise?: string
  imageUrl?: string | null
  backImageUrl?: string | null
  finish?: string
  attack?: number
  defense?: number
  resistance?: number
  weight?: number
  stability?: number
  spin?: number
  control?: number
  bounce?: number
  precision?: number
}

function avgStats(t: RawTazo): { atk: number; def: number; spd: number; wgt: number } {
  const a = t.attack || 50
  const d = t.defense || 50
  const s = ((t.spin || 50) + (t.bounce || 50) + (t.control || 50)) / 3
  const w = t.weight || 50
  return { atk: a, def: d, spd: s, wgt: w }
}

function classifyArchetype(t: RawTazo): TazoArchetype {
  const a = t.attack || 50
  const d = t.defense || 50
  const s = ((t.spin || 50) + (t.bounce || 50) + (t.control || 50)) / 3
  const w = t.weight || 50
  const r = t.resistance || 50

  if (d >= 70 && r >= 65) return "defender"
  if (w >= 70 && d >= 65) return "heavy"
  if (s >= 75 && w <= 40) return "spinner"
  if (s >= 65 && a >= 55) return "bouncer"
  if (s >= 60 && t.precision! >= 60) return "technical"
  return "balanced"
}

function rawToDisc(t: RawTazo, owner: "player" | "opponent", index: number): DiscState {
  const { atk, def, spd, wgt } = avgStats(t)
  const arch = classifyArchetype(t)
  const stats: TazoStats = {
    attack: Math.round(atk),
    defense: Math.round(def),
    speed: Math.round(spd),
    weight: Math.round(wgt),
  }
  return {
    id: `${owner}-${t.id || `r${index}`}`,
    name: t.name || "?",
    franchise: (t.franchise || "minimon") as DiscState["franchise"],
    imageUrl: t.imageUrl || undefined,
    backImageUrl: t.backImageUrl || undefined,
    finish: t.finish || "standard",
    archetype: arch,
    stats,
    x: 0, y: 0.02, z: 0,
    vx: 0, vy: 0, vz: 0,
    moving: false, flying: false,
    rotation: 0, rotationSpeed: 0,
    flipped: false, ringOut: false,
    wobbleAngle: 0, wobbleSpeed: 0, wobbleAxis: 0,
    owner,
    landedOnId: null,
  }
}

// ─── Generate opponent discs based on difficulty ───
const DIFFICULTY_CONFIG: Record<string, { count: number; statBoost: number }> = {
  rookie: { count: 3, statBoost: -10 },
  skilled: { count: 4, statBoost: 0 },
  expert: { count: 5, statBoost: 10 },
}

const OPPONENT_NAMES = [
  { name: "SHADE", franchise: "dracobell" },
  { name: "GLITCH", franchise: "cybermon" },
  { name: "TOXIN", franchise: "minimon" },
  { name: "RUST", franchise: "cybermon" },
  { name: "VOID", franchise: "dracobell" },
  { name: "BLAZE", franchise: "dracobell" },
  { name: "CHILL", franchise: "minimon" },
]

const OPPONENT_ARCHETYPES: TazoArchetype[] = ["heavy", "defender", "balanced", "spinner", "bouncer", "technical", "balanced"]

function generateOpponentDiscs(difficulty: string, count: number): DiscState[] {
  const cfg = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.skilled
  const discCount = count || cfg.count
  const baseNames = OPPONENT_NAMES.slice(0, discCount)
  const archs = OPPONENT_ARCHETYPES.slice(0, discCount)

  return baseNames.map((n, i) => {
    const arch = archs[i] || "balanced"
    const boost = cfg.statBoost
    const stats: TazoStats = {
      attack: Math.min(99, 50 + boost + Math.floor(Math.random() * 15)),
      defense: Math.min(99, 50 + boost + Math.floor(Math.random() * 15)),
      speed: Math.min(99, 50 + boost + Math.floor(Math.random() * 15)),
      weight: Math.min(99, 45 + boost + Math.floor(Math.random() * 15)),
    }
    return {
      id: `opp-${i}`,
      name: n.name,
      franchise: n.franchise as DiscState["franchise"],
      imageUrl: undefined,
      backImageUrl: undefined,
      finish: "standard",
      archetype: arch,
      stats,
      x: 0, y: 0.02, z: 0,
      vx: 0, vy: 0, vz: 0,
      moving: false, flying: false,
      rotation: 0, rotationSpeed: 0,
      flipped: false, ringOut: false,
      wobbleAngle: 0, wobbleSpeed: 0, wobbleAxis: 0,
      owner: "opponent" as const,
      landedOnId: null,
    }
  })
}

// ─── Loading screen ───
function LoadingScreen() {
  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse at center, #161630 0%, #0b0b18 50%, #030308 100%)",
      gap: "2rem", zIndex: 40,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        border: "3px solid rgba(255,204,0,0.12)",
        borderTopColor: "#FFCC00",
        animation: "spin 0.8s linear infinite",
        boxShadow: "0 0 32px rgba(255,204,0,0.15)",
      }} />
      <p style={{ fontSize: 14, fontWeight: 900, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.25em", margin: 0 }}>
        Entering Arena…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function BattlePlayV2() {
  const { token } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playerDiscs, setPlayerDiscs] = useState<DiscState[] | null>(null)
  const [opponentDiscs, setOpponentDiscs] = useState<DiscState[] | null>(null)

  useEffect(() => {
    // Validate sessionStorage
    const mode = sessionStorage.getItem("battle_mode")
    const deckId = sessionStorage.getItem("battle_deckId")
    if (!mode || !deckId) { router.replace("/app/battle"); return }

    const difficulty = sessionStorage.getItem("battle_difficulty") || "skilled"
    sessionStorage.removeItem("battle_mode")
    sessionStorage.removeItem("battle_difficulty")
    sessionStorage.removeItem("battle_deckId")

    // Fetch deck from API
    async function load() {
      try {
        const headers: Record<string, string> = {}
        if (token) headers["Authorization"] = `Bearer ${token}`

        const res = await fetch("/api/decks", { headers })
        if (!res.ok) throw new Error("Failed to load decks")

        const data = await res.json()
        const activeDeck = (data.decks || []).find((d: any) => d.id === deckId)
        if (!activeDeck?.tazos?.length) throw new Error("Deck not found or empty")

        const tazos: RawTazo[] = activeDeck.tazos
        const discs: DiscState[] = tazos.map((t, i) => rawToDisc(t, "player", i))
        const oppDiscs = generateOpponentDiscs(difficulty, 0)

        setPlayerDiscs(discs)
        setOpponentDiscs(oppDiscs)
        setLoading(false)
      } catch (err: any) {
        setError(err.message || "Failed to load battle data")
        setLoading(false)
      }
    }

    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [token, router])

  if (loading) return <LoadingScreen />

  if (error) {
    return (
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse at center, #161630 0%, #0b0b18 50%, #030308 100%)",
        gap: "1.5rem", zIndex: 40,
      }}>
        <div style={{ fontSize: 48 }}>⚠️</div>
        <p style={{ color: "#FF4444", fontSize: 14, fontWeight: 900, textTransform: "uppercase" }}>{error}</p>
        <button onClick={() => router.push("/app/battle")}
          style={{ padding: "8px 24px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Back to Lobby
        </button>
      </div>
    )
  }

  return <ArenaSlamV2 initialPlayerDiscs={playerDiscs || undefined} initialOpponentDiscs={opponentDiscs || undefined} />
}
