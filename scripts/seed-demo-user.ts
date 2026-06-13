// ============================================================
// Demo User Seed — Creates demo@tradingtazosgame.com for
// screenshots, e2e testing, and public demos.
//
// Usage: npx tsx scripts/seed-demo-user.ts
// ============================================================

import { db } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

const DEMO_EMAIL = "demo@tradingtazosgame.com"
const DEMO_PASSWORD = "demo1234"
const DEMO_NAME = "DemoTrainer"

async function main() {
  console.log("🎮 Seeding demo user...\n")

  // Check if demo user already exists
  const existing = await db.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (existing) {
    // Refresh: reset credits and clear old data
    console.log("♻️  Demo user exists — resetting collections & credits")
    await db.userTazo.deleteMany({ where: { userId: existing.id } })
    await db.deckTazo.deleteMany({ where: { deck: { userId: existing.id } } })
    await db.deck.deleteMany({ where: { userId: existing.id } })
    await db.creditTransaction.deleteMany({ where: { userId: existing.id } })
    await db.battleRecord.deleteMany({ where: { userId: existing.id } })
    await db.userQuest.deleteMany({ where: { userId: existing.id } })
    await db.userAchievement.deleteMany({ where: { userId: existing.id } })

    await db.user.update({
      where: { id: existing.id },
      data: {
        passwordHash: hashPassword(DEMO_PASSWORD),
        credits: 2500,
        name: DEMO_NAME,
      },
    })
    console.log("✅ Demo user reset\n")
    await seedCollections(existing.id)
  } else {
    const user = await db.user.create({
      data: {
        email: DEMO_EMAIL,
        passwordHash: hashPassword(DEMO_PASSWORD),
        name: DEMO_NAME,
        credits: 2500,
      },
    })
    console.log("✅ Demo user created\n")
    await seedCollections(user.id)
  }

  console.log("\n🎉 Demo account ready!")
  console.log(`   Email: ${DEMO_EMAIL}`)
  console.log(`   Password: ${DEMO_PASSWORD}`)
  console.log(`   Credits: 2500`)
}

async function seedCollections(userId: string) {
  // Get 30 published tazos — 10 from each franchise
  const tazoPool = await db.tazo.findMany({
    where: { publishStatus: "published" },
    take: 30,
    orderBy: { id: "asc" },
  })

  console.log(`📦 Assigning ${tazoPool.length} tazos to demo user...`)

  // Create UserTazo entries
  for (const tazo of tazoPool) {
    await db.userTazo.create({
      data: {
        userId,
        tazoId: tazo.id,
        quantity: 1,
        obtainedFrom: "starter",
      },
    })
  }
  console.log(`✅ ${tazoPool.length} tazos added to collection`)

  // Create a battle deck with the first 5 tazos
  const deckTazos = tazoPool.slice(0, 5)
  await db.deck.create({
    data: {
      userId,
      name: "Demo Deck",
      isActive: true,
      deckTazos: {
        create: deckTazos.map((t) => ({ tazoId: t.id })),
      },
    },
  })
  console.log(`✅ Battle deck created with 5 tazos`)

  // Add some credit transaction history
  await db.creditTransaction.create({
    data: { userId, amount: 2500, source: "admin", reference: "demo_seed" },
  })
  console.log(`✅ Credit history seeded`)

  // Add a battle record
  await db.battleRecord.create({
    data: {
      userId,
      playerTazos: JSON.stringify(deckTazos.slice(0, 3).map((t) => t.id)),
      opponentTazos: JSON.stringify(deckTazos.slice(3, 5).map((t) => t.id)),
      winner: "player",
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    },
  })
  console.log(`✅ Battle record seeded`)

  // Initialize quests
  const quests = await db.quest.findMany({ take: 17 })
  for (const quest of quests) {
    await db.userQuest.create({
      data: {
        userId,
        questId: quest.id,
        progress: Math.floor(Math.random() * quest.target * 0.5),
        completed: false,
      },
    })
  }
  console.log(`✅ ${quests.length} quests initialized`)

  // Initialize achievements
  const achievements = await db.achievement.findMany()
  for (const ach of achievements) {
    await db.userAchievement.create({
      data: {
        userId,
        achievementId: ach.id,
        progress: 0,
        unlocked: false,
      },
    })
  }
  if (achievements.length > 0) {
    console.log(`✅ ${achievements.length} achievements initialized`)
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
