// app/layout.tsx
'use client';

import '@/app/globals.css';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/app/contexts/theme-context';
import { NotificationsProvider } from '@/app/lib/contexts/notifications-context';
import { AuthProvider } from '@/app/contexts/auth-context';
import { Header } from '@/app/components/ui/header';
import { NotificationsContainer } from '@/app/components/notifications/notifications-container';
import { Inter } from 'next/font/google';
import { NotificationProvider } from '@/app/components/ui/notification/provider';
import { LeadTimesProvider } from './contexts/lead-times-context';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Military Planning Tool</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
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
      </body>
    </html>
  );
}