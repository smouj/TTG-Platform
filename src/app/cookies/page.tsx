import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { COOKIE_SECTIONS } from "@/lib/legal-content"

export const metadata: Metadata = {
  title: "Cookie Policy — Trading Tazos Game",
  description: "Cookie Policy for Trading Tazos Game — what cookies we use and how to manage them.",
  robots: "index, follow",
  alternates: {
    canonical: "https://tradingtazosgame.com/cookies",
    languages: {
      "en": "https://tradingtazosgame.com/cookies",
      "es": "https://tradingtazosgame.com/cookies?lang=es",
    },
  },
  openGraph: {
    title: "Cookie Policy — Trading Tazos Game",
    description: "What cookies we use and how to manage them.",
    url: "https://tradingtazosgame.com/cookies",
    siteName: "Trading Tazos Game",
    type: "website",
  },
}

export default function CookiesPage() {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#f4f4f4", fontFamily: "system-ui, sans-serif" }}>
        <header style={{ background: "#1a1a1a", borderBottom: "4px solid #E3350D", padding: "16px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <Image src="/pwa-512.webp" alt="TTG" width={36} height={36} style={{ borderRadius: 8 }} />
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em" }}>Trading Tazos Game</span>
          </Link>
        </header>

        <main style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a1a1a", textTransform: "uppercase", marginBottom: 4 }}>Cookie Policy</h1>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 24 }}>Last updated: June 10, 2026</p>

          {COOKIE_SECTIONS.map((s, i) => (
            <section key={i} style={{ background: "#fff", border: "3px solid #1a1a1a", padding: "20px", marginBottom: 12, boxShadow: "3px 3px 0 #1a1a1a" }}>
              <h2 style={{ fontSize: 14, fontWeight: 900, color: "#1a1a1a", textTransform: "uppercase", margin: "0 0 8px" }}>{s.title}</h2>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#666", lineHeight: 1.6, margin: 0 }}>{s.body}</p>
            </section>
          ))}

          <div style={{ background: "#fff", border: "3px solid #1a1a1a", padding: "20px", marginTop: 24, boxShadow: "3px 3px 0 #1a1a1a", textAlign: "center" }}>
            <h2 style={{ fontSize: 14, fontWeight: 900, color: "#1a1a1a", textTransform: "uppercase", margin: "0 0 8px" }}>Manage Your Preferences</h2>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#666", lineHeight: 1.6, margin: "0 0 12px" }}>You can update your cookie consent preferences at any time.</p>
            <button
              id="cookie-settings-btn"
              style={{ background: "#22C55E", color: "#fff", border: "2px solid #1a1a1a", padding: "10px 24px", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", boxShadow: "2px 2px 0 #1a1a1a" }}
            >
              Cookie Settings
            </button>
            <script dangerouslySetInnerHTML={{ __html: `
              document.getElementById("cookie-settings-btn").onclick = function() {
                window.dispatchEvent(new Event("ttg:cookie-settings"));
              };
            `}} />
          </div>

          <footer style={{ marginTop: 32, paddingTop: 16, borderTop: "2px solid #ddd", textAlign: "center" }}>
            <nav style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/privacy" style={{ fontSize: 11, fontWeight: 700, color: "#E3350D", textTransform: "uppercase" }}>Privacy Policy</Link>
              <Link href="/terms" style={{ fontSize: 11, fontWeight: 700, color: "#E3350D", textTransform: "uppercase" }}>Terms of Service</Link>
              <Link href="/disclaimer" style={{ fontSize: 11, fontWeight: 700, color: "#E3350D", textTransform: "uppercase" }}>Disclaimer</Link>
              <Link href="/?page=contact" style={{ fontSize: 11, fontWeight: 700, color: "#E3350D", textTransform: "uppercase" }}>Contact</Link>
            </nav>
            <p style={{ fontSize: 9, fontWeight: 700, color: "#aaa", marginTop: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>© 2026 Trading Tazos Game — Independent fictional digital tazo game</p>
          </footer>
        </main>
      </body>
    </html>
  )
}
