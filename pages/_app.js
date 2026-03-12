import { Analytics } from "@vercel/analytics/react";
import { Inter, Space_Grotesk, DM_Sans } from "next/font/google";
import '@/styles/globals.css';
import Layout from '@/components/Layout';

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

export default function App({ Component, pageProps }) {
  return (
    <div className={`${inter.variable} ${spaceGrotesk.variable} ${dmSans.variable} font-sans`}>
      <Layout>
        <Component {...pageProps} />
        <Analytics />
      </Layout>
    </div>
  );
}
