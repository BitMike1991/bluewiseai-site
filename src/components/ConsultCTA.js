// src/components/ConsultCTA.js
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ConsultCTA({ children }) {
  const { pathname } = useRouter();
  const isFr = pathname.startsWith('/fr');
  const href = isFr ? '/fr/contact' : '/contact';
  const label =
    children ||
    (isFr
      ? 'Réservez une consultation gratuite'
      : 'Book a Free Consultation');

  return (
    <Link
      href={href}
      className="
        inline-block
        bg-blue-600
        text-white
        font-medium
        px-6 py-3
        rounded-2xl
        shadow
        hover:bg-blue-700
        transition-colors
        duration-200
      "
    >
      {label}
    </Link>
  );
}
