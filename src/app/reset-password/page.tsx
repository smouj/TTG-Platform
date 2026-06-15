"use client"

import { useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Lock, ShieldCheck, ArrowLeft, Disc3 } from "lucide-react"

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "#E5E7EB" }
  let score = 0
  if (pw.length >= 10) score++
  if (pw.length >= 14) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 1) return { score: 1, label: "Weak", color: "#E3350D" }
  if (score === 2) return { score: 2, label: "Fair", color: "#F59E0B" }
  if (score === 3) return { score: 3, label: "Good", color: "#3B82F6" }
  return { score: 4, label: "Strong", color: "#22C55E" }
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
        <div className="border-3 border-[#E3350D] bg-[#E3350D10] p-4 text-center">
          <p className="text-sm font-bold text-[#E3350D] uppercase">
            ⚠️ No reset token provided
          </p>
          <p className="text-xs text-[#1a1a1a]/50 mt-1">
            Please use the link from your password reset email.
          </p>
          <p className="text-xs text-[#1a1a1a]/50">
            Need a new one?{" "}
            <a href="/forgot-password" className="underline font-bold hover:text-[#1a1a1a]">
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
        <div className="border-3 border-[#22C55E] bg-[#22C55E10] p-4">
          <p className="text-sm font-bold text-[#22C55E]">✅ {message}</p>
        </div>
        <div className="w-6 h-6 border-2 border-[#3B4CCA] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message && (
        <div className={`border-3 p-3 text-center ${
          status === "error"
            ? "border-[#E3350D] bg-[#E3350D10]"
            : "border-[#22C55E] bg-[#22C55E10]"
        }`}>
          <p className={`text-sm font-bold ${
            status === "error" ? "text-[#E3350D]" : "text-[#22C55E]"
          }`}>
            {message}
          </p>
        </div>
      )}

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-1.5">
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
          className="w-full border-3 border-[#1a1a1a] px-4 py-3 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 shadow-[3px_3px_0px_#1a1a1a] focus:outline-none focus:border-[#3B4CCA] transition-colors"
          style={{ background: "#fffef0" }}
        />
        <p className="mt-1 text-[10px] font-bold text-[#1a1a1a]/40 uppercase">
          Must be at least 10 characters
        </p>
        {/* Strength bar */}
        {password && (
          <div className="mt-2">
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="h-1.5 flex-1 border border-[#1a1a1a] transition-colors"
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
        <label htmlFor="confirm" className="block text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-1.5">
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
          className={`w-full border-3 px-4 py-3 text-sm font-bold placeholder:text-[#1a1a1a]/30 placeholder:font-bold shadow-[3px_3px_0px_#1a1a1a] focus:outline-none transition-colors ${
            passwordsMismatch ? "border-[#E3350D]" : "border-[#1a1a1a] focus:border-[#3B4CCA]"
          }`}
          style={{ background: "#fffef0" }}
        />
        {passwordsMismatch && (
          <p className="mt-1 text-[10px] font-bold text-[#E3350D]">
            Passwords do not match
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full py-3.5 mag-btn bg-[#3B4CCA] text-white flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="min-h-screen flex flex-col mag-bg">
      {/* Masthead */}
      <header className="bg-[#FFCC00] border-b-4 border-[#1a1a1a] mag-stripes">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/login" className="text-[#1a1a1a] hover:opacity-70">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <img
              src="/logo/logo-tg-yellow.png"
              alt="TTG"
              className="w-10 h-10 drop-shadow-[3px_3px_0px_rgba(26,26,26,0.3)]"
            />
            <h1 className="text-xl sm:text-2xl font-black text-[#1a1a1a] uppercase tracking-tight mag-stroke-sm">
              Reset Password
            </h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div
            className="space-y-5 border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-8"
            style={{ background: "white" }}
          >
            {/* Badge */}
            <div className="text-center space-y-1">
              <span className="inline-block bg-[#FFCC00] text-[#1a1a1a] text-[10px] font-black px-3 py-1 border-2 border-[#1a1a1a] uppercase tracking-widest shadow-[2px_2px_0px_#1a1a1a]">
                Set New Password
              </span>
              <p className="text-xs font-bold text-[#1a1a1a]/50">
                Choose a strong, unique password for your account
              </p>
            </div>

            <Suspense
              fallback={
                <div className="h-64 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#FFCC00] border-t-transparent rounded-full animate-spin" />
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
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
