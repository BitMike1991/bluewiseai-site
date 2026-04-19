// lib/security.js
// Shared security utilities: rate limiting + input sanitization
import crypto from "crypto";

/**
 * Timing-safe comparison for secrets (prevents timing attacks).
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} true if equal
 */
export function timingSafeEqual(a, b) {
  if (!a || !b) return false;
  // Use Node.js crypto for timing-safe comparison
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify CRON_SECRET header (timing-safe).
 * Returns true if the request should be BLOCKED.
 */
export function checkCronSecret(req, res) {
  const secret = req.headers["x-cron-secret"] || req.headers["authorization"]?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || !timingSafeEqual(secret, process.env.CRON_SECRET)) {
    res.status(403).json({ error: "Unauthorized" });
    return true;
  }
  return false;
}

/**
 * Validate input length. Returns true if blocked (too long).
 */
export function checkMaxLength(res, value, fieldName, maxLen) {
  if (value && typeof value === "string" && value.length > maxLen) {
    res.status(400).json({ error: `${fieldName} exceeds maximum length of ${maxLen} characters` });
    return true;
  }
  return false;
}

/**
 * Sanitize search terms for PostgREST .or() filter strings.
 * Strips characters that are PostgREST metacharacters to prevent filter injection.
 */
export function sanitizeSearchTerm(term) {
  if (!term || typeof term !== "string") return "";
  // Remove PostgREST metacharacters: ( ) , . * that could inject filter clauses
  // Keep alphanumeric, spaces, hyphens, @, +, and accented chars
  return term.replace(/[(),.*\\]/g, "").trim();
}

/**
 * Simple in-memory sliding window rate limiter.
 * For Vercel serverless: each instance has its own window, so this is
 * approximate (good enough for abuse prevention, not billing-precise).
 *
 * For production scale: replace with Vercel KV or Upstash Redis.
 */
const windows = new Map();

const CLEANUP_INTERVAL = 60000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entries] of windows) {
    const valid = entries.filter((ts) => now - ts < 60000);
    if (valid.length === 0) windows.delete(key);
    else windows.set(key, valid);
  }
}

/**
 * Check if a request should be rate limited.
 * @param {string} key - Unique key (e.g., userId, IP, customerId)
 * @param {number} maxPerMinute - Max requests per 60-second window
 * @returns {boolean} true if rate limited (should deny)
 */
export function isRateLimited(key, maxPerMinute = 30) {
  cleanup();
  const now = Date.now();
  const entries = windows.get(key) || [];
  const valid = entries.filter((ts) => now - ts < 60000);

  if (valid.length >= maxPerMinute) {
    return true;
  }

  valid.push(now);
  windows.set(key, valid);
  return false;
}

/**
 * Rate limit middleware helper for API routes.
 * Returns 429 if rate limited, null if OK.
 */
export function checkRateLimit(req, res, key, maxPerMinute = 30) {
  if (isRateLimited(key, maxPerMinute)) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return true;
  }
  return false;
}

/**
 * Serverless-safe rate limiter backed by Supabase (rate_limit_buckets table
 * + rate_limit_check RPC). Use this instead of isRateLimited() for any limit
 * that is load-bearing security — the in-memory Map above is per-Lambda-
 * instance, so an attacker varying UA/IP across cold starts bypasses it.
 *
 * @param {object} supabase - authenticated Supabase client
 * @param {string} key - unique bucket key (e.g. "sign:CONT-2026-001")
 * @param {number} max - max attempts in window
 * @param {number} windowMs - window size in ms
 * @returns {Promise<{allowed: boolean, current_count: number, reset_at: string}>}
 */
export async function checkRateLimitDb(supabase, key, max, windowMs) {
  try {
    const { data, error } = await supabase.rpc('rate_limit_check', {
      p_key: key,
      p_max: max,
      p_window_ms: windowMs,
    });
    if (error) {
      // Fail-open (log + allow). Prior behavior was in-memory best-effort
      // anyway, so degrading to "no limit" on RPC error is no worse.
      console.error('[checkRateLimitDb] RPC error — failing open', error.message);
      return { allowed: true, current_count: 0, reset_at: null };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return row || { allowed: true, current_count: 0, reset_at: null };
  } catch (e) {
    console.error('[checkRateLimitDb] exception — failing open', e.message);
    return { allowed: true, current_count: 0, reset_at: null };
  }
}
