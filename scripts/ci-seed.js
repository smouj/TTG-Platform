const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const franchise = await prisma.franchise.upsert({
    where: { slug: "cybermon" },
    update: {},
    create: {
      name: "Cybermon",
      slug: "cybermon",
      color: "#00A1E9",
      icon: "grid",
      description: "Living digital creatures from the Neon Grid.",
      mechanic: "Synchronize cores and evolve protocols.",
    },
  });

  const collection = await prisma.collection.upsert({
    where: { slug: "ci-smoke" },
    update: {},
    create: {
      name: "CI Smoke Collection",
      slug: "ci-smoke",
      franchiseId: franchise.id,
      year: 2026,
      totalTazos: 1,
      description: "Minimal data for CI smoke tests.",
    },
  });

  const tazo = await prisma.tazo.upsert({
    where: { id: "ci-cipherion" },
    update: {
      publishStatus: "published",
      sourceStatus: "verified",
      imageUrl: "/tazos/cybermon/cipherion.svg",
    },
    create: {
      id: "ci-cipherion",
      name: "Cipherion",
      displayName: "Cipherion",
      slug: "cipherion",
      franchiseId: franchise.id,
      collectionId: collection.id,
      number: "CI-001",
      sourceStatus: "verified",
      publishStatus: "published",
      rarity: "rare",
      condition: "good",
      imageUrl: "/tazos/cybermon/cipherion.svg",
      skill: "Cipher Pulse",
      skillDesc: "A stable protocol burst for smoke-test battles.",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "ci@tradingtazosgame.com" },
    update: {},
    create: {
      email: "ci@tradingtazosgame.com",
      name: "CI User",
      passwordHash: "$scrypt$ci",
      credits: 100,
    },
  });

  await prisma.userTazo.upsert({
    where: { userId_tazoId: { userId: user.id, tazoId: tazo.id } },
    update: {},
    create: {
      userId: user.id,
      tazoId: tazo.id,
      quantity: 1,
      obtainedFrom: "ci",
    },
  });

  console.log("CI seed ready");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
