
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
 
  images: isDev ? { 
    unoptimized: true 
  } : {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // 1 день кэша
    remotePatterns: [
      // Firebase Storage images
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      
      // Optional: Unsplash images (if still used)
      { protocol: 'https', hostname: 'images.unsplash.com' },

      // Google avatars (after login)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },

      // GitHub avatars (for future use)
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' }
    ]
  },
 
  async redirects() {
    return [
      { source: '/about', destination: '/about-us', permanent: true },
    ];
  },
};
 
module.exports = nextConfig;