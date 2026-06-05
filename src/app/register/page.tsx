"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { Disc3, ArrowRight, Mail, Lock, User, ArrowLeft, ShieldCheck } from "lucide-react"

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

export default function RegisterPage() {
  const { t } = useI18n()
  const { register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])
  const passwordsMismatch = confirmPassword && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password.length < 10) {
      setError(t.auth_password_min)
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (!agreedTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy")
      return
    }
    setSubmitting(true)
    try {
      await register(email, password, name)
      router.push("/app")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col mag-bg">
      {/* Masthead */}
      <header className="bg-[#3B4CCA] border-b-4 border-[#1a1a1a] mag-stripes">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-white hover:opacity-70">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <img
              src="/logo/logo-icon-black.webp"
              alt="TTG"
              className="w-10 h-10 drop-shadow-[3px_3px_0px_rgba(26,26,26,0.3)]"
            />
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mag-stroke-sm">
              {t.auth_register}
            </h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-5 border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-8"
            style={{ background: "white" }}
          >
            {/* Badge */}
            <div className="text-center space-y-1">
              <span className="inline-block bg-[#FFCC00] text-[#1a1a1a] text-[10px] font-black px-3 py-1 border-2 border-[#1a1a1a] uppercase tracking-widest shadow-[2px_2px_0px_#1a1a1a]">
                {t.auth_register_subtitle}
              </span>
              <p className="text-[10px] font-bold text-[#22C55E] uppercase tracking-wider">
                {t.auth_register_subtitle}
              </p>
            </div>

            {error && (
              <div className="border-3 border-[#E3350D] bg-[#E3350D10] p-3 text-center">
                <p className="text-sm font-bold text-[#E3350D]">{error}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-1.5">
                <User className="w-3.5 h-3.5 inline mr-1" />
                {t.auth_name}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder={t.auth_name_placeholder}
                className="w-full border-3 border-[#1a1a1a] px-4 py-3 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 placeholder:font-bold shadow-[3px_3px_0px_#1a1a1a] focus:outline-none focus:border-[#3B4CCA] transition-colors"
                style={{ background: "#fffef0" }}
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-1.5">
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                {t.auth_email}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="w-full border-3 border-[#1a1a1a] px-4 py-3 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 placeholder:font-bold shadow-[3px_3px_0px_#1a1a1a] focus:outline-none focus:border-[#3B4CCA] transition-colors"
                style={{ background: "#fffef0" }}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-1.5">
                <Lock className="w-3.5 h-3.5 inline mr-1" />
                {t.auth_password}
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
                {t.auth_password_min}
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
              <label htmlFor="confirmPassword" className="block text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                {t.auth_password_confirm || "Confirm password"}
              </label>
              <input
                id="confirmPassword"
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

            {/* Terms agreement */}
            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 border-2 border-[#1a1a1a] accent-[#3B4CCA] shrink-0"
              />
              <label htmlFor="terms" className="text-[10px] font-bold text-[#1a1a1a]/60 leading-relaxed">
                {t.auth_agree_terms || "I agree to the"}{" "}
                <Link href="/terms" className="underline text-[#3B4CCA] hover:text-[#1a1a1a]">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline text-[#3B4CCA] hover:text-[#1a1a1a]">Privacy Policy</Link>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 mag-btn bg-[#3B4CCA] text-white flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Disc3 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {t.auth_register}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t-2 border-[#1a1a1a]" />
              <span className="text-[10px] font-black text-[#1a1a1a]/40 uppercase">
                {t.auth_have_account}
              </span>
              <div className="flex-1 border-t-2 border-[#1a1a1a]" />
            </div>

            {/* Login link */}
            <Link
              href="/login"
              className="block w-full py-3 mag-btn bg-[#1a1a1a] text-[#FFCC00] text-center text-sm font-black uppercase tracking-widest"
            >
              {t.auth_login}
            </Link>
          </form>

          {/* Back to arena */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t.common_back || "Back to Arena"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
