// pages/api/auth/set-session.js
import { createServerClient } from "@supabase/ssr";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { access_token, refresh_token } = req.body || {};
  if (!access_token || !refresh_token) {
    return res.status(400).json({ error: "Missing tokens" });
  }

  // Bridge: take client tokens -> set HttpOnly cookies via SSR client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies[name];
        },
        set(name, value, options) {
          res.setHeader("Set-Cookie", [
            ...(res.getHeader("Set-Cookie") || []),
            serializeCookie(name, value, options),
          ]);
        },
        remove(name, options) {
          res.setHeader("Set-Cookie", [
            ...(res.getHeader("Set-Cookie") || []),
            serializeCookie(name, "", { ...options, maxAge: 0 }),
          ]);
        },
      },
    }
  );

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  return res.status(200).json({ ok: true, userId: data?.user?.id || null });
}

// Minimal cookie serializer (no extra dependency)
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
