// pages/api/auth/session.js
import { createServerClient } from "@supabase/ssr";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { access_token, refresh_token } = req.body || {};
    if (!access_token || !refresh_token) {
      return res.status(400).json({ error: "Missing tokens" });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return req.cookies[name];
          },
          set(name, value, options) {
            // Next.js Pages API route: use res.setHeader('Set-Cookie', ...)
            res.appendHeader(
              "Set-Cookie",
              serializeCookie(name, value, options)
            );
          },
          remove(name, options) {
            res.appendHeader(
              "Set-Cookie",
              serializeCookie(name, "", { ...options, maxAge: 0 })
            );
          },
        },
      }
    );

    // This will write the Supabase auth cookies through the cookie adapter above
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[api/auth/session] Error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Minimal cookie serializer (avoids adding a dependency).
 * Options match what Supabase SSR expects.
 */
function serializeCookie(name, value, options = {}) {
  const opt = {
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
    secure: true,
    ...options,
  };

  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (opt.maxAge != null) cookie += `; Max-Age=${opt.maxAge}`;
  if (opt.expires) cookie += `; Expires=${opt.expires.toUTCString()}`;
  if (opt.path) cookie += `; Path=${opt.path}`;
  if (opt.domain) cookie += `; Domain=${opt.domain}`;
  if (opt.sameSite) cookie += `; SameSite=${opt.sameSite}`;
  if (opt.secure) cookie += `; Secure`;
  if (opt.httpOnly) cookie += `; HttpOnly`;

  return cookie;
}
