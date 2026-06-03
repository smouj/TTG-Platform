import Link from "next/link"

const columns = [
  {
    title: "Game",
    links: [
      ["How to Play", "/how-to-play"],
      ["Battle System", "/battle-system"],
      ["Collections", "/collections"],
      ["Tazos", "/tazos"],
      ["Leaderboard", "/app/leaderboard"],
    ],
  },
  {
    title: "Player",
    links: [
      ["Sign In", "/login"],
      ["Create Account", "/register"],
      ["Shop", "/app?tab=shop"],
      ["Quests", "/app?tab=quests"],
      ["Download", "/app/download"],
    ],
  },
  {
    title: "Support",
    links: [
      ["FAQ", "/faq"],
      ["Support", "mailto:support@medaclawarena.com"],
      ["Contact", "mailto:support@medaclawarena.com"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Terms", "/terms"],
      ["Privacy", "/privacy"],
      ["Cookies", "/cookies"],
      ["Disclaimer", "/disclaimer"],
    ],
  },
]

export default function PublicFooter() {
  return (
    <footer className="bg-[#1a1a1a] text-white border-t-4 border-[#FFCC00]">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#FFCC00] mb-3">{column.title}</h2>
              <ul className="space-y-2">
                {column.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-sm font-bold text-zinc-300 hover:text-white hover:underline underline-offset-4">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-5 border-t border-white/15 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <p className="text-xs font-bold text-zinc-400">
            Copyright {new Date().getFullYear()} Trading Tazos Game. Version 0.3.0.
          </p>
          <p className="text-xs font-bold text-zinc-500">
            Fan-made collector experience. Minimon, Dracobell, and Cybermon are fictional IPs.
          </p>
        </div>
      </div>
    </footer>
  )
}
