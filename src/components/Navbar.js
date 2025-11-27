import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const { pathname, asPath, query } = router;

  // Real current path (not /pillars/[slug]), without query string
  const currentPath = (asPath || "").split("?")[0] || "/";
  const isFr = currentPath.startsWith("/fr");

  // Main dark pages (add onboarding pages here)
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
    pathname === "/fr/onboarding-rescue";

  // Add pillars (index + article pages)
  const isPillarsPage =
    pathname.startsWith("/pillars") || pathname.startsWith("/fr/pillars");

  const isDarkPage = isMainDarkPage || isPillarsPage;

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Base nav items WITHOUT resources (we’ll handle Resources/Ressources as a dropdown)
  const navItems = isFr
    ? [
        { href: "/fr", label: "Accueil" },
        { href: "/fr/about", label: "À propos" },
        { href: "/fr/services", label: "Services" },
        { href: "/fr/portfolio", label: "Portfolio" },
        { href: "/fr/contact", label: "Contact", isCTA: true },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/services", label: "Services" },
        { href: "/portfolio", label: "Portfolio" },
        { href: "/contact", label: "Contact", isCTA: true },
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
  if (Array.isArray(slug)) {
    slug = slug[0];
  }

  let switchHref;

  if (slug) {
    // Dynamic article page
    if (isFr) {
      const targetSlug = frToEn[slug] || slug;
      switchHref = `/pillars/${targetSlug}`;
    } else {
      const targetSlug = enToFr[slug] || slug;
      switchHref = `/fr/pillars/${targetSlug}`;
    }
  } else {
    // Static pages (including onboarding-rescue): just add/remove /fr prefix
    if (isFr) {
      const withoutFr = currentPath.replace(/^\/fr/, "") || "/";
      switchHref = withoutFr;
    } else {
      switchHref = currentPath === "/" ? "/fr" : `/fr${currentPath}`;
    }
  }

  // Helper: active state for dropdown parent (resources)
  const isResourcesActive =
    pathname.startsWith("/pillars") ||
    pathname.startsWith("/fr/pillars") ||
    pathname === "/onboarding-rescue" ||
    pathname === "/fr/onboarding-rescue";

  // Tailwind styles for nav links
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
            className="
              rounded-full mr-3
              transition-all duration-300
              hover:scale-110
              hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.85)]
            "
            priority
          />
        </Link>

        {/* Nav items */}
        <nav className="flex items-center flex-wrap gap-4 sm:gap-7 text-sm sm:text-base font-medium uppercase tracking-wide">
          {/* Regular nav items (no Resources) */}
          {navItems.map(({ href, label, isCTA }) => {
            const isActive = pathname === href || pathname === `${href}/`;

            if (isCTA) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition shadow"
                >
                  {label}
                </Link>
              );
            }

            return (
              <Link key={href} href={href} className={linkBase(isActive)}>
                {label}
              </Link>
            );
          })}

          {/* Resources dropdown */}
          <div className="relative group">
            <button
              type="button"
              className={`
                flex items-center gap-1 ${linkBase(isResourcesActive)}
              `}
            >
              {isFr ? "Ressources" : "Resources"}
              <span className="text-xs">▾</span>
            </button>

            {/* Dropdown menu */}
            <div
              className={`
                invisible opacity-0 group-hover:visible group-hover:opacity-100
                absolute right-0 mt-2 min-w-[220px] rounded-xl border
                shadow-lg transition-all duration-150
                ${
                  isDarkPage
                    ? "bg-slate-900/95 border-white/10"
                    : "bg-white border-gray-200"
                }
              `}
            >
              <div className="py-2">
                {/* Articles / Pillars */}
                <Link
                  href={isFr ? "/fr/pillars" : "/pillars"}
                  className={`
                    block px-4 py-2 text-sm
                    ${
                      isDarkPage
                        ? "text-gray-200 hover:text-white hover:bg-slate-800/70"
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    }
                  `}
                >
                  {isFr ? "Articles & guides" : "Articles & guides"}
                </Link>

                {/* Lead Rescue Form */}
                <Link
                  href={isFr ? "/fr/onboarding-rescue" : "/onboarding-rescue"}
                  className={`
                    block px-4 py-2 text-sm
                    ${
                      isDarkPage
                        ? "text-gray-200 hover:text-white hover:bg-slate-800/70"
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                    }
                  `}
                >
                  {isFr
                    ? "Formulaire Lead Rescue"
                    : "Lead Rescue System form"}
                </Link>
              </div>
            </div>
          </div>

          {/* Language switch */}
          <Link
            href={switchHref}
            className={`
              ml-2 px-3 py-2 rounded transition-all
              ${
                isDarkPage
                  ? "text-gray-300 hover:text-white hover:bg-slate-700/50"
                  : "text-gray-500 hover:text-blue-600 hover:bg-blue-100"
              }
            `}
            aria-label="Switch language"
            title="Switch language"
          >
            {isFr ? "EN" : "FR"}
          </Link>
        </nav>
      </div>
    </header>
  );
}
