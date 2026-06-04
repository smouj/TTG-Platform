import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Download for Linux and Web",
  description: "Play Trading Tazos Game in your browser or download the Linux desktop app. Windows and macOS builds are planned.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
