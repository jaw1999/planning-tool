'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, Package, Settings, Wrench } from 'lucide-react';

export function MainNav() {
  const pathname = usePathname();

  const routes = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
      active: pathname === '/dashboard',
    },
    {
      href: '/equipment',
      label: 'Equipment',
      icon: Wrench,
      active: pathname === '/equipment',
    },
    {
      href: '/consumables',
      label: 'Consumables',
      icon: Package,
      active: pathname === '/consumables',
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
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            'flex items-center text-sm font-medium transition-colors hover:text-primary',
            route.active ? 'text-black dark:text-white' : 'text-muted-foreground'
          )}
        >
          <route.icon className="w-4 h-4 mr-2" />
          {route.label}
        </Link>
      ))}
    </nav>
  );
} 