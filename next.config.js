/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/JardinsCampion',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
}

module.exports = nextConfig 