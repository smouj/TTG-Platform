import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Download for Desktop — Windows, macOS, Linux",
  description: "Download Trading Tazos Game for Windows, macOS, and Linux. Native desktop app with full-screen experience.",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
