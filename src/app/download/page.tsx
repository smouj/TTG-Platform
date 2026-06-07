"use client"

import { Download, Monitor, Apple, Terminal, Github, ExternalLink, Globe, Gamepad2, Smartphone } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import PublicPageShell from "@/components/layout/public-page-shell"

const GITHUB_URL = "https://github.com/smouj/Trading-Tazos-Game"
const RELEASES_URL = `${GITHUB_URL}/releases`
const RELEASE_TAG = "v0.3.1"
const RELEASE_VER = "0.3.1"

const DOWNLOADS = [
  {
    id: "windows",
    icon: Monitor,
    color: "#00A4EF",
    label: "Windows",
    badge: "Available",
    badgeColor: "#22C55E",
    exe: ".exe",
    url: `${RELEASES_URL}/tag/${RELEASE_TAG}`,
    available: true,
    formats: [
      { label: ".exe Installer", path: `trading-tazos-game-${RELEASE_VER}-win-x64.exe` },
    ],
  },
  {
    id: "mac",
    icon: Apple,
    color: "#1a1a1a",
    label: "macOS",
    badge: "Available",
    badgeColor: "#22C55E",
    exe: ".dmg",
    url: `${RELEASES_URL}/tag/${RELEASE_TAG}`,
    available: true,
    formats: [
      { label: ".dmg (Apple Silicon)", path: `trading-tazos-game-${RELEASE_VER}-mac-arm64.dmg` },
      { label: ".dmg (Intel)", path: `trading-tazos-game-${RELEASE_VER}-mac-x64.dmg` },
      { label: ".zip (Apple Silicon)", path: `trading-tazos-game-${RELEASE_VER}-mac-arm64.zip` },
      { label: ".zip (Intel)", path: `trading-tazos-game-${RELEASE_VER}-mac-x64.zip` },
    ],
  },
  {
    id: "linux",
    icon: Terminal,
    color: "#FCC624",
    label: "Linux",
    badge: "Available",
    badgeColor: "#22C55E",
    exe: ".AppImage",
    url: `${RELEASES_URL}/tag/${RELEASE_TAG}`,
    available: true,
    formats: [
      { label: ".AppImage (Portable)", path: `trading-tazos-game-${RELEASE_VER}-linux-x86_64.AppImage` },
      { label: ".deb (Ubuntu/Debian)", path: `trading-tazos-game-${RELEASE_VER}-linux-amd64.deb` },
    ],
  },
]

