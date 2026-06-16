"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"

interface User {
  id: string
  email: string
  name: string
  displayName?: string | null
  avatarUrl?: string | null
  bio?: string | null
  credits?: number
  tazoCount?: number
  deckCount?: number
  level?: number
  xp?: number
  xpToNext?: number
  totalBattles?: number
  totalWins?: number
  totalLosses?: number
  totalTazosOwned?: number
  totalBagsOpened?: number
  totalQuestsDone?: number
  joinDate?: string
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const TOKEN_KEY = "ttg-token"

/** Check if companion session cookie exists (non-httpOnly, readable by JS) */
function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false
  return document.cookie.split(";").some((c) => c.trim().startsWith("ttg_session="))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  /** Lightweight cookie-based session check */
  const checkCookieAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/ping", { credentials: "include" })
      if (!res.ok) return
      const data = await res.json()
      if (data.authed && data.user) {
        setUser(data.user)
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token)
          setToken(data.token)
        }
      }
    } catch {
      // network error — ignore
    }
  }, [])

  const fetchMe = useCallback(async (t: string | null) => {
    try {
      const headers: Record<string, string> = {}
      if (t) headers["Authorization"] = `Bearer ${t}`
      const res = await fetch("/api/auth/me", { headers, credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        // Sync localStorage with cookie auth
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token)
          setToken(data.token)
        }
      } else if (t) {
        // Only clear localStorage if we explicitly had a stored token that failed
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
      }
    } catch {
      // network error — keep token, user will retry
    } finally {
      setLoading(false)
    }
  }, [])

  // Load token from localStorage on mount.
  // Always also try cookie-based auth via /api/auth/ping (browser sends auth_token cookie).
  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem(TOKEN_KEY)
      if (saved) {
        setToken(saved)
        await fetchMe(saved)
      }
      // Always attempt cookie-based auth as safety net
      await checkCookieAuth()
      setLoading(false)
    }
    init()
  }, [checkCookieAuth, fetchMe])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || "Login failed")
    }

    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
      credentials: "include",
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || "Registration failed")
    }

    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    // Call logout API to clear both cookies
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {})
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    if (!token) return
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
    if (res.ok) {
      const data = await res.json()
      setUser(data.user)
    } else {
      logout()
    }
  }, [token, logout])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
