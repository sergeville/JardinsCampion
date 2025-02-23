/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  output: 'export',  // Enable static exports for GitHub Pages
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
    // Add path alias resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
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
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  poweredByHeader: false,
  generateEtags: false,
  compress: true,
  // Static export configuration
  trailingSlash: true, // Recommended for GitHub Pages
  skipTrailingSlashRedirect: true,
  distDir: 'out',
};

export default nextConfig;
