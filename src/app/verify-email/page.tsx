"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ShieldCheck, Disc3 } from "lucide-react"

function EmailVerifier() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("No verification token found. Please use the link from your welcome email.")
      return
    }

    const verify = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()

        if (res.ok && data.success) {
          setStatus("success")
          setMessage("Your email has been verified! Redirecting to the arena...")
          setTimeout(() => {
            router.push("/app")
          }, 3000)
        } else {
          setStatus("error")
          setMessage(data.error || "This verification link is invalid or expired. Please request a new one.")
        }
      } catch {
        setStatus("error")
        setMessage("Network error. Please check your connection and try again.")
      }
    }

    verify()
  }, [token, router])

  return (
    <div className="space-y-5 text-center">
      {status === "verifying" && (
        <div className="flex flex-col items-center gap-3">
          <Disc3 className="w-8 h-8 animate-spin text-[#3B4CCA]" />
          <p className="text-sm font-bold text-[#1a1a1a]/50 uppercase">Verifying your email...</p>
        </div>
      )}

      {status === "success" && (
        <>
          <div className="border-3 border-[#22C55E] bg-[#22C55E10] p-4">
            <ShieldCheck className="w-12 h-12 text-[#22C55E] mx-auto mb-2" />
            <p className="text-sm font-bold text-[#22C55E] uppercase">{message}</p>
          </div>
          <div className="w-6 h-6 border-2 border-[#3B4CCA] border-t-transparent rounded-full animate-spin mx-auto" />
        </>
      )}

      {status === "error" && (
        <>
          <div className="border-3 border-[#E3350D] bg-[#E3350D10] p-4">
            <p className="text-sm font-bold text-[#E3350D] uppercase">{message}</p>
          </div>
          <Link
            href="/app"
            className="block w-full py-3 mag-btn bg-[#3B4CCA] text-white text-center text-sm font-black uppercase tracking-widest"
          >
            Go to Arena
          </Link>
        </>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
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
              src="/logo/logo-tg-yellow.png"
              alt="TTG"
              className="w-10 h-10 drop-shadow-[3px_3px_0px_rgba(26,26,26,0.3)]"
            />
            <h1 className="text-xl sm:text-2xl font-black text-[#1a1a1a] uppercase tracking-tight mag-stroke-sm">
              Verify Email
            </h1>
          </div>
        </div>
      </header>

      {/* Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div
            className="space-y-5 border-3 border-[#1a1a1a] shadow-[6px_6px_0px_#1a1a1a] p-8"
            style={{ background: "white" }}
          >
            {/* Badge */}
            <div className="text-center space-y-1">
              <span className="inline-block bg-[#22C55E] text-white text-[10px] font-black px-3 py-1 border-2 border-[#1a1a1a] uppercase tracking-widest shadow-[2px_2px_0px_#1a1a1a]">
                Email Verification
              </span>
              <p className="text-xs font-bold text-[#1a1a1a]/50">
                Confirm your email to unlock all features
              </p>
            </div>

            <Suspense
              fallback={
                <div className="flex flex-col items-center gap-3 py-8">
                  <Disc3 className="w-8 h-8 animate-spin text-[#3B4CCA]" />
                  <p className="text-sm font-bold text-[#1a1a1a]/50 uppercase">Loading...</p>
                </div>
              }
            >
              <EmailVerifier />
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
