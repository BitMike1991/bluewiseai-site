import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useEffect, useState } from "react";

export default function Navbar() {
  const { pathname } = useRouter();
  const isFr = pathname.startsWith('/fr');

  // All pages that should have DARK / GLASS navbar
  const isDarkPage =
    pathname === '/' ||
    pathname === '/fr' ||
    pathname === '/contact' ||
    pathname === '/fr/contact' ||
    pathname === '/about' ||
    pathname === '/fr/about' ||
    pathname === '/services' ||
    pathname === '/fr/services' ||
    pathname === '/portfolio' ||
    pathname === '/fr/portfolio';

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = isFr
    ? [
        { href: '/fr', label: 'Accueil' },
        { href: '/fr/about', label: 'À propos' },
        { href: '/fr/services', label: 'Services' },
        { href: '/fr/portfolio', label: 'Portfolio' },
        { href: '/fr/contact', label: 'Contact', isCTA: true },
      ]
    : [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
        { href: '/services', label: 'Services' },
        { href: '/portfolio', label: 'Portfolio' },
        { href: '/contact', label: 'Contact', isCTA: true },
      ];

  const switchHref = isFr
    ? pathname.replace(/^\/fr/, '') || '/'
    : `/fr${pathname}`;

  return (
    <header
      className={`
        sticky top-0 z-50 backdrop-blur-md transition-all duration-300
        ${
          isDarkPage
            ? (scrolled
                ? "bg-slate-900/70 shadow-lg border-b border-white/10"
                : "bg-slate-900/40 shadow-sm")
            : (scrolled
                ? "bg-white/80 shadow-lg border-b border-gray-200"
                : "bg-white/60 shadow")
        }
      `}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link
          href={isFr ? '/fr' : '/'}
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

        {/* Navigation */}
        <nav className="flex items-center flex-wrap gap-4 sm:gap-7 text-sm sm:text-base font-medium uppercase tracking-wide">
          {navItems.map(({ href, label, isCTA }) => {
            const isActive = pathname === href || pathname === `${href}/`;

            const baseStyle = isCTA
              ? 'bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition shadow'
              : `px-3 py-2 rounded transition-all duration-200 ${
                  isActive
                    ? 'text-blue-300 bg-slate-800/60'
                    : isDarkPage
                    ? 'text-gray-200 hover:text-white hover:bg-slate-800/50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-100'
                }`;

            return (
              <Link key={href} href={href} className={baseStyle}>
                {label}
              </Link>
            );
          })}

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
            {isFr ? 'EN' : 'FR'}
          </Link>
        </nav>

      </div>
    </header>
  );
}
