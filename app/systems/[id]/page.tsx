'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { SystemDetails } from '@/app/components/systems/system-details';
import { EditSystemForm } from '@/app/components/systems/edit-system-form';
import { useSystems } from '@/app/hooks/use-systems';
import { System } from '@/app/lib/types/system';

export default function SystemPage() {
  const params = useParams();
  const { systems, updateSystem } = useSystems();
  const [isEditing, setIsEditing] = useState(false);

  const system = systems.find(s => s.id === params.id);

  if (!system) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">System not found</div>
      </div>
    );
  }

  const handleSave = async (updatedSystem: Partial<System>) => {
    await updateSystem(system.id, updatedSystem);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {isEditing ? (
        <EditSystemForm
          system={system}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <SystemDetails
          system={system}
          onEdit={() => setIsEditing(true)}
        />
      )}
    </div>
  );
}