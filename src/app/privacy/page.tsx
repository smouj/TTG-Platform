import PublicPageShell from "@/components/layout/public-page-shell"

export const metadata = { title: "Privacy Policy", description: "Privacy Policy for Trading Tazos Game." }

export default function PrivacyPage() {
  return (
    <PublicPageShell>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-6">Privacy Policy</h1>
        <div className="prose prose-sm font-bold text-[#1a1a1a]/70 max-w-none space-y-4">
          <p><strong>Last updated:</strong> June 5, 2026</p>
          <p>
            Trading Tazos Game (&ldquo;TTG,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) respects your privacy.
            This policy explains what data we collect, how we use it, and your rights.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">1. Data We Collect</h2>
          <p><strong>Account data:</strong> When you register, we collect your username, email address, and hashed password (never stored in plain text).</p>
          <p><strong>Gameplay data:</strong> Tazos collected, decks created, battle results, quest progress, credits balance, bag purchase history.</p>
          <p><strong>Scanner uploads:</strong> Images you voluntarily upload via the scanner feature to identify physical tazos.</p>
          <p><strong>Technical data:</strong> IP address, browser type, device info, and access timestamps for security and debugging.</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">2. How We Use Data</h2>
          <p>We use your data exclusively to: (a) provide and maintain the game service; (b) authenticate your account; (c) display your collection and stats; (d) populate leaderboards; (e) diagnose technical issues; (f) prevent abuse and fraud.</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">3. Data Storage</h2>
          <p>All data is stored on servers in the European Union. We use SQLite for game data and secure, hashed password storage (bcrypt). Account credentials are never shared with third parties.</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">4. Data Retention</h2>
          <p>We retain your account and gameplay data as long as your account is active. Upon account deletion, your personal data is permanently removed within 30 days. Anonymized game statistics may be retained indefinitely.</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">5. Your Rights</h2>
          <p>Under GDPR and applicable laws, you have the right to: (a) access your data; (b) correct inaccurate data; (c) delete your account and associated data; (d) object to processing; (e) data portability. To exercise these rights, contact support@tradingtazosgame.com.</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">6. Children&apos;s Privacy</h2>
          <p>TTG is not directed at children under 13. We do not knowingly collect data from children under 13. If you believe a child has provided us with personal data, contact us immediately.</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">7. Cookies</h2>
          <p>We use essential cookies for authentication (session tokens) and security. See our <a href="/cookies" className="text-[#E3350D] underline">Cookie Policy</a>.</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">8. Changes</h2>
          <p>We may update this policy. Significant changes will be communicated via email or site notice. Continued use after changes constitutes acceptance.</p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">9. Contact</h2>
          <p>
            Data controller: support@tradingtazosgame.com
            <br />
            Email: <a href="mailto:support@tradingtazosgame.com" className="text-[#E3350D] underline">support@tradingtazosgame.com</a>
          </p>
        </div>
      </div>
    </PublicPageShell>
  )
}
