/** @type {import('next').NextConfig} */
const nextConfig = {
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
    path: '/_next/image',
  },
  assetPrefix: process.env.GITHUB_ACTIONS ? '/JardinsCampion' : '',
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      dns: false,
      tls: false,
      assert: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      util: require.resolve('util'),
    };
    return config;
  },
  swcMinify: true,
  experimental: {
    forceSwcTransforms: true,
    esmExternals: true,
  },
  env: {
    MONGODB_URI_DEV: process.env.MONGODB_URI_DEV,
    MONGODB_URI_PROD: process.env.MONGODB_URI_PROD,
  },
};

module.exports = nextConfig;
