// ============================================================
// Trading Tazos Game — Contact Page
// ============================================================
import { Metadata } from "next"
import PublicPageShell from "@/components/layout/public-page-shell"
import { Mail, Github, MessageCircle, Shield, Bug, HelpCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact — Support & Inquiries | Trading Tazos Game",
  description: "Get in touch with the Trading Tazos Game team. Support, bug reports, privacy inquiries, and content removal requests. We respond within 48 hours.",
  openGraph: {
    title: "Contact — Trading Tazos Game",
    description: "Support, bug reports, and privacy inquiries for Trading Tazos Game",
  },
}

const CONTACT_CHANNELS = [
  {
    icon: <Mail className="w-6 h-6" />,
    title: "Email Support",
    description: "For general questions, account help, and gameplay support.",
    action: "support@medaclawarena.com",
    href: "mailto:support@medaclawarena.com",
    color: "#E3350D",
  },
  {
    icon: <Bug className="w-6 h-6" />,
    title: "Bug Reports",
    description: "Found a bug? Report it on GitHub Issues with steps to reproduce.",
    action: "GitHub Issues",
    href: "https://github.com/smouj/Trading-Tazos-Game/issues",
    color: "#3B4CCA",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Privacy & Data",
    description: "Data deletion requests, privacy questions, and account removal.",
    action: "support@medaclawarena.com",
    href: "mailto:support@medaclawarena.com",
    color: "#22C55E",
  },
  {
    icon: <HelpCircle className="w-6 h-6" />,
    title: "Content Removal",
    description: "If you believe any content violates our policies, let us know.",
    action: "support@medaclawarena.com",
    href: "mailto:support@medaclawarena.com",
    color: "#F59E0B",
  },
]

export default function ContactPage() {
  return (
    <PublicPageShell>
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-3 mag-stroke text-[#1a1a1a]"
            style={{ WebkitTextStroke: "3px #1a1a1a" }}>
            Contact
          </h1>
          <p className="text-sm sm:text-base font-bold text-[#1a1a1a]/60 max-w-lg mx-auto">
            We are here to help. Choose the right channel and we will get back to you within 48 hours.
          </p>
        </div>

        {/* Contact Channels Grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-12">
          {CONTACT_CHANNELS.map((ch, i) => (
            <a
              key={i}
              href={ch.href}
              target={ch.href.startsWith("http") ? "_blank" : undefined}
              rel={ch.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="mag-card p-5 sm:p-6 flex items-start gap-4 hover:translate-y-[-2px] active:translate-y-0 transition-transform group"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-3 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a]"
                style={{ background: ch.color, color: "#FFF" }}
              >
                {ch.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black uppercase tracking-wider text-[#1a1a1a] mb-1">
                  {ch.title}
                </h3>
                <p className="text-xs font-bold text-[#1a1a1a]/50 mb-2 leading-relaxed">
                  {ch.description}
                </p>
                <span className="text-xs font-black text-[#E3350D] group-hover:underline underline-offset-2">
                  {ch.action} →
                </span>
              </div>
            </a>
          ))}
        </div>

        {/* Response time banner */}
        <div className="mag-card-yellow rounded-none p-5 sm:p-6 border-b-4 border-[#1a1a1a] text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MessageCircle className="w-5 h-5 text-[#1a1a1a]" />
            <span className="text-sm font-black uppercase tracking-wider text-[#1a1a1a]">
              Response Time
            </span>
          </div>
          <p className="text-xs font-bold text-[#1a1a1a]/60 max-w-md mx-auto">
            We typically respond within <strong className="text-[#1a1a1a]">24-48 hours</strong> on business days.
            For urgent account issues, use the email support channel above.
          </p>
        </div>

        {/* FAQ link */}
        <div className="text-center mt-8">
          <p className="text-xs font-bold text-[#1a1a1a]/40">
            Looking for quick answers?{" "}
            <a href="/faq" className="text-[#E3350D] underline underline-offset-2 hover:text-[#1a1a1a]">
              Check our FAQ →
            </a>
          </p>
        </div>
      </div>
    </PublicPageShell>
  )
}
