// app/layout.tsx
'use client';

import '@/app/globals.css';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@/app/contexts/theme-context';
import { NotificationsProvider } from '@/app/lib/contexts/notifications-context';
import { AuthProvider } from '@/app/contexts/auth-context';
import { Header } from '@/app/components/ui/header';
import { NotificationsContainer } from '@/app/components/notifications/notifications-container';
import { Inter } from 'next/font/google';
import { NotificationProvider } from '@/app/components/ui/notification/provider';
import { LeadTimesProvider } from './contexts/lead-times-context';
import { Toaster } from "@/app/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const handleRouteChange = useCallback(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return handleRouteChange();
  }, [pathname, searchParams, handleRouteChange]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="text-size-adjust momentum-scroll">
        <ThemeProvider>
          <AuthProvider>
            <NotificationsProvider>
              <NotificationProvider>
                <LeadTimesProvider>
                  <div className="relative min-h-screen">
                    <Header />
                    <NotificationsContainer />
                    <main className="flex-1">
                      <div className="container mx-auto px-4 py-6">
                        {children}
                      </div>
                    </main>
                  </div>
                </LeadTimesProvider>
              </NotificationProvider>
            </NotificationsProvider>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}