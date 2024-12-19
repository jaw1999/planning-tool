'use client';

import { useTheme } from '@/app/contexts/theme-context';
import { Moon, Sun, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        Theme Preference
      </label>
      <div className="flex space-x-4">
        <button
          onClick={() => setTheme('light')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
            theme === 'light' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <Sun className="h-5 w-5" />
          <span>Light</span>
        </button>
        
        <button
          onClick={() => setTheme('dark')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
            theme === 'dark' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <Moon className="h-5 w-5" />
          <span>Dark</span>
        </button>
        
        <button
          onClick={() => setTheme('system')}
          className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
            theme === 'system' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <Monitor className="h-5 w-5" />
          <span>System</span>
        </button>
      </div>
    </div>
  );
} 