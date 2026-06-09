"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { Disc3, ArrowRight, Mail, Lock, ArrowLeft } from "lucide-react"

function LoginForm() {
  const { t } = useI18n()
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/app"
  const oauthError = searchParams.get("error")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (oauthError) {
      const messages: Record<string, string> = {
        github_not_configured: "GitHub login no está configurado aún.",
        google_not_configured: "Google login no está configurado aún.",
        discord_not_configured: "Discord login no está configurado aún.",
        oauth_access_denied: "Acceso denegado por el proveedor.",
        invalid_oauth_request: "Solicitud OAuth inválida.",
      }
      setError(messages[oauthError] || `Error de autenticación: ${decodeURIComponent(oauthError)}`)
    }
  }, [oauthError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login(email, password)
      router.push(redirectTo)
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
              src="/logo/logo-icon-black.webp"
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
                placeholder={t.auth_email_placeholder || "you@email.com"}
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

            {/* Forgot password */}
            <div className="text-right">
              <a href="/forgot-password" className="text-xs font-bold text-[#1a1a1a]/50 hover:text-[#FF004D] transition-colors uppercase tracking-wider">
                Forgot password?
              </a>
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

            {/* OAuth Providers */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t-2 border-[#1a1a1a]/15" />
                <span className="text-[10px] font-black text-[#1a1a1a]/30 uppercase tracking-widest">{t.auth_oauth_divider || "or continue with"}</span>
                <div className="flex-1 border-t-2 border-[#1a1a1a]/15" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <OAuthButton provider="github" />
                <OAuthButton provider="google" />
                <OAuthButton provider="discord" />
              </div>

              <p className="text-[9px] text-[#1a1a1a]/30 text-center leading-tight">
                {t.auth_oauth_terms || "By continuing you agree to our"}{' '}
                <a href="/terms" className="underline hover:text-[#1a1a1a]/50">{t.auth_terms || "Terms"}</a>
                {' '}{t.common_and || "and"}{' '}
                <a href="/privacy" className="underline hover:text-[#1a1a1a]/50">{t.auth_privacy || "Privacy"}</a>
              </p>
            </div>

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
              {t.common_back || "Back"}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginSkeleton() {
  return (
    <div className="min-h-screen flex flex-col mag-bg">
      <header className="bg-[#FFCC00] border-b-4 border-[#1a1a1a] mag-stripes">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-5 h-5 bg-[#1a1a1a]/10 rounded" />
          <div className="w-10 h-10 bg-[#1a1a1a]/10 rounded" />
          <div className="h-6 w-24 bg-[#1a1a1a]/10 rounded" />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-5">
          <div className="border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-8 bg-white">
            <div className="text-center mb-6">
              <div className="inline-block w-32 h-6 bg-[#1a1a1a]/5 rounded" />
            </div>
            <div className="space-y-4">
              <div className="h-3 w-12 bg-[#1a1a1a]/10 rounded" />
              <div className="h-12 w-full bg-[#1a1a1a]/5 rounded" />
              <div className="h-3 w-16 bg-[#1a1a1a]/10 rounded" />
              <div className="h-12 w-full bg-[#1a1a1a]/5 rounded" />
              <div className="h-12 w-full bg-[#E3350D]/60 rounded" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ── OAuth Button Component ──

const OAUTH_ICONS: Record<string, string> = {
  github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`,
  google: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,
  discord: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
}

function OAuthButton({ provider }: { provider: string }) {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/app"

  const labels: Record<string, string> = {
    github: "GitHub",
    google: "Google",
    discord: "Discord",
  }

  const colors: Record<string, string> = {
    github: "bg-[#24292e] hover:bg-[#1b1f23]",
    google: "bg-white hover:bg-gray-50 border-2 border-[#1a1a1a]/20 text-[#1a1a1a]",
    discord: "bg-[#5865F2] hover:bg-[#4752c4]",
  }

  return (
    <a
      href={`/api/auth/oauth/login?provider=${provider}&redirect=${encodeURIComponent(redirectTo)}`}
      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded text-xs font-bold uppercase tracking-wider text-white transition-colors shadow-sm ${colors[provider] || "bg-[#1a1a1a]"}`}
      title={`Continue with ${labels[provider] || provider}`}
    >
      <span
        className="w-4 h-4 shrink-0"
        dangerouslySetInnerHTML={{ __html: OAUTH_ICONS[provider] || "" }}
      />
      <span className="hidden sm:inline">{labels[provider] || provider}</span>
    </a>
  )
}
