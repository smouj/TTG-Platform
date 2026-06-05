// ============================================================
// Trading Tazos Game — Seed
// Original creature collections: Minimon, Cybermon, Dracobell
// Names managed in scripts/regenerate-tazo-names.mjs
// ============================================================

import { db } from "@/lib/db"

// ---- Helpers ----
function randRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function genStats() {
  return {
    attack: randRange(35, 85),
    defense: randRange(30, 80),
    resistance: randRange(30, 80),
    weight: randRange(30, 80),
    stability: randRange(30, 80),
    spin: randRange(25, 75),
    control: randRange(30, 80),
    bounce: randRange(25, 75),
    precision: randRange(30, 80),
  }
}

async function main() {
  console.log("🌱 Seeding Trading Tazos Game — Real Collections...\n")

  // Clean
  await db.tazo.deleteMany()
  await db.collection.deleteMany()
  await db.franchise.deleteMany()
  console.log("🧹 Cleaned existing data\n")

  // ============================================================
  // FRANCHISES
  // ============================================================
  const minimon = await db.franchise.create({
    data: {
      name: "Minimon", slug: "minimon", color: "#FFCB05", icon: "🐾",
      description: "Minimon — criaturas coleccionables originales. Colección de 51 tazos con diseños coloridos y adorables.",
      mechanic: "Colección numerada #1-51. Criaturas tipo mascota con trazo suave, colores vibrantes y diseño expresivo.",
    },
  })

  const dracobell = await db.franchise.create({
    data: {
      name: "Dracobell", slug: "dracobell", color: "#FF6B00", icon: "💥",
      description: "Dracobell — guerreros de artes marciales originales. Luchadores con auras elementales y técnicas especiales.",
      mechanic: "7 categorías: Tazos, Supertazos Voladores, Supertazos Octogonales, Megatazos, Holo 3D, Mastertazos.",
    },
  })

  const cybermon = await db.franchise.create({
    data: {
      name: "Cybermon", slug: "cybermon", color: "#00A1E9", icon: "🦾",
      description: "Cybermon — criaturas digitales originales. Monstruos biomecánicos con energía tecnológica y datos corruptos.",
      mechanic: "Criaturas digitales con armaduras, circuitos brillantes y habilidades de datos.",
    },
  })

  console.log(`✅ 3 franchises\n`)

  // ============================================================
  // COLLECTIONS
  // ============================================================
  const minimonTazos1 = await db.collection.create({
    data: {
      name: "Minimon Tazos 1", slug: "minimon-tazos-1",
      franchiseId: minimon.id, year: 2000, totalTazos: 51,
      manufacturer: "Matutano", country: "España",
      description: "La colección original de 51 tazos Minimon lanzada en España. Numeración del #1 al #51.",
    },
  })

  const dracobellTazos = await db.collection.create({
    data: {
      name: "Dracobell Tazos", slug: "dracobell-matutano-1995",
      franchiseId: dracobell.id, year: 1995, totalTazos: 105,
      manufacturer: "Matutano", country: "España",
      description: "Colección completa de 118 tazos Dracobell en 7 categorías: Tazos (1-10), Supertazos voladores (11-30), Supertazos octogonales (31-50), Megatazos (51-70), Holo 3D (1-10), y Mastertazos.",
    },
  })

  const cybermonMagicBox = await db.collection.create({
    data: {
      name: "Cybermon Digital Monsters", slug: "cybermon-magic-box-2000",
      franchiseId: cybermon.id, year: 2000, totalTazos: 150,
      manufacturer: "Magic Box", country: "España / Europa",
      description: "Colección de 150 caps Cybermon. Monstruos digitales evolucionables con armaduras y energía tecnológica.",
    },
  })

  console.log(`✅ 3 collections\n`)

  // ============================================================
  // MINIMON TAZOS 1 — #1-51 (VERIFIED)
  // ============================================================
  const minimonTazosData = [
    { n: "1", name: "Lumipuff" },
    { n: "2", name: "Bubblit" },
    { n: "3", name: "Emberkit" },
    { n: "4", name: "Leafroll" },
    { n: "5", name: "Voltbud" },
    { n: "6", name: "Plumfuzz" },
    { n: "7", name: "Nimbikoo" },
    { n: "8", name: "Twinklump" },
    { n: "9", name: "Sproutlet" },
    { n: "10", name: "Froskit" },
    { n: "11", name: "Glowbun" },
    { n: "12", name: "Pebblit" },
    { n: "13", name: "Dewdrop" },
    { n: "14", name: "Snugleaf" },
    { n: "15", name: "Fizzpuff" },
    { n: "16", name: "Tumblepop" },
    { n: "17", name: "Mossling" },
    { n: "18", name: "Starwhiff" },
    { n: "19", name: "Fluffern" },
    { n: "20", name: "Bloombit" },
    { n: "21", name: "Corkit" },
    { n: "22", name: "Lullabud" },
    { n: "23", name: "Wispikoo" },
    { n: "24", name: "Bounceleaf" },
    { n: "25", name: "Chirplet" },
    { n: "26", name: "Puffball" },
    { n: "27", name: "Squeaknip" },
    { n: "28", name: "Glintail" },
    { n: "29", name: "Trufflit" },
    { n: "30", name: "Petaloo" },
    { n: "31", name: "Marbit" },
    { n: "32", name: "Flitter" },
    { n: "33", name: "Snoozle" },
    { n: "34", name: "Glimpet" },
    { n: "35", name: "Tinkit" },
    { n: "36", name: "Waddleplum" },
    { n: "37", name: "Snapvine" },
    { n: "38", name: "Furnip" },
    { n: "39", name: "Skitter" },
    { n: "40", name: "Bramblet" },
    { n: "41", name: "Pondleap" },
    { n: "42", name: "Gustwhirl" },
    { n: "43", name: "Quillbee" },
    { n: "44", name: "Mossberg" },
    { n: "45", name: "Ripplefin" },
    { n: "46", name: "Stonibble" },
    { n: "47", name: "Fluffernix" },
    { n: "48", name: "Cinderpuff" },
    { n: "49", name: "Glacub" },
    { n: "50", name: "Berrytuft" },
    { n: "51", name: "Zapplet" },
  ]

  console.log(`📦 Inserting ${minimonTazosData.length} Minimon Tazos 1...`)

  // Mark some as owned (random ~30%)
  const ownedMinimonIds = new Set(
    Array.from({ length: minimonTazosData.length }, (_, i) => i)
      .filter(() => Math.random() < 0.3)
      .map(i => minimonTazosData[i].n)
  )

  for (const t of minimonTazosData) {
    const slug = `minimon-t1-${t.n}`
    await db.tazo.create({
      data: {
        name: t.name, displayName: t.name, slug,
        franchiseId: minimon.id, collectionId: minimonTazos1.id,
        number: t.n, variant: null, category: "tazos",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "cardboard", rarity: "common",
        imageUrl: `/tazos/minimon/${slug}.svg`,
        isOwned: ownedMinimonIds.has(t.n),
        ...genStats(),
      },
    })
  }

  console.log(`   ✅ ${minimonTazosData.length} Minimon tazos\n`)

  // ============================================================
  // DRACO BELL — TAZOS NORMALES #1-10
  // ============================================================
  const dracobellTazosNormales = [
    { n: "1", name: "Rai Kendo" },
    { n: "2", name: "Tenzan Blaze" },
    { n: "3", name: "Mizu Shiro" },
    { n: "4", name: "Kenji Storm" },
    { n: "5", name: "Hikari Flame" },
    { n: "6", name: "Takeshi Frost" },
    { n: "7", name: "Yuki Thunder" },
    { n: "8", name: "Ren Stone" },
    { n: "9", name: "Akira Gale" },
    { n: "10", name: "Haru Ember" },
  ]

  console.log(`📦 Dracobell Tazos #1-10...`)
  for (const t of dracobellTazosNormales) {
    const slug = `dracobell-t-${t.n}`
    await db.tazo.create({
      data: {
        name: t.name, displayName: t.name, slug,
        franchiseId: dracobell.id, collectionId: dracobellTazos.id,
        number: t.n, category: "tazos",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "cardboard", rarity: "common",
        imageUrl: `/tazos/dracobell/${slug}.svg`,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 10 tazos normales\n`)

  // ============================================================
  // DRACO BELL — SUPERTAZOS VOLADORES #11-30
  // ============================================================
  const dracobellSupertazosVoladores = [
    { n: "11", name: "Sora Tide" },
    { n: "12", name: "Kaito Steel" },
    { n: "13", name: "Michi Wind" },
    { n: "14", name: "Riku Ash" },
    { n: "15", name: "Nami Wave" },
    { n: "16", name: "Taro Spark" },
    { n: "17", name: "Jiro Iron" },
    { n: "18", name: "Shin Blaze" },
    { n: "19", name: "Koji Frost" },
    { n: "20", name: "Yoru Shadow" },
    { n: "21", name: "Asahi Dawn" },
    { n: "22", name: "Daiki Quake" },
    { n: "23", name: "Ryo Lightning" },
    { n: "24", name: "Goro Titan" },
    { n: "25", name: "Isamu Fang" },
    { n: "26", name: "Kenta Shield" },
    { n: "27", name: "Makoto Fist" },
    { n: "28", name: "Shota Storm" },
    { n: "29", name: "Yuto Claw" },
    { n: "30", name: "Hiroki Fang" },
  ]

  console.log(`📦 Dracobell Supertazos Voladores #11-30...`)
  for (const t of dracobellSupertazosVoladores) {
    const slug = `dracobell-sv-${t.n}`
    await db.tazo.create({
      data: {
        name: t.name, displayName: t.name, slug,
        franchiseId: dracobell.id, collectionId: dracobellTazos.id,
        number: t.n, category: "supertazos_voladores",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "plastic", rarity: "uncommon",
        imageUrl: `/tazos/dracobell/${slug}.svg`,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 20 supertazos voladores\n`)

  // ============================================================
  // DRACO BELL — SUPERTAZOS OCTOGONALES #31-50
  // ============================================================
  const dracobellSupertazosOctogonales = [
    { n: "31", name: "Naoki Blade" },
    { n: "32", name: "Takuya Vortex" },
    { n: "33", name: "Ryuji Phoenix" },
    { n: "34", name: "Kazuki Serpent" },
    { n: "35", name: "Daichi Wolf" },
    { n: "36", name: "Sho Crane" },
    { n: "37", name: "Jun Tiger" },
    { n: "38", name: "Kota Bear" },
    { n: "39", name: "Tsubasa Hawk" },
    { n: "40", name: "Raiden Storm" },
    { n: "41", name: "Hayato Blaze" },
    { n: "42", name: "Yamato Tide" },
    { n: "43", name: "Seiji Frost" },
    { n: "44", name: "Masaru Iron" },
    { n: "45", name: "Noboru Gale" },
    { n: "46", name: "Osamu Thunder" },
    { n: "47", name: "Takumi Ash" },
    { n: "48", name: "Itsuki Wave" },
    { n: "49", name: "Hideki Ember" },
    { n: "50", name: "Fumio Steel" },
  ]

  console.log(`📦 Dracobell Supertazos Octogonales #31-50...`)
  for (const t of dracobellSupertazosOctogonales) {
    const slug = `dracobell-so-${t.n}`
    await db.tazo.create({
      data: {
        name: t.name, displayName: t.name, slug,
        franchiseId: dracobell.id, collectionId: dracobellTazos.id,
        number: t.n, category: "supertazos_octogonales",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "plastic", rarity: "uncommon",
        imageUrl: `/tazos/dracobell/${slug}.svg`,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 20 supertazos octogonales\n`)

  // ============================================================
  // DRACO BELL — MEGATAZOS #51-70 (REDONDO + OCTOGONAL)
  // ============================================================
  const dracobellMegatazosNames = [
    { n: "51", name: "Rin Shadow" },
    { n: "52", name: "Haruki Dawn" },
    { n: "53", name: "Akio Fang" },
    { n: "54", name: "Saburo Shield" },
    { n: "55", name: "Shiro Fist" },
    { n: "56", name: "Jin Claw" },
    { n: "57", name: "Kane Blade" },
    { n: "58", name: "Tetsuya Storm" },
    { n: "59", name: "Masaki Vortex" },
    { n: "60", name: "Koichi Phoenix" },
    { n: "61", name: "Genji Wolf" },
    { n: "62", name: "Daizen Tiger" },
    { n: "63", name: "Raiga Bear" },
    { n: "64", name: "Shingen Hawk" },
    { n: "65", name: "Nobunaga Crane" },
    { n: "66", name: "Kageyama Shadow" },
    { n: "67", name: "Matsuo Steel" },
    { n: "68", name: "Ishikawa Stone" },
    { n: "69", name: "Tanaka Iron" },
    { n: "70", name: "Yamamoto Tide" },
  ]

  console.log(`📦 Dracobell Megatazos #51-70 (redondos + octogonales)...`)
  for (const t of dracobellMegatazosNames) {
    // Redondo
    await db.tazo.create({
      data: {
        name: t.name, displayName: `${t.name} (Redondo)`, slug: `dracobell-mr-${t.n}`,
        franchiseId: dracobell.id, collectionId: dracobellTazos.id,
        number: t.n, variant: "megatazo_redondo", category: "megatazos",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "partial",
        physicalType: "plastic", rarity: "rare",
        imageUrl: `/tazos/dracobell/dbz-mr-${t.n}.svg`,
        ...genStats(),
      },
    })
    // Octogonal
    await db.tazo.create({
      data: {
        name: t.name, displayName: `${t.name} (Octogonal)`, slug: `dracobell-mo-${t.n}`,
        franchiseId: dracobell.id, collectionId: dracobellTazos.id,
        number: t.n, variant: "megatazo_octogonal", category: "megatazos",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "partial",
        physicalType: "plastic", rarity: "rare",
        imageUrl: `/tazos/dracobell/dbz-mo-${t.n}.svg`,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 40 megatazos (20 redondos + 20 octogonales)\n`)

  // ============================================================
  // DRACO BELL — HOLO 3D #1-10 (RANURA DERECHA + IZQUIERDA)
  // ============================================================
  const dracobellHolo3DNames = [
    { n: "1", name: "Watanabe Wave" },
    { n: "2", name: "Suzuki Flame" },
    { n: "3", name: "Sato Thunder" },
    { n: "4", name: "Takahashi Blaze" },
    { n: "5", name: "Kobayashi Gale" },
    { n: "6", name: "Nakamura Frost" },
    { n: "7", name: "Ito Storm" },
    { n: "8", name: "Sasaki Ash" },
    { n: "9", name: "Kato Ember" },
    { n: "10", name: "Yoshida Spark" },
  ]

  console.log(`📦 Dracobell Holo 3D #1-10 (ranura derecha + izquierda)...`)
  for (const t of dracobellHolo3DNames) {
    await db.tazo.create({
      data: {
        name: t.name, displayName: `${t.name} (Ranura Der.)`, slug: `dracobell-hr-${t.n}`,
        franchiseId: dracobell.id, collectionId: dracobellTazos.id,
        number: t.n, variant: "ranura_derecha", category: "holo_3d",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "holo", rarity: "ultra",
        imageUrl: `/tazos/dracobell/dbz-hr-${t.n}.svg`,
        ...genStats(),
      },
    })
    await db.tazo.create({
      data: {
        name: t.name, displayName: `${t.name} (Ranura Izq.)`, slug: `dracobell-hl-${t.n}`,
        franchiseId: dracobell.id, collectionId: dracobellTazos.id,
        number: t.n, variant: "ranura_izquierda", category: "holo_3d",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "holo", rarity: "ultra",
        imageUrl: `/tazos/dracobell/dbz-hl-${t.n}.svg`,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 20 Holo 3D (10 ranura derecha + 10 izquierda)\n`)

  // ============================================================
  // DRACO BELL — MASTERTAZOS
  // ============================================================
  const dracobellMastertazos = [
    { id: "MASTER-A18",             name: "Mecha Sentinel",           variant: null },
    { id: "MASTER-A18-GOLD",        name: "Mecha Sentinel Gold",    variant: "gold" },
    { id: "MASTER-A18-BLACK",       name: "Mecha Sentinel Dark",   variant: "black_border" },
    { id: "MASTER-FREEZER",         name: "Frost Tyrant",        variant: null },
    { id: "MASTER-GOKU",            name: "Zen Striker",           variant: null },
    { id: "MASTER-SHENRON",         name: "Dragon Ascendant",        variant: null },
    { id: "MASTER-SHENRON-BLACK",   name: "Dragon Ascendant Dark",variant: "black_border" },
    { id: "MASTER-VEGETA",          name: "Prince Rival",         variant: null },
  ]

  console.log(`📦 Dracobell Mastertazos...`)
  for (const t of dracobellMastertazos) {
    const slug = `dracobell-master-${t.id.toLowerCase().replace(/-/g, "-")}`
    await db.tazo.create({
      data: {
        name: t.name, displayName: t.name, slug,
        franchiseId: dracobell.id, collectionId: dracobellTazos.id,
        number: t.id, variant: t.variant, category: "mastertazos",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "metal", rarity: "legendary",
        imageUrl: `/tazos/dracobell/${slug}.svg`,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 8 mastertazos\n`)

  // ============================================================
  // CYBERMON — MAGIC BOX 2000 #1-150 (PENDING VISUAL CHECK)
  // ============================================================
  console.log(`📦 Cybermon Magic Box 2000 #1-150...`)

  const CYBERMON_NAMES = [    "Voltcrab-X", "Datadrake", "Bytefang", "Kryptoworm", "Hexashell", "Synthclaw",
    "Bitdrone", "Glitchfang", "Circuitusk", "Voidraptor", "Nulldrake", "Pixelwyrm",
    "Datablight", "Necrobyte", "Shardbeast", "Phantocode", "Cryptospine", "Nullfang",
    "Rasterclaw", "Vexdrake", "Malwarex", "Codeghast", "Bitwraith", "Hexafang",
    "Synthshard", "Glitchraptor", "Voidcrawl", "Datarex", "Pyxelisk", "Circuitile",
    "Phagehound", "Neuraptor", "Cipherclaw", "Skemdrake", "Vexbyte", "Noxtusk",
    "Rastermaw", "Cryptohorn", "Nullwurm", "Shardraptor", "Bitbane", "Glitchvex",
    "Codeclaw", "Hexadrone", "Phantobeast", "Voidfang", "Dataspine", "Synthraptor",
    "Malweaver", "Necrodrake", "Pixelshard", "Glitchmaw", "Rasterbeast", "Cryptowing",
    "Voidtusk", "Neuroclaw", "Hexadrake", "Bithorn", "Cipherbeast", "Shardwing",
    "Nullraptor", "Datanox", "Vexmaw", "Synthfang", "Pyxclaw", "Glitchspine",
    "Codebeast", "Noxtail", "Bitraptor", "Hexatusk", "Voidclaw", "Rasterdrake",
    "Phantorn", "Cryptohtooth", "Datavore", "Nullbeast", "Circuitmaw", "Shardraptor",
    "Glitchdrone", "Hexafang", "Voidspine", "Synthdraken", "Bytedrake", "Vextalon",
    "Rastertusk", "Nullwing", "Cryptobeast", "Neurox", "Shardclaw", "Phantobeast",
    "Datamaw", "Hexadrone", "Glitchvex", "Codewurm", "Voidfang", "Bitbeast",
    "Synthcore", "Rasterfang", "Cipherdrake", "Nullmaw", "Cryptowing", "Shardhorn",
    "Glitchcore", "Noxclaw", "Hexavex", "Voiddrake", "Neurobeast", "Bitspine",
    "Dataraptor", "Circuitfang", "Phantodrake", "Rasterclaw", "Shardvex", "Vextusk",
    "Glitchwing", "Cryptodrone", "Nullraptor", "Synthmaw", "Codebeast", "Hexaspine",
    "Bitclaw", "Voidcore", "Rastervex", "Dataraptor-X", "Glitchmancer", "Nullbyte",
    "Cryptodusker", "Shardwing-X", "Voidmaw-X", "Hexadrakon", "Bitable", "Synthvex",
    "Codewarden", "Rasterlord", "Glitchking", "Datavisor", "Nullshard", "Cryptovere",
    "Shardemperor", "Voidreaver", "Hexatitan", "Bitsovereign", "Noxqueen", "Circuitlord",
    "Phantomagus", "Dataking", "Rasterlord-X", "Synthmaster", "Glitchoverlord", "Voidsovereign",
]

  for (let i = 0; i < 150; i++) {
    const n = String(i + 1)
    const name = CYBERMON_NAMES[i]
    const slug = `cybermon-mb-${n}`
    await db.tazo.create({
      data: {
        name, displayName: name, slug,
        franchiseId: cybermon.id, collectionId: cybermonMagicBox.id,
        number: n, category: "caps",
        manufacturer: "Magic Box", country: "España / Europa",
        sourceStatus: "verified",
        physicalType: "plastic", rarity: "common",
        imageUrl: `/tazos/cybermon/${slug}.svg`,
        isOwned: false,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 150 Cybermon caps (verified names)\n`)

  // ============================================================
  // SUMMARY
  // ============================================================
  const tazoCount = await db.tazo.count()
  const verifiedCount = await db.tazo.count({ where: { sourceStatus: "verified" } })
  const partialCount = await db.tazo.count({ where: { sourceStatus: "partial" } })
  const pendingCount = await db.tazo.count({ where: { sourceStatus: "pending_visual_check" } })

  console.log("═══ SEED COMPLETE ═══")
  console.log(`   Franchises:  3`)
  console.log(`   Collections: 3`)
  console.log(`   Total Tazos: ${tazoCount}`)
  console.log(`     Verified:            ${verifiedCount}`)
  console.log(`     Partial:             ${partialCount}`)
  console.log(`     Pending Visual Check: ${pendingCount}`)
  console.log()
  console.log(`   Pokémon Tazos 1:        51 (verified)`  )
  console.log(`   DBZ Tazos Normales:      10 (verified)`  )
  console.log(`   Dracobell Supertazos Volador:  20 (verified)`  )
  console.log(`   Dracobell Supertazos Octog:    20 (verified)`  )
  console.log(`   Dracobell Megatazos:           40 (partial — 20R + 20O)`)
  console.log(`   Dracobell Holo 3D:             20 (verified — 10D + 10I)`)
  console.log(`   Dracobell Mastertazos:          8 (verified)`  )
  console.log(`   Cybermon Magic Box:      150 (verified)`   )
  console.log(`                          ———`)
  console.log(`   TOTAL:                  319 tazos`)
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
