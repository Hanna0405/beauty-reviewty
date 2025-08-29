/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
 
  images: {
  formats: ['image/avif', 'image/webp'],
  minimumCacheTTL: 60 * 60 * 24, // 1 день кэша
  remotePatterns: [
  // демо-заглушки / внешние картинки
  { protocol: 'https', hostname: 'placekitten.com' },
  { protocol: 'https', hostname: 'images.unsplash.com' },
 
  // аватары Google (после логина)
  { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
 
  // изображения из Firebase Storage
  { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
 
  // аватарки GitHub (на будущее)
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