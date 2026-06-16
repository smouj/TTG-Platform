"use client"

import { useState, useEffect, useCallback } from "react"
import { MAX_REWARDED_ADS_PER_DAY, REWARDED_AD_CREDITS, REWARDED_AD_COOLDOWN_SECONDS } from "@/lib/monetization"

interface RewardedAdButtonProps {
  isAuthenticated: boolean
  onRewardClaimed?: (newBalance: number) => void
}

interface AdStatus {
  used: number
  remaining: number
  dailyLimit: number
  reward: number
  cooldownRemaining: number
}

export function RewardedAdButton({ isAuthenticated, onRewardClaimed }: RewardedAdButtonProps) {
  const [status, setStatus] = useState<AdStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [claimed, setClaimed] = useState(false)

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await fetch("/api/credits/rewarded-ad")
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch {
      // Silently fail
    }
  }, [isAuthenticated])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Cooldown countdown
  useEffect(() => {
    if (!status?.cooldownRemaining) return
    const timer = setInterval(() => {
      setStatus((prev) =>
        prev ? { ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - 1) } : null
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [status?.cooldownRemaining])

  const handleWatchAd = async () => {
    if (!isAuthenticated || loading) return
    setLoading(true)
    setError("")
    setClaimed(false)

    try {
      const res = await fetch("/api/credits/rewarded-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adProvider: "adsense" }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Could not claim reward")
        return
      }

      setClaimed(true)
      onRewardClaimed?.(data.credits)
      fetchStatus()
      setTimeout(() => setClaimed(false), 3000)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Logged out: show CTA ──
  if (!isAuthenticated) {
    return (
      <div style={{
        background: "linear-gradient(160deg, #FFFBEB, #FFF7E0)",
        border: "3px solid #FFCC00",
        boxShadow: "3px 3px 0px #1a1a1a15",
        padding: "16px 20px",
        textAlign: "center",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "8px",
        }}>
          <span style={{ fontSize: "1.4rem" }}>🎬</span>
          <span style={{
            fontSize: "0.9rem",
            fontWeight: 900,
            color: "#1a1a1a",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            Watch & Earn Free Credits
          </span>
        </div>
        <p style={{
          fontSize: "0.75rem",
          color: "#888",
          fontWeight: 600,
          margin: "0 0 10px",
        }}>
          Watch short ads to earn up to {MAX_REWARDED_ADS_PER_DAY * REWARDED_AD_CREDITS} CREDITS daily
        </p>
        <a
          href="/login"
          style={{
            display: "inline-block",
            padding: "8px 24px",
            background: "#1a1a1a",
            color: "#FFCC00",
            border: "2px solid #1a1a1a",
            fontSize: "0.75rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            textDecoration: "none",
            boxShadow: "3px 3px 0px #1a1a1a",
          }}
        >
          Sign In to Earn
        </a>
      </div>
    )
  }

  // ── Authenticated ──
  const canWatch =
    status && status.remaining > 0 && status.cooldownRemaining === 0 && !loading

  return (
    <div style={{
      background: "linear-gradient(160deg, #FFFBEB, #FFF7E0)",
      border: "3px solid #FFCC00",
      boxShadow: "3px 3px 0px #1a1a1a15",
      padding: "16px 20px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "10px",
      }}>
        <span style={{ fontSize: "1.6rem" }}>🎬</span>
        <div>
          <div style={{
            fontSize: "0.9rem",
            fontWeight: 900,
            color: "#1a1a1a",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            Watch & Earn
          </div>
          <div style={{
            fontSize: "0.7rem",
            color: "#888",
            fontWeight: 600,
            marginTop: "1px",
          }}>
            Watch a short ad to earn free credits
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "10px",
        fontSize: "0.8rem",
        fontWeight: 700,
      }}>
        <span style={{ color: "#E3350D" }}>+{REWARDED_AD_CREDITS} credits</span>
        <span style={{ color: "#ccc" }}>·</span>
        <span style={{ color: "#888" }}>
          {status ? `${status.remaining}/${status.dailyLimit} remaining today` : "Loading..."}
        </span>
      </div>

      {/* Error / Success */}
      {error && (
        <div style={{
          background: "#FEE2E2",
          color: "#991B1B",
          border: "2px solid #FCA5A5",
          padding: "6px 10px",
          marginBottom: "10px",
          fontSize: "0.75rem",
          fontWeight: 700,
        }}>
          {error}
        </div>
      )}
      {claimed && (
        <div style={{
          background: "#D1FAE5",
          color: "#065F46",
          border: "2px solid #6EE7B7",
          padding: "6px 10px",
          marginBottom: "10px",
          fontSize: "0.8rem",
          fontWeight: 700,
        }}>
          ✅ +{REWARDED_AD_CREDITS} credits earned!
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleWatchAd}
        disabled={!canWatch}
        style={{
          width: "100%",
          padding: "10px",
          background: canWatch ? "#E3350D" : "#ddd",
          color: canWatch ? "#fff" : "#999",
          border: "3px solid #1a1a1a",
          fontSize: "0.8rem",
          fontWeight: 900,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          cursor: canWatch ? "pointer" : "not-allowed",
          boxShadow: canWatch ? "3px 3px 0px #1a1a1a" : "none",
          transition: "all 0.1s",
        }}
        onMouseEnter={(e) => {
          if (canWatch) {
            e.currentTarget.style.boxShadow = "1px 1px 0px #1a1a1a"
            e.currentTarget.style.transform = "translate(2px, 2px)"
          }
        }}
        onMouseLeave={(e) => {
          if (canWatch) {
            e.currentTarget.style.boxShadow = "3px 3px 0px #1a1a1a"
            e.currentTarget.style.transform = ""
          }
        }}
      >
        {loading
          ? "Loading ad..."
          : status?.cooldownRemaining
          ? `Wait ${status.cooldownRemaining}s`
          : status?.remaining === 0
          ? "Come back tomorrow"
          : "🎬 Watch Ad"}
      </button>

      {status?.remaining === 0 && (
        <p style={{
          textAlign: "center",
          color: "#aaa",
          fontSize: "0.7rem",
          fontWeight: 600,
          margin: "8px 0 0",
        }}>
          Resets at midnight (CEST)
        </p>
      )}
    </div>
  )
}
