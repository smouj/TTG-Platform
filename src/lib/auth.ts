// ============================================================
// Trading Tazos Game — Auth Library (JWT + OAuth)
// ============================================================
// Single source of truth for authentication.
// - JWT tokens in cookies (7d expiry)
// - Password hashing via bcryptjs
// - OAuth via GitHub / Google / Discord
// - Admin seed on startup
// ============================================================

import jwt from "jsonwebtoken"
import crypto from "crypto"
import { db } from "@/lib/db"

// ── Password config (use Node.js built-in crypto — never code-split, always reliable) ──
const SCRYPT_KEYLEN = 64
const SCRYPT_SALT_LEN = 32
const SCRYPT_COST = 16384 // N = 2^14 (~88ms, 16MB), secure + works everywhere
const SCRYPT_BLOCK = 8
const SCRYPT_PARALLEL = 1
const SCRYPT_PREFIX = "$scrypt$"

// ── Constants ──

const JWT_SECRET_ENV = process.env.JWT_SECRET
if (!JWT_SECRET_ENV) {
  throw new Error("FATAL: JWT_SECRET environment variable is required. Set it in .env")
}
const JWT_SECRET = JWT_SECRET_ENV
const TOKEN_EXPIRY = "7d"

// ── Types ──

export interface AuthUser {
  id: string
  email: string
  name: string
  displayName?: string | null
  avatarUrl?: string | null
  oauthProvider?: string | null
}

export type OAuthProvider = "github" | "google" | "discord"

export interface OAuthProfile {
  provider: OAuthProvider
  providerId: string
  email: string
  name: string
  displayName?: string
  avatarUrl?: string
}

// ── OAuth Config ──

const OAUTH_PROVIDERS: Record<
  OAuthProvider,
  { clientId: string; clientSecret: string; authorizeUrl: string; tokenUrl: string; userInfoUrl: string; scope: string }
> = {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    scope: "read:user user:email",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
    scope: "openid email profile",
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || "",
    clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    authorizeUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    userInfoUrl: "https://discord.com/api/users/@me",
    scope: "identify email",
  },
}

// ── JWT ──

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, displayName: user.displayName, avatarUrl: user.avatarUrl },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY },
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as AuthUser
  } catch {
    return null
  }
}

// ── Password ──

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SCRYPT_SALT_LEN)
  const digest = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK,
    p: SCRYPT_PARALLEL,
  })
  return `${SCRYPT_PREFIX}${salt.toString("base64url")}$${digest.toString("base64url")}`
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false // OAuth-only users have no password

  // New scrypt format
  if (hash.startsWith(SCRYPT_PREFIX)) {
    return verifyScrypt(password, hash)
  }

  // Legacy bcrypt format ($2b$, $2a$) — backward compatible
  if (hash.startsWith("$2b$") || hash.startsWith("$2a$")) {
    const bcrypt = await import("bcryptjs")
    return bcrypt.default.compare(password, hash)
  }

  return false
}

/** Auto-migrate: returns new hash if legacy bcrypt login succeeded */
export async function migratePasswordIfNeeded(password: string, hash: string): Promise<string | null> {
  if (hash.startsWith(SCRYPT_PREFIX)) return null // Already migrated
  if (hash.startsWith("$2b$") || hash.startsWith("$2a$")) {
    const bcrypt = await import("bcryptjs")
    const valid = await bcrypt.default.compare(password, hash)
    if (valid) return hashPassword(password) // Upgrade to scrypt
  }
  return null
}

function verifyScrypt(password: string, hash: string): boolean {
  const parts = hash.split("$")
  // Expected: ["", "scrypt", "<salt>", "<digest>"]
  if (parts.length !== 4) return false
  const salt = Buffer.from(parts[2], "base64url")
  const expectedDigest = Buffer.from(parts[3], "base64url")
  if (salt.length === 0 || expectedDigest.length === 0) return false
  try {
    const digest = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
      N: SCRYPT_COST,
      r: SCRYPT_BLOCK,
      p: SCRYPT_PARALLEL,
    })
    return crypto.timingSafeEqual(digest, expectedDigest)
  } catch {
    return false
  }
}

// ── Cookie Helpers ──

export function extractToken(request: Request): string | null {
  const auth = request.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7)
  const match = (request.headers.get("cookie") || "").match(/(?:^|;\s*)ttg_auth=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

export function authCookie(token: string, maxAge = 60 * 60 * 24 * 7) {
  return `ttg_auth=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`
}

export function clearAuthCookies(): string[] {
  return [
    "ttg_auth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
    "ttg_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
  ]
}

// ── Auth Middleware ──

export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  const token = extractToken(request)
  if (!token) return null
  const user = verifyToken(token)
  if (!user) return null
  // Verify user still exists in DB
  const exists = await db.user.findUnique({ where: { id: user.id } })
  return exists ? user : null
}

export async function requireAuth(request: Request): Promise<AuthUser> {
  const user = await getAuthUser(request)
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  return user
}

// ── OAuth: Build authorize URL ──

