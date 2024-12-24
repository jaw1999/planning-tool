'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function SystemDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex justify-between items-center p-6 border-b">
        <h1 className="text-3xl font-bold">System Design</h1>
        <Link
          href="/system-design/settings"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80"
        >
          <FileText className="w-4 h-4" />
          Documentation
        </Link>
      </div>
      {children}
    </div>
  );
} 