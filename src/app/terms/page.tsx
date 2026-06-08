import PublicPageShell from "@/components/layout/public-page-shell"

export const metadata = { title: "Terms of Service", description: "Terms of Service for Trading Tazos Game." }

export default function TermsPage() {
  return (
    <PublicPageShell>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-6">Terms of Service</h1>
        <div className="prose prose-sm font-bold text-[#1a1a1a]/70 max-w-none space-y-4">
          <p><strong>Last updated:</strong> June 5, 2026</p>
          <p>
            Welcome to Trading Tazos Game (&ldquo;TTG,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
            TTG is a fan-made digital collectible experience available at tradingtazosgame.com.
            By accessing or using our service you agree to these Terms of Service.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">1. Acceptance of Terms</h2>
          <p>
            By creating an account, accessing, or using tradingtazosgame.com you agree to be bound by these terms.
            If you do not agree, do not use the service. We reserve the right to update these terms at any time;
            continued use after changes constitutes acceptance.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">2. Eligibility</h2>
          <p>
            You must be at least 13 years old to create an account.
            If you are under 18, you must have a parent or guardian&apos;s permission.
            By registering you represent that you meet these requirements.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">3. Account Responsibility</h2>
          <p>
            You are responsible for maintaining the confidentiality of your login credentials.
            You are responsible for all activity under your account. Notify us immediately at
            support@tradingtazosgame.com if you suspect unauthorized access. We reserve the right to
            suspend or terminate accounts that violate these terms.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">4. User Conduct</h2>
          <p>
            You agree not to: (a) upload malicious content or attempt to exploit the service;
            (b) use automated scripts, bots, or cheats; (c) impersonate others or provide false information;
            (d) harass, abuse, or harm other users; (e) violate any applicable laws.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">5. Content &amp; Scanner</h2>
          <p>
            The scanner feature allows users to upload images of physical tazos.
            By uploading content, you grant us a non-exclusive license to store and display it within the service.
            You represent that you own or have rights to any content you upload.
            We do not claim ownership of user content.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">6. Intellectual Property</h2>
          <p>
            Trading Tazos Game is a fan-made collector experience. Minimon, Dracobell, and Cybermon
            are original fictional IPs created for this game. The game code, design, artwork,
            and original content are protected by copyright. You may not reproduce, distribute,
            or create derivative works without permission.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">7. Service Availability</h2>
          <p>
            TTG is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind.
            We do not guarantee uninterrupted access. We may modify, suspend, or discontinue features
            at any time without liability.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">8. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Trading Tazos Game and its operators shall not be
            liable for any indirect, incidental, or consequential damages arising from your use of the service.
            Our total liability is limited to the amount you have paid us, if any, in the past 12 months.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">9. Termination</h2>
          <p>
            We may terminate or suspend your account at any time for violation of these terms.
            You may delete your account at any time by contacting support.
            Upon termination, your right to use the service ceases immediately.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">10. Governing Law</h2>
          <p>
            These terms are governed by Spanish law. Any disputes shall be resolved in the courts of Spain.
          </p>

          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">11. Contact</h2>
          <p>
            For questions about these Terms:
            <br />
            Email: <a href="mailto:support@tradingtazosgame.com" className="text-[#E3350D] underline">support@tradingtazosgame.com</a>
            <br />
            Website: <a href="https://tradingtazosgame.com/contact" className="text-[#E3350D] underline">tradingtazosgame.com/contact</a>
          </p>
        </div>
      </div>
    </PublicPageShell>
  )
}
