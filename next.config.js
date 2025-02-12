/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.GITHUB_ACTIONS ? '/JardinsCampion' : '',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sergeville.github.io',
      },
    ],
    domains: ['sergeville.github.io'],
    path: '/_next/image'
  },
  assetPrefix: process.env.GITHUB_ACTIONS ? '/JardinsCampion' : '',
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
}

module.exports = nextConfig 