import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Create Account — Start Your Journey",
  description: "Create your free Trading Tazos Game account. Collect 349 tazos, open welcome bags, build decks, and enter the battle arena.",
  path: "/register",
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
