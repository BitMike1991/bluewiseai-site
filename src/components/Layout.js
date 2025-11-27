// src/components/Layout.js
import { Analytics } from "@vercel/analytics/next"
import { useRouter } from "next/router";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }) {
  const { pathname } = useRouter();

  // Helper booleans for groups of pages
  const isMainDarkPage =
    pathname === "/" ||
    pathname === "/fr" ||
    pathname === "/contact" ||
    pathname === "/fr/contact" ||
    pathname === "/services" ||
    pathname === "/fr/services" ||
    pathname === "/about" ||
    pathname === "/fr/about" ||
    pathname === "/portfolio" ||
    pathname === "/fr/portfolio" ||
    pathname === "/onboarding-rescue" ||          // ✅ NEW
    pathname === "/fr/onboarding-rescue" ||        // ✅ NEW
    pathname === "/lead-rescue" ||          // ✅ NEW
    pathname === "/fr/lead-rescue";         // ✅ NEW
  // All resources / pillars pages (list + articles) → dark layout too
  const isPillarsPage =
    pathname.startsWith("/pillars") || pathname.startsWith("/fr/pillars");

  const isDarkPage = isMainDarkPage || isPillarsPage;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      <main
        className={
          isDarkPage
            ? "flex-grow bg-transparent"
            : "flex-grow bg-white/90 backdrop-blur-sm shadow-[0_0_60px_rgba(59,130,246,0.2)]"
        }
      >
        <div className="max-w-6xl mx-auto px-6 py-8 animate-[fadeIn_0.6s_ease-out]">
          {children}
        </div>
      </main>

      <Footer />
      <Analytics />
    </div>
  );
}
