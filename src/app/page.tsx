import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  Crosshair,
  Disc3,
  Gamepad2,
  Layers3,
  PackageOpen,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react"
import PublicPageShell from "@/components/layout/public-page-shell"

export const metadata: Metadata = {
  title: "Collect, Trade & Battle 319 Classic Tazos",
  description:
    "Trading Tazos Game is a skill-based tazo battle game. Aim, throw, flip, and capture in a 3D match arena. Build your collection of 319 tazos across Minimon, Dracobell, and Cybermon.",
  openGraph: {
    title: "Trading Tazos Game — Aim. Throw. Flip. Capture.",
    description:
      "319 classic tazos. 9 combat stats. 2D collection views and a skill-based 3D battle arena.",
    images: [{ url: "/logo/social-preview.png", width: 1200, height: 630 }],
  },
}

const heroTazos = [
  {
    src: "/tazos/minimon/minimon-t1-25.svg",
    alt: "Minimon tazo",
    className: "left-[5%] top-[11%] w-24 sm:w-32 lg:w-40 ttg-float-disc",
  },
  {
    src: "/tazos/dracobell/dracobell-master-master-goku.svg",
    alt: "Dracobell tazo",
    className: "right-[7%] top-[10%] w-28 sm:w-36 lg:w-48 ttg-float-disc-delayed",
  },
  {
    src: "/tazos/cybermon/cybermon-mb-88.svg",
    alt: "Cybermon tazo",
    className: "left-[12%] bottom-[17%] w-20 sm:w-28 lg:w-36 ttg-float-disc-slow",
  },
  {
    src: "/tazos/dracobell/dracobell-master-master-shenron.svg",
    alt: "Legendary Dracobell tazo",
    className: "right-[13%] bottom-[14%] w-20 sm:w-28 lg:w-36 ttg-float-disc",
  },
]

const stats = [
  ["319", "Tazos"],
  ["3", "Collections"],
  ["9", "Stats"],
  ["5", "Card Decks"],
]

const collections = [
  {
    name: "Minimon",
    count: 51,
    color: "#FFCC00",
    year: 2000,
    href: "/collections/minimon",
    src: "/tazos/minimon/minimon-t1-1.svg",
    desc: "Bright starters and balanced stats for your first competitive decks.",
  },
  {
    name: "Dracobell",
    count: 118,
    color: "#FF6B00",
    year: 1995,
    href: "/collections/dracobell",
    src: "/tazos/dracobell/dracobell-master-master-vegeta.svg",
    desc: "The biggest collection, packed with categories, rare pulls, and heavy hitters.",
  },
  {
    name: "Cybermon",
    count: 150,
    color: "#00A1E9",
    year: 2000,
    href: "/collections/cybermon",
    src: "/tazos/cybermon/cybermon-mb-42.svg",
    desc: "Digital-era creatures with sharp stat profiles and lots of deck variety.",
  },
]

const flow = [
  {
    icon: PackageOpen,
    title: "Open Bags",
    desc: "Earn credits, open illustrated packs, and reveal new tazos for your album.",
    color: "#FFCC00",
  },
  {
    icon: Layers3,
    title: "Build Decks",
    desc: "Choose 5 tazos, balance 8 combat roles, and tune your strategy.",
    color: "#3B4CCA",
  },
  {
    icon: Crosshair,
    title: "Aim & Throw",
    desc: "Enter the 3D arena, charge power, line up the shot, and release.",
    color: "#E3350D",
  },
  {
    icon: Trophy,
    title: "Flip to Win",
    desc: "Use rebounds, impact and control to flip rival tazos before they flip yours.",
    color: "#78C850",
  },
]

const features = [
  {
    icon: Disc3,
    title: "Complete Album",
    desc: "A clean 2D collection view for every Minimon, Dracobell, and Cybermon tazo.",
  },
  {
    icon: Gamepad2,
    title: "3D Battle Arena",
    desc: "The action stays in matches: throw physics, impacts, flips, and momentum.",
  },
  {
    icon: ScanLine,
    title: "Scanner Flow",
    desc: "Upload sheets, crop tazos, and add physical finds into your digital collection.",
  },
  {
    icon: ShieldCheck,
    title: "Account Progress",
    desc: "Welcome pack, decks, quests, credits, stats, and leaderboard progression.",
  },
]

