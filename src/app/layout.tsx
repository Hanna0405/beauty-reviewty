import "@/app/globals.css";
import Providers from "./providers";
import { ToastProvider } from '@/components/ui/Toast';
import AppHeader from "@/components/layout/AppHeader";
import GoogleMapsProvider from '@/providers/GoogleMapsProvider';
import ToasterClient from '@/components/system/ToasterClient';

export const metadata = {
  title: "BeautyReviewty",
  description: "Find your perfect beauty master",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <GoogleMapsProvider>
          <ToastProvider>
            <Providers>
              <header className="relative z-50 border-b">
                <AppHeader />
              </header>
              {children}
            </Providers>
          </ToastProvider>
          <ToasterClient />
        </GoogleMapsProvider>
      </body>
    </html>
  );
}