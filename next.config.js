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
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      util: 'util',
    };
    return config;
  },
  experimental: {
    forceSwcTransforms: true,
    esmExternals: true,
  },
  env: {
    MONGODB_URI_DEV: process.env.MONGODB_URI_DEV,
    MONGODB_URI_PROD: process.env.MONGODB_URI_PROD,
  },
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/show-data',
        destination: '/show-data',
      },
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;
