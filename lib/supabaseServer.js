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
  // F-011 — previously fell back to anon-key silently when SERVICE_ROLE_KEY
  // was unset, which produced an inconsistent "some writes succeed, some
  // fail under RLS" state under env misconfiguration. Hard-throw so the
  // outage is detected at first-use.
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side operations');
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

/**
 * Set Postgres session variable for RLS tenant context.
 * current_customer_id() reads app.current_tenant first, falls back to customer_users lookup.
 */
async function setTenantContext(supabase, customerId) {
  if (!customerId) return;
  try {
    await supabase.rpc("set_tenant_context", { tenant_id: customerId });
  } catch (e) {
    // Non-fatal — RLS falls back to customer_users lookup
    console.error("[setTenantContext] failed:", e?.message);
  }
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

  // Check cache — but invalidate if active tenant cookie changed
  const activeTenantCookie = parseInt(req.cookies?.["__active_tenant"], 10) || null;
  const cached = _authCache.get(user.id);
  if (cached && Date.now() - cached.ts < AUTH_CACHE_TTL) {
    // If user switched tenants via cookie, use the new one (if valid)
    let effectiveId = cached.customerId;
    if (activeTenantCookie && cached.allCustomerIds?.includes(activeTenantCookie)) {
      effectiveId = activeTenantCookie;
    }
    await setTenantContext(supabase, effectiveId);
    const m = (cached.memberships || []).find(x => x.customer_id === effectiveId);
    return {
      supabase, user,
      customerId: effectiveId,
      allCustomerIds: cached.allCustomerIds || [effectiveId],
      memberships: cached.memberships || [],
      role: m?.role || 'owner',
      divisionId: m?.division_id || null,
      error: null,
    };
  }

  // Fetch ALL tenant mappings for this user (multi-tenant switcher support)
  const { data: cuRows, error: cuErr } = await supabase
    .from("customer_users")
    .select("customer_id, role, division_id")
    .eq("user_id", user.id);

  if (cuErr || !cuRows || cuRows.length === 0) {
    return { supabase, user, customerId: null, allCustomerIds: [], memberships: [], role: null, divisionId: null, error: cuErr || null };
  }

  const memberships = cuRows.map(r => ({
    customer_id: r.customer_id,
    role: r.role || 'owner',
    division_id: r.division_id || null,
  }));
  const allCustomerIds = memberships.map(m => m.customer_id);

  // If user has multiple tenants, check for __active_tenant cookie
  let customerId = allCustomerIds[0];
  if (allCustomerIds.length > 1) {
    const activeTenant = parseInt(req.cookies?.["__active_tenant"], 10);
    if (activeTenant && allCustomerIds.includes(activeTenant)) {
      customerId = activeTenant;
    }
  }

  // Set Postgres session var so RLS current_customer_id() respects the switch
  await setTenantContext(supabase, customerId);

  // Cache the result
  _authCache.set(user.id, { customerId, allCustomerIds, memberships, ts: Date.now() });

  // Evict stale entries periodically (keep cache small)
  if (_authCache.size > 100) {
    const cutoff = Date.now() - AUTH_CACHE_TTL;
    for (const [k, v] of _authCache) {
      if (v.ts < cutoff) _authCache.delete(k);
    }
  }

  const m = memberships.find(x => x.customer_id === customerId);
  return {
    supabase, user,
    customerId,
    allCustomerIds,
    memberships,
    role: m?.role || 'owner',
    divisionId: m?.division_id || null,
    error: null,
  };
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