export default function LandingPage() {
  return (
    <PublicPageShell>
      <section className="relative isolate overflow-hidden border-b-4 border-[#1a1a1a] bg-[#FFCC00]">
        <div className="absolute inset-0 mag-stripes opacity-20" />
        <div className="absolute inset-0 ttg-hero-halftone" />

        {heroTazos.map((tazo) => (
          <div key={tazo.src} className={`absolute hidden md:block ${tazo.className}`}>
            <Image
              src={tazo.src}
              alt={tazo.alt}
              width={220}
              height={220}
              priority
              className="h-auto w-full drop-shadow-[8px_10px_0_rgba(26,26,26,0.35)]"
            />
          </div>
        ))}

        <div className="relative z-10 mx-auto flex min-h-[74svh] max-w-7xl flex-col items-center justify-center px-4 py-14 text-center sm:py-18 lg:py-20">
          <div className="mag-enter-up-1 mb-5 inline-flex items-center gap-2 border-3 border-[#1a1a1a] bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a]">
            <Sparkles className="h-3.5 w-3.5 text-[#E3350D]" />
            Browser & Linux Desktop
          </div>

          <div className="mag-enter-up-2 relative mb-6">
            <Image
              src="/logo/logo-complete-black.png"
              alt="Trading Tazos Game"
              width={560}
              height={168}
              priority
              className="mx-auto h-auto w-[min(82vw,520px)]"
            />
          </div>

          <h1 className="mag-enter-up-3 max-w-5xl text-balance text-4xl font-black uppercase leading-[1.02] text-[#1a1a1a] sm:text-6xl lg:text-7xl">
            Aim. Throw. <span className="text-[#E3350D] mag-stroke-sm">Flip.</span> Capture.
          </h1>

          <p className="mag-enter-up-4 mt-6 max-w-2xl text-pretty text-base font-bold leading-relaxed text-[#1a1a1a]/75 sm:text-lg">
            Build a 2D album of classic tazos, craft 5-card decks, then settle matches in a skill-based 3D arena where power, angle, and timing decide the flip.
          </p>

          <div className="mag-enter-up-5 mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="mag-btn bg-[#E3350D] px-8 py-4 text-sm font-black uppercase tracking-wider text-white"
            >
              Start Free
            </Link>
            <Link
              href="/tazos"
              className="mag-btn bg-white px-8 py-4 text-sm font-black uppercase tracking-wider text-[#1a1a1a]"
            >
              Browse Tazos
            </Link>
            <Link
              href="/how-to-play"
              className="mag-btn bg-[#3B4CCA] px-8 py-4 text-sm font-black uppercase tracking-wider text-white"
            >
              How to Play
            </Link>
          </div>
        </div>

        <div className="relative z-10 border-t-4 border-[#1a1a1a] bg-[#1a1a1a] text-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-white/15 sm:grid-cols-4 sm:divide-y-0">
            {stats.map(([value, label]) => (
              <div key={label} className="px-4 py-4 text-center">
                <p className="text-3xl font-black leading-none text-[#FFCC00] sm:text-4xl">{value}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/70">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-b-4 border-[#1a1a1a] bg-white">
        <div className="ttg-ticker flex whitespace-nowrap py-3 text-sm font-black uppercase tracking-[0.16em] text-[#1a1a1a]">
          <span className="px-6">Collect 319 tazos</span>
          <span className="px-6 text-[#E3350D]">Aim by hand</span>
          <span className="px-6">Open bags</span>
          <span className="px-6 text-[#3B4CCA]">Build 5-card decks</span>
          <span className="px-6">Flip rivals</span>
          <span className="px-6 text-[#E3350D]">Collect 319 tazos</span>
          <span className="px-6">Aim by hand</span>
          <span className="px-6 text-[#3B4CCA]">Open bags</span>
        </div>
      </section>

      <section className="border-b-4 border-[#1a1a1a] bg-[#fffbe6] py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 grid gap-4 md:grid-cols-[0.9fr_1.1fr] md:items-end">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#E3350D]">Core Loop</p>
              <h2 className="text-3xl font-black uppercase leading-tight text-[#1a1a1a] sm:text-4xl">
                Not an auto-battle card game.
              </h2>
            </div>
            <p className="text-sm font-bold leading-relaxed text-[#1a1a1a]/65 sm:text-base">
              Stats matter, but the shot is yours. Overcharge and you can miss. Underpower and the rival tazo survives. Every match asks for timing, aim, and deck sense.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {flow.map((item, index) => (
              <div key={item.title} className="ttg-step-card bg-white p-5" style={{ ["--step-color" as string]: item.color }}>
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center border-3 border-[#1a1a1a] bg-[var(--step-color)] shadow-[3px_3px_0_#1a1a1a]">
                    <item.icon className="h-6 w-6 text-[#1a1a1a]" />
                  </div>
                  <span className="text-4xl font-black leading-none text-[#1a1a1a]/10">0{index + 1}</span>
                </div>
                <h3 className="mb-2 text-base font-black uppercase text-[#1a1a1a]">{item.title}</h3>
                <p className="text-sm font-bold leading-relaxed text-[#1a1a1a]/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b-4 border-[#1a1a1a] bg-white py-14 sm:py-18">
        <div className="absolute inset-0 mag-dots opacity-80" />
        <div className="relative mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#3B4CCA]">The Album</p>
            <h2 className="text-3xl font-black uppercase text-[#1a1a1a] sm:text-4xl">Three Collections, One Arena</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm font-bold leading-relaxed text-[#1a1a1a]/60 sm:text-base">
              Browse the collections in 2D, compare stat profiles, then bring your best five into battle.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {collections.map((collection) => (
              <Link
                key={collection.name}
                href={collection.href}
                className="ttg-collection-card group bg-[#fffbe6] p-5"
                style={{ ["--collection-color" as string]: collection.color }}
              >
                <div className="relative mb-5 flex h-48 items-center justify-center overflow-hidden border-3 border-[#1a1a1a] bg-white">
                  <div className="absolute inset-0 opacity-30" style={{ backgroundColor: collection.color }} />
                  <Image
                    src={collection.src}
                    alt={`${collection.name} tazo preview`}
                    width={190}
                    height={190}
                    className="relative h-36 w-36 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 sm:h-40 sm:w-40"
                  />
                  <div className="absolute right-3 top-3 border-2 border-[#1a1a1a] bg-white px-2 py-1 text-[10px] font-black uppercase shadow-[2px_2px_0_#1a1a1a]">
                    {collection.year}
                  </div>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-black uppercase text-[#1a1a1a]">{collection.name}</h3>
                    <p className="mt-2 text-sm font-bold leading-relaxed text-[#1a1a1a]/60">{collection.desc}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-4xl font-black leading-none text-[var(--collection-color)] mag-stroke-sm">{collection.count}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1a1a1a]/50">Tazos</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b-4 border-[#1a1a1a] bg-[#1a1a1a] py-14 text-white sm:py-18">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#FFCC00]">Battle Feel</p>
            <h2 className="text-3xl font-black uppercase leading-tight sm:text-4xl">
              The throw is the input.
            </h2>
            <p className="mt-4 max-w-xl text-sm font-bold leading-relaxed text-white/70 sm:text-base">
              The arena is where TTG becomes physical: aim sweep, vertical timing, power charge, impact, flip, rebound. The UI stays readable, but the match gets kinetic.
            </p>
            <Link
              href="/battle-system"
              className="mag-btn mt-7 inline-flex bg-[#FFCC00] px-7 py-3 text-sm font-black uppercase tracking-wider text-[#1a1a1a]"
            >
              Study Battle System
            </Link>
          </div>

          <div className="relative min-h-[300px] overflow-hidden border-4 border-[#FFCC00] bg-[#fffbe6] p-5 shadow-[8px_8px_0_#FFCC00]">
            <div className="absolute inset-0 ttg-arena-grid" />
            <div className="relative mx-auto h-[260px] max-w-xl">
              <Image
                src="/tazos/minimon/minimon-t1-7.svg"
                alt="Player tazo in battle"
                width={132}
                height={132}
                loading="eager"
                className="ttg-arena-disc absolute bottom-7 left-4 h-24 w-24 sm:h-32 sm:w-32"
              />
              <Image
                src="/tazos/cybermon/cybermon-mb-12.svg"
                alt="Rival tazo in battle"
                width={124}
                height={124}
                loading="eager"
                className="ttg-arena-disc-opponent absolute right-5 top-6 h-24 w-24 sm:h-32 sm:w-32"
              />
              <div className="ttg-shot-line absolute left-[28%] top-[50%] h-2 w-[44%] origin-left -rotate-[18deg] bg-[#E3350D]" />
              <div className="absolute left-[56%] top-[31%] border-3 border-[#1a1a1a] bg-white px-3 py-2 text-[11px] font-black uppercase text-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a]">
                Impact window
              </div>
              <div className="absolute bottom-0 left-1/2 h-16 w-52 -translate-x-1/2 rounded-[50%] border-3 border-[#1a1a1a] bg-[#FFCC00]/50" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-4 border-[#1a1a1a] bg-[#fffbe6] py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-[#E3350D]">Built Out</p>
            <h2 className="text-3xl font-black uppercase text-[#1a1a1a] sm:text-4xl">More Than a Landing Page</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="ttg-feature-card bg-white p-5">
                <feature.icon className="mb-4 h-8 w-8 text-[#E3350D]" />
                <h3 className="mb-2 text-sm font-black uppercase tracking-wide text-[#1a1a1a]">{feature.title}</h3>
                <p className="text-xs font-bold leading-relaxed text-[#1a1a1a]/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b-4 border-[#1a1a1a] bg-[#E3350D] py-14 sm:py-18">
        <div className="absolute inset-0 mag-stripes opacity-10" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-black uppercase text-white sm:text-4xl">Start Your Collection Today</h2>
          <p className="mx-auto mt-4 max-w-lg text-base font-bold leading-relaxed text-white/80">
            Free to play. Earn tazos and credits through gameplay, build your deck, and start flipping.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="mag-btn bg-[#FFCC00] px-10 py-4 text-sm font-black uppercase tracking-wider text-[#1a1a1a]"
            >
              Create Free Account
            </Link>
            <Link
              href="/download"
              className="mag-btn bg-white px-10 py-4 text-sm font-black uppercase tracking-wider text-[#1a1a1a]"
            >
              Download Linux App
            </Link>
          </div>
          <p className="mt-4 text-xs font-bold text-white/60">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-white">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </PublicPageShell>
  )
}
