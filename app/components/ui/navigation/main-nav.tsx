'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/app/lib/utils/index';
import { Box, Calendar, Database, Calculator, Settings, BarChart2, Package } from 'lucide-react';

export function MainNav() {
  const pathname = usePathname();

  const routes = [
    {
      href: '/systems',
      label: 'Systems',
      icon: Box,
      active: pathname === '/systems',
    },
    {
      href: '/equipment',
      label: 'Equipment',
      icon: Database,
      active: pathname === '/equipment',
    },
    {
      href: '/consumables',
      label: 'Consumables',
      icon: Package,
      active: pathname === '/consumables',
    },
    {
      href: '/exercises',
      label: 'Exercises',
      icon: Calendar,
      active: pathname === '/exercises',
    },
    {
      href: '/calculator',
      label: 'Calculator',
      icon: Calculator,
      active: pathname === '/calculator',
    },
    {
      href: '/analysis',
      label: 'Analysis',
      icon: BarChart2,
      active: pathname === '/analysis',
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  return (
    <nav className="flex items-center space-x-6">
      {routes.map((route) => {
        const Icon = route.icon;
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'flex items-center text-sm font-medium transition-colors hover:text-primary',
              route.active ? 'text-black dark:text-white' : 'text-muted-foreground'
            )}
          >
            <Icon className="w-4 h-4 mr-2" />
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
} 