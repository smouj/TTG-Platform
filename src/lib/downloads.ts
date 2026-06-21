import { SITE_CONFIG } from "@/lib/site-config"

export type DownloadPlatform = {
  id: "windows" | "macos" | "linux"
  label: string
  status: "available" | "planned"
  version: string
  hint: string
  primary: {
    label: string
    url: string
    size: string
  }
  secondary?: {
    label: string
    url: string
    size: string
  }[]
}

const RELEASE_TAG = "v0.11.2"
const DESKTOP_VERSION = "0.11.2"
const RELEASE_BASE = `${SITE_CONFIG.social.github}/releases/download/${RELEASE_TAG}`

export const DOWNLOAD_RELEASE = {
  tag: RELEASE_TAG,
  desktopVersion: DESKTOP_VERSION,
  releaseUrl: `${SITE_CONFIG.social.github}/releases/tag/${RELEASE_TAG}`,
} as const

export const DOWNLOAD_PLATFORMS: DownloadPlatform[] = [
  {
    id: "windows",
    label: "Windows",
    status: "available",
    version: DESKTOP_VERSION,
    hint: "Installer for Windows 10/11",
    primary: {
      label: "Download .exe",
      url: `${RELEASE_BASE}/trading-tazos-game-${DESKTOP_VERSION}-win-x64.exe`,
      size: "255 MB",
    },
  },
  {
    id: "macos",
    label: "macOS",
    status: "available",
    version: DESKTOP_VERSION,
    hint: "DMG for Apple Silicon and Intel",
    primary: {
      label: "Apple Silicon .dmg",
      url: `${RELEASE_BASE}/trading-tazos-game-${DESKTOP_VERSION}-mac-arm64.dmg`,
      size: "340 MB",
    },
    secondary: [
      {
        label: "Intel .dmg",
        url: `${RELEASE_BASE}/trading-tazos-game-${DESKTOP_VERSION}-mac-x64.dmg`,
        size: "344 MB",
      },
    ],
  },
  {
    id: "linux",
    label: "Linux",
    status: "available",
    version: DESKTOP_VERSION,
    hint: "AppImage and Debian package",
    primary: {
      label: "Download AppImage",
      url: `${RELEASE_BASE}/trading-tazos-game-${DESKTOP_VERSION}-linux-x86_64.AppImage`,
      size: "401 MB",
    },
    secondary: [
      {
        label: "Download .deb",
        url: `${RELEASE_BASE}/trading-tazos-game-${DESKTOP_VERSION}-linux-amd64.deb`,
        size: "280 MB",
      },
    ],
  },
]
