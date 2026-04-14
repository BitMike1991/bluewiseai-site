import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Inter, Space_Grotesk, DM_Sans } from "next/font/google";
import '@/styles/globals.css';
import Layout from '@/components/Layout';
import { getLocale } from "@/lib/locale";
import { ToastProvider } from "@/components/ui/ToastContext";
import ToastContainer from "@/components/ui/Toast";
import CookieConsent, { hasConsented } from "@/components/CookieConsent";

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

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
  const isMarketing = FB_PIXEL_ID && !pathname.startsWith("/platform");
  const [pixelAllowed, setPixelAllowed] = useState(false);

  useEffect(() => {
    setPixelAllowed(hasConsented('marketing'));
    const handler = () => setPixelAllowed(hasConsented('marketing'));
    window.addEventListener('cookie-consent-changed', handler);
    return () => window.removeEventListener('cookie-consent-changed', handler);
  }, []);

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
      {isMarketing && pixelAllowed && (
        <>
          <Script
            id="fb-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
                n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
                document,'script','https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${FB_PIXEL_ID}');
                fbq('track', 'PageView');
              `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
      <ToastProvider>
        <div className={`${inter.variable} ${spaceGrotesk.variable} ${dmSans.variable} font-sans`}>
          <Layout>
            <Component {...pageProps} />
            <Analytics />
          </Layout>
          <ToastContainer />
        </div>
      </ToastProvider>
      <CookieConsent privacyUrl="/privacy" />
    </>
  );
}
