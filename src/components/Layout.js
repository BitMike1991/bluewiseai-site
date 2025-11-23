import { useRouter } from "next/router";
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  const { pathname } = useRouter();

  // All pages that use DARK / TRANSPARENT layout
  const isDarkPage =
    pathname === "/" ||
    pathname === "/fr" ||
    pathname === "/contact" ||
    pathname === "/fr/contact" ||
    pathname === "/about" ||
    pathname === "/fr/about" ||
    pathname === "/services" ||
    pathname === "/fr/services" ||
    pathname === "/portfolio" ||
    pathname === "/fr/portfolio";

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
    </div>
  );
}
