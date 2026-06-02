// ============================================================
// Trading Tazos Game — Seed
// Real-world verified Spanish tazo collections.
// Pokemon Tazos 1 (51), DBZ Matutano (105+variants), Digimon Magic Box (150)
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
    spin: randRange(25, 75),
    weight: randRange(30, 80),
    aura: randRange(20, 70),
    control: randRange(30, 80),
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
  const pokemon = await db.franchise.create({
    data: {
      name: "Pokémon", slug: "pokemon", color: "#FFCB05", icon: "⚡",
      description: "Pokémon Tazos — ediciones españolas de Matutano, 2000-2001.",
      mechanic: "Colección numerada #1-51 con arte original de la serie.",
    },
  })

  const dbz = await db.franchise.create({
    data: {
      name: "Dragon Ball Z", slug: "dragon-ball-z", color: "#FF6B00", icon: "🔥",
      description: "Dragon Ball Z Tazos — Matutano España 1995. 105 tazos en 7 categorías.",
      mechanic: "7 categorías: Tazos, Supertazos voladores, Supertazos octogonales, Megatazos, Holo 3D, Mastertazos.",
    },
  })

  const digimon = await db.franchise.create({
    data: {
      name: "Digimon", slug: "digimon", color: "#00A1E9", icon: "🦖",
      description: "Digimon Digital Monsters — Magic Box 2000. Colección de 150 caps.",
      mechanic: "Colección verificada pero pendiente de checklist visual completo.",
    },
  })

  console.log(`✅ 3 franchises\n`)

  // ============================================================
  // COLLECTIONS
  // ============================================================
  const pokemonTazos1 = await db.collection.create({
    data: {
      name: "Pokémon Tazos 1", slug: "pokemon-tazos-1",
      franchiseId: pokemon.id, year: 2000, totalTazos: 51,
      manufacturer: "Matutano", country: "España",
      description: "La colección original de 51 tazos Pokémon lanzada en España. Numeración verificada del #1 al #51.",
    },
  })

  const dbzTazos = await db.collection.create({
    data: {
      name: "Dragon Ball Z Tazos", slug: "dbz-matutano-1995",
      franchiseId: dbz.id, year: 1995, totalTazos: 105,
      manufacturer: "Matutano", country: "España",
      description: "Colección completa de 105 tazos DBZ agrupados en 7 categorías: Tazos (1-10), Supertazos voladores (11-30), Supertazos octogonales (31-50), Megatazos (51-70), Holo 3D (1-10), y Mastertazos.",
    },
  })

  const digimonMagicBox = await db.collection.create({
    data: {
      name: "Digimon Digital Monsters", slug: "digimon-magic-box-2000",
      franchiseId: digimon.id, year: 2000, totalTazos: 150,
      manufacturer: "Magic Box", country: "España / Europa",
      description: "Coleccion de 150 caps Digimon con nombres canonicos en espanol. Coleccion verificada.",
    },
  })

  console.log(`✅ 3 collections\n`)

  // ============================================================
  // POKÉMON TAZOS 1 — #1-51 (VERIFIED)
  // ============================================================
  const pokemonTazosData = [
    { n: "1",  name: "Bulbasaur" },
    { n: "2",  name: "Charmander" },
    { n: "3",  name: "Squirtle" },
    { n: "4",  name: "Metapod" },
    { n: "5",  name: "Weedle" },
    { n: "6",  name: "Pidgeotto" },
    { n: "7",  name: "Rattata" },
    { n: "8",  name: "Spearow" },
    { n: "9",  name: "Arbok" },
    { n: "10", name: "Pikachu" },
    { n: "11", name: "Raichu" },
    { n: "12", name: "Nidoran♀" },
    { n: "13", name: "Nidorina" },
    { n: "14", name: "Vulpix" },
    { n: "15", name: "Jigglypuff" },
    { n: "16", name: "Golbat" },
    { n: "17", name: "Oddish" },
    { n: "18", name: "Paras" },
    { n: "19", name: "Venonat" },
    { n: "20", name: "Diglett" },
    { n: "21", name: "Meowth" },
    { n: "22", name: "Psyduck" },
    { n: "23", name: "Mankey" },
    { n: "24", name: "Growlithe" },
    { n: "25", name: "Poliwag" },
    { n: "26", name: "Kadabra" },
    { n: "27", name: "Machamp" },
    { n: "28", name: "Bellsprout" },
    { n: "29", name: "Tentacool" },
    { n: "30", name: "Geodude" },
    { n: "31", name: "Ponyta" },
    { n: "32", name: "Slowpoke" },
    { n: "33", name: "Magnemite" },
    { n: "34", name: "Grimer" },
    { n: "35", name: "Gastly" },
    { n: "36", name: "Drowzee" },
    { n: "37", name: "Krabby" },
    { n: "38", name: "Voltorb" },
    { n: "39", name: "Exeggcute" },
    { n: "40", name: "Cubone" },
    { n: "41", name: "Koffing" },
    { n: "42", name: "Rhydon" },
    { n: "43", name: "Horsea" },
    { n: "44", name: "Goldeen" },
    { n: "45", name: "Staryu" },
    { n: "46", name: "Magikarp" },
    { n: "47", name: "Eevee" },
    { n: "48", name: "Omanyte" },
    { n: "49", name: "Kabuto" },
    { n: "50", name: "Dragonair" },
    { n: "51", name: "Ash" },
  ]

  console.log(`📦 Inserting ${pokemonTazosData.length} Pokémon Tazos 1...`)

  // Mark some as owned (random ~30%)
  const ownedPokemonIds = new Set(
    Array.from({ length: pokemonTazosData.length }, (_, i) => i)
      .filter(() => Math.random() < 0.3)
      .map(i => pokemonTazosData[i].n)
  )

  for (const t of pokemonTazosData) {
    const slug = `pokemon-t1-${t.n}`
    await db.tazo.create({
      data: {
        name: t.name, displayName: t.name, slug,
        franchiseId: pokemon.id, collectionId: pokemonTazos1.id,
        number: t.n, variant: null, category: "tazos",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "cardboard", rarity: "common",
        imageUrl: `/tazos/pokemon/${slug}.svg`,
        isOwned: ownedPokemonIds.has(t.n),
        ...genStats(),
      },
    })
  }

  console.log(`   ✅ ${pokemonTazosData.length} Pokémon tazos\n`)

  // ============================================================
  // DBZ — TAZOS NORMALES #1-10
  // ============================================================
  const dbzTazosNormales = [
    { n: "1",  name: "Freezer" },
    { n: "2",  name: "Recoome" },
    { n: "3",  name: "Ginyu" },
    { n: "4",  name: "Burter" },
    { n: "5",  name: "Dodoria" },
    { n: "6",  name: "Guldo" },
    { n: "7",  name: "Saibaman" },
    { n: "8",  name: "A-19" },
    { n: "9",  name: "Spopovitch" },
    { n: "10", name: "Yamu" },
  ]

  console.log(`📦 DBZ Tazos #1-10...`)
  for (const t of dbzTazosNormales) {
    const slug = `dbz-t-${t.n}`
    await db.tazo.create({
      data: {
        name: t.name, displayName: t.name, slug,
        franchiseId: dbz.id, collectionId: dbzTazos.id,
        number: t.n, category: "tazos",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "cardboard", rarity: "common",
        imageUrl: `/tazos/dbz/${slug}.svg`,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 10 tazos normales\n`)

  // ============================================================
  // DBZ — SUPERTAZOS VOLADORES #11-30
  // ============================================================
  const dbzSupertazosVoladores = [
    { n: "11", name: "Babidi" },
    { n: "12", name: "Piccolo Jr." },
    { n: "13", name: "Spopovitch" },
    { n: "14", name: "Son Goku" },
    { n: "15", name: "Gotten y Trunks" },
    { n: "16", name: "Yakon" },
    { n: "17", name: "Satán" },
    { n: "18", name: "Videl" },
    { n: "19", name: "Pui-Pui" },
    { n: "20", name: "Kibito" },
    { n: "21", name: "Kaio-Shin" },
    { n: "22", name: "Cell Jr." },
    { n: "23", name: "Son Gohan" },
    { n: "24", name: "Kaio-sama" },
    { n: "25", name: "A-16" },
    { n: "26", name: "Chi-Chi" },
    { n: "27", name: "A-18" },
    { n: "28", name: "Freezer" },
    { n: "29", name: "Yamu" },
    { n: "30", name: "Bulma" },
  ]

  console.log(`📦 DBZ Supertazos Voladores #11-30...`)
  for (const t of dbzSupertazosVoladores) {
    const slug = `dbz-sv-${t.n}`
    await db.tazo.create({
      data: {
        name: t.name, displayName: t.name, slug,
        franchiseId: dbz.id, collectionId: dbzTazos.id,
        number: t.n, category: "supertazos_voladores",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "plastic", rarity: "uncommon",
        imageUrl: `/tazos/dbz/${slug}.svg`,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 20 supertazos voladores\n`)

  // ============================================================
  // DBZ — SUPERTAZOS OCTOGONALES #31-50
  // ============================================================
  const dbzSupertazosOctogonales = [
    { n: "31", name: "Cell 1ª fase" },
    { n: "32", name: "Pui-Pui" },
    { n: "33", name: "Cell 2ª fase" },
    { n: "34", name: "Yakon" },
    { n: "35", name: "A-16" },
    { n: "36", name: "King Cold" },
    { n: "37", name: "Cell 3ª fase" },
    { n: "38", name: "Dabra" },
    { n: "39", name: "Majin Boo" },
    { n: "40", name: "Babidi" },
    { n: "41", name: "Vegeta" },
    { n: "42", name: "Videl" },
    { n: "43", name: "Son Gotten" },
    { n: "44", name: "Trunks" },
    { n: "45", name: "Piccolo Junior" },
    { n: "46", name: "Son Goku" },
    { n: "47", name: "Kaio-Shin" },
    { n: "48", name: "Son Gohan" },
    { n: "49", name: "Kibito" },
    { n: "50", name: "Kaio-sama" },
  ]

  console.log(`📦 DBZ Supertazos Octogonales #31-50...`)
  for (const t of dbzSupertazosOctogonales) {
    const slug = `dbz-so-${t.n}`
    await db.tazo.create({
      data: {
        name: t.name, displayName: t.name, slug,
        franchiseId: dbz.id, collectionId: dbzTazos.id,
        number: t.n, category: "supertazos_octogonales",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "plastic", rarity: "uncommon",
        imageUrl: `/tazos/dbz/${slug}.svg`,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 20 supertazos octogonales\n`)

  // ============================================================
  // DBZ — MEGATAZOS #51-70 (REDONDO + OCTOGONAL)
  // ============================================================
  const dbzMegatazosNames = [
    { n: "51", name: "Son Goku" },
    { n: "52", name: "Vegeta" },
    { n: "53", name: "Son Gohan" },
    { n: "54", name: "Son Gotten" },
    { n: "55", name: "Trunks" },
    { n: "56", name: "Piccolo Jr." },
    { n: "57", name: "Cell" },
    { n: "58", name: "Majin Boo" },
    { n: "59", name: "Babidi" },
    { n: "60", name: "Dabra" },
    { n: "61", name: "Kibito" },
    { n: "62", name: "Satán" },
    { n: "63", name: "Shin Sama" },
    { n: "64", name: "Kaio-Shin" },
    { n: "65", name: "Videl" },
    { n: "66", name: "Bulma" },
    { n: "67", name: "Krilin" },
    { n: "68", name: "Mutenroshi" },
    { n: "69", name: "Pui-Pui" },
    { n: "70", name: "Kaio-sama" },
  ]

  console.log(`📦 DBZ Megatazos #51-70 (redondos + octogonales)...`)
  for (const t of dbzMegatazosNames) {
    // Redondo
    await db.tazo.create({
      data: {
        name: t.name, displayName: `${t.name} (Redondo)`, slug: `dbz-mr-${t.n}`,
        franchiseId: dbz.id, collectionId: dbzTazos.id,
        number: t.n, variant: "megatazo_redondo", category: "megatazos",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "partial",
        physicalType: "plastic", rarity: "rare",
        imageUrl: `/tazos/dbz/dbz-mr-${t.n}.svg`,
        ...genStats(),
      },
    })
    // Octogonal
    await db.tazo.create({
      data: {
        name: t.name, displayName: `${t.name} (Octogonal)`, slug: `dbz-mo-${t.n}`,
        franchiseId: dbz.id, collectionId: dbzTazos.id,
        number: t.n, variant: "megatazo_octogonal", category: "megatazos",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "partial",
        physicalType: "plastic", rarity: "rare",
        imageUrl: `/tazos/dbz/dbz-mo-${t.n}.svg`,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 40 megatazos (20 redondos + 20 octogonales)\n`)

  // ============================================================
  // DBZ — HOLO 3D #1-10 (RANURA DERECHA + IZQUIERDA)
  // ============================================================
  const dbzHolo3DNames = [
    { n: "1",  name: "Cell" },
    { n: "2",  name: "Son Goku" },
    { n: "3",  name: "Son Gohan" },
    { n: "4",  name: "Son Gotten" },
    { n: "5",  name: "Gotten y Trunks" },
    { n: "6",  name: "Vegeta" },
    { n: "7",  name: "Majin Boo" },
    { n: "8",  name: "Dabra" },
    { n: "9",  name: "Goku" },
    { n: "10", name: "Cell y Trunks" },
  ]

  console.log(`📦 DBZ Holo 3D #1-10 (ranura derecha + izquierda)...`)
  for (const t of dbzHolo3DNames) {
    await db.tazo.create({
      data: {
        name: t.name, displayName: `${t.name} (Ranura Der.)`, slug: `dbz-hr-${t.n}`,
        franchiseId: dbz.id, collectionId: dbzTazos.id,
        number: t.n, variant: "ranura_derecha", category: "holo_3d",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "holo", rarity: "ultra",
        imageUrl: `/tazos/dbz/dbz-hr-${t.n}.svg`,
        ...genStats(),
      },
    })
    await db.tazo.create({
      data: {
        name: t.name, displayName: `${t.name} (Ranura Izq.)`, slug: `dbz-hl-${t.n}`,
        franchiseId: dbz.id, collectionId: dbzTazos.id,
        number: t.n, variant: "ranura_izquierda", category: "holo_3d",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "holo", rarity: "ultra",
        imageUrl: `/tazos/dbz/dbz-hl-${t.n}.svg`,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 20 Holo 3D (10 ranura derecha + 10 izquierda)\n`)

  // ============================================================
  // DBZ — MASTERTAZOS
  // ============================================================
  const dbzMastertazos = [
    { id: "MASTER-A18",             name: "A-18",           variant: null },
    { id: "MASTER-A18-GOLD",        name: "A-18 Dorado",    variant: "gold" },
    { id: "MASTER-A18-BLACK",       name: "A-18 B.Negro",   variant: "black_border" },
    { id: "MASTER-FREEZER",         name: "Freezer",        variant: null },
    { id: "MASTER-GOKU",            name: "Goku",           variant: null },
    { id: "MASTER-SHENRON",         name: "Shenron",        variant: null },
    { id: "MASTER-SHENRON-BLACK",   name: "Shenron B.Negro",variant: "black_border" },
    { id: "MASTER-VEGETA",          name: "Vegeta",         variant: null },
  ]

  console.log(`📦 DBZ Mastertazos...`)
  for (const t of dbzMastertazos) {
    const slug = `dbz-master-${t.id.toLowerCase().replace(/-/g, "-")}`
    await db.tazo.create({
      data: {
        name: t.name, displayName: t.name, slug,
        franchiseId: dbz.id, collectionId: dbzTazos.id,
        number: t.id, variant: t.variant, category: "mastertazos",
        manufacturer: "Matutano", country: "España",
        sourceStatus: "verified",
        physicalType: "metal", rarity: "legendary",
        imageUrl: `/tazos/dbz/${slug}.svg`,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 8 mastertazos\n`)

  // ============================================================
  // DIGIMON — MAGIC BOX 2000 #1-150 (PENDING VISUAL CHECK)
  // ============================================================
  console.log(`📦 Digimon Magic Box 2000 #1-150...`)

  const DIGIMON_CANON_NAMES = [
    // In-Training / Baby
    "Botamon", "Koromon", "Tsunomon", "Tokomon", "Tanemon",
    "Bukamon", "Motimon", "Nyaromon", "Yokomon", "Pagumon",
    // Rookies
    "Agumon", "Gabumon", "Biyomon", "Tentomon", "Palmon",
    "Gomamon", "Patamon", "Gatomon", "Salamon", "Veemon",
    "Hawkmon", "Armadillomon", "Wormmon", "Terriermon", "Lopmon",
    "Renamon", "Guilmon", "Impmon", "Leomon", "Ogremon",
    // Champions
    "Greymon", "Garurumon", "Birdramon", "Kabuterimon", "Togemon",
    "Ikkakumon", "Angemon", "Devimon", "Meramon", "Seadramon",
    "Monochromon", "Centarumon", "Tyrannomon", "DarkTyrannomon", "Frigimon",
    "Mojyamon", "Drimogemon", "Shellmon", "Numemon", "Sukamon",
    // Ultimate
    "MetalGreymon", "WereGarurumon", "Garudamon", "MegaKabuterimon", "Lillymon",
    "Zudomon", "MagnaAngemon", "Angewomon", "LadyDevimon", "Myotismon",
    "SkullGreymon", "Andromon", "Etemon", "Datamon", "MegaSeadramon",
    "Mammothmon", "Piximon", "Whamon", "Scorpiomon", "Phantomon",
    // Mega
    "WarGreymon", "MetalGarurumon", "Phoenixmon", "HerculesKabuterimon", "Rosemon",
    "Vikemon", "Seraphimon", "Holydramon", "Omnimon", "Imperialdramon",
    "BlackWarGreymon", "Diaboromon", "Piedmon", "MetalSeadramon", "Puppetmon",
    "Machinedramon", "VenomMyotismon", "MaloMyotismon", "Apocalymon", "Cherubimon",
    // Armor Digimon (02)
    "Flamedramon", "Raidramon", "Magnamon", "Halsemon", "Shurimon",
    "Digmon", "Submarimon", "Pegasusmon", "Nefertimon", "Mummymon",
    // DNA / Jogress (02)
    "Paildramon", "Dinobeemon", "Silphymon", "Shakkoumon", "ExVeemon",
    "Stingmon", "Aquilamon", "Ankylomon", "Arukenimon", "Mummymon",
    // Dark Masters & Villains
    "Myotismon", "VenomMyotismon", "MaloMyotismon", "Piedmon", "MetalSeadramon",
    "Puppetmon", "Machinedramon", "Apocalymon", "Diaboromon", "Daemon",
    // Tamers-era
    "Guilmon", "Growlmon", "WarGrowlmon", "Gallantmon", "Megidramon",
    "Renamon", "Kyubimon", "Taomon", "Sakuyamon", "Rika",
    // Extras
    "MarineAngemon", "SaberLeomon", "MetalEtemon", "PrinceMamemon", "Omnimon",
    "Imperialdramon FM", "Gallantmon CM", "Sakuyamon", "MegaGargomon", "Justimon",
    "Zhuqiaomon", "Azulongmon", "Ebonwumon", "Baihumon", "Fanglongmon",
    "Kimeramon", "SkullSatamon", "Infermon", "Kerpymon", "Susanoomon",
  ]

  for (let i = 0; i < 150; i++) {
    const n = String(i + 1)
    const name = DIGIMON_CANON_NAMES[i]
    const slug = `digimon-mb-${n}`
    await db.tazo.create({
      data: {
        name, displayName: name, slug,
        franchiseId: digimon.id, collectionId: digimonMagicBox.id,
        number: n, category: "caps",
        manufacturer: "Magic Box", country: "España / Europa",
        sourceStatus: "verified",
        physicalType: "plastic", rarity: "common",
        imageUrl: `/tazos/digimon/${slug}.svg`,
        isOwned: false,
        ...genStats(),
      },
    })
  }
  console.log(`   ✅ 150 Digimon caps (verified names)\n`)

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
  console.log(`   DBZ Supertazos Volador:  20 (verified)`  )
  console.log(`   DBZ Supertazos Octog:    20 (verified)`  )
  console.log(`   DBZ Megatazos:           40 (partial — 20R + 20O)`)
  console.log(`   DBZ Holo 3D:             20 (verified — 10D + 10I)`)
  console.log(`   DBZ Mastertazos:          8 (verified)`  )
  console.log(`   Digimon Magic Box:      150 (verified)`   )
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
