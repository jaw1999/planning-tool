'use client';

import React from 'react';
import { NotificationsProvider } from '@/app/lib/contexts/notifications-context';
import { NotificationsButton } from '@/app/components/notifications/notifications-button';
import { NotificationsContainer } from '@/app/components/notifications/notifications-container';
import { Calculator, Calendar, Box, BarChart2, Settings } from 'lucide-react';
import Link from 'next/link';
import { Header } from '../ui/header';

const navigation = [
  { name: 'Systems', href: '/systems', icon: Box },
  { name: 'Exercises', href: '/exercises', icon: Calendar },
  { name: 'Cost Analysis', href: '/analysis', icon: BarChart2 },
  { name: 'Calculator', href: '/calculator', icon: Calculator },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Header />
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}