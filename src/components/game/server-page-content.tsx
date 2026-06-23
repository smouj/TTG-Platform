// ============================================================
// ServerPageContent — Server-rendered unique HTML per SPA page
// Renders before LauncherView so crawlers get unique content.
// Hidden via CSS when JS hydrates (LauncherView takes over).
// ============================================================

import { SITE_CONFIG } from "@/lib/site-config"
import { FRANCHISES, FRANCHISE_BY_SLUG } from "@/lib/franchise-config"

interface Props {
  page: string
}

export default function ServerPageContent({ page }: Props) {
  if (page === "how-to-play") {
    return <ServerHowToPlay />
  }
  if (page === "collections") {
    return <ServerCollections />
  }
  if (page === "wiki") {
    return <ServerWiki />
  }
  if (page === "leaderboard") {
    return <ServerLeaderboard />
  }
  if (page === "download") {
    return <ServerDownload />
  }
  if (page === "faq") {
    return <ServerFAQ />
  }
  if (page === "refund-policy") {
    return <ServerRefundPolicy />
  }
  if (page === "disclaimer") {
    return <ServerDisclaimer />
  }
  if (page === "contact") {
    return <ServerContact />
  }
  if (page === "privacy") {
    return <ServerPrivacy />
  }
  if (page === "terms") {
    return <ServerTerms />
  }
  if (page === "cookies") {
    return <ServerCookies />
  }
  return null
}

// ── How to Play ──
function ServerHowToPlay() {
  return (
    <section className="sr-only">
      <h1>How to Play Trading Tazos Game</h1>
      <h2>Game Overview</h2>
      <p>Trading Tazos Game is a physics-based tazo battle game. Download the TTG-Engine for desktop (Windows, macOS, Linux) or play instantly in your browser. Create a free account, open your 30 welcome bags, build a 20-tazo deck, and enter the 3D arena.</p>
      <h2>Getting Started</h2>
      <ol>
        <li>Download the TTG-Engine for your platform, or play in your browser at tradingtazosgame.com.</li>
        <li>Create a free account — you will receive 30 welcome bags and 100 CREDITS.</li>
        <li>Open your welcome bags to collect your first tazos.</li>
        <li>Build a 20-tazo battle deck from your collection.</li>
        <li>Enter the 3D arena and use the Vertical Slam system: Aim → Charge → Tilt.</li>
        <li>Flip opponent tazos to capture them. Eliminate their deck to win.</li>
      </ol>
      <h2>Combat Stats</h2>
      <p>Each tazo has 9 combat stats: Attack, Defense, Resistance, Weight, Stability, Spin, Control, Bounce, and Precision. Build a balanced deck for the best results.</p>
    </section>
  )
}

// ── Collections ──
function ServerCollections() {
  return (
    <section className="sr-only">
      <h1>Collections — 351 Tazos Across 3 Series</h1>
      <p>Explore all 351 wiki lore entities in Trading Tazos Game, across three original series: Minimon (151), Dracobell (72), and Cybermon (128).</p>
      <h2>Minimon Series</h2>
      <p>151 creatures from Luminara. Life Spark origin, Pathfinder Bond Marks, diverse biomes, and Blooming evolution.</p>
      <h2>Dracobell Series</h2>
      <p>72 martial warriors from Bellora. Roar Aura resonance, Bell Shard clans, Ascension phases, and Grand Bell Tournament.</p>
      <h2>Cybermon Series</h2>
      <p>128 digital beings from the Neon Grid. Soul Protocols, Link Pulse synchronization, Shift Phases, and Null Signal threat.</p>
    </section>
  )
}

// ── Leaderboard ──
function ServerLeaderboard() {
  return (
    <section className="sr-only">
      <h1>Leaderboard — Top Players</h1>
      <p>See the top-ranked players in Trading Tazos Game. Rankings by battles won, tazos collected, and CREDITS earned. Sign in to compete and climb the leaderboard.</p>
    </section>
  )
}

// ── Download ──
function ServerDownload() {
  return (
    <section className="sr-only">
      <h1>Download Trading Tazos Game</h1>
      <p>Download the TTG-Engine for Windows, macOS, or Linux — the full-featured desktop game launcher with 3D arena battles, PvP matchmaking, offline collection viewer, and automatic updates. Or play instantly in your browser at tradingtazosgame.com. Mobile apps coming soon to Google Play and the App Store.</p>
      <h2>Platforms</h2>
      <ul>
        <li>Windows 10+ — TTG-Engine</li>
        <li>macOS 12+ — TTG-Engine</li>
        <li>Linux x64 — TTG-Engine</li>
        <li>Web Browser — Play instantly at tradingtazosgame.com</li>
        <li>Mobile — Coming soon to Google Play and App Store</li>
      </ul>
    </section>
  )
}

