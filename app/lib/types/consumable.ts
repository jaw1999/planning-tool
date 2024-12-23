export interface Consumable {
  id: string;
  name: string;
  description?: string;
  currentUnitCost: number;
  unit: string;
  minimumOrderQuantity?: number;
  leadTime?: number;
  supplier?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsumablePreset {
  id: string;
  name: string;
  description?: string;
  consumableId: string;
  consumable: Consumable;
  defaultQuantity: number;
  systemId: string;
  createdAt: Date;
  updatedAt: Date;
} 