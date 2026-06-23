import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sabana POS",
  description: "Aplikasi kasir untuk usaha fried chicken Sabana",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#E11B22",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  // Periodic Background Sync untuk keep-alive
                  if ('periodicSync' in reg) {
                    reg.periodicSync.register('keep-alive', { minInterval: 60000 })
                      .catch(function() {});
                  }
                }).catch(function() {});
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
