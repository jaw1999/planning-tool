import { Settings } from 'lucide-react';
import Link from 'next/link';

export default function ExercisesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex justify-between items-center p-6 border-b">
        <h1 className="text-3xl font-bold">Exercises</h1>
        <Link
          href="/exercises/settings"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
      {children}
    </div>
  );
} 