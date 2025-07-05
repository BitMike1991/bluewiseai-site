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

        {/* ✅ Tailwind CDN */}
        <script src="https://cdn.tailwindcss.com" defer></script>

        {/* ✅ Tailwind theme override */}
        <script
          defer
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      primary: '#2563EB',
                      dark: '#2E3A59',
                      midgray: '#4A5568',
                    },
                    fontFamily: {
                      heading: ['Poppins', 'sans-serif'],
                      body: ['Open Sans', 'sans-serif'],
                    },
                  },
                },
              }
            `,
          }}
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
