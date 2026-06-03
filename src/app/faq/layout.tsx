import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "FAQ — Frequently Asked Questions",
  description: "Answers to common questions about Trading Tazos Game. Account, collections, battles, shop, quests, and technical support.",
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
