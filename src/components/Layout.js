// src/components/Layout.js
import { Analytics } from "@vercel/analytics/next"
import { useRouter } from "next/router";
import { useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { getLocale } from "@/lib/locale";

export default function Layout({ children }) {
  const { pathname } = useRouter();
  const locale = getLocale(pathname);

  // Set document lang attribute dynamically
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Helper booleans for groups of pages
  const isMainDarkPage =
    pathname === "/" ||
    pathname === "/fr" ||
    pathname === "/es" ||
    pathname === "/contact" ||
    pathname === "/fr/contact" ||
    pathname === "/es/contact" ||
    pathname === "/services" ||
    pathname === "/fr/services" ||
    pathname === "/es/services" ||
    pathname === "/about" ||
    pathname === "/fr/about" ||
    pathname === "/portfolio" ||
    pathname === "/fr/portfolio" ||
    pathname === "/onboarding-rescue" ||
    pathname === "/fr/onboarding-rescue" ||
    pathname === "/lead-rescue" ||
    pathname === "/fr/lead-rescue" ||
    pathname === "/es/lead-rescue" ||
    pathname === "/artisan" ||
    pathname === "/fr/artisan" ||
    pathname === "/es/artisan" ||
    pathname === "/results" ||
    pathname === "/fr/results" ||
    pathname === "/es/results";
  // All resources / pillars pages (list + articles) → dark layout too
  const isPillarsPage =
    pathname.startsWith("/pillars") || pathname.startsWith("/fr/pillars");

  const isDarkPage = isMainDarkPage || isPillarsPage;

    // 🔵 NEW: platform/dashboard pages use their own layout
  const isPlatformPage = pathname.startsWith("/platform");

  if (isPlatformPage) {
    // Dashboard pages (we'll wrap them in DashboardLayout directly)
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      <Navbar />

      {isDarkPage ? (
        <main className="flex-grow">
          {children}
        </main>
      ) : (
        <main className="flex-grow bg-white/90 backdrop-blur-sm shadow-[0_0_60px_rgba(59,130,246,0.2)]">
          <div className="max-w-6xl mx-auto px-6 py-8 animate-[fadeIn_0.6s_ease-out]">
            {children}
          </div>
        </main>
      )}

      <Footer />
      <Analytics />
    </div>
  );
}
