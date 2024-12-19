'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Equipment, EquipmentStatus, FSRFrequency, Classification } from '@/app/lib/types/equipment';
import { Form } from '@/app/components/ui/form';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { BasicInfoFields } from './form-fields/basic-info-fields';
import { PhysicalSpecsFields } from './form-fields/physical-specs-fields';
import { SystemComponentsFields } from './form-fields/system-components-fields';
import { InterfacesFields } from './form-fields/interfaces-fields';
import { PowerSpecificationsFields } from './form-fields/power-specifications-fields';
import { EnvironmentalSpecificationsFields } from './form-fields/environmental-specifications-fields';
import { SoftwareFields } from './form-fields/software-fields';
import { OperationsFields } from './form-fields/operations-fields';
import { LogisticsFields } from './form-fields/logistics-fields';
import { IntegrationFields } from './form-fields/integration-fields';
import { CommunicationsFields } from './form-fields/communications-fields';
import { EWSpecificationsFields } from './form-fields/ew-specifications-fields';
import { RFSpecificationsFields } from './form-fields/rf-specifications-fields';
import { useRouter } from 'next/navigation';
import { Checkbox } from "@/app/components/ui/checkbox";
import { ArrowLeft } from 'lucide-react';
import { EquipmentConsumables } from './equipment-consumables';
import { ConsumableItem } from './equipment-consumables';

const equipmentFormSchema = z.object({
  productInfo: z.object({
    name: z.string().min(2, { message: "Name is required" }),
    model: z.string(),
    version: z.string().optional(),
    classification: z.enum(['UNCLASSIFIED', 'UNCLASSIFIED//FOUO', 'CONFIDENTIAL', 'SECRET', 'TOP SECRET']),
    type: z.string(),
    description: z.string(),
    status: z.string(),
    partNumber: z.string(),
    configuration: z.object({
      type: z.string(),
      variants: z.array(z.string()),
      specifications: z.record(z.any()),
    }),
    useRestrictions: z.object({
      disclosure: z.string(),
      export: z.string(),
      handling: z.string(),
    }),
  }),
  interfaces: z.object({
    mechanical: z.object({
      connections: z.array(z.string()),
      mounts: z.array(z.string()),
      payload: z.array(z.string()),
    }),
    electrical: z.object({
      power: z.record(z.any()),
      signals: z.record(z.any()),
      connectors: z.array(z.string()),
    }),
    data: z.object({
      types: z.array(z.string()),
      protocols: z.array(z.string()),
      ports: z.array(z.string()),
    }),
    control: z.object({
      methods: z.array(z.string()),
      interfaces: z.array(z.string()),
    }),
  }),
  powerSpecifications: z.object({
    input: z.object({
      requirements: z.record(z.any()),
      options: z.array(z.string()),
    }),
    consumption: z.object({
      nominal: z.record(z.any()),
      peak: z.string(),
      byMode: z.record(z.any()),
    }),
    management: z.object({
      features: z.array(z.string()),
      efficiency: z.record(z.any()),
    }),
  }),
  environmentalSpecifications: z.object({
    temperature: z.object({
      operating: z.record(z.any()),
      storage: z.record(z.any()),
    }),
    altitude: z.object({
      operating: z.string(),
      maximum: z.string(),
      restrictions: z.array(z.string()),
    }),
    weather: z.object({
      wind: z.record(z.any()),
      precipitation: z.record(z.any()),
      restrictions: z.array(z.string()),
    }),
    certifications: z.object({
      environmental: z.array(z.string()),
      safety: z.array(z.string()),
      compliance: z.array(z.string()),
    }),
  }),
  software: z.object({
    features: z.array(z.string()),
    gui: z.object({
      capabilities: z.array(z.string())
    }),
    control: z.object({
      primary: z.string(),
      interfaces: z.array(z.string()),
      features: z.array(z.string()),
    }),
    planning: z.object({
      tools: z.array(z.string()),
      capabilities: z.array(z.string()),
    }),
    analysis: z.object({
      realtime: z.array(z.string()),
      postMission: z.array(z.string()),
    }),
    licensing: z.object({
      type: z.string(),
      terms: z.record(z.any()),
      restrictions: z.array(z.string()),
    }),
  }),
  operations: z.object({
    deployment: z.object({
      methods: z.array(z.string()),
      requirements: z.array(z.string()),
      limitations: z.array(z.string()),
    }),
    training: z.object({
      required: z.record(z.any()),
      optional: z.record(z.any()),
      certification: z.array(z.string()),
    }),
    maintenance: z.object({
      scheduled: z.array(z.string()),
      unscheduled: z.array(z.string()),
      requirements: z.array(z.string()),
    }),
    support: z.object({
      onsite: z.record(z.any()),
      remote: z.record(z.any()),
      documentation: z.array(z.string()),
    }),
  }),
  logistics: z.object({
    procurement: z.object({
      leadTime: z.record(z.any()),
      pricing: z.record(z.any()),
      terms: z.record(z.any()),
    }),
    shipping: z.object({
      methods: z.array(z.string()),
      restrictions: z.array(z.string()),
      requirements: z.array(z.string()),
    }),
    refurbishment: z.object({
      options: z.array(z.string()),
      requirements: z.array(z.string()),
      pricing: z.record(z.any()),
    }),
    spares: z.object({
      required: z.array(z.string()),
      recommended: z.array(z.string()),
      availability: z.record(z.any()),
    }),
  }),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED']),
  fsrFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'AS_NEEDED']),
  systemComponents: z.object({
    primary: z.object({
      type: z.string(),
      components: z.array(z.string()),
      specifications: z.record(z.any())
    }),
    communications: z.object({
      primary: z.object({
        type: z.string(),
        specifications: z.record(z.any())
      }),
      backup: z.array(z.string()),
      protocols: z.array(z.string())
    }),
    rfSpecifications: z.object({
      frequencies: z.object({
        ranges: z.array(z.string()),
        bands: z.array(z.string())
      }),
      power: z.object({
        tx: z.record(z.any()),
        rx: z.record(z.any())
      }),
      features: z.array(z.string()),
      ewCapabilities: z.object({
        operationalModes: z.array(z.string()),
        frequencyCoverage: z.object({
          detection: z.array(z.string()),
          jamming: z.array(z.string())
        }),
        signalProcessing: z.object({
          capabilities: z.array(z.string()),
          modes: z.array(z.string())
        }),
        antenna: z.object({
          type: z.string(),
          gain: z.string(),
          coverage: z.string()
        }),
        sensitivity: z.object({
          min: z.string(),
          max: z.string(),
          unit: z.string()
        })
      })
    }).optional()
  }),
});

