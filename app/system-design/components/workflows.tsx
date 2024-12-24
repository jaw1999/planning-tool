'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ArrowRight, Activity, DollarSign, Calendar, Users, Package2 } from 'lucide-react';

interface CostDataPoint {
  name: string;
  cost: number;
  color: string;
}

interface WorkflowStep {
  title: string;
  icon: React.ReactNode;
  steps: string[];
  metrics?: {
    label: string;
    value: string | number;
  }[];
}

export function Workflows() {
  const [activeStep, setActiveStep] = useState<number>(0);

  const planningWorkflow: WorkflowStep[] = [
    {
      title: "Initial Setup",
      icon: <Calendar className="h-5 w-5" />,
      steps: [
        "Define exercise dates and location",
        "Set total budget",
        "Configure environmental conditions"
      ],
      metrics: [
        { label: "Average Setup Time", value: "2-3 days" },
        { label: "Success Rate", value: "98%" }
      ]
    },
    {
      title: "System Assignment",
      icon: <Package2 className="h-5 w-5" />,
      steps: [
        "Select required systems",
        "Configure quantities",
        "Set launch rates",
        "Define FSR support levels"
      ],
      metrics: [
        { label: "Avg Systems/Exercise", value: 3 },
        { label: "FSR Coverage", value: "85%" }
      ]
    },
    {
      title: "Resource Planning",
      icon: <Users className="h-5 w-5" />,
      steps: [
        "Calculate lead times",
        "Configure consumables",
        "Plan FSR support",
        "Schedule deliveries"
      ],
      metrics: [
        { label: "Lead Time", value: "30 days" },
        { label: "Resource Utilization", value: "92%" }
      ]
    },
    {
      title: "Cost Analysis",
      icon: <DollarSign className="h-5 w-5" />,
      steps: [
        "Hardware costs",
        "Monthly FSR costs",
        "Consumables breakdown",
        "Total cost projections"
      ],
      metrics: [
        { label: "Budget Accuracy", value: "±5%" },
        { label: "Cost Optimization", value: "15%" }
      ]
    }
  ];

  const costData: CostDataPoint[] = [
    { name: 'Hardware', cost: 150000, color: '#8884d8' },
    { name: 'FSR Support', cost: 25000, color: '#82ca9d' },
    { name: 'Consumables', cost: 35000, color: '#ffc658' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Workflows
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Exercise Planning Workflow */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Exercise Planning Workflow</h3>
              <div className="relative">
                <div className="absolute h-full w-0.5 bg-border left-2 top-0" />
                <ol className="space-y-6 relative">
                  {planningWorkflow.map((step, index) => (
                    <li 
                      key={index}
                      className={`pl-8 relative cursor-pointer transition-all ${
                        activeStep === index ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                      }`}
                      onClick={() => setActiveStep(index)}
                    >
                      <div className={`absolute w-10 h-10 flex items-center justify-center bg-background border-2 ${
                        activeStep === index ? 'border-primary text-primary' : 'border-muted'
                      } rounded-full left-[-12px] top-0`}>
                        {step.icon}
                      </div>
                      
                      <div className="ml-4">
                        <h4 className="font-medium flex items-center gap-2">
                          {step.title}
                          <Badge variant="outline">{`Step ${index + 1}`}</Badge>
                        </h4>
                        
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            {step.steps.map((s, i) => (
                              <p key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                {s}
                              </p>
                            ))}
                          </div>
                          
                          {step.metrics && (
                            <div className="space-y-2 border-l pl-4">
                              {step.metrics.map((metric, i) => (
                                <div key={i} className="text-sm">
                                  <span className="text-muted-foreground">{metric.label}:</span>
                                  <span className="ml-2 font-medium">{metric.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            {/* Cost Analysis Pipeline */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Cost Analysis Pipeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 border rounded-lg p-4">
                  <h4 className="font-medium">Process Flow</h4>
                  <div className="space-y-2">
                    {["Data Collection", "Processing", "Output"].map((phase, index) => (
                      <div key={phase} className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span>{phase}</span>
                        {index < 2 && <ArrowRight className="h-4 w-4" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Bar 
                        dataKey="cost" 
                        name="Cost"
                        fill="#8884d8"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 