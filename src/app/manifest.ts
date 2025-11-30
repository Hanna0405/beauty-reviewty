import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BeautyReviewty',
    short_name: 'BeautyReviewty',
    description:
      'Find beauty masters in Canada by location, service, language and honest reviews with real photos.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#f472b6', // rose / pink tone
    icons: [
      {
        src: '/icons/br-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/br-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

