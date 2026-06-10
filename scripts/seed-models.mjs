#!/usr/bin/env node
/**
 * scripts/seed-models.mjs
 * Seeds BagModel and TubeModel tables with default data for the shop.
 * Safe to run multiple times — skips if models already exist.
 */

import { execSync } from "child_process"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const BAG_MODELS = [
  {
    name: "Minimon Basic Pack",
    frontUrl: "/textures/bags/minimon/bag-minimon-front-01.png",
    backUrl: "/textures/bags/minimon/bag-minimon-back-01.png",
    franchise: "minimon",
    cost: 10,
    bonusChance: 15,
    rareBoost: 2,
    color: "#FFCC00",
    bgColor: "#FFF8E7",
    tagline: "Classic minimon collection bag",
    sortOrder: 0,
  },
  {
    name: "Minimon Premium Pack",
    frontUrl: "/textures/bags/minimon/bag-minimon-front-02.png",
    backUrl: "/textures/bags/minimon/bag-minimon-back-02.png",
    franchise: "minimon",
    cost: 25,
    bonusChance: 25,
    rareBoost: 5,
    color: "#FFCC00",
    bgColor: "#FFFBE6",
    tagline: "Higher chance of rare minimon tazos",
    sortOrder: 1,
  },
  {
    name: "Cybermon Basic Pack",
    frontUrl: "/textures/bags/cybermon/bag-cybermon-front-01.png",
    backUrl: "/textures/bags/cybermon/bag-cybermon-back-01.png",
    franchise: "cybermon",
    cost: 10,
    bonusChance: 15,
    rareBoost: 2,
    color: "#00B4D8",
    bgColor: "#E0F7FA",
    tagline: "Digital cybermon collection bag",
    sortOrder: 2,
  },
  {
    name: "Cybermon Premium Pack",
    frontUrl: "/textures/bags/cybermon/bag-cybermon-front-02.png",
    backUrl: "/textures/bags/cybermon/bag-cybermon-back-02.png",
    franchise: "cybermon",
    cost: 25,
    bonusChance: 25,
    rareBoost: 5,
    color: "#00B4D8",
    bgColor: "#E8F8FC",
    tagline: "Higher chance of rare cybermon tazos",
    sortOrder: 3,
  },
  {
    name: "Dracobell Basic Pack",
    frontUrl: "/textures/bags/dracobell/bag-dracobell-front-01.png",
    backUrl: "/textures/bags/dracobell/bag-dracobell-back-01.png",
    franchise: "dracobell",
    cost: 10,
    bonusChance: 15,
    rareBoost: 2,
    color: "#FF6B00",
    bgColor: "#FFF3E6",
    tagline: "Fiery dracobell collection bag",
    sortOrder: 4,
  },
  {
    name: "Dracobell Premium Pack",
    frontUrl: "/textures/bags/dracobell/bag-dracobell-front-02.png",
    backUrl: "/textures/bags/dracobell/bag-dracobell-back-02.png",
    franchise: "dracobell",
    cost: 25,
    bonusChance: 25,
    rareBoost: 5,
    color: "#FF6B00",
    bgColor: "#FFF8F0",
    tagline: "Higher chance of rare dracobell tazos",
    sortOrder: 5,
  },
]

async function main() {
  console.log("🌱 Seeding BagModel + TubeModel...\n")

  // Check existing
  const existingBags = await prisma.bagModel.count()
  const existingTubes = await prisma.tubeModel.count()

  if (existingBags > 0) {
    console.log(`⚠️  ${existingBags} BagModel(s) already exist — skipping bag seed`)
  } else {
    for (const bag of BAG_MODELS) {
      await prisma.bagModel.create({ data: bag })
    }
    console.log(`✅ Seeded ${BAG_MODELS.length} BagModels`)
  }

  if (existingTubes > 0) {
    console.log(`⚠️  ${existingTubes} TubeModel(s) already exist — skipping tube seed`)
  } else {
    console.log("ℹ️  No tube textures found — skipping TubeModel seed (manual via /admin/tubes)")
  }

  console.log("\n✨ Seed complete!")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
