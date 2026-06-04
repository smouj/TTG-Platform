"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { Disc3, ArrowRight, Mail, Lock, User, ArrowLeft } from "lucide-react"

export default function RegisterPage() {
  const { t } = useI18n()
  const { register } = useAuth()
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password.length < 6) {
      setError(t.auth_password_min)
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
                minLength={6}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full border-3 border-[#1a1a1a] px-4 py-3 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 shadow-[3px_3px_0px_#1a1a1a] focus:outline-none focus:border-[#3B4CCA] transition-colors"
                style={{ background: "#fffef0" }}
              />
              <p className="mt-1 text-[10px] font-bold text-[#1a1a1a]/40 uppercase">
                {t.auth_password_min}
              </p>
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
