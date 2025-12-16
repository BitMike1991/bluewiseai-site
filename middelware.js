// /middleware.js
import { NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="BlueWise Platform"',
    },
  });
}

function timingSafeEqual(a, b) {
  // Basic constant-time compare for short strings
  const aa = String(a || "");
  const bb = String(b || "");
  if (aa.length !== bb.length) return false;
  let out = 0;
  for (let i = 0; i < aa.length; i++) out |= aa.charCodeAt(i) ^ bb.charCodeAt(i);
  return out === 0;
}

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow public marketing + contact form
  if (pathname === "/api/contact") return NextResponse.next();

  // Gate all platform pages + sensitive APIs
  const isProtected =
    pathname.startsWith("/platform") ||
    pathname.startsWith("/api/ask") ||
    pathname.startsWith("/api/send") ||
    pathname.startsWith("/api/inbox") ||
    pathname.startsWith("/api/leads") ||
    pathname.startsWith("/api/overview") ||
    pathname.startsWith("/api/tasks") || // if you have it
    pathname.startsWith("/api/followups"); // if you have it

  if (!isProtected) return NextResponse.next();

  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // If env vars missing, fail CLOSED (safer)
  if (!user || !pass) return unauthorized();

  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Basic ")) return unauthorized();

  let decoded = "";
  try {
    decoded = atob(auth.slice("Basic ".length));
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(":");
  if (sep < 0) return unauthorized();

  const u = decoded.slice(0, sep);
  const p = decoded.slice(sep + 1);

  const ok = timingSafeEqual(u, user) && timingSafeEqual(p, pass);
  if (!ok) return unauthorized();

  return NextResponse.next();
}

// Only run middleware where it matters (faster + safer)
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
    "/api/contact", // included so the "allow" rule above can short-circuit safely
  ],
};
