"use client"

// ============================================================
// Trading Tazos Game — Cookie Consent + CMP (AdSense-ready)
// Manages consent for essential + advertising cookies.
// Integrates with Google Consent Mode v2 when AdSense enabled.
// ============================================================

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"

const ADSENSE_ENABLED = typeof window !== "undefined"
  ? process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true"
  : false

function grantConsent(adConsent = true) {
  if (typeof window === "undefined") return
  localStorage.setItem("ttg-cookie-consent", "1")
  if (!adConsent) localStorage.setItem("ttg-ad-consent", "0")
  else localStorage.removeItem("ttg-ad-consent")
  document.cookie = "cookie_consent=1; max-age=31536000; path=/; SameSite=Lax"

  // Google Consent Mode v2 — update from defaults
  if (ADSENSE_ENABLED && (window as any).gtag) {
    ;(window as any).gtag("consent", "update", {
      ad_storage: adConsent ? "granted" : "denied",
      ad_user_data: adConsent ? "granted" : "denied",
      ad_personalization: adConsent ? "granted" : "denied",
      analytics_storage: "granted",
    })
  }
}

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)

  const show = useCallback(() => setShowBanner(true), [])

  useEffect(() => {
    setMounted(true)
    if (!localStorage.getItem("ttg-cookie-consent")) {
      setShowBanner(true)
    }
    // Allow re-opening from footer "Cookie Settings" link
    window.addEventListener("ttg:cookie-settings", show)
    return () => window.removeEventListener("ttg:cookie-settings", show)
  }, [show])

  if (!mounted || !showBanner) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4"
      style={{ background: "#fffef0", borderTop: "4px solid #1a1a1a" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <p className="flex-1 text-[10px] sm:text-[11px] font-bold text-[#1a1a1a]/70 leading-relaxed">
          We use essential cookies for login and gameplay.
          {ADSENSE_ENABLED ? (
            <> Ad partners use cookies to show relevant ads and measure performance.</>
          ) : (
            <> No tracking, no ads, no third-party cookies.</>
          )}
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
        <div className="flex items-center gap-2 shrink-0">
          {ADSENSE_ENABLED && (
            <button
              type="button"
              onClick={() => { grantConsent(false); setShowBanner(false) }}
              className="px-4 py-2.5 text-xs font-black uppercase tracking-wider border-2 border-[#1a1a1a] text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-colors cursor-pointer"
            >
              Essential Only
            </button>
          )}
          <button
            type="button"
            onClick={() => { grantConsent(true); setShowBanner(false) }}
            className="shrink-0 bg-[#22C55E] text-white px-6 py-2.5 text-xs font-black uppercase tracking-widest border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
          >
            {ADSENSE_ENABLED ? "Accept All" : "Got It"}
          </button>
        </div>
      </div>
    </div>
  )
}
