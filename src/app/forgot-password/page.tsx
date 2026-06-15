"use client"

import { useState } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { ArrowLeft, Mail, Disc3 } from "lucide-react"

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
              Forgot Password
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
                Password Recovery
              </span>
              <p className="text-xs font-bold text-[#1a1a1a]/50">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            {/* Status message */}
            {message && (
              <div
                className={`border-3 p-3 text-center ${
                  status === "success"
                    ? "border-[#22C55E] bg-[#22C55E10]"
                    : "border-[#E3350D] bg-[#E3350D10]"
                }`}
              >
                <p className={`text-sm font-bold ${
                  status === "success" ? "text-[#22C55E]" : "text-[#E3350D]"
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
                    className="block text-xs font-black text-[#1a1a1a] uppercase tracking-wider mb-1.5"
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
                    className="w-full border-3 border-[#1a1a1a] px-4 py-3 text-sm font-bold text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 placeholder:font-bold shadow-[3px_3px_0px_#1a1a1a] focus:outline-none focus:border-[#FFCC00] transition-colors"
                    style={{ background: "#fffef0" }}
                  />
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
                    "Send Reset Link"
                  )}
                </button>
              </form>
            )}

            {/* Back to login */}
            {status === "success" && (
              <Link
                href="/login"
                className="block w-full py-3 mag-btn bg-[#1a1a1a] text-[#FFCC00] text-center text-sm font-black uppercase tracking-widest"
              >
                Back to Sign In
              </Link>
            )}

            {/* Divider */}
            {status !== "success" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t-2 border-[#1a1a1a]" />
                  <span className="text-[10px] font-black text-[#1a1a1a]/40 uppercase">
                    Remembered?
                  </span>
                  <div className="flex-1 border-t-2 border-[#1a1a1a]" />
                </div>

                <Link
                  href="/login"
                  className="block w-full py-3 mag-btn bg-[#1a1a1a] text-[#FFCC00] text-center text-sm font-black uppercase tracking-widest"
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
