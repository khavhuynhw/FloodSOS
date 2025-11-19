// Simple in-memory rate limiter
// For production, use Redis-based rate limiting

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ipLimits = new Map<string, RateLimitEntry>();
const phoneLimits = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  timeWindowMs: number,
  store: Map<string, RateLimitEntry>
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetAt) {
    // Create new entry or reset expired one
    const resetAt = now + timeWindowMs;
    store.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

export function checkIPRateLimit(ip: string, maxRequests: number, timeWindowMs: number) {
  return checkRateLimit(ip, maxRequests, timeWindowMs, ipLimits);
}

export function checkPhoneRateLimit(phone: string, maxRequests: number, timeWindowMs: number) {
  return checkRateLimit(phone, maxRequests, timeWindowMs, phoneLimits);
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of ipLimits.entries()) {
    if (now > entry.resetAt) {
      ipLimits.delete(key);
    }
  }
  for (const [key, entry] of phoneLimits.entries()) {
    if (now > entry.resetAt) {
      phoneLimits.delete(key);
    }
  }
}, 60000); // Cleanup every minute

