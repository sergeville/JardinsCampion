/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/JardinsCampion',
  assetPrefix: '/JardinsCampion/',
  images: {
    unoptimized: true,
    loader: 'custom',
    loaderFile: './image-loader.js',
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
}

module.exports = nextConfig 