export default function DownloadPage() {
  const { t } = useI18n()

  return (
    <PublicPageShell>
      <div className="max-w-5xl mx-auto w-full px-4 py-12 sm:py-16 space-y-8">

        {/* ─── Header ─── */}
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-4">Download</h1>
        <p className="text-sm font-bold text-[#1a1a1a]/40 -mt-3 mb-2">
          Play in your browser, install the PWA, or download the native desktop app.
        </p>

        {/* ─── THREE WAYS TO PLAY ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Browser */}
          <div className="mag-card p-5 text-center space-y-3 relative">
            <div className="w-12 h-12 mx-auto bg-[#22C55E] border-3 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] rounded-full flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[#1a1a1a]">Play in Browser</h3>
              <p className="text-[10px] font-bold text-zinc-500 mt-1">
                No download needed. Open <a href="/" className="underline text-[#3B4CCA]">medaclawarena.com</a> and start battling.
              </p>
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
              <p className="text-[10px] font-bold text-zinc-500 mt-1">
                Available for Windows, macOS, and Linux. Download the installer for your platform.
              </p>
            </div>
            <span className="absolute top-2 right-2 px-2 py-0.5 text-[8px] font-black bg-[#22C55E] text-white uppercase rounded">All platforms</span>
          </div>

          {/* PWA */}
          <div className="mag-card p-5 text-center space-y-3 relative">
            <div className="w-12 h-12 mx-auto bg-[#A855F7] border-3 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] rounded-full flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-[#1a1a1a]">PWA Install</h3>
              <p className="text-[10px] font-bold text-zinc-500 mt-1">
                Install on your phone or desktop from a supported browser.
              </p>
            </div>
            <span className="absolute top-2 right-2 px-2 py-0.5 text-[8px] font-black bg-[#22C55E] text-white uppercase rounded">Active</span>
          </div>
        </div>

        {/* ─── Intro ─── */}
        <div className="mag-card p-6">
          <p className="text-sm font-bold text-[#1a1a1a] leading-relaxed">
            Download Trading Tazos Game for your desktop. Available on Windows, macOS, and Linux — or play instantly in your browser at{" "}
            <a href="/" className="underline text-[#3B4CCA]">medaclawarena.com</a>.
          </p>
        </div>

        {/* ─── DESKTOP DOWNLOADS ─── */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[#E3350D]" />
            <h2 className="font-black text-lg uppercase tracking-wider text-[#1a1a1a]">
              {t.download_title || "Desktop Downloads"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {DOWNLOADS.map((os) => (
              <div
                key={os.id}
                className="mag-card p-6 text-center space-y-4"
              >
                <os.icon className="w-10 h-10 mx-auto" style={{ color: os.color }} />
                <div>
                  <h3 className="font-black text-base uppercase tracking-wider text-[#1a1a1a]">
                    {os.label}
                  </h3>

                  {/* Status badge */}
                  <span
                    className="inline-block mt-2 px-3 py-1 text-[10px] font-black border-2 border-[#1a1a1a] shadow-[2px_2px_0px_#1a1a1a] uppercase"
                    style={{ backgroundColor: os.badgeColor, color: os.available ? "#fff" : "#1a1a1a" }}
                  >
                    {os.badge}
                  </span>

                  {/* Download buttons */}
                  {os.available && os.formats ? (
                    <div className="flex flex-col gap-2 mt-3">
                      {os.formats.map((fmt) => (
                        <a
                          key={fmt.path}
                          href={`${RELEASES_URL}/download/${RELEASE_TAG}/${fmt.path}`}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-black bg-[#22C55E] text-white border-2 border-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] hover:bg-[#16a34a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all uppercase"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {fmt.label}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-black bg-zinc-200 text-zinc-400 border-2 border-[#1a1a1a]/20 uppercase cursor-not-allowed">
                        <Download className="w-3.5 h-3.5" />
                        {os.exe}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[9px] font-bold text-zinc-400 uppercase">
                  Version: {RELEASE_TAG}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Requirements ─── */}
        <div className="mag-card p-6 space-y-2">
          <h3 className="font-black text-xs uppercase tracking-wider text-[#1a1a1a]">
            System Requirements
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px]">
            <div>
              <p className="font-black text-[#00A4EF]">Windows</p>
              <p className="font-bold text-zinc-500">Windows 10/11 (x64), 4GB RAM, 200MB disk</p>
            </div>
            <div>
              <p className="font-black text-[#1a1a1a]">macOS</p>
              <p className="font-bold text-zinc-500">macOS 12+ (Intel/Apple Silicon), 4GB RAM, 200MB disk</p>
            </div>
            <div>
              <p className="font-black text-[#FCC624]">Linux</p>
              <p className="font-bold text-zinc-500">x86_64, glibc 2.28+, 4GB RAM, 200MB disk. AppImage (portable) or .deb</p>
            </div>
          </div>
        </div>

        {/* ─── Source Code ─── */}
        <div className="mag-card p-6 text-center space-y-4">
          <Github className="w-8 h-8 mx-auto text-[#1a1a1a]" />
          <div>
            <h3 className="font-black text-xs uppercase tracking-wider text-[#1a1a1a]">
              Source Available License
            </h3>
            <p className="text-[11px] font-bold text-zinc-500 mt-1">
              The source code is public under the project license. You can inspect the game, report bugs, and contribute improvements.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 mag-btn bg-[#1a1a1a] text-[#FFCC00] text-xs"
            >
              <Github className="w-4 h-4" />
              GitHub Repo
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href={RELEASES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 mag-btn bg-[#3B4CCA] text-white text-xs"
            >
              <Download className="w-4 h-4" />
              All Releases
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

      </div>
    </PublicPageShell>
  )
}
