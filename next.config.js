const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'talaveracasajuarez.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' blob: https://vercel.live https://va.vercel-scripts.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://*.ingest.sentry.io font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: "bluewise-ai",
  project: "bluewise-ai",
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  authToken: process.env.SENTRY_AUTH_TOKEN,
});
