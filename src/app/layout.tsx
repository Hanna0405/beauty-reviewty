import type { Metadata } from "next";

import { AuthProvider } from "@/context/AuthContext";

import "./globals.css";

import Providers from "./providers";

import AppHeader from "@/components/layout/AppHeader";

import ToasterClient from "@/components/system/ToasterClient";
import { SwRegister } from "@/components/pwa/SwRegister";

export const metadata: Metadata = { title: "BeautyReviewty" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SwRegister />
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
