"use client"

// ============================================================
// Trading Tazos Game — Cookie Consent Banner
// Shows at the bottom of the page until accepted.
// ============================================================

import { useState } from "react"
import Link from "next/link"

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    // Persist consent in localStorage
    if (typeof window === "undefined") return true
    return !localStorage.getItem("ttg-cookie-consent")
  })

  const accept = () => {
    localStorage.setItem("ttg-cookie-consent", "1")
    setIsVisible(false)
  }

  if (!isVisible) {
    // Also set the cookie so the server can check
    if (typeof document !== "undefined") {
      document.cookie = "cookie_consent=1; max-age=31536000; path=/; SameSite=Lax"
    }
    return null
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4"
      style={{ background: "#fffef0", borderTop: "4px solid #1a1a1a" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <p className="flex-1 text-[10px] sm:text-[11px] font-bold text-[#1a1a1a]/70 leading-relaxed">
          🍪 This site uses essential cookies for authentication, security, and gameplay. No tracking, no ads, no third-party cookies.
          <br className="hidden sm:block" />
          <span className="text-[#1a1a1a]/40">
            By continuing, you agree to our{" "}
            <Link href="/privacy" className="underline hover:text-[#E3350D]">Privacy Policy</Link>
            ,{" "}
            <Link href="/cookies" className="underline hover:text-[#E3350D]">Cookie Policy</Link>
            , and{" "}
            <Link href="/terms" className="underline hover:text-[#E3350D]">Terms</Link>.
          </span>
        </p>
        <button
          onClick={accept}
          className="mag-btn shrink-0 bg-[#22C55E] text-white px-6 py-2 text-xs font-black uppercase tracking-widest border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
        >
          Got It
        </button>
      </div>
    </div>
  )
}
