"use client"

import { useState } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { ArrowLeft, Mail, Disc3 } from "lucide-react"
import MagazineHeader from "@/components/game/magazine-header"
import MagazineFooter from "@/components/game/magazine-footer"

export default function ForgotPasswordPage() {
  const { t } = useI18n()
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus("submitting")
    setMessage("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()

      if (data.success) {
        setStatus("success")
        setMessage(data.message || "If an account with that email exists, a reset link has been sent.")
        setEmail("")
      } else {
        setStatus("error")
        setMessage(data.error || "Something went wrong. Please try again.")
      }
    } catch {
      setStatus("error")
      setMessage("Network error. Please check your connection and try again.")
    }
  }

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
                Password Recovery
              </span>
              <p className="text-xs font-bold text-ttg-black/50">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            {/* Status message */}
            {message && (
              <div
                className={`border-3 p-3 text-center ${
                  status === "success"
                    ? "border-ttg-success bg-ttg-success/6"
                    : "border-ttg-red bg-ttg-red/6"
                }`}
              >
                <p className={`text-sm font-bold ${
                  status === "success" ? "text-ttg-success" : "text-ttg-red"
                }`}>
                  {message}
                </p>
              </div>
            )}

            {status !== "success" && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-black text-ttg-black uppercase tracking-wider mb-1.5"
                  >
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
                    className="w-full border-3 border-ttg-black px-4 py-3 text-sm font-bold text-ttg-black placeholder:text-ttg-black/30 placeholder:font-bold shadow-[3px_3px_0px_var(--ttg-black)] focus:outline-none focus:border-ttg-yellow transition-colors"
                    style={{ background: 'var(--ttg-cream)' }}
                  />
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
                    "Send Reset Link"
                  )}
                </button>
              </form>
            )}

            {/* Back to login */}
            {status === "success" && (
              <Link
                href="/login"
                className="block w-full py-3 mag-btn bg-ttg-black text-ttg-yellow text-center text-sm font-black uppercase tracking-widest"
              >
                Back to Sign In
              </Link>
            )}

            {/* Divider */}
            {status !== "success" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t-2 border-ttg-black" />
                  <span className="text-[10px] font-black text-ttg-black/40 uppercase">
                    Remembered?
                  </span>
                  <div className="flex-1 border-t-2 border-ttg-black" />
                </div>

                <Link
                  href="/login"
                  className="block w-full py-3 mag-btn bg-ttg-black text-ttg-yellow text-center text-sm font-black uppercase tracking-widest"
                >
                  Back to Sign In
                </Link>
              </>
            )}
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
