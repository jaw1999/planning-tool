'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ChevronDown, ChevronUp, Database, ArrowRight, Table, Key } from 'lucide-react';
import { Badge } from "@/app/components/ui/badge";
import Mermaid from "@/app/components/ui/mermaid";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";

export function DatabaseSchema() {
  const [expandedSection, setExpandedSection] = useState<string | null>("models");
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSection = async (section: string) => {
    if (section === "relationships") {
      setIsLoading(true);
    }
    setExpandedSection(expandedSection === section ? null : section);
    if (section === "relationships") {
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      setIsLoading(false);
    }
  };

  // Enhanced mermaid diagram with better styling
  const mermaidDiagram = `
    erDiagram
      Exercise ||--o{ ExerciseSystem : "has many"
      System ||--o{ ExerciseSystem : "used in"
      ExerciseSystem ||--o{ ExerciseConsumablePreset : "has many"
      ConsumablePreset ||--o{ ExerciseConsumablePreset : "used in"
      Consumable ||--o{ ConsumablePreset : "has many"
      Exercise ||--o{ CostRecord : "tracks"
      System ||--o{ CostRecord : "tracks"

      Exercise {
        string id PK
        string name
        string description
        datetime startDate
        datetime endDate
        string location
        enum status
        float totalBudget
        int launchesPerDay
        datetime createdAt
        datetime updatedAt
      }

      System {
        string id PK
        string name
        string description
        float basePrice
        boolean hasLicensing
        float licensePrice
        int leadTime
        json specifications
        float consumablesRate
        datetime createdAt
        datetime updatedAt
      }

      ExerciseSystem {
        string id PK
        string exerciseId FK
        string systemId FK
        int quantity
        enum fsrSupport
        float fsrCost
        int launchesPerDay
        datetime createdAt
        datetime updatedAt
      }

      CostRecord {
        string id PK
        string exerciseId FK
        string systemId FK
        enum type
        float amount
        datetime date
        string description
        string category
        datetime createdAt
        datetime updatedAt
      }

      Consumable {
        string id PK
        string name
        string description
        string unit
        float currentUnitCost
        string category
        string notes
        datetime createdAt
        datetime updatedAt
      }

      ConsumablePreset {
        string id PK
        string name
        string description
        string consumableId FK
        float quantity
        string notes
        datetime createdAt
        datetime updatedAt
      }

      ExerciseConsumablePreset {
        string id PK
        string exerciseSystemId FK
        string presetId FK
        int quantity
        datetime createdAt
        datetime updatedAt
      }
  `;

  const models = {
    exercise: {
      title: "Exercise Model",
      badge: "Core",
      schema: `interface Exercise {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  status: ExerciseStatus;
  totalBudget: number;
  launchesPerDay: number;
  systems: ExerciseSystem[];
  costs: CostRecord[];
}`
    },
    exerciseSystem: {
      title: "Exercise System Model",
      badge: "Relationship",
      schema: `interface ExerciseSystem {
  id: string;
  exerciseId: string;
  systemId: string;
  quantity: number;
  fsrSupport: FSRType;
  fsrCost: number;
  launchesPerDay: number;
  baseHardwareCost: number;
  monthlyConsumablesCost: number;
  totalMonthlyRecurring: number;
  totalForDuration: number;
  system: System;
  exercise: Exercise;
}`
    },
    costRecord: {
      title: "Cost Record Model",
      badge: "Tracking",
      schema: `interface CostRecord {
  id: string;
  exerciseId: string;
  systemId: string;
  type: CostType;
  amount: number;
  date: Date;
  description?: string;
  exercise: Exercise;
  system: System;
}`
    },
    consumable: {
      title: "Consumable Model",
      badge: "Resource",
      schema: `interface Consumable {
  id: string;
  name: string;
  unit: string;
  currentUnitCost: number;
  isPerLaunch: boolean;
  presets: ConsumablePreset[];
}`
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Schema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Entity Relationship Section */}
            <section>
              <Button
                variant="ghost"
                className="w-full flex justify-between items-center"
                onClick={() => toggleSection("relationships")}
              >
                <div className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  <h3 className="text-lg font-semibold">Entity Relationships</h3>
                </div>
                {expandedSection === "relationships" ? <ChevronUp /> : <ChevronDown />}
              </Button>

              {expandedSection === "relationships" && (
                <div className="mt-4 bg-background rounded-lg border">
                  <div className="p-4 min-h-[400px] w-full overflow-x-auto">
                    <Mermaid 
                      chart={`
                        %%{init: {'theme': 'dark', 'themeVariables': { 'fontSize': '16px' }}}%%
                        ${mermaidDiagram}
                      `} 
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Data Models Section */}
            <section>
              <Button
                variant="ghost"
                className="w-full flex justify-between items-center"
                onClick={() => toggleSection("models")}
              >
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <h3 className="text-lg font-semibold">Data Models</h3>
                </div>
                {expandedSection === "models" ? <ChevronUp /> : <ChevronDown />}
              </Button>

              {expandedSection === "models" && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(models).map(([key, model]) => (
                    <div 
                      key={key}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        selectedModel === key ? 'ring-2 ring-primary' : 'hover:border-primary'
                      }`}
                      onClick={() => setSelectedModel(selectedModel === key ? null : key)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-primary">{model.title}</h4>
                        <Badge variant="outline">{model.badge}</Badge>
                      </div>
                      <pre className="text-sm bg-muted p-2 rounded mt-2">
                        {model.schema}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 