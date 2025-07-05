import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function Navbar() {
  const { pathname } = useRouter();
  const isFr = pathname.startsWith('/fr');

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
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
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
            className="rounded-full mr-3"
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
                    ? 'text-blue-600 bg-blue-100'
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
            className="ml-2 px-3 py-2 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-100 transition-all"
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
