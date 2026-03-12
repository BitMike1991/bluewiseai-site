import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X, Globe } from "lucide-react";

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
  const [pastHero, setPastHero] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
      setPastHero(window.scrollY > window.innerHeight * 0.7);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = isFr
    ? [
        { href: "/fr", label: "Accueil" },
        { href: "/fr/services", label: "Comment ça marche" },
        { href: "/fr/portfolio", label: "Résultats" },
        { href: "/fr/lead-rescue", label: "Plans" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/services", label: "How It Works" },
        { href: "/portfolio", label: "Results" },
        { href: "/lead-rescue", label: "Plans" },
      ];

  // Mapping EN <-> FR slugs for pillar articles
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
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? "text-white bg-accent/20"
        : isDarkPage
        ? "text-txt2 hover:text-white hover:bg-white/5"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    }`;

  return (
    <header
      className={`
        sticky top-0 z-50 backdrop-blur-lg transition-all duration-300
        ${
          isDarkPage
            ? scrolled
              ? "bg-bg/80 shadow-lg border-b border-border"
              : "bg-transparent"
            : scrolled
            ? "bg-white/80 shadow-lg border-b border-gray-200"
            : "bg-white/60 shadow"
        }
      `}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Logo + Wordmark */}
        <Link
          href={isFr ? "/fr" : "/"}
          className="flex items-center gap-2.5 group"
          aria-label="BlueWise AI logo"
          title="BlueWise AI"
        >
          <Image
            src="/owl.png"
            alt="BlueWise AI logo"
            width={36}
            height={36}
            className="rounded-full transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(108,99,255,0.7)]"
            priority
          />
          <span className={`font-heading font-bold text-lg tracking-tight hidden sm:block ${
            isDarkPage ? "text-white" : "text-gray-900"
          }`}>
            BlueWise<span className="text-accent">AI</span>
          </span>
        </Link>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden p-2 rounded-lg transition-colors cursor-pointer ${
            isDarkPage ? "text-gray-200 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100"
          }`}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label }) => {
            const isActive = pathname === href || pathname === `${href}/`;
            return (
              <Link key={href} href={href} className={linkBase(isActive)}>
                {label}
              </Link>
            );
          })}

          {/* Contact CTA — glows after scrolling past hero */}
          <Link
            href={isFr ? "/fr/contact" : "/contact"}
            className={`ml-3 px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 cursor-pointer ${
              pastHero
                ? "bg-accent text-white shadow-[0_0_20px_rgba(108,99,255,0.4)] hover:shadow-[0_0_30px_rgba(108,99,255,0.6)]"
                : "bg-accent text-white hover:bg-accent/90"
            }`}
          >
            {isFr ? "Réserver un appel" : "Book a Call"}
          </Link>

          {/* Language switch */}
          <Link
            href={switchHref}
            className={`ml-2 p-2 rounded-lg transition-all cursor-pointer ${
              isDarkPage
                ? "text-txt3 hover:text-white hover:bg-white/5"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            }`}
            aria-label="Switch language"
            title={isFr ? "Switch to English" : "Passer au français"}
          >
            <Globe className="w-4 h-4" />
          </Link>
        </nav>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className={`md:hidden border-t ${
          isDarkPage ? "bg-bg/95 backdrop-blur-lg border-border" : "bg-white/95 border-gray-200"
        }`}>
          <nav className="flex flex-col px-4 py-4 gap-1">
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href || pathname === `${href}/`;
              return (
                <Link key={href} href={href} className={`${linkBase(isActive)} block py-3`}>
                  {label}
                </Link>
              );
            })}

            <Link
              href={isFr ? "/fr/contact" : "/contact"}
              className="mt-2 block py-3 bg-accent text-white text-center rounded-lg font-semibold text-sm cursor-pointer"
            >
              {isFr ? "Réserver un appel" : "Book a Call"}
            </Link>

            <div className="flex justify-center pt-3">
              <Link
                href={switchHref}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer ${
                  isDarkPage ? "text-txt3 hover:text-white" : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <Globe className="w-4 h-4" />
                {isFr ? "English" : "Français"}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
