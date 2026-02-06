import { Analytics } from "@vercel/analytics/react"; // <-- use /react for Pages Router
import { Inter } from "next/font/google";
import '@/styles/globals.css';
import Layout from '@/components/Layout';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function App({ Component, pageProps }) {
  return (
    <div className={`${inter.variable} font-sans`}>
      <Layout>
        <Component {...pageProps} />
        <Analytics />
      </Layout>
    </div>
  );
}