const defaultValues: Partial<Equipment> = {
  id: '',
  productInfo: {
    name: '',
    model: '',
    version: '',
    classification: 'UNCLASSIFIED' as Classification,
    type: '',
    description: '',
    status: '',
    partNumber: '',
    configuration: {
      type: '',
      variants: [],
      specifications: {},
    },
    useRestrictions: {
      disclosure: '',
      export: '',
      handling: '',
    },
  },
  interfaces: {
    mechanical: {
      connections: [],
      mounts: [],
      payload: [],
    },
    electrical: {
      power: {},
      signals: {},
      connectors: [],
    },
    data: {
      types: [],
      protocols: [],
      ports: [],
    },
    control: {
      methods: [],
      interfaces: [],
    },
  },
  powerSpecifications: {
    input: {
      requirements: {},
      options: [],
    },
    consumption: {
      nominal: {},
      peak: '',
      byMode: {},
    },
    management: {
      features: [],
      efficiency: {},
    },
  },
  environmentalSpecifications: {
    temperature: {
      operating: {},
      storage: {},
    },
    altitude: {
      operating: '',
      maximum: '',
      restrictions: [],
    },
    weather: {
      wind: {},
      precipitation: {},
      restrictions: [],
    },
    certifications: {
      environmental: [],
      safety: [],
      compliance: [],
    },
  },
  software: {
    features: [],
    gui: {
      capabilities: []
    },
    control: {
      primary: '',
      interfaces: [],
      features: [],
    },
    planning: {
      tools: [],
      capabilities: [],
    },
    analysis: {
      realtime: [],
      postMission: [],
    },
    licensing: {
      type: '',
      terms: {},
      restrictions: [],
    },
  },
  operations: {
    deployment: {
      methods: [],
      requirements: [],
      limitations: [],
    },
    training: {
      required: {},
      optional: {},
      certification: [],
    },
    maintenance: {
      scheduled: [],
      unscheduled: [],
      requirements: [],
    },
    support: {
      onsite: {},
      remote: {},
      documentation: [],
    },
  },
  logistics: {
    procurement: {
      leadTime: {},
      pricing: {},
      terms: {},
    },
    shipping: {
      methods: [],
      restrictions: [],
      requirements: [],
    },
    refurbishment: {
      options: [],
      requirements: [],
      pricing: {},
    },
    spares: {
      required: [],
      recommended: [],
      availability: {},
    },
  },
  status: 'AVAILABLE' as EquipmentStatus,
  fsrFrequency: 'AS_NEEDED' as FSRFrequency,
};

