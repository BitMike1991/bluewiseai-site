// lib/supabaseClient.js
import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client.
 * Uses cookie-based auth compatible with middleware's createServerClient.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
