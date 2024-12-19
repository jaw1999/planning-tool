'use client';

import { useRouter } from 'next/navigation';
import { EquipmentForm } from '@/app/components/equipment/equipment-form';
import { Equipment } from '@/app/lib/types/equipment';
import { ArrowLeft } from 'lucide-react';

export default function NewEquipmentPage() {
  const router = useRouter();

  const handleSubmit = async (data: Partial<Equipment>) => {
    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create equipment');
      router.push('/equipment');
    } catch (error) {
      console.error('Error creating equipment:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/equipment')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Equipment
        </button>
        <h1 className="text-3xl font-bold">Add New Equipment</h1>
      </div>
      <EquipmentForm 
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
} 