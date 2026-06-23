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
  if (page === "collections-minimon") {
    return <ServerMinimon />
  }
  if (page === "collections-dracobell") {
    return <ServerDracobell />
  }
  if (page === "collections-cybermon") {
    return <ServerCybermon />
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
  if (page === "shop") {
    return <ServerShop />
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
      <p>Trading Tazos Game is a skill-based digital tazo battle game. Discover 351 tazos across 3 series. Build your battle deck, draw 3 tazos into your hand, and launch one per turn by dragging back and releasing. Land on opponent discs to flip them in a physics-driven 3D arena.</p>
      <h2>Game Rules</h2>
      <ol>
        <li>Draw 3 tazos into your starting hand from your deck.</li>
        <li>Select a tazo, drag back to aim, and release to launch it in a parabolic arc.</li>
        <li>Land on opponent discs to flip them — momentum and weight determine the outcome.</li>
        <li>On your turn, select a tazo from your hand and launch it vertically from above.</li>
        <li>Use Aim controls to position your drop, then Charge to power up your slam.</li>
        <li>The tazo impacts the stack below — flipped tazos are captured by the attacker.</li>
        <li>Earn points for capturing opponent tazos. First to reach the score limit wins by TKO.</li>
        <li>If all opponent tazos are eliminated, win by elimination.</li>
      </ol>
      <h2>Stats That Matter</h2>
      <p>Each tazo has 9 combat stats: Attack (flip strength), Defense (flip resistance), Resistance (wear protection), Weight (impact force), Stability (knockback resistance), Spin (spin recovery), Control (aim precision), Bounce (bounce height), Precision (accuracy bonus).</p>
      <h2>Battle Modes</h2>
      <p>Practice: Train against AI with adjustable difficulty (Novice, Skilled, Master).</p>
      <p>Ranked PvP: Coming soon — competitive matchmaking with global leaderboard.</p>
      <p>Friend Battle: Coming soon — invite friends with room codes.</p>
    </section>
  )
}

// ── Collections ──
function ServerCollections() {
  return (
    <section className="sr-only">
      <h1>Collections — 351 Tazos Across 3 Series</h1>
      <p>Explore all 351 entities in Trading Tazos Game, distributed across three original series: Minimon (151), Dracobell (72), and Cybermon (128).</p>
      <h2>Minimon Series</h2>
      <p>50 natural creatures from Luminara. Elemental types, diverse biomes, and unique evolutions.</p>
      <h2>Dracobell Series</h2>
      <p>50 martial fighters from Bellora. Clans, auras, and Bell Shard transformations.</p>
      <h2>Cybermon Series</h2>
      <p>50 digital monsters from the Neon Grid. Code-based beings with patch upgrades and prime forms.</p>
    </section>
  )
}

// ── Tazos ──
function ServerTazos() {
  return (
    <section className="sr-only">
      <h1>Tazo Catalog — 351 Published Tazos</h1>
      <p>Browse the complete catalog of 351 entities in Trading Tazos Game. Filter by series, rarity, combat type, and more. Each tazo features 9 combat stats, unique artwork, and finish variants.</p>
      <h2>Rarity Tiers</h2>
      <ul>
        <li>Common — Basic collection tazos</li>
        <li>Uncommon — Slightly rarer with better stats</li>
        <li>Rare — Distinctive finishes and higher stats</li>
        <li>Ultra Rare — Premium holographic and chrome finishes</li>
        <li>Legendary — The rarest tazos with exclusive shiny variants</li>
      </ul>
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
      <p>Play Trading Tazos Game instantly in your browser — no download or install needed. Desktop apps are available for Windows, macOS, and Linux for the best experience. Also available as a PWA for mobile.</p>
      <ul>
        <li>Windows — Download .exe installer</li>
        <li>macOS — Download .dmg</li>
        <li>Linux — Download .AppImage</li>
        <li>Web — Play instantly at tradingtazosgame.com</li>
        <li>PWA — Install from browser for offline play</li>
      </ul>
    </section>
  )
}

