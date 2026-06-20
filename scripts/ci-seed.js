// Minimal CI seed — seeds DB for smoke tests
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CI database...");

  for (const name of ["Minimon", "Cybermon", "Dracobell"]) {
    await prisma.series.upsert({
      where: { name },
      update: {},
      create: { name, slug: name.toLowerCase(), order: 1 },
    });
  }

  const user = await prisma.user.upsert({
    where: { email: "demo@tradingtazosgame.com" },
    update: {},
    create: {
      id: "demo_user_001",
      email: "demo@tradingtazosgame.com",
      name: "DemoTrainer",
      displayName: "DemoTrainer",
      passwordHash: "$2a$10$placeholderplaceholderplacehol",
      credits: 1000,
    },
  });

  const existing = await prisma.tazo.count();
  if (existing === 0) {
    const names = ["Pikachu", "Charizard", "Bulbasaur", "Squirtle", "Eevee"];
    for (const name of names) {
      await prisma.tazo.create({
        data: {
          name,
          slug: name.toLowerCase(),
          seriesName: "Minimon",
          rarity: "common",
          attack: 50 + Math.floor(Math.random() * 20),
          defense: 40 + Math.floor(Math.random() * 15),
          publishStatus: "published",
          tazoType: "minimon",
        },
      });
    }
  }

  const tazos = await prisma.tazo.findMany({ take: 3 });
  for (const t of tazos) {
    const utId = "ci_ut_" + t.id;
    await prisma.userTazo.upsert({
      where: { id: utId },
      update: {},
      create: {
        id: utId,
        userId: "demo_user_001",
        tazoId: t.id,
        condition: "good",
        quantity: 1,
      },
    });
  }

  console.log("✅ CI seed complete");
}

main()
  .catch((e) => {
    console.error("Seed error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
