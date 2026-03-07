import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const { pathname, asPath, query } = router;

  const currentPath = (asPath || "").split("?")[0] || "/";
  const isFr = currentPath.startsWith("/fr");

  const isMainDarkPage =
    pathname === "/" ||
    pathname === "/fr" ||
    pathname === "/contact" ||
    pathname === "/fr/contact" ||
    pathname === "/about" ||
    pathname === "/fr/about" ||
    pathname === "/services" ||
    pathname === "/fr/services" ||
    pathname === "/portfolio" ||
    pathname === "/fr/portfolio" ||
    pathname === "/onboarding-rescue" ||
    pathname === "/fr/onboarding-rescue" ||
    pathname === "/lead-rescue" ||
    pathname === "/fr/lead-rescue";

  const isPillarsPage =
    pathname.startsWith("/pillars") || pathname.startsWith("/fr/pillars");

  const isDarkPage = isMainDarkPage || isPillarsPage;

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = isFr
    ? [
        { href: "/fr", label: "Accueil" },
        { href: "/fr/about", label: "\u00C0 propos" },
        { href: "/fr/services", label: "Services" },
        { href: "/fr/portfolio", label: "R\u00e9sultats" },
        { href: "/fr/lead-rescue", label: "Plans" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/services", label: "Services" },
        { href: "/portfolio", label: "Results" },
        { href: "/lead-rescue", label: "Plans" },
      ];

  const enToFr = {
    "ultimate-guide-ai-automation": "guide-ultime-automatisation-ia-pme",
    "making-money-ai-automation": "gagner-argent-avec-automatisation-ia",
    "choosing-tools-models": "choisir-outils-modeles-ia",
  };

  const frToEn = Object.fromEntries(
    Object.entries(enToFr).map(([en, fr]) => [fr, en])
  );

  let slug = query.slug;
  if (Array.isArray(slug)) slug = slug[0];

  let switchHref;
  if (slug) {
    if (isFr) {
      switchHref = `/pillars/${frToEn[slug] || slug}`;
    } else {
      switchHref = `/fr/pillars/${enToFr[slug] || slug}`;
    }
  } else {
    if (isFr) {
      switchHref = currentPath.replace(/^\/fr/, "") || "/";
    } else {
      switchHref = currentPath === "/" ? "/fr" : `/fr${currentPath}`;
    }
  }

  const linkBase = (isActive) =>
    `px-3 py-2 rounded transition-all duration-200 ${
      isActive
        ? "text-blue-300 bg-slate-800/60"
        : isDarkPage
        ? "text-gray-200 hover:text-white hover:bg-slate-800/50"
        : "text-gray-700 hover:text-blue-600 hover:bg-blue-100"
    }`;

  return (
    <header
      className={`
        sticky top-0 z-50 backdrop-blur-md transition-all duration-300
        ${
          isDarkPage
            ? scrolled
              ? "bg-slate-900/70 shadow-lg border-b border-white/10"
              : "bg-slate-900/40 shadow-sm"
            : scrolled
            ? "bg-white/80 shadow-lg border-b border-gray-200"
            : "bg-white/60 shadow"
        }
      `}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href={isFr ? "/fr" : "/"}
          className="flex items-center"
          aria-label="BlueWise AI logo"
          title="BlueWise AI"
        >
          <Image
            src="/owl.png"
            alt="BlueWise AI logo"
            width={40}
            height={40}
            className="rounded-full mr-3 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.85)]"
            priority
          />
        </Link>

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden p-2 rounded-lg transition-colors ${
            isDarkPage ? "text-gray-200 hover:bg-slate-800/50" : "text-gray-700 hover:bg-gray-100"
          }`}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4 sm:gap-7 text-sm sm:text-base font-medium uppercase tracking-wide">
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href || pathname === `${href}/`;
            return (
              <Link key={href} href={href} className={linkBase(isActive)}>
                {label}
              </Link>
            );
          })}

          {/* Platform button */}
          <Link
            href="/platform/overview"
            className={`rounded-full border px-4 py-2 text-xs sm:text-sm font-semibold tracking-[0.18em] ${
              isDarkPage
                ? "border-blue-500/70 text-blue-200 hover:bg-blue-600/20 hover:text-blue-100"
                : "border-blue-600 text-blue-700 hover:bg-blue-50"
            }`}
          >
            {isFr ? "Plateforme" : "Platform"}
          </Link>

          {/* Contact CTA */}
          <Link
            href={isFr ? "/fr/contact" : "/contact"}
            className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-500 transition shadow"
          >
            Contact
          </Link>

          {/* Language switch */}
          <Link
            href={switchHref}
            className={`ml-2 px-3 py-2 rounded transition-all ${
              isDarkPage
                ? "text-gray-300 hover:text-white hover:bg-slate-700/50"
                : "text-gray-500 hover:text-blue-600 hover:bg-blue-100"
            }`}
            aria-label="Switch language"
            title="Switch language"
          >
            {isFr ? "EN" : "FR"}
          </Link>
        </nav>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div className={`md:hidden border-t ${
          isDarkPage ? "bg-slate-900/95 border-white/10" : "bg-white/95 border-gray-200"
        }`}>
          <nav className="flex flex-col px-6 py-4 gap-2 text-sm font-medium uppercase tracking-wide">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href || pathname === `${href}/`;
              return (
                <Link key={href} href={href} className={`${linkBase(isActive)} block py-3`}>
                  {label}
                </Link>
              );
            })}

            <Link
              href="/platform/overview"
              className={`block py-3 rounded-xl border text-center font-semibold ${
                isDarkPage
                  ? "border-blue-500/70 text-blue-200"
                  : "border-blue-600 text-blue-700"
              }`}
            >
              {isFr ? "Plateforme" : "Platform"}
            </Link>

            <Link
              href={isFr ? "/fr/contact" : "/contact"}
              className="block py-3 bg-blue-600 text-white text-center rounded-xl font-semibold"
            >
              Contact
            </Link>

            <div className="flex justify-center pt-2">
              <Link
                href={switchHref}
                className={`px-4 py-2 rounded ${
                  isDarkPage ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-blue-600"
                }`}
              >
                {isFr ? "EN" : "FR"}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