// ── FAQ ──
function ServerFAQ() {
  return (
    <section className="sr-only">
      <h1>Frequently Asked Questions</h1>
      <h2>Is Trading Tazos Game free?</h2>
      <p>Yes, completely free. You get 30 welcome bags and 100 CREDITS when you create an account.</p>
      <h2>How many tazos are there?</h2>
      <p>351 tazos across 3 original series: Minimon (151), Dracobell (72), and Cybermon (128). More planned for future seasons.</p>
      <h2>How do battles work?</h2>
      <p>Choose a tazo, drag back to aim, and release to launch it in an arcing jump. Land on opponent discs to flip them — heavier discs hit harder, faster discs are harder to catch. First to flip 5 opponent discs wins. It is a physics-based arcade battle.</p>
      <h2>Can I play as a guest?</h2>
      <p>Try the practice arena instantly — no account needed. Battle against the AI, test different decks, and experience the slam mechanics. Create a free account to open bags, build your collection, earn CREDITS, and compete on the leaderboard.</p>
      <h2>What are the tazo stats?</h2>
      <p>Each tazo has 9 stats: Attack, Defense, Resistance, Weight, Stability, Spin, Control, Bounce, and Precision.</p>
      <h2>What is a deck?</h2>
      <p>A battle deck consists of 5 tazos selected from your collection. You can build multiple decks with different strategies.</p>
      <h2>Are there microtransactions?</h2>
      <p>No. The game is supported by ads. CREDITS are earned through gameplay and daily rewards — they cannot be purchased.</p>
      <h2>Is this related to any real franchise?</h2>
      <p>No. All series, creatures, and lore are original fictional works created for Trading Tazos Game.</p>
    </section>
  )
}

