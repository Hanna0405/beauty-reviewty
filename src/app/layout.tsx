import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';

import { AuthProvider } from '@/context/AuthContext';
import UserAvatarMenu from '@/components/UserAvatarMenu';

export const metadata: Metadata = {
 title: 'BeautyReviewty',
 description: 'Find your beauty master with honest reviews',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
 return (
 <html lang="en">
 <body>
 {/* Подключаем Google Maps JS API после интерактивности */}
 <Script
 src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
 strategy="afterInteractive"
 />

 {/* Провайдер авторизации доступен для всей страницы */}
 <AuthProvider>
 {/* Простая шапка с логотипом и меню пользователя */}
 <header className="border-b">
 <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
 <a href="/" className="font-bold text-lg">BeautyReviewty</a>
 <UserAvatarMenu />
 </div>
 </header>

 {/* Контент страниц */}
 {children}
 </AuthProvider>
 </body>
 </html>
 );
}