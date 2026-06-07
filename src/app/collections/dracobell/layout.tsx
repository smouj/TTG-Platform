import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Dracobell Collection — 128 Tazos (Matutano 1995)",
  description: "The massive Dracobell collection: 128 tazos across 6 categories including Tazos, Megatazos, Supertazos, Mastertazos, and Holo 3D variants.",
  path: "/collections/dracobell",
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
