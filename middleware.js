// middleware.js
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req) {
  // IMPORTANT: in Next middleware, you must return the SAME `res` object
  // that Supabase writes cookies into (otherwise session cookies won't persist).
  let res = NextResponse.next();

  const { pathname, search } = req.nextUrl;

  // Allow login page itself (and do not redirect-loop)
  if (pathname === "/platform/login") return res;

  // Protect platform + sensitive APIs
  const isProtected =
    pathname.startsWith("/platform") ||
    pathname.startsWith("/api/ask") ||
    pathname.startsWith("/api/send") ||
    pathname.startsWith("/api/inbox") ||
    pathname.startsWith("/api/leads") ||
    pathname.startsWith("/api/overview") ||
    pathname.startsWith("/api/tasks") ||
    pathname.startsWith("/api/followups") ||
    pathname.startsWith("/api/auth"); // allow our auth endpoints to function under protection rules

  if (!isProtected) return res;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail closed if env vars are missing in Vercel
  if (!supabaseUrl || !supabaseAnonKey) {
    const url = req.nextUrl.clone();
    url.pathname = "/platform/login";
    url.searchParams.set("next", `${pathname}${search || ""}`);
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return req.cookies.get(name)?.value;
      },
      set(name, value, options) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name, options) {
        res.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const { data, error } = await supabase.auth.getSession();
  const session = data?.session || null;

  // If anything goes wrong, fail closed (redirect to login)
  if (!session || error) {
    const url = req.nextUrl.clone();
    url.pathname = "/platform/login";
    // preserve full path, including querystring
    url.searchParams.set("next", `${pathname}${search || ""}`);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/platform/:path*",
    "/api/ask",
    "/api/send",
    "/api/inbox/:path*",
    "/api/leads/:path*",
    "/api/overview/:path*",
    "/api/tasks/:path*",
    "/api/followups/:path*",
    "/api/auth/:path*",
  ],
};
