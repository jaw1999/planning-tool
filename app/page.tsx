'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Plus, BarChart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Welcome to the Planning Tool</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer" onClick={() => router.push('/systems')}>
          <CardHeader>
            <Box className="w-5 h-5 mb-2" />
            <CardTitle>Systems Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Browse and manage available systems</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => router.push('/equipment')}>
          <CardHeader>
            <Box className="w-5 h-5 mb-2" />
            <CardTitle>Equipment Repository</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage military equipment and assets</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer" onClick={() => router.push('/exercises')}>
          <CardHeader>
            <Box className="w-5 h-5 mb-2" />
            <CardTitle>Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Plan and manage exercises</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="h-auto py-4 px-6"
            onClick={() => router.push('/systems')}
          >
            <Box className="w-4 h-4 mr-2" />
            Browse available systems
          </Button>
          
          <Button 
            variant="outline"
            className="h-auto py-4 px-6"
            onClick={() => router.push('/exercises/new')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create a new exercise
          </Button>
          
          <Button 
            variant="outline"
            className="h-auto py-4 px-6"
            onClick={() => router.push('/analysis')}
          >
            <BarChart className="w-4 h-4 mr-2" />
            Analyze costs
          </Button>
        </div>
      </div>
    </div>
  );
}