"use client"

import { useState } from "react"
import { CREDIT_PACKAGES, formatPrice, formatCredits } from "@/lib/monetization"

interface CreditShopProps {
  userCredits: number
  isAuthenticated: boolean
  onPurchase?: (packageId: string) => void
}

export function CreditShop({ userCredits, isAuthenticated, onPurchase }: CreditShopProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  const handlePurchase = async (packageId: string) => {
    if (!isAuthenticated) return
    setLoading(packageId)
    setError("")
    setSuccessMsg("")

    try {
      const res = await fetch("/api/credits/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Purchase failed")
        return
      }

      if (data.url) {
        window.location.href = data.url
        return
      }

      if (data.dev) {
        setSuccessMsg(data.message)
        onPurchase?.(packageId)
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mag-card border-3 border-[#1a1a1a] bg-white overflow-hidden" style={{ boxShadow: "4px 4px 0px #E3350D30" }}>
      {/* Header */}
      <div style={{
        background: "#1a1a1a",
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.3rem" }}>💎</span>
          <h3 style={{
            color: "#FFCC00",
            fontSize: "0.95rem",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: 0,
          }}>
            Credit Shop
          </h3>
        </div>
        {isAuthenticated && (
          <span style={{
            color: "#ccc",
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}>
            Balance: <strong style={{ color: "#FFCC00" }}>{formatCredits(userCredits)}</strong>
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "20px" }}>
        {error && (
          <div style={{
            background: "#FEE2E2",
            color: "#991B1B",
            border: "2px solid #FCA5A5",
            padding: "10px 14px",
            marginBottom: "14px",
            fontSize: "0.8rem",
            fontWeight: 700,
          }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{
            background: "#D1FAE5",
            color: "#065F46",
            border: "2px solid #6EE7B7",
            padding: "10px 14px",
            marginBottom: "14px",
            fontSize: "0.85rem",
            fontWeight: 700,
          }}>
            {successMsg}
          </div>
        )}

        {/* Package Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: "12px",
        }}>
          {CREDIT_PACKAGES.map((pkg) => {
            const isPopular = pkg.isPopular
            const highlightColor = isPopular ? "#FFCC00" : "#1a1a1a"

            return (
              <div
                key={pkg.id}
                style={{
                  background: isPopular
                    ? "linear-gradient(160deg, #FFFBEB 0%, #fff 100%)"
                    : "#fff",
                  border: `3px solid ${highlightColor}`,
                  boxShadow: isPopular
                    ? "4px 4px 0px #FFCC00"
                    : "3px 3px 0px #1a1a1a10",
                  padding: "16px",
                  textAlign: "center",
                  position: "relative",
                  transition: "transform 0.12s, box-shadow 0.12s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translate(-2px, -2px)"
                  e.currentTarget.style.boxShadow = isPopular
                    ? "6px 6px 0px #FFCC00"
                    : "5px 5px 0px #1a1a1a20"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = ""
                  e.currentTarget.style.boxShadow = isPopular
                    ? "4px 4px 0px #FFCC00"
                    : "3px 3px 0px #1a1a1a10"
                }}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div style={{
                    position: "absolute",
                    top: "-11px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#FFCC00",
                    color: "#1a1a1a",
                    fontSize: "0.65rem",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    padding: "3px 12px",
                    border: "2px solid #1a1a1a",
                    whiteSpace: "nowrap",
                  }}>
                    🔥 Most Popular
                  </div>
                )}

                {/* Name */}
                <div style={{
                  fontSize: "0.85rem",
                  fontWeight: 900,
                  color: "#1a1a1a",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  marginTop: isPopular ? "6px" : "0",
                  marginBottom: "8px",
                }}>
                  {pkg.name}
                </div>

                {/* Credits */}
                <div style={{
                  fontSize: "2.2rem",
                  fontWeight: 900,
                  color: "#E3350D",
                  lineHeight: 1,
                  marginBottom: "2px",
                  fontFamily: "system-ui, sans-serif",
                }}>
                  {formatCredits(pkg.credits)}
                </div>
                <div style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: "#999",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "6px",
                }}>
                  credits
                </div>

                {/* Bonus */}
                {pkg.bonusPct > 0 && (
                  <div style={{
                    background: "#1a1a1a",
                    color: "#FFCC00",
                    fontSize: "0.7rem",
                    fontWeight: 900,
                    letterSpacing: "0.05em",
                    padding: "3px 10px",
                    border: "2px solid #FFCC00",
                    display: "inline-block",
                    marginBottom: "10px",
                  }}>
                    +{pkg.bonusPct}% EXTRA
                  </div>
                )}
                {pkg.bonusPct === 0 && <div style={{ height: "31px" }} />}

                {/* Price */}
                <div style={{
                  fontSize: "1.4rem",
                  fontWeight: 900,
                  color: "#1a1a1a",
                  marginBottom: "12px",
                }}>
                  {formatPrice(pkg.priceCents)}
                </div>

                {/* Button */}
                {isAuthenticated ? (
                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={!!loading}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: loading === pkg.id ? "#555" : "#E3350D",
                      color: "#fff",
                      border: "3px solid #1a1a1a",
                      fontSize: "0.8rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      cursor: loading ? "wait" : "pointer",
                      boxShadow: "3px 3px 0px #1a1a1a",
                      transition: "all 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) {
                        e.currentTarget.style.boxShadow = "1px 1px 0px #1a1a1a"
                        e.currentTarget.style.transform = "translate(2px, 2px)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "3px 3px 0px #1a1a1a"
                      e.currentTarget.style.transform = ""
                    }}
                  >
                    {loading === pkg.id ? "Processing..." : "Buy Now"}
                  </button>
                ) : (
                  <a
                    href="/login"
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px",
                      background: "#1a1a1a",
                      color: "#FFCC00",
                      border: "3px solid #1a1a1a",
                      fontSize: "0.8rem",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      cursor: "pointer",
                      textDecoration: "none",
                      textAlign: "center",
                      boxShadow: "3px 3px 0px #1a1a1a",
                    }}
                  >
                    Sign In to Buy
                  </a>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          marginTop: "16px",
          paddingTop: "14px",
          borderTop: "2px solid #eee",
        }}>
          <p style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "#999",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: "0 0 4px",
          }}>
            Prices include VAT. One-time purchase, no subscription.
          </p>
          <a
            href="/refund-policy"
            style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#E3350D",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Refund Policy →
          </a>
        </div>
      </div>
    </div>
  )
}
