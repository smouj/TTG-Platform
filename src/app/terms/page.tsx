import PublicPageShell from "@/components/layout/public-page-shell"

export const metadata = { title: "Terms of Service", description: "Terms of Service for Trading Tazos Game." }

export default function TermsPage() {
  return (
    <PublicPageShell>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-6">Terms of Service</h1>
        <div className="prose prose-sm font-bold text-[#1a1a1a]/70 max-w-none space-y-4">
          <p><strong>Last updated:</strong> June 2026</p>
          <p>Trading Tazos Game is a fan-made collector experience. By using this website you agree to these terms.</p>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">1. Acceptance</h2>
          <p>By accessing medaclawarena.com, you accept these Terms of Service. If you do not agree, do not use the service.</p>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">2. Account</h2>
          <p>You are responsible for maintaining your account credentials. You must be at least 13 years old to create an account.</p>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">3. Service</h2>
          <p>Trading Tazos Game is provided "as is" without warranties. We may modify or discontinue features at any time.</p>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">4. Contact</h2>
          <p>Questions: <a href="mailto:support@medaclawarena.com" className="text-[#E3350D] underline">support@medaclawarena.com</a></p>
        </div>
      </div>
    </PublicPageShell>
  )
}
