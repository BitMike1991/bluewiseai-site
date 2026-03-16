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
