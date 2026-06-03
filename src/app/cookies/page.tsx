import PublicPageShell from "@/components/layout/public-page-shell"

export const metadata = { title: "Cookie Policy", description: "Cookie Policy for Trading Tazos Game." }

export default function CookiesPage() {
  return (
    <PublicPageShell>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-6">Cookie Policy</h1>
        <div className="prose prose-sm font-bold text-[#1a1a1a]/70 max-w-none space-y-4">
          <p><strong>Last updated:</strong> June 2026</p>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">What We Use</h2>
          <p>Trading Tazos Game uses a single essential cookie:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>auth_token</strong> — JWT for session authentication. Expires after 7 days. Required for login.</li>
          </ul>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">What We DON'T Use</h2>
          <p>No analytics cookies. No tracking cookies. No advertising cookies. No third-party cookies of any kind.</p>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">Managing Cookies</h2>
          <p>You can disable cookies in your browser settings, but you will not be able to log in or save game progress.</p>
        </div>
      </div>
    </PublicPageShell>
  )
}
