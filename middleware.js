// middleware.js
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req) {
  let res = NextResponse.next();
  const { pathname, search } = req.nextUrl;

  // Allow login page, auth endpoints, and subscription status check
  if (pathname === "/platform/login") return res;
  if (pathname === "/platform/suspended") return res;
  if (pathname.startsWith("/api/auth/")) return res;
  if (pathname === "/api/subscription/status") return res;

  // Public API routes that don't need auth (allowlist)
  const isPublic =
    pathname === "/api/contact" ||
    pathname === "/api/onboarding" ||
    pathname === "/api/export-leads";

  if (isPublic) return res;

  const isProtected =
    pathname.startsWith("/platform") ||
    pathname.startsWith("/api/ask") ||
    pathname.startsWith("/api/send") ||
    pathname.startsWith("/api/inbox") ||
    pathname.startsWith("/api/leads") ||
    pathname.startsWith("/api/overview") ||
    pathname.startsWith("/api/tasks") ||
    pathname.startsWith("/api/followups") ||
    pathname.startsWith("/api/settings") ||
    pathname.startsWith("/api/calls") ||
    pathname.startsWith("/api/jobs") ||
    pathname.startsWith("/api/finances") ||
    pathname.startsWith("/api/campaigns") ||
    pathname.startsWith("/api/admin");

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

  // Subscription gate: HMAC-signed cookie fast-path (no DB call in Edge runtime)
  const subCookie = req.cookies.get("__sub_status")?.value;
  if (subCookie && subCookie.includes(".") && pathname.startsWith("/platform") && pathname !== "/platform/suspended") {
    const [val, sig] = subCookie.split(".");
    // Verify signature using Web Crypto (Edge runtime compatible)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(process.env.SUPABASE_SERVICE_ROLE_KEY),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, encoder.encode(val));
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    if (sig === expectedSig && val === "suspended") {
      const url = req.nextUrl.clone();
      url.pathname = "/platform/suspended";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/platform/:path*",
    "/api/auth/:path*",
    "/api/ask",
    "/api/send",
    "/api/inbox/:path*",
    "/api/leads/:path*",
    "/api/overview/:path*",
    "/api/tasks/:path*",
    "/api/followups/:path*",
    "/api/settings/:path*",
    "/api/calls/:path*",
    "/api/jobs/:path*",
    "/api/finances/:path*",
    "/api/campaigns/:path*",
    "/api/admin/:path*",
    "/api/subscription/:path*",
  ],
};
