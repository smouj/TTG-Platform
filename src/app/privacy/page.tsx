import PublicPageShell from "@/components/layout/public-page-shell"

export const metadata = { title: "Privacy Policy", description: "Privacy Policy for Trading Tazos Game." }

export default function PrivacyPage() {
  return (
    <PublicPageShell>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-6">Privacy Policy</h1>
        <div className="prose prose-sm font-bold text-[#1a1a1a]/70 max-w-none space-y-4">
          <p><strong>Last updated:</strong> June 2026</p>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">Data We Collect</h2>
          <p>We collect: email address, username, password hash, and gameplay data (tazos collected, battles, achievements). We do NOT collect real names, addresses, or payment info.</p>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">Cookies</h2>
          <p>We use a session cookie (auth_token) for authentication. No tracking or advertising cookies. See our <a href="/cookies" className="text-[#E3350D] underline">Cookie Policy</a>.</p>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">Third Parties</h2>
          <p>We do not share, sell, or trade your data with third parties. Your collection and battle data stays private.</p>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">Contact</h2>
          <p><a href="mailto:support@medaclawarena.com" className="text-[#E3350D] underline">support@medaclawarena.com</a></p>
        </div>
      </div>
    </PublicPageShell>
  )
}
