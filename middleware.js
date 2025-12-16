// middleware.js
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req) {
  let res = NextResponse.next();
  const { pathname, search } = req.nextUrl;

  // Allow login page + auth endpoints
  if (pathname === "/platform/login") return res;
  if (pathname.startsWith("/api/auth/")) return res;

  const isProtected =
    pathname.startsWith("/platform") ||
    pathname.startsWith("/api/ask") ||
    pathname.startsWith("/api/send") ||
    pathname.startsWith("/api/inbox") ||
    pathname.startsWith("/api/leads") ||
    pathname.startsWith("/api/overview") ||
    pathname.startsWith("/api/tasks") ||
    pathname.startsWith("/api/followups");

  if (!isProtected) return res;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value;
        },
        set(name, value, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          res.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getSession();
  const session = data?.session || null;

  if (!session || error) {
    const url = req.nextUrl.clone();
    url.pathname = "/platform/login";
    url.searchParams.set("next", `${pathname}${search || ""}`);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/platform/:path*",
    "/api/auth/:path*", // allow rule above will short-circuit; still good to include for clarity
    "/api/ask",
    "/api/send",
    "/api/inbox/:path*",
    "/api/leads/:path*",
    "/api/overview/:path*",
    "/api/tasks/:path*",
    "/api/followups/:path*",
  ],
};
