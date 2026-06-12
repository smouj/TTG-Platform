"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import MagazineHeader from "@/components/game/magazine-header"
import MagazineFooter from "@/components/game/magazine-footer"
import {
  Disc3, ArrowRight, Mail, Lock, User, ArrowLeft, ShieldCheck,
  Eye, EyeOff, AlertTriangle, CheckCircle2,
} from "lucide-react"

function getPasswordStrength(pw: string): {
  score: number
  label: string
  color: string
} {
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
  const [showPassword, setShowPassword] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])
  const passwordsMismatch = confirmPassword && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Please enter your name")
      return
    }
    if (password.length < 10) {
      setError(t.auth_password_min || "Password must be at least 10 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (!agreedTerms) {
      setError("You must agree to the Terms of Service to continue")
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
    <div className="min-h-screen flex flex-col" style={{ background: "#FFF9E6" }}>
      <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" />

      <MagazineHeader />

      {/* Decorative stripe below header */}
      <div className="relative z-10 h-2 mag-stripes opacity-20 pointer-events-none" />

      {/* Form area */}
      <main
        id="main-content"
        className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:py-14"
      >
        <div className="w-full max-w-md space-y-5">
          {/* Page Title */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black text-[#1a1a1a] uppercase tracking-tight mag-stroke-sm">
              {t.auth_register}
            </h1>
            <p className="text-xs font-bold text-[#1a1a1a]/40 uppercase tracking-widest">
              {t.auth_register_subtitle}
            </p>
          </div>

          {/* Magazine-style card */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-6 sm:p-8"
            style={{ background: "white" }}
          >
            {/* Error alert */}
            {error && (
              <div className="border-3 border-[#E3350D] bg-[#E3350D0A] p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-[#E3350D] shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-[#E3350D] leading-relaxed">{error}</p>
              </div>
            )}

            {/* Name */}
            <div>
              <label
                htmlFor="reg-name"
                className="block text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-1.5"
              >
                <User className="w-3.5 h-3.5 inline mr-1.5" />
                {t.auth_name}
              </label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                placeholder={t.auth_name_placeholder || "Your Name"}
                className="w-full border-3 border-[#1a1a1a] px-4 py-3 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/25 placeholder:font-bold shadow-[3px_3px_0px_#1a1a1a] focus:outline-none focus:border-[#3B4CCA] transition-colors"
                style={{ background: "#FFFEF7" }}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-1.5"
              >
                <Mail className="w-3.5 h-3.5 inline mr-1.5" />
                {t.auth_email}
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t.auth_email_placeholder || "you@email.com"}
                className="w-full border-3 border-[#1a1a1a] px-4 py-3 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/25 placeholder:font-bold shadow-[3px_3px_0px_#1a1a1a] focus:outline-none focus:border-[#3B4CCA] transition-colors"
                style={{ background: "#FFFEF7" }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-1.5"
              >
                <Lock className="w-3.5 h-3.5 inline mr-1.5" />
                {t.auth_password}
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={10}
                  autoComplete="new-password"
                  placeholder="••••••••••"
                  className="w-full border-3 border-[#1a1a1a] pl-4 pr-11 py-3 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/25 shadow-[3px_3px_0px_#1a1a1a] focus:outline-none focus:border-[#3B4CCA] transition-colors"
                  style={{ background: "#FFFEF7" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1a1a]/25 hover:text-[#1a1a1a]/60 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="mt-1 text-[10px] font-bold text-[#1a1a1a]/35 uppercase">
                {t.auth_password_min || "Minimum 10 characters"}
              </p>

              {/* Strength bar */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="h-1.5 flex-1 border border-[#1a1a1a]/15 transition-colors rounded-sm"
                        style={{
                          background:
                            level <= strength.score ? strength.color : "#E5E7EB",
                        }}
                      />
                    ))}
                  </div>
                  <p
                    className="text-[9px] font-black uppercase tracking-wider"
                    style={{ color: strength.color }}
                  >
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="reg-confirm"
                className="block text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 inline mr-1.5" />
                {t.auth_password_confirm || "Confirm Password"}
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••"
                  className={`w-full border-3 pl-4 pr-11 py-3 text-sm font-bold placeholder:text-[#1a1a1a]/25 placeholder:font-bold shadow-[3px_3px_0px_#1a1a1a] focus:outline-none transition-colors ${
                    passwordsMismatch
                      ? "border-[#E3350D] focus:border-[#E3350D]"
                      : confirmPassword
                      ? "border-[#22C55E] focus:border-[#22C55E]"
                      : "border-[#1a1a1a] focus:border-[#3B4CCA]"
                  }`}
                  style={{ background: "#FFFEF7" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1a1a1a]/25 hover:text-[#1a1a1a]/60 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordsMismatch && (
                <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#E3350D]">
                  <AlertTriangle className="w-3 h-3" />
                  Passwords do not match
                </p>
              )}
              {confirmPassword && !passwordsMismatch && (
                <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#22C55E]">
                  <CheckCircle2 className="w-3 h-3" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Terms agreement */}
            <div className="flex items-start gap-2.5">
              <input
                id="reg-terms"
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 border-2 border-[#1a1a1a] accent-[#3B4CCA] shrink-0 cursor-pointer"
              />
              <label
                htmlFor="reg-terms"
                className="text-[10px] font-bold text-[#1a1a1a]/50 leading-relaxed cursor-pointer"
              >
                {t.auth_agree_terms_prefix || "I agree to the"}{" "}
                <Link
                  href="/?page=terms"
                  className="underline text-[#3B4CCA] hover:text-[#1a1a1a]"
                >
                  {t.auth_terms || "Terms of Service"}
                </Link>{" "}
                {t.common_and || "and"}{" "}
                <Link
                  href="/?page=privacy"
                  className="underline text-[#3B4CCA] hover:text-[#1a1a1a]"
                >
                  {t.auth_privacy || "Privacy Policy"}
                </Link>
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 mag-btn bg-[#3B4CCA] text-white flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
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
              <div className="flex-1 border-t-2 border-[#1a1a1a]/15" />
              <span className="text-[9px] font-black text-[#1a1a1a]/30 uppercase tracking-wider">
                {t.auth_have_account}
              </span>
              <div className="flex-1 border-t-2 border-[#1a1a1a]/15" />
            </div>

            {/* Login link */}
            <Link
              href="/login"
              className="block w-full py-3 mag-btn bg-[#1a1a1a] text-[#FFCC00] text-center text-sm font-black uppercase tracking-widest no-underline"
            >
              {t.auth_login}
            </Link>
          </form>

          {/* Back to landing */}
          <div className="text-center pb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a1a1a]/35 hover:text-[#1a1a1a] transition-colors uppercase tracking-wider no-underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t.common_back || "Back to Arena"}
            </Link>
          </div>
        </div>
      </main>

      {/* Decorative stripe above footer */}
      <div className="relative z-10 h-2 mag-stripes opacity-20 pointer-events-none" />

      <MagazineFooter />
    </div>
  )
}
