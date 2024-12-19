'use client';

import { useEffect, useState } from 'react';
import { Equipment } from '@/app/lib/types/equipment';
import { EquipmentList } from '@/app/components/equipment/equipment-list';
import { EquipmentComparison } from '@/app/components/equipment/equipment-comparison';
import { Button } from '@/app/components/ui/button';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';


export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchEquipment() {
      try {
        const response = await fetch('/api/equipment');
        const data = await response.json();
        setEquipment(data);
      } catch (error) {
        console.error('Failed to fetch equipment:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEquipment();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Equipment</h1>
        <Button onClick={() => router.push('/equipment/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Equipment
        </Button>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="comparison">Compare</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <EquipmentList />
        </TabsContent>
        
        <TabsContent value="comparison" className="space-y-4">
          <EquipmentComparison equipment={equipment} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 