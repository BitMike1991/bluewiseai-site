import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X, Globe } from "lucide-react";
import { getLocale, localePath } from "@/lib/locale";

const NAV_ITEMS = {
  en: [
    { href: "/", label: "Home" },
    { href: "/services", label: "How It Works" },
    { href: "/portfolio", label: "Results" },
    { href: "/lead-rescue", label: "Plans" },
  ],
  fr: [
    { href: "/fr", label: "Accueil" },
    { href: "/fr/services", label: "Comment ça marche" },
    { href: "/fr/portfolio", label: "Résultats" },
    { href: "/fr/lead-rescue", label: "Plans" },
  ],
  es: [
    { href: "/es", label: "Inicio" },
    { href: "/es/services", label: "Cómo funciona" },
    { href: "/es/portfolio", label: "Resultados" },
    { href: "/es/lead-rescue", label: "Planes" },
  ],
};

const CTA_LABELS = {
  en: "Book a Call",
  fr: "Réserver un appel",
  es: "Agendar llamada",
};

const LANG_LABELS = {
  en: "English",
  fr: "Français",
  es: "Español",
};

export default function Navbar() {
  const router = useRouter();
  const { pathname, asPath, query } = router;

  const currentPath = (asPath || "").split("?")[0] || "/";
  const locale = getLocale(currentPath);

  const isMainDarkPage =
    pathname === "/" ||
    pathname === "/fr" ||
    pathname === "/es" ||
    pathname === "/contact" ||
    pathname === "/fr/contact" ||
    pathname === "/es/contact" ||
    pathname === "/about" ||
    pathname === "/fr/about" ||
    pathname === "/services" ||
    pathname === "/fr/services" ||
    pathname === "/es/services" ||
    pathname === "/portfolio" ||
    pathname === "/fr/portfolio" ||
    pathname === "/onboarding-rescue" ||
    pathname === "/fr/onboarding-rescue" ||
    pathname === "/lead-rescue" ||
    pathname === "/fr/lead-rescue" ||
    pathname === "/es/lead-rescue" ||
    pathname === "/artisan" ||
    pathname === "/fr/artisan" ||
    pathname === "/es/artisan";

  const isPillarsPage =
    pathname.startsWith("/pillars") || pathname.startsWith("/fr/pillars");

  const isDarkPage = isMainDarkPage || isPillarsPage;

  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

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
    setLangOpen(false);
  }, [pathname]);

  // Close lang dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const close = () => setLangOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [langOpen]);

  const navItems = NAV_ITEMS[locale];
  const contactHref = `${localePath(locale)}/contact`;

  // Mapping EN <-> FR slugs for pillar articles
  const enToFr = {
    "ultimate-guide-ai-automation": "guide-ultime-automatisation-ia-pme",
    "making-money-ai-automation": "gagner-argent-avec-automatisation-ia",
    "choosing-tools-models": "choisir-outils-modeles-ia",
  };

  const frToEn = Object.fromEntries(
    Object.entries(enToFr).map(([en, fr]) => [fr, en])
  );

  // Build switch hrefs for each locale
  function getSwitchHref(targetLocale) {
    let slug = query.slug;
    if (Array.isArray(slug)) slug = slug[0];

    if (slug) {
      // Pillar article — map slug
      const enSlug = locale === "fr" ? (frToEn[slug] || slug) : slug;
      if (targetLocale === "fr") {
        return `/fr/pillars/${enToFr[enSlug] || enSlug}`;
      }
      return `${localePath(targetLocale)}/pillars/${enSlug}`;
    }

    // Strip current locale prefix to get base path
    let basePath = currentPath;
    if (locale === "fr") basePath = currentPath.replace(/^\/fr/, "") || "/";
    if (locale === "es") basePath = currentPath.replace(/^\/es/, "") || "/";

    if (targetLocale === "en") return basePath;
    if (basePath === "/") return `/${targetLocale}`;
    return `/${targetLocale}${basePath}`;
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
          href={locale === "en" ? "/" : `/${locale}`}
          className="flex items-center gap-2.5 group"
          aria-label="BlueWise logo"
          title="BlueWise"
        >
          <Image
            src="/bluewise-logo.png"
            alt="BlueWise logo"
            width={36}
            height={36}
            className="rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(108,99,255,0.7)]"
            priority
          />
          <span className={`font-heading font-bold text-lg tracking-tight hidden sm:block ${
            isDarkPage ? "text-white" : "text-gray-900"
          }`}>
            BlueWise
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
            href={contactHref}
            className={`ml-3 px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-300 cursor-pointer ${
              pastHero
                ? "bg-accent text-white shadow-[0_0_20px_rgba(108,99,255,0.4)] hover:shadow-[0_0_30px_rgba(108,99,255,0.6)]"
                : "bg-accent text-white hover:bg-accent/90"
            }`}
          >
            {CTA_LABELS[locale]}
          </Link>

          {/* Language dropdown */}
          <div className="relative ml-2">
            <button
              onClick={(e) => { e.stopPropagation(); setLangOpen(!langOpen); }}
              className={`p-2 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                isDarkPage
                  ? "text-txt3 hover:text-white hover:bg-white/5"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}
              aria-label="Switch language"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs uppercase font-medium">{locale}</span>
            </button>

            {langOpen && (
              <div className={`absolute right-0 top-full mt-1 rounded-lg border shadow-xl py-1 min-w-[120px] z-50 ${
                isDarkPage
                  ? "bg-surface border-border"
                  : "bg-white border-gray-200"
              }`}>
                {["en", "fr", "es"].filter(l => l !== locale).map(l => (
                  <Link
                    key={l}
                    href={getSwitchHref(l)}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      isDarkPage
                        ? "text-txt2 hover:text-white hover:bg-white/5"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {LANG_LABELS[l]}
                  </Link>
                ))}
              </div>
            )}
          </div>
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
              href={contactHref}
              className="mt-2 block py-3 bg-accent text-white text-center rounded-lg font-semibold text-sm cursor-pointer"
            >
              {CTA_LABELS[locale]}
            </Link>

            <div className="flex justify-center gap-3 pt-3">
              {["en", "fr", "es"].filter(l => l !== locale).map(l => (
                <Link
                  key={l}
                  href={getSwitchHref(l)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm cursor-pointer ${
                    isDarkPage ? "text-txt3 hover:text-white" : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  {LANG_LABELS[l]}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
