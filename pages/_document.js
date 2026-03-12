// src/pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ✅ Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />

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
