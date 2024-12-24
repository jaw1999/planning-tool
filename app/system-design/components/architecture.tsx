'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export function Architecture() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application Architecture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Directory Structure</h3>
            <pre className="p-4 bg-muted rounded-lg">
              {`military-planning-tool/
├── app/
│ ├── api/         # API routes for analysis and exercises
│ ├── components/  # Shared UI components and features
│ ├── hooks/       # Custom hooks for data management
│ │ ├── use-systems.ts
│ │ ├── use-equipment.ts
│ │ └── use-exercise.ts
│ ├── lib/         # Core business logic and utilities
│ │ ├── types/     # TypeScript interfaces
│ │ └── utils/     # Helper functions
│ └── (routes)/    # Page components and routing`}
            </pre>

            <h3 className="text-lg font-semibold mt-6">Core Features</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium">Exercise Planning</h4>
                <ul className="list-disc pl-6 text-sm text-muted-foreground">
                  <li>System assignment and configuration</li>
                  <li>Resource allocation and scheduling</li>
                  <li>Cost analysis and projections</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Analysis Tools</h4>
                <ul className="list-disc pl-6 text-sm text-muted-foreground">
                  <li>Time-series cost analysis</li>
                  <li>System comparisons</li>
                  <li>Budget projections</li>
                </ul>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-6">Technology Stack</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">Frontend</h4>
                <ul className="list-disc pl-6 text-sm text-muted-foreground">
                  <li>Next.js 14 with App Router</li>
                  <li>TypeScript for type safety</li>
                  <li>Tailwind CSS with shadcn/ui</li>
                  <li>Recharts for data visualization</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium">Backend</h4>
                <ul className="list-disc pl-6 text-sm text-muted-foreground">
                  <li>Next.js API Routes</li>
                  <li>Custom hooks for state management</li>
                  <li>Type-safe API endpoints</li>
                </ul>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-6">Key Integrations</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <h4 className="font-medium">Cost Analysis</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  Time-series analysis and cost projections
                </p>
              </Card>
              <Card className="p-4">
                <h4 className="font-medium">Exercise Management</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  System configuration and resource planning
                </p>
              </Card>
              <Card className="p-4">
                <h4 className="font-medium">Data Visualization</h4>
                <p className="text-sm text-muted-foreground mt-2">
                  Interactive charts and analysis tools
                </p>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 