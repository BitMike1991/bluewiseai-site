// middleware.js
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Domain → customer_id mapping (static, Edge-safe — no DB call).
// This is a routing hint only. Session cookie remains the source of truth for auth.
const DOMAIN_TO_CUSTOMER_ID = {
  "bluewiseai.com": 1,
  "www.bluewiseai.com": 1,
  "app.bluewiseai.com": 1,
  "serviceplus.plus": 8,
  "www.serviceplus.plus": 8,
  "app.serviceplus.plus": 8,
  "hub.purconstruction.com": 9,
  "purconstruction.com": 9,
  "www.purconstruction.com": 9,
};

export async function middleware(req) {
  let res = NextResponse.next();
  const { pathname, search } = req.nextUrl;

  // Allow login page, auth endpoints, and subscription status check
  if (pathname === "/platform/login") return res;
  if (pathname === "/platform/setup-password") return res;
  if (pathname === "/platform/suspended") return res;
  if (pathname.startsWith("/api/auth/")) return res;
  if (pathname === "/api/subscription/status") return res;

  // Public API routes that don't need auth (allowlist)
  const isPublic =
    pathname === "/api/contact" ||
    pathname === "/api/onboarding" ||
    pathname === "/api/settings/gcal-token";

  if (isPublic) return res;

  const isProtected =
    pathname.startsWith("/platform") ||
    pathname.startsWith("/hub") ||
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
    pathname.startsWith("/api/analytics") ||
    pathname.startsWith("/api/tenants") ||
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

  // Use getUser() for server-side JWT verification (more secure than getSession which trusts the cookie)
  const { data, error } = await supabase.auth.getUser();
  const user = data?.user || null;

  if (!user || error) {
    const url = req.nextUrl.clone();
    url.pathname = "/platform/login";
    url.searchParams.set("next", `${pathname}${search || ""}`);
    return NextResponse.redirect(url);
  }

  // Subscription gate: HMAC-signed cookie fast-path (no DB call in Edge runtime)
  // Note: If cookie is missing, DashboardLayout.js calls /api/subscription/status on mount,
  // which re-sets the cookie and redirects suspended users client-side. API routes still enforce auth.
  const subCookie = req.cookies.get("__sub_status")?.value;
  if (subCookie && subCookie.includes(".") && pathname.startsWith("/platform") && pathname !== "/platform/suspended") {
    const [val, sig] = subCookie.split(".");
    // Verify signature using Web Crypto (Edge runtime compatible)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(process.env.HMAC_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY),
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

  // Inject x-tenant-customer-id hint based on Host header (routing hint only).
  // Downstream pages/APIs must still validate via authenticated session.
  const host = req.headers.get("host")?.split(":")[0] || "";
  const tenantId = DOMAIN_TO_CUSTOMER_ID[host];
  if (tenantId) {
    res.headers.set("x-tenant-customer-id", String(tenantId));
  }

  return res;
}

export const config = {
  matcher: [
    "/platform/:path*",
    "/hub/:path*",
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
    "/api/analytics/:path*",
    "/api/tenants",
    "/api/admin/:path*",
    "/api/subscription/:path*",
  ],
};
