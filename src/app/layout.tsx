import type { Metadata, Viewport } from "next";

import {
  GoogleTagManagerLoader,
  GoogleTagManagerNoscript,
} from "@/components/analytics/GoogleTagManagerLoader";
import { CapacitorStartup } from "@/components/capacitor/CapacitorStartup";

import { AuthProvider } from "@/context/AuthContext";

import "./globals.css";

import Providers from "./providers";

import AppHeader from "@/components/layout/AppHeader";

import ToasterClient from "@/components/system/ToasterClient";
import { SwRegister } from "@/components/pwa/SwRegister";
import { InstallAppBanner } from "@/components/pwa/InstallAppBanner";
import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";
import { ExternalLink } from "@/components/links/ExternalLink";

const defaultDescription =
  "Find beauty professionals by location, language, services, and real client reviews. Discover trusted beauty masters near you.";

export const metadata: Metadata = {
  metadataBase: new URL("https://beautyreviewty.com"),
  title: {
    default: "BeautyReviewty",
    template: "%s | BeautyReviewty",
  },
  description: defaultDescription,
  applicationName: "BeautyReviewty",
  authors: [{ name: "BeautyReviewty" }],
  creator: "BeautyReviewty",
  publisher: "BeautyReviewty",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "BeautyReviewty",
    title: "BeautyReviewty",
    description: defaultDescription,
    url: "https://beautyreviewty.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "BeautyReviewty",
    description: defaultDescription,
  },
  icons: {
    icon: [
      { url: "/icons/br-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <GoogleTagManagerNoscript />
        <GoogleTagManagerLoader />
        <CapacitorStartup />
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
                <ExternalLink
                  href="https://instagram.com/beautyreviewty"
                  aria-label="Instagram"
                  className="text-xl text-gray-500 transition hover:text-pink-600"
                >
                  <FaInstagram />
                </ExternalLink>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="text-xl text-gray-500 transition hover:text-pink-600"
                >
                  <FaTiktok />
                </a>
                <ExternalLink
                  href="https://www.facebook.com/share/1DpMGgJYKQ/?mibextid=wwXIfr"
                  aria-label="Facebook"
                  className="text-xl text-gray-500 transition hover:text-pink-600"
                >
                  <FaFacebook />
                </ExternalLink>
              </div>

              {/* Contact Email */}
              <div className="mb-3">
                <span>Contact us: </span>
                <a
                  href="mailto:support@beautyreviewty.com"
                  className="hover:underline"
                >
                  support@beautyreviewty.com
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
