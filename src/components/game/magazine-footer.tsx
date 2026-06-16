"use client"

// ============================================================
// Magazine Footer — shared across standalone pages.
// IDENTICAL to the launcher-view footer: dark #1a1a1a bar with
// platform badges (magazine style), 8 page links, 5 social icons
// (X, Reddit, Telegram, Discord, Instagram) with brand hover
// colors, copyright, disclaimer on same row.
// No GitHub link (matches launcher).
// ============================================================

import Link from "next/link"
import { Download, Globe, Monitor, Apple, Terminal } from "lucide-react"
import { SITE_CONFIG } from "@/lib/site-config"

const FOOTER_LINKS: [string, string][] = [
  ["tazos", "Tazos"],
  ["shop", "Shop"],
  ["how-to-play", "How to Play"],
  ["faq", "FAQ"],
  ["privacy", "Privacy"],
  ["terms", "Terms"],
  ["cookies", "Cookies"],
  ["contact", "Contact"],
]

function PlatformBadge({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 border-2 border-[#1a1a1a] bg-white"
      style={{ boxShadow: "2px 2px 0 #1a1a1a" }}
    >
      <Icon className="w-3 h-3 text-[#1a1a1a]" />
      <span className="text-[9px] font-black text-[#1a1a1a] uppercase tracking-wider">
        {label}
      </span>
    </div>
  )
}

export default function MagazineFooter() {
  return (
    <footer
      className="relative z-10 border-t-[5px] border-[#FFCC00]"
      style={{ background: "#1a1a1a" }}
    >
      {/* Platform badges + Download button */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-3 px-3 py-2.5 border-b border-white/10">
        <PlatformBadge icon={Globe} label="Browser" />
        <PlatformBadge icon={Monitor} label="Windows" />
        <PlatformBadge icon={Apple} label="macOS" />
        <PlatformBadge icon={Terminal} label="Linux" />
        <Link
          href="/?page=download"
          className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black text-[#1a1a1a] bg-[#FFCC00] uppercase tracking-wider border-2 border-white/20 hover:bg-[#FFE566] transition-colors no-underline"
        >
          <Download className="w-3 h-3" /> Download
        </Link>
      </div>

      {/* Links + Social + Disclaimer + Copyright — all on same row */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-2.5 gap-2">
        {/* Left: Page links + Social icons */}
        <div className="flex items-center gap-3 sm:gap-4">
          {FOOTER_LINKS.map(([page, label]) => (
            <Link
              key={page}
              href={`/?page=${page}`}
              className="text-[9px] font-bold text-white/30 hover:text-[#FFCC00] uppercase tracking-wider transition-colors no-underline"
            >
              {label}
            </Link>
          ))}
          <span className="text-white/10">|</span>

          {/* X / Twitter */}
          <a href="https://x.com/tazosgame" target="_blank" rel="noopener noreferrer" aria-label="X / Twitter"
            className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-white hover:border-white/50 transition-all">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>

          {/* Reddit */}
          <a href="https://www.reddit.com/r/tradingtazosgame/" target="_blank" rel="noopener noreferrer" aria-label="Reddit"
            className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-[#FF4500] hover:border-[#FF4500]/50 transition-all">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.6 12.6c0 .663-.537 1.2-1.2 1.2-.315 0-.603-.12-.816-.318A5.952 5.952 0 0 1 12 15.6a5.952 5.952 0 0 1-4.584-2.118A1.19 1.19 0 0 1 6.6 13.8c-.663 0-1.2-.537-1.2-1.2s.537-1.2 1.2-1.2c.315 0 .603.12.816.318a5.956 5.956 0 0 1 3.384-1.788l.72-3.384 2.94.624c.039-.327.312-.582.648-.582.363 0 .66.297.66.66s-.297.66-.66.66c-.234 0-.438-.123-.552-.306l-2.496-.528-.576 2.706a5.96 5.96 0 0 1 3.492 1.794c.213-.198.501-.318.816-.318.663 0 1.2.537 1.2 1.2zM9.6 13.2c-.48 0-.84.36-.84.84 0 .48.36.84.84.84s.84-.36.84-.84c0-.48-.36-.84-.84-.84zm4.8 0c-.48 0-.84.36-.84.84 0 .48.36.84.84.84s.84-.36.84-.84c0-.48-.36-.84-.84-.84zm-2.88 3.54c.48 0 .96.12 1.44.36.48-.24.96-.36 1.44-.36.18 0 .36-.18.36-.36s-.18-.36-.36-.36c-.66 0-1.26.18-1.74.48-.3-.18-.66-.3-1.14-.3s-.84.12-1.14.3c-.48-.3-1.08-.48-1.74-.48-.18 0-.36.18-.36.36s.18.36.36.36z"/></svg>
          </a>

          {/* Telegram */}
          <a href="https://t.me/tradingtazosgame" target="_blank" rel="noopener noreferrer" aria-label="Telegram"
            className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-[#26A5E4] hover:border-[#26A5E4]/50 transition-all">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.96 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.696.064-1.225-.46-1.9-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.24-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.1-.002.321.023.465.14.121.099.155.233.171.328.016.095.036.31.02.482z"/></svg>
          </a>

          {/* Discord */}
          <a href="https://discord.gg/4mUhnc2REb" target="_blank" rel="noopener noreferrer" aria-label="Discord"
            className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-[#5865F2] hover:border-[#5865F2]/50 transition-all">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          </a>

          {/* Instagram */}
          <a href="https://www.instagram.com/tradingtazosgame/" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
            className="flex items-center justify-center w-6 h-6 rounded-full border border-white/15 text-zinc-400 hover:text-[#E4405F] hover:border-[#E4405F]/50 transition-all">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
        </div>

        {/* Right side: Disclaimer inline + Copyright */}
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-black text-white/15 uppercase tracking-[0.3em] whitespace-nowrap">
            © {new Date().getFullYear()} {SITE_CONFIG.name} · v{SITE_CONFIG.version}
          </span>
        </div>
      </div>
    </footer>
  )
}
