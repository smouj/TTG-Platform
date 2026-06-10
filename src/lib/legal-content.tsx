import type { ReactNode } from "react"

export interface LegalSection {
  title: string
  body: ReactNode
}

// ── PRIVACY POLICY ──
export const PRIVACY_SECTIONS: LegalSection[] = [
  { title: "1. Data We Collect", body: <>When you register, we collect your <strong>username, email address, and hashed password</strong> (never stored in plain text). <strong>Gameplay data:</strong> Tazos collected, decks created, battle results, quest progress, credits balance, bag purchase history. <strong>Scanner uploads:</strong> Images you voluntarily upload via the scanner feature to identify physical tazos. <strong>Technical data:</strong> IP address, browser type, device info, and access timestamps for security and debugging.</> },
  { title: "2. How We Use Data", body: <>We use your data exclusively to: (a) provide and maintain the game service; (b) authenticate your account; (c) display your collection and stats; (d) populate leaderboards; (e) diagnose technical issues; (f) prevent abuse and fraud.</> },
  { title: "3. Data Storage", body: <>All data is stored on servers in the European Union. We use SQLite for game data and secure, hashed password storage (bcrypt). Account credentials are never shared with third parties.</> },
  { title: "4. Data Retention", body: <>We retain your account and gameplay data as long as your account is active. Upon account deletion, your personal data is permanently removed within 30 days. Anonymized game statistics may be retained indefinitely.</> },
  { title: "5. Your Rights", body: <>Under GDPR and applicable laws, you have the right to: (a) access your data; (b) correct inaccurate data; (c) delete your account and associated data; (d) object to processing; (e) data portability. To exercise these rights, contact support@tradingtazosgame.com.</> },
  { title: "6. Children's Privacy", body: <>TTG is not directed at children under 13. We do not knowingly collect data from children under 13. If you believe a child has provided us with personal data, contact us immediately.</> },
  { title: "7. Cookies & Analytics", body: <>We use essential cookies for authentication (session tokens) and security. We also use Plausible Analytics (self-hosted, privacy-friendly, no personal data) to understand site usage. See our <a href="/cookies" className="text-[#E3350D] underline font-black">Cookie Policy</a>.</> },
  { title: "8. Advertising", body: <>TTG may display non-personalized advertisements through Google AdSense. AdSense may set cookies for frequency capping and aggregated reporting. No personalized ads are served without your explicit consent. See our <a href="/cookies" className="text-[#E3350D] underline font-black">Cookie Policy</a> for details.</> },
  { title: "9. Changes", body: <>We may update this policy. Significant changes will be communicated via email or site notice. Continued use after changes constitutes acceptance. Last updated: June 10, 2026.</> },
  { title: "10. Contact", body: <>Data controller: <a href="mailto:support@tradingtazosgame.com" className="text-[#E3350D] underline font-black">support@tradingtazosgame.com</a></> },
]

// ── TERMS OF SERVICE ──
export const TERMS_SECTIONS: LegalSection[] = [
  { title: "1. Acceptance of Terms", body: <>By creating an account, accessing, or using tradingtazosgame.com you agree to be bound by these terms. If you do not agree, do not use the service. We reserve the right to update these terms at any time; continued use after changes constitutes acceptance.</> },
  { title: "2. Eligibility", body: <>You must be at least 13 years old to create an account. If you are under 18, you must have a parent or guardian's permission. By registering you represent that you meet these requirements.</> },
  { title: "3. Account Responsibility", body: <>You are responsible for maintaining the confidentiality of your login credentials. You are responsible for all activity under your account. Notify us immediately at support@tradingtazosgame.com if you suspect unauthorized access. We reserve the right to suspend or terminate accounts that violate these terms.</> },
  { title: "4. User Conduct", body: <>You agree not to: (a) upload malicious content or attempt to exploit the service; (b) use automated scripts, bots, or cheats; (c) impersonate others or provide false information; (d) harass, abuse, or harm other users; (e) violate any applicable laws.</> },
  { title: "5. Content & Scanner", body: <>The scanner feature allows users to upload images of physical tazos. By uploading content, you grant us a non-exclusive license to store and display it within the service. You represent that you own or have rights to any content you upload. We do not claim ownership of user content.</> },
  { title: "6. Intellectual Property", body: <>Trading Tazos Game is a fan-made collector experience. Minimon, Dracobell, and Cybermon are original fictional IPs created for this game. The game code, design, artwork, and original content are protected by copyright. You may not reproduce, distribute, or create derivative works without permission.</> },
  { title: "7. Service Availability", body: <>TTG is provided "as is" and "as available" without warranties of any kind. We do not guarantee uninterrupted access. We may modify, suspend, or discontinue features at any time without liability.</> },
  { title: "8. Limitation of Liability", body: <>To the fullest extent permitted by law, Trading Tazos Game and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability is limited to the amount you have paid us, if any, in the past 12 months.</> },
  { title: "9. Termination", body: <>We may terminate or suspend your account at any time for violation of these terms. You may delete your account at any time by contacting support. Upon termination, your right to use the service ceases immediately.</> },
  { title: "10. Governing Law", body: <>These terms are governed by Spanish law. Any disputes shall be resolved in the courts of Spain.</> },
  { title: "11. Contact", body: <>For questions about these Terms: <a href="mailto:support@tradingtazosgame.com" className="text-[#E3350D] underline font-black">support@tradingtazosgame.com</a></> },
]

// ── COOKIE POLICY ──
export const COOKIE_SECTIONS: LegalSection[] = [
  { title: "1. What Are Cookies", body: <>Cookies are small text files stored on your device by your browser. They help websites remember your preferences, login state, and improve your experience.</> },
  { title: "2. Essential Cookies", body: <>We use essential cookies required for the service to function: <strong>Session token</strong> — authenticates your account, set when you log in, expires after 7 days or on logout. <strong>CSRF token</strong> — protects against cross-site request forgery attacks.</> },
  { title: "3. Privacy-Friendly Analytics", body: <>We use Plausible Analytics (self-hosted, GDPR-compliant, no personal data collected). Plausible does not use cookies and does not track you across websites. We use it solely to understand how many people visit the site and which pages are popular — no individual user profiling.</> },
  { title: "4. Advertising", body: <>TTG may display non-personalized advertisements through Google AdSense. AdSense may use cookies for frequency capping and aggregated ad reporting only. No personalized ads are served without your consent. See our Privacy Policy for more information.</> },
  { title: "5. Managing Cookies", body: <>Most browsers allow you to block or delete cookies via settings. However, blocking essential cookies will prevent you from logging in or using authenticated features of TTG.</> },
  { title: "6. Local Storage", body: <>We may use browser localStorage for non-personal preferences (e.g., language selection, UI state). This data stays on your device and is never sent to our servers.</> },
  { title: "7. Contact", body: <>Questions about cookies: <a href="mailto:support@tradingtazosgame.com" className="text-[#E3350D] underline font-black">support@tradingtazosgame.com</a></> },
]
