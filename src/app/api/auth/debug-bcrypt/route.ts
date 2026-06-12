// Temporary debug route — only available in development
import { NextResponse } from "next/server"
import { hashPassword, verifyPassword } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const pwd = "test123"
  
  // Test 1: hash + verify
  const hash = hashPassword(pwd)
  const valid = await verifyPassword(pwd, hash)
  
  // Test 2: verify against DB user
  const user = await db.user.findUnique({ where: { email: "dev@tradingtazosgame.com" } })
  const dbValid = user ? await verifyPassword(pwd, user.passwordHash) : "user not found"
  
  // Test 3: recreate admin if broken
  if (user && !dbValid) {
    const newHash = hashPassword(pwd)
    await db.user.update({ where: { id: user.id }, data: { passwordHash: newHash } })
    const recheck = await verifyPassword(pwd, newHash)
    return NextResponse.json({
      status: "FIXED",
      oldHash: user.passwordHash.substring(0, 20),
      newHash: newHash.substring(0, 20),
      freshHashValid: valid,
      oldDbValid: dbValid,
      newDbValid: recheck,
    })
  }
  
  return NextResponse.json({
    status: "ok",
    freshHashValid: valid,
    dbValid,
    hashPrefix: hash.substring(0, 20),
  })
}
