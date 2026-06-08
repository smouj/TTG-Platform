import PublicPageShell from "@/components/layout/public-page-shell"

export const metadata = { title: "Cookie Policy", description: "Cookie Policy for Trading Tazos Game." }

export default function CookiesPage() {
  return (
    <PublicPageShell>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-6">Cookie Policy</h1>
        <div className="prose prose-sm font-bold text-[#1a1a1a]/70 max-w-none space-y-4">
          <p><strong>Last updated:</strong> June 5, 2026</p>
          <p>This policy explains how Trading Tazos Game uses cookies and similar technologies.</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">1. What Are Cookies</h2>
          <p>Cookies are small text files stored on your device by your browser. They help websites remember your preferences, login state, and improve your experience.</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">2. Essential Cookies</h2>
          <p>We use only essential cookies required for the service to function:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Session token:</strong> Authenticates your account. Set when you log in. Expires after 7 days or on logout.</li>
            <li><strong>CSRF token:</strong> Protects against cross-site request forgery attacks.</li>
          </ul>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">3. No Tracking Cookies</h2>
          <p>TTG does not use tracking cookies, advertising cookies, analytics cookies, or third-party cookies. We do not track you across websites. There are no &ldquo;Accept Cookies&rdquo; banners because we don&apos;t need your consent — we only use essential cookies.</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">4. Managing Cookies</h2>
          <p>Most browsers allow you to block or delete cookies via settings. However, blocking essential cookies will prevent you from logging in or using authenticated features of TTG.</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">5. Local Storage</h2>
          <p>We may use browser localStorage for non-personal preferences (e.g., language selection, UI state). This data stays on your device and is never sent to our servers.</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">6. Contact</h2>
          <p>Questions: <a href="mailto:support@tradingtazosgame.com" className="text-[#E3350D] underline">support@tradingtazosgame.com</a></p>
        </div>
      </div>
    </PublicPageShell>
  )
}
