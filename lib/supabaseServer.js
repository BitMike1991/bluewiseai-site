// lib/supabaseServer.js
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Optional: still useful for admin-only tasks (migrations, cron jobs, etc.)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error(
    "Missing Supabase env vars. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

/**
 * Cookie-aware Supabase client for Next.js Pages Router API routes.
 * This is what you should use in /pages/api/* so auth cookies work.
 */
export function createSupabaseServerClient(req, res) {
  return createServerClient(supabaseUrl, anonKey, {
    cookies: {
      get(name) {
        return req.cookies[name];
      },
      set(name, value, options) {
        // Next.js API res.setHeader cookie helper via "set-cookie"
        // @supabase/ssr expects we actually set the cookie on the response.
        res.setHeader("Set-Cookie", serializeCookie(name, value, options));
      },
      remove(name, options) {
        res.setHeader("Set-Cookie", serializeCookie(name, "", { ...options, maxAge: 0 }));
      },
    },
  });
}

/**
 * Service role client (bypasses RLS). Keep for background/admin operations only.
 * Do NOT use this for normal authenticated multi-tenant routes if you want RLS safety.
 */
export function getSupabaseServerClient() {
  if (!serviceRoleKey) {
    // Fallback to anon (won’t bypass RLS). Fine for local/dev if you didn’t set service key.
    return createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
}

/**
 * Helper: resolve { user, customerId } from the session cookies.
 * Requires your `public.customer_users` table and RLS policy "select own mapping".
 */
export async function getAuthContext(req, res) {
  const supabase = createSupabaseServerClient(req, res);

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user || null;

  if (userErr || !user) {
    return { supabase, user: null, customerId: null, error: userErr || null };
  }

  const { data: cuRow, error: cuErr } = await supabase
    .from("customer_users")
    .select("customer_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (cuErr || !cuRow?.customer_id) {
    return { supabase, user, customerId: null, error: cuErr || null };
  }

  return { supabase, user, customerId: cuRow.customer_id, error: null };
}

/**
 * Minimal cookie serializer (no dependency). Supabase passes options like:
 * { path, sameSite, secure, httpOnly, maxAge, expires }
 */
function serializeCookie(name, value, options = {}) {
  const opt = {
    path: "/",
    sameSite: "Lax",
    ...options,
  };

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
