import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';
import Providers from "./providers";
import { ToastProvider } from '@/components/ui/Toast';
import AppHeader from "@/components/layout/AppHeader";
// GoogleMapsProvider removed - using MapContainer with useJsApiLoader instead
import ToasterClient from '@/components/system/ToasterClient';

export const metadata: Metadata = { title: 'BeautyReviewty' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <Providers>
              <header className="relative z-50 border-b">
                <AppHeader />
              </header>
              {children}
            </Providers>
          </ToastProvider>
        </AuthProvider>
        <ToasterClient />
      </body>
    </html>
  );
}