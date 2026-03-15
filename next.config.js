const path = require('path')

/** @type {import('next').NextConfig} */
module.exports = {
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
  transpilePackages: ['@splinetool/react-spline', '@splinetool/runtime'],
  webpack: (config) => {
    config.resolve.alias['@splinetool/react-spline'] = path.resolve(
      __dirname, 'node_modules/@splinetool/react-spline/dist/react-spline.js'
    )
    return config
  },
};
