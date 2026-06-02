import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

const JWT_SECRET = process.env.JWT_SECRET || "ttg-dev-secret-change-in-production"
const TOKEN_EXPIRY = "7d"

export interface AuthUser {
  id: string
  email: string
  name: string
  displayName?: string | null
  avatarUrl?: string | null
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/** Extract Bearer token from Authorization header */
export function extractToken(request: Request): string | null {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  return auth.slice(7)
}

/** Middleware: get authenticated user or null */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = extractToken(request)
  if (!token) return null
  return verifyToken(token)
}

/** Require authentication — returns user or throws 401 */
export async function requireAuth(request: Request): Promise<AuthUser> {
  const user = await getAuthUser(request)
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  // Verify user still exists in DB
  const exists = await db.user.findUnique({ where: { id: user.id } })
  if (!exists) {
    throw new Response(JSON.stringify({ error: "Account not found" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  return user
}