export function getOAuthAuthorizeUrl(provider: OAuthProvider, redirectUri: string): string | null {
  const cfg = OAUTH_PROVIDERS[provider]
  if (!cfg.clientId || !cfg.clientSecret) return null
  const state = jwt.sign({ provider, redirectUri }, JWT_SECRET, { expiresIn: "10m" })
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri,
    scope: cfg.scope,
    response_type: "code",
    state,
  })
  return `${cfg.authorizeUrl}?${params.toString()}`
}

// ── OAuth: Exchange code for profile ──

export async function exchangeOAuthCode(
  provider: OAuthProvider,
  code: string,
  state: string,
  redirectUri: string,
): Promise<{ profile: OAuthProfile; redirectTo: string } | { error: string }> {
  // Verify state
  try {
    const decoded = jwt.verify(state, JWT_SECRET) as { provider: string; redirectUri: string }
    if (decoded.provider !== provider) return { error: "Invalid state" }
  } catch {
    return { error: "Invalid or expired state" }
  }

  const cfg = OAUTH_PROVIDERS[provider]
  if (!cfg.clientId || !cfg.clientSecret) return { error: `${provider} OAuth not configured` }

  // Exchange code for access token
  let token: string
  try {
    const tokenRes = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })
    const tokenData = await tokenRes.json()
    if (tokenData.error) return { error: tokenData.error_description || tokenData.error }
    token = tokenData.access_token
  } catch {
    return { error: "Failed to exchange code for token" }
  }

  // Fetch user info
  let userData: any
  try {
    const userRes = await fetch(cfg.userInfoUrl, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
    userData = await userRes.json()
  } catch {
    return { error: "Failed to fetch user info" }
  }

  // Normalize profile
  let profile: OAuthProfile
  switch (provider) {
    case "github":
      // GitHub may not return email if private — need separate API call
      let email = userData.email
      if (!email) {
        try {
          const emailsRes = await fetch("https://api.github.com/user/emails", {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          })
          const emails = await emailsRes.json()
          email = emails.find((e: any) => e.primary)?.email || emails[0]?.email || `${userData.login}@github.users`
        } catch {
          email = `${userData.login}@github.users`
        }
      }
      profile = {
        provider: "github",
        providerId: String(userData.id),
        email,
        name: userData.name || userData.login,
        displayName: userData.login,
        avatarUrl: userData.avatar_url,
      }
      break
    case "google":
      profile = {
        provider: "google",
        providerId: userData.sub,
        email: userData.email,
        name: userData.name || userData.email.split("@")[0],
        displayName: userData.name,
        avatarUrl: userData.picture,
      }
      break
    case "discord":
      profile = {
        provider: "discord",
        providerId: userData.id,
        email: userData.email || `${userData.username}@discord.users`,
        name: userData.global_name || userData.username,
        displayName: userData.username,
        avatarUrl: userData.avatar
          ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
          : undefined,
      }
      break
    default:
      return { error: "Unknown provider" }
  }

  return { profile, redirectTo: (jwt.decode(state) as any)?.redirectUri || "/app" }
}

// ── OAuth: Find or create user ──

export async function findOrCreateOAuthUser(profile: OAuthProfile): Promise<AuthUser> {
  // Try by provider + providerId first
  let user = await db.user.findFirst({
    where: { oauthProvider: profile.provider, oauthProviderId: profile.providerId },
  })

  if (!user) {
    // Try by email
    user = await db.user.findUnique({ where: { email: profile.email } })

    if (user) {
      // Link existing account
      await db.user.update({
        where: { id: user.id },
        data: { oauthProvider: profile.provider, oauthProviderId: profile.providerId },
      })
    } else {
      // Create new user
      user = await db.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          oauthProvider: profile.provider,
          oauthProviderId: profile.providerId,
          passwordHash: "",
          emailVerified: true, // OAuth users are pre-verified
          credits: 500, // Welcome bonus
        },
      })
    }
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    oauthProvider: user.oauthProvider,
  }
}

// ── Available OAuth providers ──

export function getAvailableOAuthProviders(): OAuthProvider[] {
  return (Object.keys(OAUTH_PROVIDERS) as OAuthProvider[]).filter(
    (p) => !!(OAUTH_PROVIDERS[p].clientId && OAUTH_PROVIDERS[p].clientSecret),
  )
}

// ── Admin seed (runs once on first request) ──

let seeded = false

export async function seedAdminUser() {
  if (seeded) return
  seeded = true

  const adminEmail = process.env.ADMIN_EMAIL || "dev@tradingtazosgame.com"
  const adminPass = process.env.ADMIN_PASSWORD || "test123"
  const adminName = process.env.ADMIN_NAME || "Admin"

  const exists = await db.user.findUnique({ where: { email: adminEmail } })
  if (exists) return

  try {
    const hash = hashPassword(adminPass)
    await db.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        displayName: adminName,
        passwordHash: hash,
        credits: 99999,
        emailVerified: true,
      },
    })
    console.log(`✅ Admin user seeded: ${adminEmail}`)
  } catch (e: any) {
    console.warn(`⚠️  Admin seed skipped: ${e.message}`)
  }
}
