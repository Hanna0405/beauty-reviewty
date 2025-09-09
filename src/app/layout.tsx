import "./globals.css";
import type { Metadata } from "next";

import AuthProvider from '@/components/auth/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import UserAvatarMenu from '@/components/UserAvatarMenu';
import GoogleMapsProvider from '@/providers/GoogleMapsProvider';

export const metadata: Metadata = {
  title: "BeautyReviewty",
  description: "Find beauty masters by location, reviews, and more",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Провайдер авторизации доступен для всей страницы */}
        <AuthProvider>
          <GoogleMapsProvider>
            <ToastProvider>
              {/* Простая шапка с логотипом и меню пользователя */}
              <header className="border-b">
                <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
                  <a href="/" className="font-bold text-lg">BeautyReviewty</a>
                  <UserAvatarMenu />
                </div>
              </header>

              {/* Контент страниц */}
              {children}
            </ToastProvider>
          </GoogleMapsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}