import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />

        {/* OG / Social sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="BlueWise" />
        <meta property="og:image" content="https://bluewiseai.com/bluewise-logo.png" />
        <meta property="og:image:width" content="768" />
        <meta property="og:image:height" content="768" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:url" content="https://bluewiseai.com" />
        <meta property="fb:app_id" content="928880796387934" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:image" content="https://bluewiseai.com/bluewise-logo.png" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "SoftwareApplication",
                  "@id": "https://bluewiseai.com/#software",
                  "name": "BlueWise AI",
                  "description": "AI-powered CRM and automation platform for trades and home service businesses. Voice agents, SMS automation, lead management, invoicing, and analytics.",
                  "url": "https://bluewiseai.com",
                  "applicationCategory": "BusinessApplication",
                  "operatingSystem": "Web",
                  "offers": {
                    "@type": "AggregateOffer",
                    "priceCurrency": "CAD",
                    "lowPrice": "297",
                    "highPrice": "997"
                  }
                },
                {
                  "@type": "Organization",
                  "@id": "https://bluewiseai.com/#org",
                  "name": "BlueWise AI",
                  "url": "https://bluewiseai.com",
                  "logo": "https://bluewiseai.com/bluewise-logo.png",
                  "email": "admin@bluewiseai.com",
                  "description": "AI-powered business automation for trades and home services.",
                  "areaServed": {
                    "@type": "Country",
                    "name": "Canada"
                  },
                  "knowsAbout": [
                    "AI Voice Agents",
                    "CRM for Trades",
                    "SMS Automation",
                    "Lead Management",
                    "Business Analytics"
                  ]
                }
              ]
            }),
          }}
        />

        {/* Base reset */}
        <style>{`
          html, body, #__next {
            margin: 0;
            padding: 0;
          }
        `}</style>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
