// lib/supabaseServer.js
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error(
    "Missing Supabase env vars. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

function appendSetCookie(res, cookieStr) {
  const prev = res.getHeader("Set-Cookie");
  if (!prev) {
    res.setHeader("Set-Cookie", cookieStr);
    return;
  }
  if (Array.isArray(prev)) {
    res.setHeader("Set-Cookie", [...prev, cookieStr]);
    return;
  }
  res.setHeader("Set-Cookie", [prev, cookieStr]);
}

/**
 * Cookie-aware Supabase client for Next.js Pages Router API routes.
 */
export function createSupabaseServerClient(req, res) {
  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      get(name) {
        // Next.js Pages API: req.cookies is an object
        return req.cookies?.[name];
      },
      set(name, value, options) {
        appendSetCookie(res, serializeCookie(name, value, options));
      },
      remove(name, options) {
        appendSetCookie(
          res,
          serializeCookie(name, "", { ...options, maxAge: 0 })
        );
      },
    },
  });
}

/**
 * Service role client (bypasses RLS). Admin/background only.
 */
export function getSupabaseServerClient() {
  if (!serviceRoleKey) {
    return createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

/**
 * In-memory cache for customer_id lookups (5 min TTL).
 * Prevents 2 DB roundtrips per API request for the same user.
 */
const _authCache = new Map();
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Helper: resolve { user, customerId } from session cookies.
 * Uses `customer_users` mapping with in-memory cache.
 */
export async function getAuthContext(req, res) {
  const supabase = createSupabaseServerClient(req, res);

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user || null;

  if (userErr || !user) {
    return { supabase, user: null, customerId: null, error: userErr || null };
  }

  // Check cache for customer_id
  const cached = _authCache.get(user.id);
  if (cached && Date.now() - cached.ts < AUTH_CACHE_TTL) {
    return { supabase, user, customerId: cached.customerId, error: null };
  }

  const { data: cuRow, error: cuErr } = await supabase
    .from("customer_users")
    .select("customer_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cuErr || !cuRow?.customer_id) {
    return { supabase, user, customerId: null, error: cuErr || null };
  }

  // Cache the result
  _authCache.set(user.id, { customerId: cuRow.customer_id, ts: Date.now() });

  // Evict stale entries periodically (keep cache small)
  if (_authCache.size > 100) {
    const cutoff = Date.now() - AUTH_CACHE_TTL;
    for (const [k, v] of _authCache) {
      if (v.ts < cutoff) _authCache.delete(k);
    }
  }

  return { supabase, user, customerId: cuRow.customer_id, error: null };
}

function serializeCookie(name, value, options = {}) {
  const opt = { path: "/", sameSite: "Lax", secure: true, httpOnly: true, ...options };

  let str = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  if (opt.maxAge != null) str += `; Max-Age=${opt.maxAge}`;
  if (opt.expires) str += `; Expires=${opt.expires.toUTCString()}`;
  if (opt.path) str += `; Path=${opt.path}`;
  if (opt.domain) str += `; Domain=${opt.domain}`;
  if (opt.sameSite) str += `; SameSite=${opt.sameSite}`;
  if (opt.secure) str += `; Secure`;
  if (opt.httpOnly) str += `; HttpOnly`;
  return str;
}
