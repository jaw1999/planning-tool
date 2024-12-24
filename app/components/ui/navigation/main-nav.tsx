'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/app/lib/utils/index';
import { Box, Calendar, Database, Calculator, Settings, BarChart2, Package, Menu, FileText } from 'lucide-react';
import { useState } from 'react';

export function MainNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      href: '/system-design',
      label: 'System Design',
      icon: FileText,
      active: pathname === '/system-design',
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: Settings,
      active: pathname === '/settings',
    },
  ];

  return (
    <div className="relative">
      {/* Mobile Menu Button */}
      <button 
        className="md:hidden p-2"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-6">
        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'flex items-center text-sm font-medium transition-colors hover:text-primary whitespace-nowrap',
                route.active ? 'text-black dark:text-white' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
              {route.label}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav className="absolute top-full left-0 right-0 bg-background border rounded-lg shadow-lg p-4 space-y-4 md:hidden z-50 min-w-[200px]">
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  'flex items-center text-sm font-medium transition-colors hover:text-primary p-2 w-full',
                  route.active ? 'text-black dark:text-white' : 'text-muted-foreground'
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">{route.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
} 