// Re-export the canonical db instance from @/lib/db as prisma.
// This ensures a single PrismaClient connection pool across the entire app,
// which is critical for $transaction consistency in SQLite.
export { db as prisma } from "@/lib/db"