// ── FAQ ──
function ServerFAQ() {
  return (
    <section className="sr-only">
      <h1>Frequently Asked Questions — Trading Tazos Game</h1>
      <h2>What is Trading Tazos Game?</h2>
      <p>Trading Tazos Game is a physics-based disc battle game where you collect, trade, and battle with unique tazos. Each tazo has 9 combat stats. Completely free to play.</p>
      <h2>How do I start playing?</h2>
      <p>Download the TTG-Engine for Windows, macOS, or Linux, or play directly in your browser. Create a free account and you will receive 30 welcome bags and 100 CREDITS.</p>
      <h2>How many tazos are there?</h2>
      <p>351 tazo entities across 3 original series: Minimon (151), Dracobell (72), and Cybermon (128).</p>
      <h2>How does the battle system work?</h2>
      <p>Use the Vertical Slam system: Aim your crosshair, Charge the power bar, and Tilt for landing angle. Flip opponent tazos to capture them. Win by eliminating their deck.</p>
      <h2>What are the 9 combat stats?</h2>
      <p>Attack, Defense, Resistance, Weight, Stability, Spin, Control, Bounce, and Precision. Each stat affects tazo performance in the 3D arena.</p>
      <h2>How many tazos in a deck?</h2>
      <p>Each battle deck holds exactly 20 tazos. Build a balanced deck for the best results.</p>
      <h2>Is the game free?</h2>
      <p>Yes, completely free. No microtransactions. CREDITS are earned through gameplay and daily rewards.</p>
      <h2>Is this related to any real franchise?</h2>
      <p>No. All series, creatures, and lore are original fictional works created for Trading Tazos Game.</p>
    </section>
  )
}

// ── Contact ──
function ServerContact() {
  return (
    <section className="sr-only">
      <h1>Contact Trading Tazos Game</h1>
      <p>Get in touch with the Trading Tazos Game team for bug reports, feature requests, partnership inquiries, or questions about the game. Email support@tradingtazosgame.com.</p>
    </section>
  )
}

// ── Privacy ──
function ServerPrivacy() {
  return (
    <section className="sr-only">
      <h1>Privacy Policy — Trading Tazos Game</h1>
      <p>We collect minimal data to provide the game experience. Your tazos, deck builds, and battle history are stored to serve your personal collection. We use cookies for authentication. Anonymous traffic data is collected via Google Search Console. No personal data is sold. Email support@tradingtazosgame.com for privacy requests.</p>
    </section>
  )
}

// ── Terms ──
function ServerTerms() {
  return (
    <section className="sr-only">
      <h1>Terms of Service — Trading Tazos Game</h1>
      <p>Trading Tazos Game is a free-to-play browser game. By using the service, you agree to play fairly and not exploit bugs. All tazo designs, series lore, and game mechanics are original intellectual property. Accounts violating terms may be suspended. Contact support@tradingtazosgame.com for questions.</p>
    </section>
  )
}

// ── Cookies ──
function ServerCookies() {
  return (
    <section className="sr-only">
      <h1>Cookie Policy — Trading Tazos Game</h1>
      <p>We use essential cookies for authentication and session management. Anonymous traffic data via Google Search Console. No third-party tracking cookies. You can disable cookies in your browser, but login functionality requires them.</p>
    </section>
  )
}

// ── Refund Policy ──
function ServerRefundPolicy() {
  return (
    <section className="sr-only">
      <h1>Refund Policy — Trading Tazos Game</h1>
      <p>Trading Tazos Game is a free-to-play browser game. No purchases are required to access all game features.</p>
      <p>CREDITS are earned through gameplay, daily rewards, and events. They cannot be purchased with real money.</p>
      <p>As a free-to-play game, there are no refundable purchases. If you experience any issues, contact support@tradingtazosgame.com.</p>
      <p>For any billing inquiries related to donations or third-party ads, please contact us directly.</p>
    </section>
  )
}

// ── Disclaimer ──
function ServerDisclaimer() {
  return (
    <section className="sr-only">
      <h1>Disclaimer — Trading Tazos Game</h1>
      <p>Trading Tazos Game is an independent, fictional digital tazo game created and operated by independent developers.</p>
      <p>This game is not affiliated with, endorsed by, or associated with any third-party brand, trademark, or licensed intellectual property.</p>
      <p>All series, characters, lore, designs, names, and game mechanics are original fictional works. Any resemblance to existing IP is coincidental.</p>
      <p>The game is free-to-play. CREDITS cannot be purchased with real currency. All game features are accessible through gameplay alone.</p>
    </section>
  )
}

// ── Minimon Collection ──


// ── Dracobell Collection ──


// ── Cybermon Collection ──


// ── Wiki ──
function ServerWiki() {
  return (
    <section className="sr-only">
      <h1>TTG Wiki — Official Catalog of Trading Tazos Game</h1>
      <p>Explore the official Trading Tazos Game catalog: 151 Minimon, 128 Cybermon, and 72 Draco Bell. Full documentation of creatures, characters, villains, allies, techniques, transformations, items, and locations.</p>
      <h2>Minimon — 151 Creatures</h2>
      <p>Minimon are natural creatures from Luminara. Animals, plants, elements, and biological fantasy with evolutions, types, and detailed art states.</p>
      <h2>Cybermon — 128 Digital Tazos</h2>
      <p>Cybermon features Bound Children and their companion Cybermons in a digital adventure. Includes characters, creatures, rivals, villains, and Cybernet items.</p>
      <h2>Draco Bell — 72 Combat Tazos</h2>
      <p>Draco Bell is a martial arts series with Aura, Draco Bells, and epic transformations. Includes characters, villains, techniques, and battle locations.</p>
    </section>
  )
}

export { ServerPageContent }
