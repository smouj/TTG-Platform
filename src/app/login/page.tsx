"use client"
import Image from "next/image"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import MagazineHeader from "@/components/game/magazine-header"
import MagazineFooter from "@/components/game/magazine-footer"
import {
  Disc3, ArrowRight, Mail, Lock, Eye, EyeOff, AlertTriangle, ArrowLeft,
} from "lucide-react"

// ── OAuth Icons ──
const OAUTH_ICONS: Record<string, string> = {
  github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>`,
  google: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,
  discord: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
}

const OAUTH_LABELS: Record<string, string> = {
  github: "GitHub",
  google: "Google",
  discord: "Discord",
}

const OAUTH_COLORS: Record<string, string> = {
  github: "bg-ttg-black hover:bg-ttg-black/90",
  google: "bg-white hover:bg-gray-50 border-2 border-ttg-black/20 text-ttg-black",
  discord: "bg-ttg-discord hover:bg-ttg-discord/80",
}

type OAuthProvider = "github" | "google" | "discord"

function OAuthButton({ provider, redirectTo }: { provider: OAuthProvider; redirectTo: string }) {
  return (
    <a
      href={`/api/auth/oauth/login?provider=${provider}&redirect=${encodeURIComponent(redirectTo)}`}
      className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors shadow-sm ${OAUTH_COLORS[provider] || "bg-ttg-black"}`}
      title={`Continue with ${OAUTH_LABELS[provider] || provider}`}
    >
      <span
        className="w-4 h-4 shrink-0"
        dangerouslySetInnerHTML={{ __html: OAUTH_ICONS[provider] || "" }}
      />
      <span className="hidden sm:inline">{OAUTH_LABELS[provider] || provider}</span>
    </a>
  )
}

