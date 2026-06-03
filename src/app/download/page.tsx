"use client"

import { Download, Monitor, Apple, Terminal, Github, ExternalLink, ArrowLeft, Globe, Smartphone, Gamepad2 } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"

const OS_CARDS = [
  {
    id: "windows",
    icon: Monitor,
    color: "#00A4EF",
    labelKey: "download_windows" as const,
    exe: ".exe",
    comingSoon: true,
  },
  {
    id: "mac",
    icon: Apple,
    color: "#1a1a1a",
    labelKey: "download_mac" as const,
    exe: ".dmg",
    comingSoon: true,
  },
  {
    id: "linux",
    icon: Terminal,
    color: "#FCC624",
    labelKey: "download_linux" as const,
    exe: ".AppImage",
    comingSoon: true,
  },
]

const GITHUB_URL = "https://github.com/smouj/Trading-Tazos-Game"
const RELEASES_URL = `${GITHUB_URL}/releases`
const VERSION = "v0.3.0"

export default function DownloadPage() {
  const { t } = useI18n()

  return (
    <div className="min-h-screen flex flex-col mag-bg">
      {/* Magazine masthead */}
      <header className="bg-[#E3350D] border-b-4 border-[#1a1a1a] mag-stripes">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/" className="text-white hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mag-stroke-sm">
              {t.download_title}
            </h1>
            <p className="text-[11px] sm:text-xs font-bold text-white/70 tracking-wider uppercase">
              {t.download_subtitle}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
        {/* ─── THREE WAYS TO PLAY ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Browser */}
          <div className="mag-card p-5 text-center space-y-3 relative">
            <div className="w-12 h-12 mx-auto bg-[#22C55E] border-3 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] rounded-full flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[#1a1a1a]">Play in Browser</h3>
              <p className="text-[10px] font-bold text-zinc-500 mt-1">No download needed. Just open <a href="/" className="underline text-[#3B4CCA]">medaclawarena.com</a> and start battling.</p>
            </div>
            <span className="absolute top-2 right-2 px-2 py-0.5 text-[8px] font-black bg-[#22C55E] text-white uppercase rounded">Active</span>
          </div>

          {/* Desktop App */}
          <div className="mag-card p-5 text-center space-y-3 relative">
            <div className="w-12 h-12 mx-auto bg-[#3B4CCA] border-3 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] rounded-full flex items-center justify-center">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[#1a1a1a]">Desktop App</h3>
              <p className="text-[10px] font-bold text-zinc-500 mt-1">Windows, macOS, Linux. Full-screen, offline play, keyboard controls.</p>
            </div>
            <span className="absolute top-2 right-2 px-2 py-0.5 text-[8px] font-black bg-[#F59E0B] text-white uppercase rounded">Coming Soon</span>
          </div>

          {/* PWA */}
          <div className="mag-card p-5 text-center space-y-3 relative">
            <div className="w-12 h-12 mx-auto bg-[#A855F7] border-3 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] rounded-full flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[#1a1a1a]">PWA Install</h3>
              <p className="text-[10px] font-bold text-zinc-500 mt-1">Install on your phone or desktop. Works offline, gets updates automatically.</p>
            </div>
            <span className="absolute top-2 right-2 px-2 py-0.5 text-[8px] font-black bg-[#22C55E] text-white uppercase rounded">Active</span>
          </div>
        </div>

        {/* ─── Intro ─── */}
        <div className="mag-card p-6">
          <p className="text-sm font-bold text-[#1a1a1a] leading-relaxed">
            {t.download_intro}
          </p>
        </div>

        {/* ─── DESKTOP DOWNLOADS ─── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[#E3350D]" />
            <h2 className="font-black text-lg uppercase tracking-wider text-[#1a1a1a]">
              Desktop Downloads
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {OS_CARDS.map((os) => (
              <div
                key={os.id}
                className="mag-card p-6 text-center space-y-4"
              >
                <os.icon className="w-10 h-10 mx-auto" style={{ color: os.color }} />
                <div>
                  <h3 className="font-black text-base uppercase tracking-wider text-[#1a1a1a]">
                    {t[os.labelKey]}
                  </h3>
                  {os.comingSoon ? (
                    <span className="inline-block mt-2 px-3 py-1 text-[10px] font-black bg-[#FFCC00] text-[#1a1a1a] border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] uppercase">
                      {t.download_coming_soon}
                    </span>
                  ) : (
                    <a
                      href={`${RELEASES_URL}/latest`}
                      className="inline-flex items-center gap-1.5 mt-2 px-4 py-2 text-xs font-black bg-[#22C55E] text-white border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] hover:shadow-[1px_1px_0px_#1a1a1a] hover:translate-x-0.5 hover:translate-y-0.5 transition-all uppercase"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t.download_cta} {os.exe}
                    </a>
                  )}
                </div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase">
                  {t.download_version}: {VERSION}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Requirements ─── */}
        <div className="mag-card p-6 space-y-2">
          <h3 className="font-black text-xs uppercase tracking-wider text-[#1a1a1a]">
            {t.download_requirements}
          </h3>
          <p className="text-[11px] font-bold text-zinc-500 leading-relaxed">
            {t.download_requirements_list}
          </p>
        </div>

        {/* ─── Source Code ─── */}
        <div className="mag-card p-6 space-y-4 text-center">
          <Github className="w-8 h-8 mx-auto text-[#1a1a1a]" />
          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-[#1a1a1a]">
              {t.download_source}
            </h3>
            <p className="text-[11px] font-bold text-zinc-500 mt-1">
              {t.download_source_desc}
            </p>
          </div>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 mag-btn bg-[#1a1a1a] text-[#FFCC00] text-xs"
          >
            <Github className="w-4 h-4" />
            View on GitHub
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* ─── Back to Arena ─── */}
        <div className="text-center pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 mag-btn bg-[#FFCC00] text-[#1a1a1a] text-sm font-black uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            Play Now in Browser
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] border-t-4 border-[#FFCC00] mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-3 text-center">
          <p className="text-[10px] font-bold text-zinc-400">
            Trading Tazos Game &copy; {new Date().getFullYear()} MedaClaw Arena
          </p>
        </div>
      </footer>
    </div>
  )
}
