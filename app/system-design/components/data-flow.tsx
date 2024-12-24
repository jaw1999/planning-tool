'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ChevronDown, ChevronUp, ArrowRight, Database, Code, Activity, ArrowRightCircle } from 'lucide-react';
import { Badge } from "@/app/components/ui/badge";

interface DataFlowStep {
  from: string;
  to: string;
  description: string;
  dataExample: string;
}

interface SystemComponent {
  name: string;
  type: 'database' | 'api' | 'ui' | 'service';
  description: string;
  handles: string[];
}

export function DataFlow() {
  const [expandedSection, setExpandedSection] = useState<string | null>("exercise");
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);

  const components: SystemComponent[] = [
    {
      name: "Database Layer",
      type: "database",
      description: "Persistent storage for all system data",
      handles: ["Exercise records", "System configurations", "Cost tracking", "User data"]
    },
    {
      name: "API Layer",
      type: "api",
      description: "RESTful endpoints for data operations",
      handles: ["Authentication", "CRUD operations", "Data validation", "Business logic"]
    },
    {
      name: "UI Components",
      type: "ui",
      description: "User interface elements",
      handles: ["Data display", "User input", "State management", "Interactions"]
    },
    {
      name: "Cost Analysis Service",
      type: "service",
      description: "Handles cost calculations and projections",
      handles: ["Cost calculations", "Budget analysis", "Resource planning"]
    }
  ];

  const dataFlows: Record<string, DataFlowStep[]> = {
    exercise: [
      {
        from: "UI Components",
        to: "API Layer",
        description: "Exercise creation request",
        dataExample: `{
  name: string,
  startDate: Date,
  systems: SystemConfig[]
}`
      },
      {
        from: "API Layer",
        to: "Cost Analysis Service",
        description: "Cost calculation request",
        dataExample: `{
  systems: Array<{
    id: string,
    quantity: number,
    fsrSupport: FSRType
  }>
}`
      },
      {
        from: "Cost Analysis Service",
        to: "Database Layer",
        description: "Store exercise with costs",
        dataExample: `{
  exerciseId: string,
  costs: CostRecord[],
  projections: MonthlyProjection[]
}`
      }
    ],
    // Add other flow types here
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Data Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* System Components Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {components.map((component) => (
                <div key={component.name} className="border rounded-lg p-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <Badge>{component.type}</Badge>
                    {component.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {component.description}
                  </p>
                  <ul className="mt-2 text-sm">
                    {component.handles.map((handle) => (
                      <li key={handle} className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        {handle}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Data Flow Visualization */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">Data Flow Paths</h3>
              {Object.entries(dataFlows).map(([key, steps]) => (
                <div key={key} className="space-y-4">
                  {steps.map((step, index) => (
                    <div 
                      key={index}
                      className="relative p-4 hover:bg-accent/50 rounded-lg cursor-pointer"
                      onClick={() => setSelectedFlow(selectedFlow === `${key}-${index}` ? null : `${key}-${index}`)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{step.from}</Badge>
                        <ArrowRight className="h-4 w-4" />
                        <Badge variant="outline">{step.to}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                      {selectedFlow === `${key}-${index}` && (
                        <pre className="mt-2 p-2 bg-muted rounded-md text-sm">
                          {step.dataExample}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 