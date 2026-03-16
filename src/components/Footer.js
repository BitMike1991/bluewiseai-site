import Link from 'next/link';
import { useRouter } from 'next/router';
import { getLocale, localePath } from '@/lib/locale';

const NAV_LINKS = {
  en: [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Services' },
    { href: '/portfolio', label: 'Results' },
    { href: '/lead-rescue', label: 'Plans & Pricing' },
    { href: '/contact', label: 'Contact' },
  ],
  fr: [
    { href: '/fr', label: 'Accueil' },
    { href: '/fr/about', label: 'À propos' },
    { href: '/fr/services', label: 'Services' },
    { href: '/fr/portfolio', label: 'Résultats' },
    { href: '/fr/lead-rescue', label: 'Plans & prix' },
    { href: '/fr/contact', label: 'Contact' },
  ],
  es: [
    { href: '/es', label: 'Inicio' },
    { href: '/es/services', label: 'Servicios' },
    { href: '/es/lead-rescue', label: 'Planes y precios' },
    { href: '/es/artisan', label: 'Artesanos' },
    { href: '/es/contact', label: 'Contacto' },
  ],
};

const BRAND_DESC = {
  en: 'AI-powered business optimization for home service contractors.',
  fr: "Optimisation d'entreprise propulsée par IA pour les entrepreneurs en services résidentiels.",
  es: 'Optimización empresarial con IA para contratistas de servicios residenciales.',
};

const BOOK_LABEL = {
  en: 'Book a call',
  fr: 'Réserver un appel',
  es: 'Agendar llamada',
};

const RIGHTS = {
  en: 'All rights reserved.',
  fr: 'Tous droits réservés.',
  es: 'Todos los derechos reservados.',
};

export default function Footer() {
  const { pathname } = useRouter();
  const locale = getLocale(pathname);

  const navLinks = NAV_LINKS[locale];

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-white font-bold text-lg mb-2">BlueWise</h3>
            <p className="text-sm">{BRAND_DESC[locale]}</p>
          </div>

          {/* Nav links */}
          <div>
            <h4 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-3">
              {locale === 'es' ? 'Navegación' : 'Navigation'}
            </h4>
            <ul className="space-y-2 text-sm">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-3">
              {locale === 'es' ? 'Contacto' : 'Contact'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:mikael@bluewiseai.com" className="hover:text-white transition-colors">
                  mikael@bluewiseai.com
                </a>
              </li>
              <li>
                <a href="https://calendly.com/mikael-bluewiseai" target="_blank" rel="noopener noreferrer"
                  className="hover:text-white transition-colors">
                  {BOOK_LABEL[locale]}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">
            &copy; {new Date().getFullYear()} BlueWise. {RIGHTS[locale]}
          </p>
          <div className="flex gap-4 text-xs">
            <span>{locale === 'fr' ? 'Montréal, QC' : 'Montreal, QC'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
