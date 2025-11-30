import type { Metadata } from "next";

import { AuthProvider } from "@/context/AuthContext";

import "./globals.css";

import Providers from "./providers";

import AppHeader from "@/components/layout/AppHeader";

import ToasterClient from "@/components/system/ToasterClient";
import { InstallAppBanner } from "@/components/pwa/InstallAppBanner";

export const metadata: Metadata = { title: "BeautyReviewty" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
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
