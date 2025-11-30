import type { Metadata } from "next";

import { AuthProvider } from "@/context/AuthContext";

import "./globals.css";

import Providers from "./providers";

import AppHeader from "@/components/layout/AppHeader";

import ToasterClient from "@/components/system/ToasterClient";
import { SwRegister } from "@/components/pwa/SwRegister";
import { InstallAppBanner } from "@/components/pwa/InstallAppBanner";

export const metadata: Metadata = {
  title: "BeautyReviewty",
  icons: {
    icon: [
      { url: '/icons/br-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SwRegister />
        <InstallAppBanner />
        <AuthProvider>
          <Providers>
            <header className="relative z-50 border-b">
              <AppHeader />
            </header>
            {children}
          </Providers>
        </AuthProvider>
        <ToasterClient />
      </body>
    </html>
  );
}
