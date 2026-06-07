import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Cybermon Collection — 160 Tazos (Magic Box 2000)",
  description: "The biggest Cybermon collection: 160 digital-creature tazos with evolution stages, transformation paths, and powerful abilities.",
  path: "/collections/cybermon",
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
