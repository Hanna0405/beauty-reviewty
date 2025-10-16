
const isDev = process.env.NODE_ENV !== "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  
  webpack(config, { dev }) {
    // IMPORTANT: do not override devtool in development
    if (!dev) {
      config.devtool = 'source-map';
    }
    return config;
  },
 
  images: {
    domains: ['firebasestorage.googleapis.com', 'lh3.googleusercontent.com'],
    ...(isDev ? { unoptimized: true } : {
      formats: ['image/avif', 'image/webp'],
      minimumCacheTTL: 60 * 60 * 24, // 1 день кэша
    }),
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }
    ],
  },
 
  async redirects() {
    return [
      { source: '/about', destination: '/about-us', permanent: true },
    ];
  },
};
 
module.exports = nextConfig;