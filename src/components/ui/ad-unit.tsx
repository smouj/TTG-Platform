"use client"

import { useEffect, useRef } from "react"

/**
 * Google AdSense responsive ad unit.
 * Renders only on the client side. Gates behind NEXT_PUBLIC_ADSENSE_ENABLED.
 * Follows magazine aesthetic with subtle borders.
 * 
 * Usage: <AdUnit slot="1234567890" format="horizontal" />
 */
export default function AdUnit({
  slot,
  format = "auto",
  className = "",
}: {
  slot: string
  format?: "auto" | "horizontal" | "vertical" | "rectangle"
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const enabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true"

  useEffect(() => {
    if (!enabled) return

    // Load AdSense script only once (not globally in layout)
    if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
      const script = document.createElement('script')
      script.async = true
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4932643710484609'
      script.crossOrigin = 'anonymous'
      document.head.appendChild(script)
    }

    if (initialized.current || !containerRef.current) return
    initialized.current = true

    try {
      // @ts-expect-error — Google AdSense global
      if (window.adsbygoogle) {
        // @ts-expect-error
        window.adsbygoogle.push({})
      }
    } catch {
      // AdSense blocked by ad blocker — gracefully do nothing
    }
  }, [enabled])

  // Don't render anything if AdSense is disabled
  if (!enabled) return null

  const formatStyles: Record<string, { minHeight: string }> = {
    horizontal: { minHeight: "90px" },
    vertical: { minHeight: "280px" },
    rectangle: { minHeight: "250px" },
    auto: { minHeight: "50px" },
  }

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <div
        ref={containerRef}
        className="relative w-full max-w-[728px] border-2 border-ttg-black/5 bg-ttg-black/[0.02] overflow-hidden"
        style={{
          minHeight: formatStyles[format]?.minHeight || "50px",
          backgroundImage: "repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(26,26,26,0.015) 4px, rgba(26,26,26,0.015) 8px)",
        }}
      >
        <ins
          className="adsbygoogle block"
          style={{ display: "block", minHeight: formatStyles[format]?.minHeight || "50px" }}
          data-ad-client="ca-pub-4932643710484609"
          data-ad-slot={slot}
          data-ad-format={format === "auto" ? "auto" : "rectangle"}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  )
}