// ── Shop ──
function ServerShop() {
  return (
    <section className="sr-only">
      <h1>Shop — Tazo Bags</h1>
      <p>Buy tazo bags to expand your collection. Each bag costs 100 CREDITS and contains random tazos from one of three original series.</p>
      <h2>Bag Types</h2>
      <ul>
        <li>Classic Bag — Minimon tazos with balanced rarity. 48% Common, 30% Uncommon, 15% Rare, 5% Ultra Rare, 2% Legendary.</li>
        <li>Premium Bag — Cybermon digital tazos. Same rarity distribution.</li>
        <li>Mega Bag — Dracobell martial tazos. Same rarity distribution.</li>
      </ul>
      <h2>Getting Started</h2>
      <p>New players receive 30 welcome bags and 100 CREDITS for free upon account creation. No purchase required.</p>
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
function ServerMinimon() {
  return (
    <section className="sr-only">
      <h1>Minimon Collection — Creature Companions from Luminara</h1>
      <p>50 Minimon tazos from the world of Luminara, a luminous land of colorful regions, winding paths, and elemental energy.</p>
      <p>Minimon are born when Life Spark energy accumulates in one place. Each creature is connected to its environment — fields, forests, coasts, hills, mountains.</p>
      <h2>Regions</h2>
      <ul>
        <li>Sunnyvale Fields — Rolling fields, farms, villages (Normal, Solar, Plant)</li>
        <li>Mossdeep Woods — Ancient forests with deep roots (Plant, Insect, Earth, Mystic)</li>
        <li>Bluefin Coast — Beaches, reefs, lighthouses (Water, Wind, Soft Ice)</li>
        <li>Cinderpop Hills — Warm hills, volcanic caves (Fire, Rock, Metal)</li>
        <li>Stormtail Ridge — Storm-swept peaks (Electric, Flying, Lesser Dragon)</li>
        <li>Moonberry Hollow — Strange nocturnal zone (Shadow, Dream, Illusion)</li>
        <li>Aurora Summit — Legendary endgame region (Rare forms and guardians)</li>
      </ul>
      <h2>Blooming Evolution</h2>
      <p>Minimon evolve through Blooming: Tiny Form → Trail Form → Guardian Form → Mythic Bloom. Evolution happens through bonding with Pathfinders, overcoming challenges, and awakening emotions.</p>
      <h2>Pathfinders</h2>
      <p>Explorers who travel with Minimon through Bond Marks — a mark of trust. A Minimon does not obey out of obligation. It follows because it trusts.</p>
      <h2>The Stillness</h2>
      <p>The Stillness freezes growth, creating Faded Minimon that lose color and personality. A Pathfinder&apos;s goal is to restore their Life Spark.</p>
      <p>Official Motto: Find them. Bond with them. Watch them bloom.</p>
    </section>
  )
}

// ── Dracobell Collection ──
function ServerDracobell() {
  return (
    <section className="sr-only">
      <h1>Dracobell Collection — Martial Warriors of Bellora</h1>
      <p>50 Dracobell tazos from Bellora, a world of combat regions governed by clans. Each clan protects a technique, a philosophy, and a fragment of the legendary Dracobell.</p>
      <h2>Clans</h2>
      <ul>
        <li>Ember Fist — Ember Valley (Fire, Direct Attack)</li>
        <li>Storm Fang — Storm Peaks (Lightning, Speed)</li>
        <li>Iron Horn — Iron Plateau (Defense, Endurance)</li>
        <li>Frost Scale — Frost Temple (Control, Precision)</li>
        <li>Shadow Claw — Shadow Basin (Counterattack, Stealth)</li>
        <li>Golden Roar — Golden Shrine (Aura, Mastery)</li>
      </ul>
      <h2>Ascension</h2>
      <p>Warriors ascend through phases: Base Fighter → Aura Release → Clan Ascension → Champion Ascension → Dragon Bell. Roar Aura fuels each warrior&apos;s growth.</p>
      <h2>Bell Shards</h2>
      <p>The Dracobell is a legendary bell forged from meteorite metal and dragon scales. Shattered during a clan war, its Bell Shards are now scattered and sought by all clans.</p>
      <h2>Grand Bell Tournament</h2>
      <p>The ultimate combat event where clans compete to gather Bell Shards. The Silent Clan opposes restoring the bell. The tournament decides Bellora&apos;s fate.</p>
      <p>Official Motto: Train hard. Ring loud. Rise beyond.</p>
    </section>
  )
}

// ── Cybermon Collection ──
function ServerCybermon() {
  return (
    <section className="sr-only">
      <h1>Cybermon Collection — Digital Beasts of the Neon Grid</h1>
      <p>50 Cybermon tazos from the Neon Grid, a hidden digital dimension behind all networks. Living digital creatures with Soul Protocols — not robots, not simple programs.</p>
      <h2>Sectors</h2>
      <ul>
        <li>Boot Fields — Stable simple code (Basic Cybermon)</li>
        <li>Pixel Ruins — Ancient games and lost systems (Pixel, Glitch)</li>
        <li>Volt Highway — Highways of pure electricity (Volt, Speed, Signal)</li>
        <li>Firewall Citadel — Fortified stronghold (Armor, Shield, Core)</li>
        <li>Data Ocean — Endless sea of flowing information (Aqua-data, Memory)</li>
        <li>Kernel Tower — Core of the entire digital world (Advanced forms)</li>
      </ul>
      <h2>Shift Phases</h2>
      <p>Cybermon evolve through: Boot Form → Link Form → Overdrive → Prime Form → Corrupt → Omega Patch. Soul Protocols define each digital identity.</p>
      <h2>Linkers</h2>
      <p>Humans who synchronize with Cybermon through Link Pulse. A partnership built on digital trust and shared protocols.</p>
      <h2>Null Signal</h2>
      <p>The enemy force that corrupts Cybermon into Null Shells. Linkers fight to restore corrupted protocols and break the Null.</p>
      <p>Official Motto: Log in. Link up. Break the Null.</p>
    </section>
  )
}

export { ServerPageContent }

// ── Wiki ──
function ServerWiki() {
  return (
    <section className="sr-only">
      <h1>TTG Wiki — Catálogo Oficial de Trading Tazos Game</h1>
      <p>Explora el catálogo oficial de Trading Tazos Game: 151 Minimon, 128 Cybermon y 72 Draco Bell. Documentación completa de criaturas, personajes, villanos, aliados, técnicas, transformaciones, objetos y escenarios.</p>
      <h2>Minimon — 151 Criaturas</h2>
      <p>Minimon son criaturas naturales de Luminara. Animales, plantas, elementos y fantasía biológica con evoluciones, tipos y estados de arte detallados.</p>
      <h2>Cybermon — 128 Tazos Digitales</h2>
      <p>Cybermon presenta Niños Vinculados y sus Cybermons compañeros en una aventura digital. Incluye personajes, criaturas, rivales, villanos y objetos de Cybernet.</p>
      <h2>Draco Bell — 72 Tazos de Combate</h2>
      <p>Draco Bell es una serie de artes marciales con Aura, Campanas Draco y transformaciones épicas. Incluye personajes, villanos, técnicas y escenarios de batalla.</p>
    </section>
  )
}
