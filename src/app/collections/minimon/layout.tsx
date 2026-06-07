import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Minimon Collection — 61 Tazos (Matutano 2000)",
  description: "The original Minimon collection: 61 tazos from the 2000 Matutano series. Classic starter creatures with balanced combat stats.",
  path: "/collections/minimon",
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
