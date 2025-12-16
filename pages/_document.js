// src/pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ✅ Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />

        {/* ✅ Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Poppins:wght@600;700&display=swap"
          rel="stylesheet"
        />


        {/* ✅ Custom styling including background image */}
        <style>{`
          html, body, #__next {
            margin: 0;
            padding: 0;
            font-family: 'Open Sans', sans-serif;
          }

          #__next {
            background: url('/styles/fullpage-bg.png') center/cover no-repeat;
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
