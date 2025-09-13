import "./globals.css";
import type { Metadata } from "next";

import Providers from "./providers";
import { ToastProvider } from '@/components/ui/Toast';
import AppHeader from "@/components/layout/AppHeader";
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
        <GoogleMapsProvider>
          <ToastProvider>
            <Providers>
              {/* Простая шапка с логотипом и меню пользователя */}
              <header className="border-b">
                <AppHeader />
              </header>

              {/* Контент страниц */}
              {children}
            </Providers>
          </ToastProvider>
        </GoogleMapsProvider>
      </body>
    </html>
  );
}