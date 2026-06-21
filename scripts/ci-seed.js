// CI seed — seeds DB for smoke tests
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CI database...");

  // 1. Franchises
  const franchises = [
    { name: "Minimon", slug: "minimon", color: "#22c55e" },
    { name: "Cybermon", slug: "cybermon", color: "#3b82f6" },
    { name: "Dracobell", slug: "dracobell", color: "#f97316" },
  ];
  for (const f of franchises) {
    await prisma.franchise.upsert({
      where: { slug: f.slug },
      update: {},
      create: f,
    });
  }
  console.log(`  ✅ ${franchises.length} franchises`);

  // 2. Collections (needed for tazo creation)
  const minimon = await prisma.franchise.findUnique({ where: { slug: "minimon" } });
  const cybermon = await prisma.franchise.findUnique({ where: { slug: "cybermon" } });
  const collection = await prisma.collection.upsert({
    where: { slug: "minimon-series-1" },
    update: {},
    create: {
      name: "Minimon Series 1",
      slug: "minimon-series-1",
      franchiseId: minimon.id,
      year: 2024,
      totalTazos: 50,
    },
  });
  console.log(`  ✅ Collection: ${collection.slug}`);

  const cybermonCollection = await prisma.collection.upsert({
    where: { slug: "cybermon-series-1" },
    update: {},
    create: {
      name: "Cybermon Series 1",
      slug: "cybermon-series-1",
      franchiseId: cybermon.id,
      year: 2026,
      totalTazos: 50,
    },
  });
  console.log(`  ✅ Collection: ${cybermonCollection.slug}`);

  // 3. Demo user
  const demo = await prisma.user.upsert({
    where: { email: "demo@tradingtazosgame.com" },
    update: {},
    create: {
      id: "demo_user_001",
      email: "demo@tradingtazosgame.com",
      name: "DemoTrainer",
      displayName: "DemoTrainer",
      passwordHash: "$2a$10$placeholderplaceholderplacehol",
      credits: 1000,
      emailVerified: true,
    },
  });
  console.log(`  ✅ Demo user`);

  // 4. Test tazos
  const existing = await prisma.tazo.count();
  if (existing === 0) {
    const names = ["Pikachu", "Charizard", "Bulbasaur", "Squirtle", "Eevee"];
    for (const name of names) {
      await prisma.tazo.create({
        data: {
          name,
          slug: name.toLowerCase(),
          franchiseId: minimon.id,
          collectionId: collection.id,
          rarity: "common",
          attack: 50 + Math.floor(Math.random() * 20),
          defense: 40 + Math.floor(Math.random() * 15),
          publishStatus: "published",
        },
      });
    }
    console.log(`  ✅ ${names.length} test tazos`);
  }

  await prisma.tazo.upsert({
    where: { id: "ci_tazo_cipherion" },
    update: {},
    create: {
      id: "ci_tazo_cipherion",
      name: "Cipherion",
      displayName: "Cipherion",
      slug: "cipherion",
      franchiseId: cybermon.id,
      collectionId: cybermonCollection.id,
      number: "003",
      rarity: "rare",
      imageUrl: "/tazos-generated/cybermon/cipherion.png",
      combatType: "technical",
      finish: "holo",
      publishStatus: "published",
      sourceStatus: "verified",
      attack: 75,
      defense: 48,
      resistance: 52,
      weight: 55,
      stability: 50,
      spin: 60,
      control: 40,
      bounce: 35,
      precision: 45,
    },
  });
  console.log("  ✅ SEO test tazo: cipherion");

  // 5. Link tazos to demo user
  const tazos = await prisma.tazo.findMany({ take: 3 });
  for (const t of tazos) {
    const utId = "ci_ut_" + t.id;
    await prisma.userTazo.upsert({
      where: { id: utId },
      update: {},
      create: {
        id: utId,
        userId: demo.id,
        tazoId: t.id,
        quantity: 1,
      },
    });
  }
  console.log(`  ✅ ${tazos.length} user tazos`);

  console.log("✅ CI seed complete");
}

main()
  .catch((e) => {
    console.error("Seed error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
