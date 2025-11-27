// src/components/ConsultCTA.js
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ConsultCTA({ children, href }) {
  const { pathname } = useRouter();
  const isFr = pathname.startsWith('/fr');

  // Default behavior: go to contact page
  const defaultHref = isFr ? '/fr/contact' : '/contact';

  // If a custom href is passed, use it. Otherwise use default.
  const finalHref = href || defaultHref;

  const label =
    children ||
    (isFr
      ? 'Obtenez votre audit IA de 15 minutes — Gratuit'
      : 'Get Your Free 15-Minute AI Automation Audit');

  return (
    <Link
      href={finalHref}
      className="
        inline-block
        bg-blue-600
        text-white
        font-medium
        px-6 py-3
        rounded-2xl
        shadow
        transition-all duration-300
        hover:bg-blue-500
        hover:-translate-y-0.5
        hover:shadow-[0_0_22px_rgba(59,130,246,0.85)]
        hover:saturate-150
      "
    >
      {label}
    </Link>
  );
}
