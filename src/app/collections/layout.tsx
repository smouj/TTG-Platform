import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Collections — 349 Tazos from Minimon, Dracobell & Cybermon",
  description: "Browse the three legendary tazo collections: 61 Minimon, 128 Dracobell, and 160 Cybermon. Complete guide to all verified Spanish tazos.",
  path: "/collections",
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
