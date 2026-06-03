import type { Metadata } from "next"
export const metadata: Metadata = {
  title: "Battle System — Physics Arena & Combat Mechanics",
  description: "Deep dive into the Trading Tazos Game battle system. 9 combat stats, aim mechanics, physics engine, capture system, risk/reward, and game modes.",
}
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</> }
