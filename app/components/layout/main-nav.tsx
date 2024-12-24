'use client';

import { Activity, BookOpen, Box, Calendar, Cpu, Database, FileText, Settings, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center text-sm font-medium transition-colors hover:text-primary",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      {children}
    </Link>
  );
}

export function MainNav() {
  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      <NavLink href="/dashboard">
        <Activity className="h-4 w-4 mr-2" />
        Dashboard
      </NavLink>
      <NavLink href="/exercises">
        <Calendar className="h-4 w-4 mr-2" />
        Exercises
      </NavLink>
      <NavLink href="/equipment">
        <Box className="h-4 w-4 mr-2" />
        Equipment
      </NavLink>
      <NavLink href="/systems">
        <Cpu className="h-4 w-4 mr-2" />
        Systems
      </NavLink>
      <NavLink href="/analysis">
        <Activity className="h-4 w-4 mr-2" />
        Analysis
      </NavLink>
      <NavLink href="/system-design">
        <BookOpen className="h-4 w-4 mr-2" />
        System Design
      </NavLink>
      <NavLink href="/settings">
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </NavLink>
    </nav>
  );
} 