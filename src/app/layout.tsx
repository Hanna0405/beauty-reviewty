import type { Metadata } from "next";

import { AuthProvider } from "@/context/AuthContext";

import "./globals.css";

import Providers from "./providers";

import AppHeader from "@/components/layout/AppHeader";

import ToasterClient from "@/components/system/ToasterClient";
import { SwRegister } from "@/components/pwa/SwRegister";
import { InstallAppBanner } from "@/components/pwa/InstallAppBanner";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";

export const metadata: Metadata = {
  title: "BeautyReviewty",
  icons: {
    icon: [
      { url: "/icons/br-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
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
            <footer className="w-full py-6 text-center text-xs text-gray-500 opacity-70">
              {/* Social Icons */}
              <div className="flex items-center justify-center gap-4 mb-3">
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-xl text-gray-500 transition hover:text-pink-600"
                >
                  <FaInstagram />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="text-xl text-gray-500 transition hover:text-pink-600"
                >
                  <FaTiktok />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-xl text-gray-500 transition hover:text-pink-600"
                >
                  <FaFacebook />
                </a>
              </div>

              {/* Contact Email */}
              <div className="mb-3">
                <span>Contact us: </span>
                <a
                  href="mailto:hello@beautyreviewty.app"
                  className="hover:underline"
                >
                  hello@beautyreviewty.app
                </a>
              </div>

              {/* Legal Links */}
              <div className="flex justify-center gap-4">
                <a href="/terms" className="hover:underline">
                  Terms of Service
                </a>
                <a href="/privacy" className="hover:underline">
                  Privacy Policy
                </a>
              </div>
              <p className="mt-2">
                © {new Date().getFullYear()} BeautyReviewty. All rights
                reserved.
              </p>
            </footer>
          </Providers>
        </AuthProvider>
        <ToasterClient />
      </body>
    </html>
  );
}
