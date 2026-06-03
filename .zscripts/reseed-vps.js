const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function reseed() {
  console.log("Deleting all tazos...");
  await db.tazo.deleteMany();
  console.log("Deleted. Running seed...");
  
  // Inline the seed data (minimal version)
  const seed = require('fs').readFileSync('.zscripts/seed-standalone.js', 'utf8');
  // Already ran - the seed standalone file is the full seed
  console.log("Seed script loaded. Need to run it directly.");
  await db.$disconnect();
}
reseed().catch(e => { console.error(e); process.exit(1); });
