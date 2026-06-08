// ============================================================
// Simple in-memory rate limiter for auth + write API endpoints
// Per-IP, resets periodically. Zero external dependencies.
// ============================================================

const WINDOW_MS = 60_000; // 1 minute windows

interface Bucket {
  count: number;
  resetAt: number;
}

const stores: Record<string, Record<string, Bucket>> = {
  // 5 req/min — login, register, forgot-password, reset-password
  auth: {},
  // 15 req/min — bags/buy, bags/open, battle, trade
  write: {},
  // 30 req/min — general API reads
  read: {},
};

const LIMITS: Record<string, number> = {
  auth: 5,
  write: 15,
  read: 30,
};

function getBucket(store: string, key: string): { count: number; remaining: number; resetAt: number } {
  const now = Date.now();
  const buckets = stores[store] || stores.read;
  const bucket = buckets[key];

  if (!bucket || now > bucket.resetAt) {
    buckets[key] = { count: 1, resetAt: now + WINDOW_MS };
    return { count: 1, remaining: (LIMITS[store] || 30) - 1, resetAt: now + WINDOW_MS };
  }

  bucket.count++;
  const remaining = Math.max(0, (LIMITS[store] || 30) - bucket.count);
  return { count: bucket.count, remaining, resetAt: bucket.resetAt };
}

function getClientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headers.get("x-real-ip")
    || "unknown";
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function checkRateLimit(
  headers: Headers,
  category: "auth" | "write" | "read" = "read"
): RateLimitResult {
  const ip = getClientIp(headers);
  const bucket = getBucket(category, ip);
  const limit = LIMITS[category] || 30;

  return {
    allowed: bucket.count <= limit,
    remaining: bucket.remaining,
    resetAt: bucket.resetAt,
    limit,
  };
}

/** Periodic cleanup of expired buckets (call in setInterval) */
export function cleanupRateLimitStores() {
  const now = Date.now();
  for (const store of Object.values(stores)) {
    for (const key of Object.keys(store)) {
      if (now > store[key].resetAt) {
        delete store[key];
      }
    }
  }
}

// Auto-cleanup every 5 minutes (server-side only)
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimitStores, 5 * 60_000);
}