interface EquipmentFormProps {
  equipment?: Equipment;
  onSubmit: (data: Partial<Equipment>) => Promise<void>;
  onCancel: () => void;
}

export function EquipmentForm({ equipment, onSubmit, onCancel }: EquipmentFormProps) {
  const router = useRouter();
  const [isEWPayload, setIsEWPayload] = useState(false);
  const form = useForm<Equipment>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: defaultValues,
  });

  const onSubmitForm = async (data: Equipment) => {
    console.log(data);
    // Handle form submission
  };

  const handleConsumablesUpdate = (equipmentId: string, consumables: ConsumableItem[]) => {
    const updatedConsumables = consumables.map(c => ({
      id: c.id,
      name: c.name,
      unit: c.unit,
      currentUnitCost: c.currentUnitCost,
      createdAt: c.createdAt || new Date(),
      updatedAt: c.updatedAt || new Date()
    }));

    form.setValue('consumables', updatedConsumables);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitForm)} className="space-y-8">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ewPayload"
              checked={isEWPayload}
              onCheckedChange={(checked) => setIsEWPayload(checked as boolean)}
            />
            <label
              htmlFor="ewPayload"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              EW/SIGINT Payload
            </label>
          </div>

          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid grid-cols-5 gap-4 bg-transparent h-auto p-0">
              <div className="col-span-5 grid grid-cols-6 gap-2 bg-muted/50 rounded-lg p-1">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="physical">Physical</TabsTrigger>
                <TabsTrigger value="systems">Systems</TabsTrigger>
                <TabsTrigger value="interfaces">Interfaces</TabsTrigger>
                <TabsTrigger value="power">Power</TabsTrigger>
                <TabsTrigger value="consumables">Consumables</TabsTrigger>
              </div>
              <div className="col-span-5 grid grid-cols-5 gap-2 bg-muted/50 rounded-lg p-1">
                <TabsTrigger value="environmental">Environmental</TabsTrigger>
                <TabsTrigger value="software">Software</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="logistics">Logistics</TabsTrigger>
                <TabsTrigger value="integration">Integration</TabsTrigger>
              </div>
              {isEWPayload && (
                <div className="col-span-5 grid grid-cols-2 gap-2 bg-muted/50 rounded-lg p-1">
                  <TabsTrigger value="rf">RF Specifications</TabsTrigger>
                  <TabsTrigger value="ew">EW Capabilities</TabsTrigger>
                </div>
              )}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="basic" className="m-0">
                <BasicInfoFields />
              </TabsContent>
              <TabsContent value="physical" className="m-0">
                <PhysicalSpecsFields />
              </TabsContent>
              <TabsContent value="systems" className="m-0">
                <SystemComponentsFields />
              </TabsContent>
              <TabsContent value="interfaces" className="m-0">
                <InterfacesFields />
              </TabsContent>
              <TabsContent value="power" className="m-0">
                <PowerSpecificationsFields />
              </TabsContent>
              <TabsContent value="environmental" className="m-0">
                <EnvironmentalSpecificationsFields />
              </TabsContent>
              <TabsContent value="software" className="m-0">
                <SoftwareFields />
              </TabsContent>
              <TabsContent value="operations" className="m-0">
                <OperationsFields />
              </TabsContent>
              <TabsContent value="logistics" className="m-0">
                <LogisticsFields />
              </TabsContent>
              <TabsContent value="integration" className="m-0">
                <IntegrationFields />
              </TabsContent>
              {isEWPayload && (
                <>
                  <TabsContent value="rf" className="m-0">
                    <RFSpecificationsFields />
                  </TabsContent>
                  <TabsContent value="ew" className="m-0">
                    <EWSpecificationsFields />
                  </TabsContent>
                </>
              )}
              <TabsContent value="consumables" className="m-0">
                <EquipmentConsumables 
                  equipment={[{
                    id: equipment?.id || '',
                    name: equipment?.productInfo?.name || '',
                    consumables: equipment?.consumables || []
                  }]}
                  onUpdate={(equipmentId, consumables) => {
                    handleConsumablesUpdate(equipmentId, consumables);
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Save Equipment</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}