import PublicPageShell from "@/components/layout/public-page-shell"

export const metadata = { title: "Disclaimer", description: "Legal disclaimer for Trading Tazos Game." }

export default function DisclaimerPage() {
  return (
    <PublicPageShell>
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#1a1a1a] mb-6">Disclaimer</h1>
        <div className="prose prose-sm font-bold text-[#1a1a1a]/70 max-w-none space-y-4">
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">Fan Project</h2>
          <p>Trading Tazos Game is an independent, fan-made collector experience. It is not affiliated with, endorsed by, or connected to Matutano, PepsiCo, Magic Box, or any original tazo manufacturers.</p>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">Trademarks</h2>
          <p>Minimon, Dracobell, and Cybermon are fictionalized collection labels used by this application. Any referenced third-party franchises remain trademarks of their respective owners. All tazo names used in this application are modified tributes, not reproductions of original IP.</p>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">No Affiliation</h2>
          <p>References to original tazo collections, manufacturers, or years are for historical/collector context only. This is a digital tribute to the physical tazo collecting culture.</p>
          <h2 className="text-lg font-black uppercase text-[#1a1a1a] mt-6">Contact</h2>
          <p>For any concerns: <a href="mailto:support@medaclawarena.com" className="text-[#E3350D] underline">support@medaclawarena.com</a></p>
        </div>
      </div>
    </PublicPageShell>
  )
}
