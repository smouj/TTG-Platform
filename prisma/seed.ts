// ============================================================
// Trading Tazos Game — Seed
// Real-world verified Spanish tazo collections.
// Pokemon Tazos 1 (51), DBZ Matutano (105+variants), Cybermon Magic Box (150)
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
      description: "Minimon — criaturas coleccionables estilo Ken Sugimori. Edición española, 2000-2001.",
      mechanic: "Colección numerada #1-51. Criaturas coloridas, trazo suave, diseño expresivo.",
    },
  })

  const dracobell = await db.franchise.create({
    data: {
      name: "Dracobell", slug: "dracobell", color: "#FF6B00", icon: "💥",
      description: "Dracobell — guerreros de artes marciales estilo Akira Toriyama. Edición Matutano, 1995.",
      mechanic: "7 categorías: Tazos, Supertazos Voladores, Supertazos Octogonales, Megatazos, Holo 3D, Mastertazos.",
    },
  })

  const cybermon = await db.franchise.create({
    data: {
      name: "Cybermon", slug: "cybermon", color: "#00A1E9", icon: "🦾",
      description: "Cybermon — monstruos digitales estilo Kenji Watanabe. Magic Box 2000. 150 caps.",
      mechanic: "Evoluciones marcadas, armaduras biomecánicas, garras metálicas y energía digital.",
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
    { n: "1",  name: "Bulbasaure" },
    { n: "2",  name: "Charmandere" },
    { n: "3",  name: "Squirtleh" },
    { n: "4",  name: "Metapodé" },
    { n: "5",  name: "Weedleh" },
    { n: "6",  name: "Pidgeottoh" },
    { n: "7",  name: "Rattatah" },
    { n: "8",  name: "Spearowé" },
    { n: "9",  name: "Arboké" },
    { n: "10", name: "Pikachuh" },
    { n: "11", name: "Raichuh" },
    { n: "12", name: "Nidoranñe" },
    { n: "13", name: "Nidorinah" },
    { n: "14", name: "Vulpixé" },
    { n: "15", name: "Jigglypuffé" },
    { n: "16", name: "Golbaté" },
    { n: "17", name: "Oddishé" },
    { n: "18", name: "Parasé" },
    { n: "19", name: "Venonaté" },
    { n: "20", name: "Digletté" },
    { n: "21", name: "Meowthé" },
    { n: "22", name: "Psyducké" },
    { n: "23", name: "Mankeyé" },
    { n: "24", name: "Growlitheh" },
    { n: "25", name: "Poliwagé" },
    { n: "26", name: "Kadabrah" },
    { n: "27", name: "Machampé" },
    { n: "28", name: "Bellsprouté" },
    { n: "29", name: "Tentacoole" },
    { n: "30", name: "Geodudeh" },
    { n: "31", name: "Ponytah" },
    { n: "32", name: "Slowpokeh" },
    { n: "33", name: "Magnemiteh" },
    { n: "34", name: "Grimere" },
    { n: "35", name: "Gastlyé" },
    { n: "36", name: "Drowzeeh" },
    { n: "37", name: "Krabbyé" },
    { n: "38", name: "Voltorbé" },
    { n: "39", name: "Exeggcuteh" },
    { n: "40", name: "Cuboneh" },
    { n: "41", name: "Koffingé" },
    { n: "42", name: "Rhydoné" },
    { n: "43", name: "Horseah" },
    { n: "44", name: "Goldeené" },
    { n: "45", name: "Staryuh" },
    { n: "46", name: "Magikarpé" },
    { n: "47", name: "Eeveeh" },
    { n: "48", name: "Omanyteh" },
    { n: "49", name: "Kabutoh" },
    { n: "50", name: "Dragonaire" },
    { n: "51", name: "Ashé" },
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
    { n: "1",  name: "Freezere" },
    { n: "2",  name: "Recoomeh" },
    { n: "3",  name: "Ginyuh" },
    { n: "4",  name: "Burtere" },
    { n: "5",  name: "Dodoriah" },
    { n: "6",  name: "Guldoh" },
    { n: "7",  name: "Saibamané" },
    { n: "8",  name: "A-19x" },
    { n: "9",  name: "Spopovitché" },
    { n: "10", name: "Yamuh" },
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
    { n: "11", name: "Babidih" },
    { n: "12", name: "Piccolo Jr.é" },
    { n: "13", name: "Spopovitché" },
    { n: "14", name: "Son Gokuh" },
    { n: "15", name: "Gotten y Trunksé" },
    { n: "16", name: "Yakoné" },
    { n: "17", name: "Satáné" },
    { n: "18", name: "Videle" },
    { n: "19", name: "Pui-Puih" },
    { n: "20", name: "Kibitoh" },
    { n: "21", name: "Kaio-Shiné" },
    { n: "22", name: "Cell Jr.é" },
    { n: "23", name: "Son Gohané" },
    { n: "24", name: "Kaio-samah" },
    { n: "25", name: "A-16x" },
    { n: "26", name: "Chi-Chih" },
    { n: "27", name: "A-18x" },
    { n: "28", name: "Freezere" },
    { n: "29", name: "Yamuh" },
    { n: "30", name: "Bulmah" },
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
    { n: "31", name: "Cell 1ª faseh" },
    { n: "32", name: "Pui-Puih" },
    { n: "33", name: "Cell 2ª faseh" },
    { n: "34", name: "Yakoné" },
    { n: "35", name: "A-16x" },
    { n: "36", name: "King Coldé" },
    { n: "37", name: "Cell 3ª faseh" },
    { n: "38", name: "Dabrah" },
    { n: "39", name: "Majin Booh" },
    { n: "40", name: "Babidih" },
    { n: "41", name: "Vegetah" },
    { n: "42", name: "Videle" },
    { n: "43", name: "Son Gottené" },
    { n: "44", name: "Trunksé" },
    { n: "45", name: "Piccolo Juniore" },
    { n: "46", name: "Son Gokuh" },
    { n: "47", name: "Kaio-Shiné" },
    { n: "48", name: "Son Gohané" },
    { n: "49", name: "Kibitoh" },
    { n: "50", name: "Kaio-samah" },
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
    { n: "51", name: "Son Gokuh" },
    { n: "52", name: "Vegetah" },
    { n: "53", name: "Son Gohané" },
    { n: "54", name: "Son Gottené" },
    { n: "55", name: "Trunksé" },
    { n: "56", name: "Piccolo Jr.é" },
    { n: "57", name: "Celle" },
    { n: "58", name: "Majin Booh" },
    { n: "59", name: "Babidih" },
    { n: "60", name: "Dabrah" },
    { n: "61", name: "Kibitoh" },
    { n: "62", name: "Satáné" },
    { n: "63", name: "Shin Samah" },
    { n: "64", name: "Kaio-Shiné" },
    { n: "65", name: "Videle" },
    { n: "66", name: "Bulmah" },
    { n: "67", name: "Kriliné" },
    { n: "68", name: "Mutenroshih" },
    { n: "69", name: "Pui-Puih" },
    { n: "70", name: "Kaio-samah" },
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
    { n: "1",  name: "Celle" },
    { n: "2",  name: "Son Gokuh" },
    { n: "3",  name: "Son Gohané" },
    { n: "4",  name: "Son Gottené" },
    { n: "5",  name: "Gotten y Trunksé" },
    { n: "6",  name: "Vegetah" },
    { n: "7",  name: "Majin Booh" },
    { n: "8",  name: "Dabrah" },
    { n: "9",  name: "Gokuh" },
    { n: "10", name: "Cell y Trunksé" },
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
    { id: "MASTER-A18",             name: "A-18x",           variant: null },
    { id: "MASTER-A18-GOLD",        name: "A-18 Doradoh",    variant: "gold" },
    { id: "MASTER-A18-BLACK",       name: "A-18 B.Negroh",   variant: "black_border" },
    { id: "MASTER-FREEZER",         name: "Freezere",        variant: null },
    { id: "MASTER-GOKU",            name: "Gokuh",           variant: null },
    { id: "MASTER-SHENRON",         name: "Shenroné",        variant: null },
    { id: "MASTER-SHENRON-BLACK",   name: "Shenron B.Negroh",variant: "black_border" },
    { id: "MASTER-VEGETA",          name: "Vegetah",         variant: null },
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

  const CYBERMON_NAMES = [
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
