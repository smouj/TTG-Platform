"use client"

// ============================================================
// Trading Tazos Game — Cookie Consent Banner
// Simple, non-blocking bottom banner with working button.
// ============================================================

import { useState, useEffect } from "react"
import Link from "next/link"

export default function CookieConsentBanner() {
  // Start with consent=true on SSR to hide banner (avoids hydration mismatch)
  const [hasConsent, setHasConsent] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // After hydration, check actual client-side consent
  useEffect(() => {
    setMounted(true)
    if (localStorage.getItem("ttg-cookie-consent")) {
      setHasConsent(true)
    } else {
      setHasConsent(false)
    }
  }, [])

  const accept = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ttg-cookie-consent", "1")
      document.cookie = "cookie_consent=1; max-age=31536000; path=/; SameSite=Lax"
    }
    setHasConsent(true)
    setDismissed(true)
  }

  // No render during SSR, no render if consent already given or dismissed
  if (hasConsent || dismissed) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4"
      style={{ background: "#fffef0", borderTop: "4px solid #1a1a1a" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <p className="flex-1 text-[10px] sm:text-[11px] font-bold text-[#1a1a1a]/70 leading-relaxed">
          This site uses essential cookies for authentication, security, and gameplay. No tracking, no ads, no third-party cookies.
          <br className="hidden sm:block" />
          <span className="text-[#1a1a1a]/40">
            By continuing, you agree to our{" "}
            <Link href="/?page=privacy" className="underline hover:text-[#E3350D]">Privacy Policy</Link>
            ,{" "}
            <Link href="/?page=cookies" className="underline hover:text-[#E3350D]">Cookie Policy</Link>
            , and{" "}
            <Link href="/?page=terms" className="underline hover:text-[#E3350D]">Terms</Link>.
          </span>
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 bg-[#22C55E] text-white px-6 py-2.5 text-xs font-black uppercase tracking-widest border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
        >
          Accept
        </button>
      </div>
    </div>
  )
}