function LoginForm() {
  const { t } = useI18n()
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect") || "/app"
  const oauthError = searchParams.get("error")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [oauthProviders, setOauthProviders] = useState<OAuthProvider[]>([])

  useEffect(() => {
    fetch("/api/auth/ping", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.oauthProviders?.length) setOauthProviders(d.oauthProviders)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (oauthError) {
      const messages: Record<string, string> = {
        github_not_configured: "GitHub login is not configured yet.",
        google_not_configured: "Google login is not configured yet.",
        discord_not_configured: "Discord login is not configured yet.",
        oauth_access_denied: "Access denied by provider.",
        invalid_oauth_request: "Invalid OAuth request.",
      }
      setError(messages[oauthError] || `Authentication error: ${decodeURIComponent(oauthError)}`)
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
    <div className="min-h-screen flex flex-col relative" style={{ background: "var(--ttg-cream)" }}>
      <div className="mag-halftone absolute inset-0 opacity-40 pointer-events-none" />

      <MagazineHeader />

      {/* Decorative stripe below header — matches launcher h-1.5 */}
      <div className="relative z-10 h-1.5 mag-stripes opacity-20 pointer-events-none" />

      {/* Form area */}
      <main
        id="main-content"
        className="relative z-10 flex-1 flex items-center justify-center px-4 py-10 sm:py-14"
      >
        <div className="w-full max-w-md space-y-5">
          {/* Page Title */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black text-ttg-black uppercase tracking-tight mag-stroke-sm">
              {t.auth_login}
            </h1>
            <p className="text-xs font-bold text-ttg-black/40 uppercase tracking-widest">
              {t.auth_login_subtitle}
            </p>
          </div>

          {/* Magazine-style card */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 border-3 border-ttg-black shadow-[6px_6px_0px_var(--ttg-black)] p-6 sm:p-8"
            style={{ background: "white" }}
          >
            {/* Error alert */}
            {error && (
              <div className="border-3 border-ttg-red bg-ttg-red/4 p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-ttg-red shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-ttg-red leading-relaxed">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-black text-ttg-black uppercase tracking-wider mb-1.5"
              >
                <Mail className="w-3.5 h-3.5 inline mr-1.5" />
                {t.auth_email}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t.auth_email_placeholder || "you@email.com"}
                className="w-full border-3 border-ttg-black px-4 py-3 text-sm font-bold text-ttg-black placeholder:text-ttg-black/25 placeholder:font-bold shadow-[3px_3px_0px_var(--ttg-black)] focus:outline-none focus:border-ttg-yellow transition-colors"
                style={{ background: "#FFFEF7" }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-black text-ttg-black uppercase tracking-wider mb-1.5"
              >
                <Lock className="w-3.5 h-3.5 inline mr-1.5" />
                {t.auth_password}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full border-3 border-ttg-black pl-4 pr-11 py-3 text-sm font-bold text-ttg-black placeholder:text-ttg-black/25 shadow-[3px_3px_0px_var(--ttg-black)] focus:outline-none focus:border-ttg-yellow transition-colors"
                  style={{ background: "#FFFEF7" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ttg-black/25 hover:text-ttg-black/60 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot password */}
              <div className="mt-1.5 text-right">
                <Link
                  href="/forgot-password"
                  className="text-[10px] font-bold text-ttg-black/35 hover:text-ttg-red transition-colors uppercase tracking-wider no-underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 mag-btn bg-ttg-red text-white flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
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
            {oauthProviders.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t-2 border-ttg-black/10" />
                  <span className="text-[9px] font-black text-ttg-black/25 uppercase tracking-widest">
                    {t.auth_oauth_divider || "or continue with"}
                  </span>
                  <div className="flex-1 border-t-2 border-ttg-black/10" />
                </div>

                <div
                  className={`grid gap-2 ${
                    oauthProviders.length === 1
                      ? "grid-cols-1"
                      : oauthProviders.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-3"
                  }`}
                >
                  {oauthProviders.map((provider) => (
                    <OAuthButton key={provider} provider={provider} redirectTo={redirectTo} />
                  ))}
                </div>

                <p className="text-[8px] text-ttg-black/25 text-center leading-tight">
                  {t.auth_oauth_terms || "By continuing you agree to our"}{" "}
                  <a href="/?page=terms" className="underline hover:text-ttg-black/50">
                    {t.auth_terms || "Terms"}
                  </a>{" "}
                  {t.common_and || "and"}{" "}
                  <a href="/?page=privacy" className="underline hover:text-ttg-black/50">
                    {t.auth_privacy || "Privacy"}
                  </a>
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t-2 border-ttg-black/15" />
              <span className="text-[9px] font-black text-ttg-black/30 uppercase tracking-wider">
                {t.auth_no_account}
              </span>
              <div className="flex-1 border-t-2 border-ttg-black/15" />
            </div>

            {/* Register link */}
            <Link
              href="/register"
              className="block w-full py-3 mag-btn bg-ttg-blue text-white text-center text-sm font-black uppercase tracking-widest no-underline"
            >
              {t.auth_register}
            </Link>
          </form>

          {/* Back to landing */}
          <div className="text-center pb-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ttg-black/35 hover:text-ttg-black transition-colors uppercase tracking-wider no-underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t.common_back || "Back to Home"}
            </Link>
          </div>
        </div>
      </main>

      <MagazineFooter />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col relative" style={{ background: "var(--ttg-cream)" }}>
          <MagazineHeader />
          <div className="relative z-10 h-1.5 mag-stripes opacity-20 pointer-events-none" />
          <main className="flex-1 flex items-center justify-center px-4 py-12 relative">
            <div className="mag-halftone absolute inset-0 opacity-25 pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <Image src="/logo/logo-tg-yellow.png" alt="TTG" width={48} height={48} className="animate-pulse" priority />
              <p className="text-xs font-black text-ttg-black/30 uppercase tracking-[0.3em]">Loading&hellip;</p>
            </div>
          </main>
          <div className="relative z-10 h-1.5 mag-stripes opacity-20 pointer-events-none" />
          <MagazineFooter />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
