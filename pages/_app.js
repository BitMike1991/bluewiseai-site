import { Analytics } from "@vercel/analytics/react"; // <-- use /react for Pages Router
import '@/styles/globals.css';
import Layout from '@/components/Layout';

export default function App({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
      <Analytics />
    </Layout>
  );
}
