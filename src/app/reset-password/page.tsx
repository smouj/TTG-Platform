"use client"

import { useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Lock, ShieldCheck, ArrowLeft, Disc3 } from "lucide-react"
import MagazineHeader from "@/components/game/magazine-header"
import MagazineFooter from "@/components/game/magazine-footer"

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "#E5E7EB" }
  let score = 0
  if (pw.length >= 10) score++
  if (pw.length >= 14) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 1) return { score: 1, label: "Weak", color: 'var(--ttg-red)' }
  if (score === 2) return { score: 2, label: "Fair", color: "var(--ttg-warning)" }
  if (score === 3) return { score: 3, label: "Good", color: "#3B82F6" }
  return { score: 4, label: "Strong", color: 'var(--ttg-success)' }
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const strength = useMemo(() => getPasswordStrength(password), [password])
  const passwordsMismatch = confirmPassword && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    if (password.length < 10) {
      setStatus("error")
      setMessage("Password must be at least 10 characters")
      return
    }
    if (password !== confirmPassword) {
      setStatus("error")
      setMessage("Passwords do not match")
      return
    }

    setStatus("submitting")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setStatus("success")
        setMessage(data.message + " Redirecting to sign in...")
        setTimeout(() => {
          window.location.href = "/login"
        }, 2500)
      } else {
        setStatus("error")
        setMessage(data.error || "Failed to reset password. The link may have expired.")
      }
    } catch {
      setStatus("error")
      setMessage("Network error. Please check your connection and try again.")
    }
  }

  if (!token) {
    return (
      <div className="space-y-5">
        <div className="border-3 border-ttg-red bg-ttg-red/6 p-4 text-center">
          <p className="text-sm font-bold text-ttg-red uppercase">
            ⚠️ No reset token provided
          </p>
          <p className="text-xs text-ttg-black/50 mt-1">
            Please use the link from your password reset email.
          </p>
          <p className="text-xs text-ttg-black/50">
            Need a new one?{" "}
            <a href="/forgot-password" className="underline font-bold hover:text-ttg-black">
              Request again
            </a>
          </p>
        </div>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="space-y-5 text-center">
        <div className="border-3 border-ttg-success bg-ttg-success/6 p-4">
          <p className="text-sm font-bold text-ttg-success">✅ {message}</p>
        </div>
        <div className="w-6 h-6 border-2 border-ttg-blue border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div className={`border-3 p-3 text-center ${
          status === "error"
            ? "border-ttg-red bg-ttg-red/6"
            : "border-ttg-success bg-ttg-success/6"
        }`}>
          <p className={`text-sm font-bold ${
            status === "error" ? "text-ttg-red" : "text-ttg-success"
          }`}>
            {message}
          </p>
        </div>
      )}

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-xs font-black text-ttg-black uppercase tracking-wider mb-1.5">
          <Lock className="w-3.5 h-3.5 inline mr-1" />
          New Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={10}
          autoComplete="new-password"
          placeholder="••••••••••"
          className="w-full border-3 border-ttg-black px-4 py-3 text-sm font-bold text-ttg-black placeholder:text-ttg-black/30 shadow-[3px_3px_0px_var(--ttg-black)] focus:outline-none focus:border-ttg-blue transition-colors"
          style={{ background: 'var(--ttg-cream)' }}
        />
        <p className="mt-1 text-[10px] font-bold text-ttg-black/40 uppercase">
          Must be at least 10 characters
        </p>
        {/* Strength bar */}
        {password && (
          <div className="mt-2">
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="h-1.5 flex-1 border border-ttg-black transition-colors"
                  style={{
                    background: level <= strength.score ? strength.color : "#E5E7EB",
                  }}
                />
              ))}
            </div>
            <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: strength.color }}>
              {strength.label}
            </p>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirm" className="block text-xs font-black text-ttg-black uppercase tracking-wider mb-1.5">
          <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
          Confirm Password
        </label>
        <input
          id="confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          placeholder="••••••••••"
          className={`w-full border-3 px-4 py-3 text-sm font-bold placeholder:text-ttg-black/30 placeholder:font-bold shadow-[3px_3px_0px_var(--ttg-black)] focus:outline-none transition-colors ${
            passwordsMismatch ? "border-ttg-red" : "border-ttg-black focus:border-ttg-blue"
          }`}
          style={{ background: 'var(--ttg-cream)' }}
        />
        {passwordsMismatch && (
          <p className="mt-1 text-[10px] font-bold text-ttg-red">
            Passwords do not match
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full py-3.5 mag-btn bg-ttg-blue text-white flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? (
          <Disc3 className="w-4 h-4 animate-spin" />
        ) : (
          "Reset Password"
        )}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: "var(--ttg-cream)" }}>
      <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" />
      <MagazineHeader />
      <div className="relative z-10 h-1.5 mag-stripes opacity-20 pointer-events-none" />

      {/* Form */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-md space-y-6">
          <div
            className="space-y-5 border-3 border-ttg-black shadow-[6px_6px_0px_var(--ttg-black)] p-8"
            style={{ background: "white" }}
          >
            {/* Badge */}
            <div className="text-center space-y-1">
              <span className="inline-block bg-ttg-yellow text-ttg-black text-[10px] font-black px-3 py-1 border-2 border-ttg-black uppercase tracking-widest shadow-[2px_2px_0px_var(--ttg-black)]">
                Set New Password
              </span>
              <p className="text-xs font-bold text-ttg-black/50">
                Choose a strong, unique password for your account
              </p>
            </div>

            <Suspense
              fallback={
                <div className="h-64 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-ttg-yellow border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <ResetPasswordForm />
            </Suspense>
          </div>

          {/* Back to hub */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ttg-black/50 hover:text-ttg-black transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
          </div>
        </div>
      </main>
      <MagazineFooter />
    </div>
  )
}
