import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { Inter, Space_Grotesk, DM_Sans } from "next/font/google";
import '@/styles/globals.css';
import Layout from '@/components/Layout';
import { getLocale } from "@/lib/locale";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "700"],
});

const OG_TITLE = {
  en: "BlueWise — AI-Powered Business Automation for Contractors",
  fr: "BlueWise — Automatisation IA pour entrepreneurs",
  es: "BlueWise — Automatización empresarial con IA para contratistas",
};

const OG_DESC = {
  en: "Missed calls, quotes, contracts, payments — all handled automatically by AI. We run your business while you do the work.",
  fr: "Appels manqués, soumissions, contrats, paiements — tout géré automatiquement par l'IA. On gère ta business pendant que tu fais ta job.",
  es: "Llamadas perdidas, cotizaciones, contratos, pagos — todo manejado automáticamente con IA. Gestionamos tu negocio mientras tú haces el trabajo.",
};

export default function App({ Component, pageProps }) {
  const { pathname } = useRouter();
  const locale = getLocale(pathname);

  return (
    <>
      <Head>
        <title>{OG_TITLE[locale]}</title>
        <meta name="description" content={OG_DESC[locale]} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={OG_TITLE[locale]} />
        <meta property="og:description" content={OG_DESC[locale]} />
        <meta property="og:image" content="https://bluewiseai.com/bluewise-logo.png" />
        <meta property="og:url" content="https://bluewiseai.com" />
        <meta property="og:site_name" content="BlueWise" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={OG_TITLE[locale]} />
        <meta name="twitter:description" content={OG_DESC[locale]} />
        <meta name="twitter:image" content="https://bluewiseai.com/bluewise-logo.png" />
      </Head>
      <div className={`${inter.variable} ${spaceGrotesk.variable} ${dmSans.variable} font-sans`}>
        <Layout>
          <Component {...pageProps} />
          <Analytics />
        </Layout>
      </div>
    </>
  );
}
