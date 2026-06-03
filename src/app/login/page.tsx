"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { Disc3, ArrowRight, Mail, Lock, ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const { t } = useI18n()
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login(email, password)
      router.push("/collection")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col mag-bg">
      {/* Masthead */}
      <header className="bg-[#FFCC00] border-b-4 border-[#1a1a1a] mag-stripes">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-[#1a1a1a] hover:opacity-70">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <img
              src="/logo/logo-icon-black.png"
              alt="TTG"
              className="w-10 h-10 drop-shadow-[3px_3px_0px_rgba(26,26,26,0.3)]"
            />
            <h1 className="text-xl sm:text-2xl font-black text-[#1a1a1a] uppercase tracking-tight mag-stroke-sm">
              {t.auth_login}
            </h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Magazine-style card */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-8"
            style={{ background: "white" }}
          >
            {/* Badge */}
            <div className="text-center space-y-1">
              <span className="inline-block bg-[#E3350D] text-white text-[10px] font-black px-3 py-1 border-2 border-[#1a1a1a] uppercase tracking-widest shadow-[2px_2px_0px_#1a1a1a]">
                {t.auth_login_subtitle}
              </span>
            </div>

            {error && (
              <div className="border-3 border-[#E3350D] bg-[#E3350D10] p-3 text-center">
                <p className="text-sm font-bold text-[#E3350D]">{error}</p>
              </div>
            )}

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
                className="w-full border-3 border-[#1a1a1a] px-4 py-3 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 placeholder:font-bold shadow-[3px_3px_0px_#1a1a1a] focus:outline-none focus:border-[#FFCC00] transition-colors"
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
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border-3 border-[#1a1a1a] px-4 py-3 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 shadow-[3px_3px_0px_#1a1a1a] focus:outline-none focus:border-[#FFCC00] transition-colors"
                style={{ background: "#fffef0" }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 mag-btn bg-[#E3350D] text-white flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Disc3 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {t.auth_login}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t-2 border-[#1a1a1a]" />
              <span className="text-[10px] font-black text-[#1a1a1a]/40 uppercase">
                {t.auth_no_account}
              </span>
              <div className="flex-1 border-t-2 border-[#1a1a1a]" />
            </div>

            {/* Register link */}
            <Link
              href="/register"
              className="block w-full py-3 mag-btn bg-[#3B4CCA] text-white text-center text-sm font-black uppercase tracking-widest"
            >
              {t.auth_register}
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
