// lib/supabaseClient.js
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

/**
 * Browser Supabase client (Pages Router)
 * - Uses cookies (not localStorage) so Middleware can read the session.
 * - This must match middleware.js which uses @supabase/ssr cookie storage.
 */
export const supabase = createPagesBrowserClient();
